package library

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/dhowden/tag"
)

type Song struct {
	ID              string   `json:"id"`
	Title           string   `json:"title"`
	Artist          string   `json:"artist"`
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
}

type LibraryService struct {
	db     *sql.DB
	appDir string
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

	// Create songs table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS songs (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			artist TEXT NOT NULL,
			album_id TEXT NOT NULL,
			album_title TEXT NOT NULL,
			duration TEXT NOT NULL,
			duration_seconds INTEGER NOT NULL,
			cover_url TEXT NOT NULL,
			audio_url TEXT NOT NULL,
			file_path TEXT UNIQUE NOT NULL,
			artwork TEXT NOT NULL,
			is_favorite INTEGER DEFAULT 0
		);
	`)
	if err != nil {
		return nil, err
	}

	return &LibraryService{db: db, appDir: appDir}, nil
}

func (s *LibraryService) GetSongs() ([]Song, error) {
	rows, err := s.db.Query("SELECT id, title, artist, album_id, album_title, duration, duration_seconds, cover_url, audio_url, file_path, artwork, is_favorite FROM songs")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var songs []Song
	for rows.Next() {
		var song Song
		var isFavInt int
		err := rows.Scan(
			&song.ID,
			&song.Title,
			&song.Artist,
			&song.AlbumID,
			&song.AlbumTitle,
			&song.Duration,
			&song.DurationSeconds,
			&song.CoverURL,
			&song.AudioURL,
			&song.FilePath,
			&song.Artwork,
			&isFavInt,
		)
		if err != nil {
			return nil, err
		}
		song.IsFavorite = isFavInt == 1
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
	rows, err := s.db.Query("SELECT file_path FROM songs")
	if err == nil {
		for rows.Next() {
			var fp string
			if err := rows.Scan(&fp); err == nil {
				existingFiles[fp] = true
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
			if ext != ".mp3" && ext != ".flac" && ext != ".m4a" && ext != ".wav" && ext != ".ogg" && ext != ".alac" && ext != ".aac" {
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
				id, title, artist, album_id, album_title, duration, duration_seconds, cover_url, audio_url, file_path, artwork, is_favorite
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

			_, err = stmt.Exec(
				song.ID,
				song.Title,
				song.Artist,
				song.AlbumID,
				song.AlbumTitle,
				song.Duration,
				song.DurationSeconds,
				song.CoverURL,
				song.AudioURL,
				song.FilePath,
				song.Artwork,
				isFavVal,
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

	var coverURL string

	if err == nil && m != nil {
		if t := m.Title(); t != "" {
			title = t
		}
		if a := m.Artist(); a != "" {
			artist = a
		}
		if al := m.Album(); al != "" {
			albumTitle = al
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

	// If no embedded artwork, search same directory for images
	if coverURL == "" {
		dir := filepath.Dir(path)
		commonNames := []string{"cover.jpg", "cover.png", "folder.jpg", "folder.png", "album.jpg", "album.png"}
		for _, name := range commonNames {
			imgPath := filepath.Join(dir, name)
			if _, err := os.Stat(imgPath); err == nil {
				// We found an image file in the directory! Copy it to artwork cache folder
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

	// Album ID is hash of Album Title + Artist to ensure grouping is correct
	albumIDHash := sha256.Sum256([]byte(albumTitle + artist))
	albumID := hex.EncodeToString(albumIDHash[:])

	// For local files, we stream via the /audio-file endpoint passing the encoded filePath
	audioURL := "/audio-file?path=" + strings.ReplaceAll(path, "\\", "/")

	return &Song{
		ID:              songID,
		Title:           title,
		Artist:          artist,
		AlbumID:         albumID,
		AlbumTitle:      albumTitle,
		Duration:        "4:00", // Default duration, libmpv updates duration dynamically when played!
		DurationSeconds: 240,
		CoverURL:        coverURL,
		AudioURL:        audioURL,
		FilePath:        path,
		Artwork:         coverURL,
		IsFavorite:      false,
	}, nil
}
