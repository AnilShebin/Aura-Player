package library

import (
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/dhowden/tag"
	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type Song struct {
	ID              string   `json:"id"`
	Title           string   `json:"title"`
	Artist          string   `json:"artist"`
	AlbumArtist     string   `json:"albumArtist"`
	AlbumID         string   `json:"albumId"`
	AlbumTitle      string   `json:"albumTitle"`
	Duration        string   `json:"duration"`
	DurationSeconds int      `json:"durationSeconds"`
	CoverURL        string   `json:"coverUrl"`
	AudioURL        string   `json:"audioUrl"`
	Playlists       []string `json:"playlists"`
	FilePath        string   `json:"filePath"`
	Artwork         string   `json:"artwork"`
	IsFavorite      bool     `json:"isFavorite"`
	Year            string   `json:"year"`
	Genre           string   `json:"genre"`
	Codec           string   `json:"codec"`
	Quality         string   `json:"quality"`
	SampleRate      int      `json:"sampleRate"`
	BitDepth        int      `json:"bitDepth"`
	Bitrate         int      `json:"bitrate"`
	HasTTML         bool     `json:"hasTTML"`
	Copyright       string   `json:"copyright"`
}

type LibraryService struct {
	db          *sql.DB
	appDir      string
	watcher     *fsnotify.Watcher
	watchedDirs map[string]bool
	watcherMu   sync.Mutex
}

func NewLibraryService(db *sql.DB) (*LibraryService, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	appDir := filepath.Join(home, ".aura")
	artworkDir := filepath.Join(appDir, "artwork")
	if err := os.MkdirAll(artworkDir, 0755); err != nil {
		return nil, err
	}
	// Create artwork cache directories for 128x128 and 256x256 thumbnails
	if err := os.MkdirAll(filepath.Join(artworkDir, "cache", "128"), 0755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filepath.Join(artworkDir, "cache", "256"), 0755); err != nil {
		return nil, err
	}

	// Create songs table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS songs (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			artist TEXT NOT NULL,
			album_artist TEXT DEFAULT '',
			album_id TEXT NOT NULL,
			album_title TEXT NOT NULL,
			duration TEXT NOT NULL,
			duration_seconds INTEGER NOT NULL,
			cover_url TEXT NOT NULL,
			audio_url TEXT NOT NULL,
			file_path TEXT UNIQUE NOT NULL,
			artwork TEXT NOT NULL,
			is_favorite INTEGER DEFAULT 0,
			year TEXT DEFAULT '',
			genre TEXT DEFAULT '',
			codec TEXT DEFAULT '',
			quality TEXT DEFAULT '',
			sample_rate INTEGER DEFAULT 0,
			bit_depth INTEGER DEFAULT 0,
			bitrate INTEGER DEFAULT 0,
			has_ttml INTEGER DEFAULT 0,
			copyright TEXT DEFAULT ''
		);
	`)
	if err != nil {
		return nil, err
	}

	// Add new columns if they do not exist (safe migrations for existing database)
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN album_artist TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN year TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN genre TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN codec TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN quality TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN sample_rate INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN bit_depth INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN bitrate INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN has_ttml INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE songs ADD COLUMN copyright TEXT DEFAULT ''")

	service := &LibraryService{
		db:          db,
		appDir:      appDir,
		watchedDirs: make(map[string]bool),
	}

	go service.startWatching()

	return service, nil
}

type AlbumSummary struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	AlbumArtist string `json:"albumArtist"`
	Year        string `json:"year"`
	Genre       string `json:"genre"`
	CoverURL    string `json:"coverUrl"`
	SongCount   int    `json:"songCount"`
	Songs       []Song `json:"songs"`
	Codec       string `json:"codec"`
	Quality     string `json:"quality"`
}

func normalizeGroupString(s string) string {
	words := strings.Fields(strings.ToLower(s))
	return strings.Join(words, " ")
}

func cleanDisplayTitle(title string) string {
	if title == "" {
		return "Unknown Album"
	}
	return strings.TrimSpace(title)
}

func isVariousArtists(s string) bool {
	norm := normalizeGroupString(s)
	return norm == "various artists" || norm == "various" || norm == "va" || norm == "compilation"
}

func splitArtistNames(artist string) []string {
	if artist == "" {
		return nil
	}
	a := artist
	separators := []string{"&", "feat.", "ft.", "with", "and", "/", "|", ";"}
	for _, sep := range separators {
		lower := strings.ToLower(a)
		idx := strings.Index(lower, sep)
		for idx != -1 {
			a = a[:idx] + "," + a[idx+len(sep):]
			lower = strings.ToLower(a)
			idx = strings.Index(lower, sep)
		}
	}

	parts := strings.Split(a, ",")
	var result []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func determineAlbumArtist(songs []Song) string {
	if len(songs) == 0 {
		return "Unknown Artist"
	}

	// 1. Check if there is an explicit, consistent AlbumArtist set in tags that isn't a fallback track artist.
	albumArtistCounts := make(map[string]int)
	for _, s := range songs {
		if s.AlbumArtist != "" && !isVariousArtists(s.AlbumArtist) {
			albumArtistCounts[s.AlbumArtist]++
		}
	}

	if len(albumArtistCounts) > 0 {
		bestArtist := ""
		maxCount := 0
		for artist, count := range albumArtistCounts {
			if count > maxCount {
				maxCount = count
				bestArtist = artist
			}
		}
		
		// If the best artist is consistent across tracks
		if maxCount == len(songs) || (maxCount >= (len(songs)+1)/2 && !isVariousArtists(bestArtist)) {
			return bestArtist
		}
	}

	// 2. Split track artists to find individual artists and composers
	individualCounts := make(map[string]int)
	for _, s := range songs {
		artists := splitArtistNames(s.Artist)
		for _, a := range artists {
			if a != "" {
				individualCounts[a]++
			}
		}
	}

	// 3. Indian Composer specific priorities
	wellKnownComposers := []string{
		"A.R. Rahman",
		"A. R. Rahman",
		"Anirudh Ravichander",
		"Anirudh",
		"Hiphop Tamizha",
		"Yuvan Shankar Raja",
		"Harris Jayaraj",
		"M.M. Keeravani",
		"M. M. Keeravani",
		"G.V. Prakash Kumar",
		"G. V. Prakash Kumar",
		"D. Imman",
		"Devi Sri Prasad",
		"Amit Trivedi",
		"Pritam",
		"Santhosh Narayanan",
		"Sid Sriram",
	}

	type composerMatch struct {
		name  string
		count int
	}
	var composerMatches []composerMatch

	for _, comp := range wellKnownComposers {
		normComp := normalizeGroupString(comp)
		count := 0
		for _, s := range songs {
			if strings.Contains(normalizeGroupString(s.Artist), normComp) {
				count++
			}
		}
		if count > 0 {
			composerMatches = append(composerMatches, composerMatch{name: comp, count: count})
		}
	}

	if len(composerMatches) > 0 {
		sort.Slice(composerMatches, func(i, j int) bool {
			return composerMatches[i].count > composerMatches[j].count
		})
		
		if len(composerMatches) == 1 || composerMatches[0].count > composerMatches[1].count {
			return composerMatches[0].name
		}
	}

	// 4. Find the overall dominant individual artist who appears on the most tracks.
	bestIndividual := ""
	bestCount := 0
	for artist, count := range individualCounts {
		if count > bestCount {
			bestCount = count
			bestIndividual = artist
		}
	}

	if bestCount >= (len(songs)+1)/2 && bestIndividual != "" {
		return bestIndividual
	}

	// 5. Fallback to the most frequent track artist string
	trackArtistCounts := make(map[string]int)
	for _, s := range songs {
		trackArtistCounts[s.Artist]++
	}
	bestTrackArtistString := ""
	bestTrackArtistCount := 0
	for artist, count := range trackArtistCounts {
		if count > bestTrackArtistCount {
			bestTrackArtistCount = count
			bestTrackArtistString = artist
		}
	}
	if bestTrackArtistCount >= (len(songs)+1)/2 && bestTrackArtistString != "" {
		return bestTrackArtistString
	}

	return "Various Artists"
}

func (s *LibraryService) GetAlbums() ([]AlbumSummary, error) {
	songs, err := s.GetSongs()
	if err != nil {
		return nil, err
	}

	type group struct {
		songs []Song
	}

	groups := make(map[string]*group)
	for _, song := range songs {
		normTitle := normalizeGroupString(song.AlbumTitle)
		normAlbumArtist := normalizeGroupString(song.AlbumArtist)

		var key string
		if normTitle == "" || normTitle == "unknown album" {
			dir := filepath.Dir(song.FilePath)
			key = "folder::" + strings.ToLower(filepath.ToSlash(dir))
		} else if normAlbumArtist != "" {
			key = normAlbumArtist + "::" + normTitle
		} else {
			key = normTitle
		}

		if g, exists := groups[key]; exists {
			g.songs = append(g.songs, song)
		} else {
			groups[key] = &group{
				songs: []Song{song},
			}
		}
	}

	var albums []AlbumSummary
	for _, g := range groups {
		if len(g.songs) == 0 {
			continue
		}

		albumArtist := determineAlbumArtist(g.songs)

		coverURL := ""
		for _, s := range g.songs {
			if s.CoverURL != "" {
				coverURL = s.CoverURL
				break
			}
		}

		year := ""
		genre := ""
		codec := ""
		quality := ""
		for _, s := range g.songs {
			if s.Year != "" && year == "" {
				year = s.Year
			}
			if s.Genre != "" && genre == "" {
				genre = s.Genre
			}
			if s.Codec != "" && codec == "" {
				codec = s.Codec
			}
			if s.Quality != "" && quality == "" {
				quality = s.Quality
			}
		}
		if year == "" {
			year = "2026"
		}
		if genre == "" {
			genre = "Local Audio"
		}
		if codec == "" {
			codec = "Unknown"
		}
		if quality == "" {
			quality = "High Quality"
		}

		firstSong := g.songs[0]
		normTitle := normalizeGroupString(firstSong.AlbumTitle)
		normAlbumArtist := normalizeGroupString(albumArtist)
		var idKey string
		if normTitle == "" || normTitle == "unknown album" {
			dir := filepath.Dir(firstSong.FilePath)
			idKey = "folder::" + strings.ToLower(filepath.ToSlash(dir))
		} else if normAlbumArtist != "" {
			idKey = normAlbumArtist + "::" + normTitle
		} else {
			idKey = normTitle
		}

		albumIDHash := sha256.Sum256([]byte(idKey))
		albumID := hex.EncodeToString(albumIDHash[:])

		sort.Slice(g.songs, func(i, j int) bool {
			return strings.ToLower(g.songs[i].Title) < strings.ToLower(g.songs[j].Title)
		})

		albums = append(albums, AlbumSummary{
			ID:          albumID,
			Title:       cleanDisplayTitle(firstSong.AlbumTitle),
			AlbumArtist: albumArtist,
			CoverURL:    coverURL,
			Year:        year,
			Genre:       genre,
			SongCount:   len(g.songs),
			Songs:       g.songs,
			Codec:       codec,
			Quality:     quality,
		})
	}

	log.Printf("[LibraryService] GetAlbums: total songs = %d, total grouped albums = %d", len(songs), len(albums))

	sort.Slice(albums, func(i, j int) bool {
		return strings.ToLower(albums[i].Title) < strings.ToLower(albums[j].Title)
	})

	return albums, nil
}

func (s *LibraryService) GetSongsByAlbum(albumID string) ([]Song, error) {
	albums, err := s.GetAlbums()
	if err != nil {
		return nil, err
	}

	for _, album := range albums {
		if album.ID == albumID {
			return album.Songs, nil
		}
	}

	return []Song{}, nil
}

func (s *LibraryService) GetSongs() ([]Song, error) {
	rows, err := s.db.Query("SELECT id, title, artist, album_artist, album_id, album_title, duration, duration_seconds, cover_url, audio_url, file_path, artwork, is_favorite, year, genre, codec, quality, sample_rate, bit_depth, bitrate, has_ttml, copyright FROM songs")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var songs []Song
	for rows.Next() {
		var song Song
		var isFavInt int
		var hasTTMLInt int
		err := rows.Scan(
			&song.ID,
			&song.Title,
			&song.Artist,
			&song.AlbumArtist,
			&song.AlbumID,
			&song.AlbumTitle,
			&song.Duration,
			&song.DurationSeconds,
			&song.CoverURL,
			&song.AudioURL,
			&song.FilePath,
			&song.Artwork,
			&isFavInt,
			&song.Year,
			&song.Genre,
			&song.Codec,
			&song.Quality,
			&song.SampleRate,
			&song.BitDepth,
			&song.Bitrate,
			&hasTTMLInt,
			&song.Copyright,
		)
		if err != nil {
			return nil, err
		}
		song.IsFavorite = isFavInt == 1
		song.HasTTML = hasTTMLInt == 1
		song.Playlists = []string{}
		songs = append(songs, song)
	}
	return songs, nil
}

func (s *LibraryService) ToggleFavorite(songID string) (bool, error) {
	var current int
	err := s.db.QueryRow("SELECT is_favorite FROM songs WHERE id = ?", songID).Scan(&current)
	if err != nil {
		return false, err
	}

	newVal := 0
	if current == 0 {
		newVal = 1
	}

	_, err = s.db.Exec("UPDATE songs SET is_favorite = ? WHERE id = ?", newVal, songID)
	if err != nil {
		return false, err
	}

	return newVal == 1, nil
}

func (s *LibraryService) ScanLibrary(folders []string) (int, error) {
	// First, let's keep track of existing filePaths in DB to avoid scanning unneeded
	existingFiles := make(map[string]bool)
	rows, err := s.db.Query("SELECT file_path, album_artist, codec, sample_rate, copyright FROM songs")
	if err == nil {
		for rows.Next() {
			var fp string
			var aa sql.NullString
			var codec sql.NullString
			var sr sql.NullInt64
			var copyright sql.NullString
			if err := rows.Scan(&fp, &aa, &codec, &sr, &copyright); err == nil {
				if aa.Valid && aa.String != "" && codec.Valid && codec.String != "" && sr.Valid && sr.Int64 > 0 && copyright.Valid && copyright.String != "" {
					existingFiles[fp] = true
				}
			}
		}
		rows.Close()
	}

	scannedCount := 0
	foundFiles := make(map[string]bool)
	var songsToInsert []*Song

	for _, folder := range folders {
		filepath.WalkDir(folder, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return nil
			}
			if d.IsDir() {
				return nil
			}

			ext := strings.ToLower(filepath.Ext(path))
			if ext != ".mp3" && ext != ".flac" && ext != ".m4a" && ext != ".wav" && ext != ".ogg" && ext != ".alac" && ext != ".aac" && ext != ".ec3" && ext != ".ac3" {
				return nil
			}

			foundFiles[path] = true

			// If already in DB, skip scanning but count it
			if existingFiles[path] {
				scannedCount++
				return nil
			}

			// Parse file
			song, err := s.parseAudioFile(path)
			if err != nil {
				log.Printf("Failed to parse %s: %v", path, err)
				return nil
			}

			songsToInsert = append(songsToInsert, song)
			return nil
		})
	}

	// Execute all writes (inserts and deletes) in a single transaction
	if len(songsToInsert) > 0 || len(existingFiles) > 0 {
		tx, err := s.db.Begin()
		if err != nil {
			return scannedCount, err
		}
		defer tx.Rollback()

		// Prepare insert statement
		stmt, err := tx.Prepare(`
			INSERT OR REPLACE INTO songs (
				id, title, artist, album_artist, album_id, album_title, duration, duration_seconds, cover_url, audio_url, file_path, artwork, is_favorite, year, genre, codec, quality, sample_rate, bit_depth, bitrate, has_ttml, copyright
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)
		if err != nil {
			return scannedCount, err
		}
		defer stmt.Close()

		for _, song := range songsToInsert {
			isFavVal := 0
			if song.IsFavorite {
				isFavVal = 1
			}
			hasTTMLVal := 0
			if song.HasTTML {
				hasTTMLVal = 1
			}

			_, err = stmt.Exec(
				song.ID,
				song.Title,
				song.Artist,
				song.AlbumArtist,
				song.AlbumID,
				song.AlbumTitle,
				song.Duration,
				song.DurationSeconds,
				song.CoverURL,
				song.AudioURL,
				song.FilePath,
				song.Artwork,
				isFavVal,
				song.Year,
				song.Genre,
				song.Codec,
				song.Quality,
				song.SampleRate,
				song.BitDepth,
				song.Bitrate,
				hasTTMLVal,
				song.Copyright,
			)
			if err != nil {
				log.Printf("Failed to save song to DB transaction: %v", err)
			} else {
				scannedCount++
			}
		}

		// Delete files that no longer exist
		stmtDelete, err := tx.Prepare("DELETE FROM songs WHERE file_path = ?")
		if err == nil {
			defer stmtDelete.Close()
			for fp := range existingFiles {
				if !foundFiles[fp] {
					_, _ = stmtDelete.Exec(fp)
				}
			}
		}

		if err := tx.Commit(); err != nil {
			return scannedCount, err
		}
	}

	return scannedCount, nil
}

func (s *LibraryService) parseAudioFile(path string) (*Song, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	m, err := tag.ReadFrom(f)
	
	// Generate unique IDs
	hash := sha256.Sum256([]byte(path))
	songID := hex.EncodeToString(hash[:])

	// Fallback details
	title := filepath.Base(path)
	// Remove extension
	if idx := strings.LastIndex(title, "."); idx != -1 {
		title = title[:idx]
	}
	artist := "Unknown Artist"
	albumTitle := "Unknown Album"
	albumArtist := ""
	year := ""
	genre := ""
	copyright := ""

	var coverURL string

	if err == nil && m != nil {
		if t := m.Title(); t != "" {
			title = cleanM4AMetadataString(t)
		}
		if a := m.Artist(); a != "" {
			artist = cleanM4AMetadataString(a)
		}
		if al := m.Album(); al != "" {
			albumTitle = cleanM4AMetadataString(al)
		}
		if aa := m.AlbumArtist(); aa != "" {
			albumArtist = cleanM4AMetadataString(aa)
		}
		if y := m.Year(); y != 0 {
			year = strconv.Itoa(y)
		}
		if year == "" {
			year = cleanM4AMetadataString(extractYearFromRaw(m))
		}
		if g := m.Genre(); g != "" {
			genre = cleanM4AMetadataString(g)
		}
		copyright = cleanM4AMetadataString(extractCopyrightFromRaw(m))
		if copyright == "" {
			copyright = "none"
		}

		// Handle cover art picture
		if pic := m.Picture(); pic != nil && len(pic.Data) > 0 {
			picHash := sha256.Sum256(pic.Data)
			picHex := hex.EncodeToString(picHash[:])
			ext := ".jpg"
			if strings.Contains(strings.ToLower(pic.MIMEType), "png") {
				ext = ".png"
			}
			artworkFileName := picHex + ext
			artworkPath := filepath.Join(s.appDir, "artwork", artworkFileName)
			
			// Save artwork file
			if _, err := os.Stat(artworkPath); os.IsNotExist(err) {
				os.WriteFile(artworkPath, pic.Data, 0644)
			}
			coverURL = "/artwork/" + artworkFileName
		}
	}

	// If no album artist found in tags, fall back to track artist
	if albumArtist == "" {
		albumArtist = artist
	}

	// If no embedded artwork, search same directory for images
	if coverURL == "" {
		dir := filepath.Dir(path)
		commonNames := []string{"cover.jpg", "cover.png", "folder.jpg", "folder.png", "album.jpg", "album.png"}
		for _, name := range commonNames {
			imgPath := filepath.Join(dir, name)
			if _, err := os.Stat(imgPath); err == nil {
				data, err := os.ReadFile(imgPath)
				if err == nil && len(data) > 0 {
					picHash := sha256.Sum256(data)
					picHex := hex.EncodeToString(picHash[:])
					ext := filepath.Ext(name)
					artworkFileName := picHex + ext
					artworkPath := filepath.Join(s.appDir, "artwork", artworkFileName)
					if _, err := os.Stat(artworkPath); os.IsNotExist(err) {
						os.WriteFile(artworkPath, data, 0644)
					}
					coverURL = "/artwork/" + artworkFileName
					break
				}
			}
		}
	}

	// Album ID key calculation following industry rules:
	// albumArtist + "::" + albumTitle (fallback: albumTitle)
	normTitle := normalizeGroupString(albumTitle)
	normAlbumArtist := normalizeGroupString(albumArtist)
	var idKey string
	if normTitle == "" || normTitle == "unknown album" {
		dir := filepath.Dir(path)
		idKey = "folder::" + strings.ToLower(filepath.ToSlash(dir))
	} else if normAlbumArtist != "" {
		idKey = normAlbumArtist + "::" + normTitle
	} else {
		idKey = normTitle
	}

	albumIDHash := sha256.Sum256([]byte(idKey))
	albumID := hex.EncodeToString(albumIDHash[:])

	audioURL := "/audio-file?path=" + strings.ReplaceAll(path, "\\", "/")

	extSuffix := strings.ToLower(filepath.Ext(path))
	codec := "Unknown"
	quality := "High Quality"

	sampleRate := 44100
	bitDepth := 16
	bitrate := 320
	durationSec := 240
	durationStr := "4:00"

	switch extSuffix {
	case ".flac":
		codec = "FLAC"
		quality = "Lossless"
		sr, _, bd, br, ds := parseFLACInfo(path)
		if sr > 0 {
			sampleRate = sr
			bitDepth = bd
			bitrate = br
			durationSec = ds
		}
		if sampleRate > 48000 {
			quality = "Hi-Res Lossless"
		}
	case ".wav":
		codec = "WAV"
		quality = "Lossless"
		sr, _, bd, br, ds := parseWAVInfo(path)
		if sr > 0 {
			sampleRate = sr
			bitDepth = bd
			bitrate = br
			durationSec = ds
		}
		if sampleRate > 48000 {
			quality = "Hi-Res Lossless"
		}
	case ".m4a", ".alac", ".ec3", ".ac3":
		cdec, sr, _, bd, br, ds := parseM4AInfo(path)
		codec = cdec
		if codec == "ALAC" {
			quality = "Lossless"
		} else if codec == "E-AC-3" || codec == "AC-3" || extSuffix == ".ec3" || extSuffix == ".ac3" {
			quality = "Spatial Audio"
			if codec == "Unknown" {
				if extSuffix == ".ac3" {
					codec = "AC-3"
				} else {
					codec = "E-AC-3"
				}
			}
		} else {
			quality = "High Quality"
		}
		if sr > 0 {
			sampleRate = sr
			bitDepth = bd
			bitrate = br
			durationSec = ds
		}
		if codec == "ALAC" && sampleRate > 48000 {
			quality = "Hi-Res Lossless"
		}
	case ".mp3":
		codec = "MP3"
		quality = "High Quality"
		sr, _, bd, br, ds := parseMP3Info(path)
		if sr > 0 {
			sampleRate = sr
			bitDepth = bd
			bitrate = br
			durationSec = ds
		}
	}

	if durationSec > 0 {
		mins := durationSec / 60
		secs := durationSec % 60
		durationStr = fmt.Sprintf("%d:%02d", mins, secs)
	}

	hasTTML := false
	if m != nil {
		if rawMap := m.Raw(); rawMap != nil {
			for k, val := range rawMap {
				kLower := strings.ToLower(k)
				if kLower == "lyrics-ttml" || strings.Contains(kLower, "lyrics-ttml") || strings.HasPrefix(kLower, "----") {
					var strVal string
					if str, ok := val.(string); ok {
						strVal = str
					} else if byteSlice, ok := val.([]byte); ok {
						strVal = string(byteSlice)
					}
					if strings.Contains(strVal, "<tt ") || strings.Contains(strVal, "<tt>") {
						hasTTML = true
						break
					}
				}
			}
		}
	}
	if !hasTTML {
		basePathNoExt := path[:len(path)-len(filepath.Ext(path))]
		if _, err := os.Stat(basePathNoExt + ".ttml"); err == nil {
			hasTTML = true
		}
	}

	// Fallback to Spatial Audio if filename, folder, or tags indicate immersive audio
	lowerPath := strings.ToLower(path)
	lowerTitle := strings.ToLower(title)
	lowerArtist := strings.ToLower(artist)
	lowerAlbum := strings.ToLower(albumTitle)
	if strings.Contains(lowerPath, "dolby") || strings.Contains(lowerPath, "atmos") ||
		strings.Contains(lowerTitle, "dolby") || strings.Contains(lowerTitle, "atmos") ||
		strings.Contains(lowerArtist, "dolby") || strings.Contains(lowerArtist, "atmos") ||
		strings.Contains(lowerAlbum, "dolby") || strings.Contains(lowerAlbum, "atmos") {
		quality = "Spatial Audio"
		if codec == "Unknown" || codec == "AAC" {
			codec = "E-AC-3"
		}
	}

	if m != nil {
		if rawMap := m.Raw(); rawMap != nil {
			for k, val := range rawMap {
				kLower := strings.ToLower(k)
				var strVal string
				if str, ok := val.(string); ok {
					strVal = str
				} else if byteSlice, ok := val.([]byte); ok {
					strVal = string(byteSlice)
				} else if slice, ok := val.([]string); ok && len(slice) > 0 {
					strVal = slice[0]
				}
				strValLower := strings.ToLower(strVal)
				if strings.Contains(kLower, "dolby") || strings.Contains(kLower, "atmos") ||
					strings.Contains(strValLower, "dolby") || strings.Contains(strValLower, "atmos") {
					quality = "Spatial Audio"
					if codec == "Unknown" || codec == "AAC" {
						codec = "E-AC-3"
					}
				}
			}
		}
	}

	return &Song{
		ID:              songID,
		Title:           title,
		Artist:          artist,
		AlbumArtist:     albumArtist,
		AlbumID:         albumID,
		AlbumTitle:      albumTitle,
		Duration:        durationStr,
		DurationSeconds: durationSec,
		CoverURL:        coverURL,
		AudioURL:        audioURL,
		FilePath:        path,
		Artwork:         coverURL,
		IsFavorite:      false,
		Year:            year,
		Genre:           genre,
		Codec:           codec,
		Quality:         quality,
		SampleRate:      sampleRate,
		BitDepth:        bitDepth,
		Bitrate:         bitrate,
		HasTTML:         hasTTML,
		Copyright:       copyright,
	}, nil
}

func parseFLACInfo(filePath string) (sampleRate int, channels int, bitDepth int, bitrate int, durationSeconds int) {
	f, err := os.Open(filePath)
	if err != nil {
		return 0, 0, 0, 0, 0
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil {
		return 0, 0, 0, 0, 0
	}
	fileSize := info.Size()

	buf := make([]byte, 42)
	n, err := f.Read(buf)
	if err != nil || n < 42 {
		return 0, 0, 0, 0, 0
	}

	if string(buf[:4]) != "fLaC" {
		return 0, 0, 0, 0, 0
	}

	sr20 := (uint32(buf[18+8]) << 12) | (uint32(buf[19+8]) << 4) | (uint32(buf[20+8]) >> 4)
	sampleRate = int(sr20)

	channels = int(((buf[20+8] >> 1) & 0x07) + 1)

	bitDepth = int((((buf[20+8] & 0x01) << 4) | (buf[21+8] >> 4)) + 1)

	ts36 := (uint64(buf[21+8]&0x0F) << 32) | (uint64(buf[22+8]) << 24) | (uint64(buf[23+8]) << 16) | (uint64(buf[24+8]) << 8) | uint64(buf[25+8])

	if sampleRate > 0 {
		durationSeconds = int(ts36 / uint64(sampleRate))
		if durationSeconds > 0 {
			bitrate = int((fileSize * 8) / int64(durationSeconds * 1000))
		}
	}
	return
}

func parseWAVInfo(filePath string) (sampleRate int, channels int, bitDepth int, bitrate int, durationSeconds int) {
	f, err := os.Open(filePath)
	if err != nil {
		return 0, 0, 0, 0, 0
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil {
		return 0, 0, 0, 0, 0
	}
	fileSize := info.Size()

	buf := make([]byte, 1024)
	n, err := f.Read(buf)
	if err != nil || n < 44 {
		return 0, 0, 0, 0, 0
	}

	if string(buf[:4]) != "RIFF" || string(buf[8:12]) != "WAVE" {
		return 0, 0, 0, 0, 0
	}

	idx := bytes.Index(buf, []byte("fmt "))
	if idx == -1 || idx+20 > len(buf) {
		return 0, 0, 0, 0, 0
	}

	dataIdx := idx + 8
	channels = int(binary.LittleEndian.Uint16(buf[dataIdx+2 : dataIdx+4]))
	sampleRate = int(binary.LittleEndian.Uint32(buf[dataIdx+4 : dataIdx+8]))
	bitrate = int(binary.LittleEndian.Uint32(buf[dataIdx+8:dataIdx+12])) * 8 / 1000
	bitDepth = int(binary.LittleEndian.Uint16(buf[dataIdx+14 : dataIdx+16]))

	dataChunkIdx := bytes.Index(buf, []byte("data"))
	if dataChunkIdx != -1 && dataChunkIdx+8 <= len(buf) {
		dataSize := int64(binary.LittleEndian.Uint32(buf[dataChunkIdx+4 : dataChunkIdx+8]))
		byteRate := int64(binary.LittleEndian.Uint32(buf[dataIdx+8 : dataIdx+12]))
		if byteRate > 0 {
			durationSeconds = int(dataSize / byteRate)
		}
	}
	if durationSeconds <= 0 && bitrate > 0 {
		durationSeconds = int((fileSize * 8) / int64(bitrate * 1000))
	}
	return
}

func parseM4AInfo(filePath string) (codec string, sampleRate int, channels int, bitDepth int, bitrate int, durationSeconds int) {
	codec = "AAC"
	sampleRate = 44100
	channels = 2
	bitDepth = 16
	bitrate = 256
	durationSeconds = 0

	f, err := os.Open(filePath)
	if err != nil {
		return
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		return
	}
	fileSize := stat.Size()

	var mdatSize int64
	var durationTicks uint64
	var timeScale uint32

	var scan func(off int64, end int64) error
	scan = func(off int64, end int64) error {
		for off < end {
			_, err := f.Seek(off, io.SeekStart)
			if err != nil {
				return err
			}

			var header [8]byte
			_, err = io.ReadFull(f, header[:])
			if err != nil {
				if err == io.EOF || err == io.ErrUnexpectedEOF {
					return nil
				}
				return err
			}

			size := int64(binary.BigEndian.Uint32(header[0:4]))
			boxType := string(header[4:8])

			var headerSize int64 = 8
			if size == 1 {
				var size64 [8]byte
				if _, err := io.ReadFull(f, size64[:]); err != nil {
					return err
				}
				size = int64(binary.BigEndian.Uint64(size64[:]))
				headerSize = 16
			}

			if size <= 0 {
				break
			}

			if boxType == "mvhd" {
				payloadSize := size - headerSize
				payload := make([]byte, payloadSize)
				if _, err := io.ReadFull(f, payload); err == nil && len(payload) >= 20 {
					version := payload[0]
					if version == 0 {
						timeScale = binary.BigEndian.Uint32(payload[12:16])
						durationTicks = uint64(binary.BigEndian.Uint32(payload[16:20]))
					} else if version == 1 && len(payload) >= 32 {
						timeScale = binary.BigEndian.Uint32(payload[20:24])
						durationTicks = binary.BigEndian.Uint64(payload[24:32])
					}
					if timeScale > 0 {
						durationSeconds = int(durationTicks / uint64(timeScale))
					}
				}
			} else if boxType == "mdat" {
				mdatSize = size - headerSize
			} else if boxType == "alac" {
				if size == 36 {
					payloadSize := size - headerSize
					payload := make([]byte, payloadSize)
					if _, err := io.ReadFull(f, payload); err == nil {
						if len(payload) == 28 {
							codec = "ALAC"
							bitDepth = int(payload[9])
							channels = int(payload[13])
							sampleRate = int(binary.BigEndian.Uint32(payload[24:28]))
						}
					}
				}
			} else if boxType == "mp4a" {
				payloadSize := size - headerSize
				payload := make([]byte, payloadSize)
				if _, err := io.ReadFull(f, payload); err == nil && len(payload) >= 28 {
					codec = "AAC"
					channels = int(binary.BigEndian.Uint16(payload[16:18]))
					bitDepth = int(binary.BigEndian.Uint16(payload[18:20]))
					if bitDepth == 0 {
						bitDepth = 16
					}
					sampleRate = int(binary.BigEndian.Uint16(payload[24:26]))
					if sampleRate < 8000 || sampleRate > 192000 {
						sampleRate = 44100
					}
					if channels <= 0 || channels > 8 {
						channels = 2
					}
				}
			} else if boxType == "ec-3" || boxType == "ac-3" {
				payloadSize := size - headerSize
				payload := make([]byte, payloadSize)
				if _, err := io.ReadFull(f, payload); err == nil && len(payload) >= 28 {
					if boxType == "ec-3" {
						codec = "E-AC-3"
					} else {
						codec = "AC-3"
					}
					channels = int(binary.BigEndian.Uint16(payload[16:18]))
					bitDepth = int(binary.BigEndian.Uint16(payload[18:20]))
					if bitDepth == 0 {
						bitDepth = 16
					}
					sampleRate = int(binary.BigEndian.Uint16(payload[24:26]))
					if sampleRate < 8000 || sampleRate > 192000 {
						sampleRate = 44100
					}
					if channels <= 0 || channels > 8 {
						channels = 2
					}
				}
			}

			isContainer := boxType == "moov" || boxType == "trak" || boxType == "mdia" ||
				boxType == "minf" || boxType == "stbl" || boxType == "stsd" || (boxType == "alac" && size > 36)

			if isContainer {
				childStart := off + headerSize
				if boxType == "stsd" {
					childStart += 8
				} else if boxType == "alac" {
					childStart += 28
				}
				childEnd := off + size
				_ = scan(childStart, childEnd)
			}

			off += size
		}
		return nil
	}

	_ = scan(0, fileSize)

	if timeScale > 0 && durationTicks > 0 {
		durationInSeconds := float64(durationTicks) / float64(timeScale)
		if durationInSeconds > 0 {
			if mdatSize > 0 {
				bitrate = int(float64(mdatSize*8) / (durationInSeconds * 1000))
			} else {
				bitrate = int(float64(fileSize*8) / (durationInSeconds * 1000))
			}
		}
	}
	if bitrate <= 0 {
		if durationSeconds > 0 {
			bitrate = int((fileSize * 8) / int64(durationSeconds * 1000))
		} else {
			bitrate = 256
		}
	}

	return
}

func parseMP3Info(filePath string) (sampleRate int, channels int, bitDepth int, bitrate int, durationSeconds int) {
	f, err := os.Open(filePath)
	if err != nil {
		return 44100, 2, 16, 320, 0
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil {
		return 44100, 2, 16, 320, 0
	}
	fileSize := info.Size()

	buf := make([]byte, 128*1024)
	n, err := f.Read(buf)
	if err != nil || n < 4 {
		return 44100, 2, 16, 320, 0
	}

	bitratesMPEG1 := []int{0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0}
	bitratesMPEG2 := []int{0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0}
	sampleratesMPEG1 := []int{44100, 48000, 32000, 0}
	sampleratesMPEG2 := []int{22050, 24000, 16000, 0}

	for i := 0; i < n-4; i++ {
		if buf[i] == 0xFF && (buf[i+1]&0xE0) == 0xE0 {
			version := (buf[i+1] >> 3) & 0x03
			layer := (buf[i+1] >> 1) & 0x03
			if layer == 1 {
				bitrateIdx := (buf[i+2] >> 4) & 0x0F
				samplerateIdx := (buf[i+2] >> 2) & 0x03
				chanMode := (buf[i+3] >> 6) & 0x03

				channels = 2
				if chanMode == 3 {
					channels = 1
				}
				bitDepth = 16

				if version == 3 {
					bitrate = bitratesMPEG1[bitrateIdx]
					sampleRate = sampleratesMPEG1[samplerateIdx]
				} else {
					bitrate = bitratesMPEG2[bitrateIdx]
					sampleRate = sampleratesMPEG2[samplerateIdx]
				}

				if bitrate > 0 {
					durationSeconds = int((fileSize * 8) / int64(bitrate * 1000))
				}
				return
			}
		}
	}

	return 44100, 2, 16, 320, 0
}

func extractYearFromRaw(m tag.Metadata) string {
	if m == nil {
		return ""
	}
	if m.Year() != 0 {
		return strconv.Itoa(m.Year())
	}
	raw := m.Raw()
	if raw == nil {
		return ""
	}

	keys := []string{"©day", "day", "TDRC", "TYER", "TDRL", "RELEASETIME", "release_date", "date"}
	for _, k := range keys {
		if val, ok := raw[k]; ok {
			var strVal string
			if str, ok := val.(string); ok {
				strVal = str
			} else if slice, ok := val.([]string); ok && len(slice) > 0 {
				strVal = slice[0]
			} else {
				strVal = fmt.Sprintf("%v", val)
			}

			for i := 0; i <= len(strVal)-4; i++ {
				if isDigit(strVal[i]) && isDigit(strVal[i+1]) && isDigit(strVal[i+2]) && isDigit(strVal[i+3]) {
					return strVal[i : i+4]
				}
			}
		}
	}
	return ""
}

func extractCopyrightFromRaw(m tag.Metadata) string {
	if m == nil {
		return ""
	}
	raw := m.Raw()
	if raw == nil {
		return ""
	}

	keys := []string{"cprt", "copyright", "TCOP", "COPYRIGHT", "©cprt"}
	for _, k := range keys {
		if val, ok := raw[k]; ok {
			var strVal string
			if str, ok := val.(string); ok {
				strVal = str
			} else if slice, ok := val.([]string); ok && len(slice) > 0 {
				strVal = slice[0]
			} else {
				strVal = fmt.Sprintf("%v", val)
			}
			if strVal != "" {
				return strVal
			}
		}
	}
	return ""
}

func isDigit(b byte) bool {
	return b >= '0' && b <= '9'
}

func cleanM4AMetadataString(s string) string {
	if s == "" {
		return ""
	}

	data := []byte(s)
	var parts []string

	currentStart := 0
	i := 0
	for i < len(data) {
		if i+4 <= len(data) && string(data[i:i+4]) == "data" {
			headerStart := i - 4
			headerEnd := i + 12

			if headerStart >= currentStart && headerEnd <= len(data) {
				part := string(data[currentStart:headerStart])
				part = strings.TrimSpace(part)
				if part != "" {
					parts = append(parts, part)
				}
				currentStart = headerEnd
				i = headerEnd
				continue
			}
		}
		i++
	}

	if currentStart < len(data) {
		part := string(data[currentStart:])
		part = strings.TrimSpace(part)
		if part != "" {
			parts = append(parts, part)
		}
	}

	if len(parts) > 0 {
		for idx, p := range parts {
			parts[idx] = removeControlChars(p)
		}
		return strings.Join(parts, " / ")
	}

	return removeControlChars(s)
}

func removeControlChars(s string) string {
	var sb strings.Builder
	for _, r := range s {
		if r >= 32 && r != 127 {
			sb.WriteRune(r)
		}
	}
	return strings.TrimSpace(sb.String())
}

func (s *LibraryService) startWatching() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Printf("[LibraryService] Failed to create fsnotify watcher: %v", err)
		return
	}
	s.watcher = watcher
	defer watcher.Close()

	// Initial watch setup
	s.updateWatcherPaths()

	// Ticker to periodically check for new/deleted folders in the database
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			s.handleWatcherEvent(event)

		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			log.Printf("[LibraryService] Watcher error: %v", err)

		case <-ticker.C:
			s.updateWatcherPaths()
		}
	}
}

func (s *LibraryService) handleWatcherEvent(event fsnotify.Event) {
	path := event.Name
	ext := strings.ToLower(filepath.Ext(path))

	isDelete := event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename)
	
	if isDelete {
		res, err := s.db.Exec("DELETE FROM songs WHERE file_path = ?", path)
		if err == nil {
			rowsAffected, _ := res.RowsAffected()
			if rowsAffected > 0 {
				log.Printf("[LibraryService] Watcher deleted song from DB: %s", path)
				s.notifyLibraryChanged()
			}
		}
		
		s.watcherMu.Lock()
		if s.watchedDirs[path] {
			s.watcher.Remove(path)
			delete(s.watchedDirs, path)
			log.Printf("[LibraryService] Watcher stopped watching directory: %s", path)
		}
		s.watcherMu.Unlock()
		return
	}

	info, err := os.Stat(path)
	if err == nil && info.IsDir() {
		if event.Has(fsnotify.Create) {
			s.watchDirectoryRecursive(path)
		}
		return
	}

	isAudio := ext == ".mp3" || ext == ".flac" || ext == ".m4a" || ext == ".wav" || ext == ".ogg" || ext == ".alac" || ext == ".aac"
	if isAudio && (event.Has(fsnotify.Create) || event.Has(fsnotify.Write)) {
		time.Sleep(200 * time.Millisecond)

		song, err := s.parseAudioFile(path)
		if err != nil {
			log.Printf("[LibraryService] Watcher failed to parse %s: %v", path, err)
			return
		}

		isFavVal := 0
		if song.IsFavorite {
			isFavVal = 1
		}
		hasTTMLVal := 0
		if song.HasTTML {
			hasTTMLVal = 1
		}

		_, err = s.db.Exec(`
			INSERT OR REPLACE INTO songs (
				id, title, artist, album_artist, album_id, album_title, duration, duration_seconds, cover_url, audio_url, file_path, artwork, is_favorite, year, genre, codec, quality, sample_rate, bit_depth, bitrate, has_ttml
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
			song.ID, song.Title, song.Artist, song.AlbumArtist, song.AlbumID, song.AlbumTitle,
			song.Duration, song.DurationSeconds, song.CoverURL, song.AudioURL, song.FilePath,
			song.Artwork, isFavVal, song.Year, song.Genre, song.Codec, song.Quality,
			song.SampleRate, song.BitDepth, song.Bitrate, hasTTMLVal,
		)

		if err != nil {
			log.Printf("[LibraryService] Watcher failed to upsert song %s: %v", path, err)
		} else {
			log.Printf("[LibraryService] Watcher successfully updated song in DB: %s", song.Title)
			s.notifyLibraryChanged()
		}
	}
}

func (s *LibraryService) notifyLibraryChanged() {
	app := application.Get()
	if app != nil {
		app.Event.Emit("library-changed", "update")
	}
}

func (s *LibraryService) watchDirectoryRecursive(dir string) {
	_ = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			s.watcherMu.Lock()
			if !s.watchedDirs[path] {
				err := s.watcher.Add(path)
				if err == nil {
					s.watchedDirs[path] = true
					log.Printf("[LibraryService] Watching directory: %s", path)
				} else {
					log.Printf("[LibraryService] Error watching %s: %v", path, err)
				}
			}
			s.watcherMu.Unlock()
		}
		return nil
	})
}

func (s *LibraryService) updateWatcherPaths() {
	rows, err := s.db.Query("SELECT path FROM folders")
	if err != nil {
		return
	}
	defer rows.Close()

	var folders []string
	for rows.Next() {
		var path string
		if err := rows.Scan(&path); err == nil {
			folders = append(folders, path)
		}
	}

	for _, folder := range folders {
		s.watchDirectoryRecursive(folder)
	}
}
