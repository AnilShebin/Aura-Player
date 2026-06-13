package lyrics

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/bogem/id3v2/v2"
	"github.com/dhowden/tag"
)

// LyricsService provides lyrics fetching capabilities as a Wails-bound service.
type LyricsService struct {
	db *sql.DB
}

// NewLyricsService creates a new LyricsService instance.
func NewLyricsService(db *sql.DB) *LyricsService {
	if db != nil {
		_, err := db.Exec(`
			CREATE TABLE IF NOT EXISTS lyrics_cache (
				file_path TEXT PRIMARY KEY,
				lyrics TEXT NOT NULL,
				status TEXT NOT NULL,
				source TEXT DEFAULT '',
				last_fetched DATETIME DEFAULT CURRENT_TIMESTAMP
			);
		`)
		if err != nil {
			log.Printf("[LyricsService] Failed to create lyrics_cache table: %v", err)
		}
		// Safely add source column if it doesn't exist in older databases
		_, _ = db.Exec("ALTER TABLE lyrics_cache ADD COLUMN source TEXT DEFAULT ''")
		// Clear negative caches to retry lookup with the new 15s timeout
		_, _ = db.Exec("DELETE FROM lyrics_cache WHERE status = 'not_found'")
	}
	return &LyricsService{db: db}
}

// GetLyrics extracts and parses lyrics for the given audio file path.
// It returns a structured LyricsResult with synced timing, lines, and raw text.
func (s *LyricsService) GetLyrics(filePath string) LyricsResult {
	log.Printf("[LyricsService] GetLyrics called: %s", filePath)

	// 1. Check local files (sidecar or embedded metadata) first
	raw := extractRawLyrics(filePath)
	if raw != "" {
		log.Printf("[LyricsService] Found local/embedded lyrics (length: %d)", len(raw))
		res := parseLyrics(raw)
		
		source := "Local"
		if s.db != nil {
			var cachedSource string
			var cachedLyrics string
			err := s.db.QueryRow(`
				SELECT source, lyrics 
				FROM lyrics_cache 
				WHERE file_path = ?
			`, filePath).Scan(&cachedSource, &cachedLyrics)
			
			if err == nil && cachedSource != "" && cachedLyrics == raw {
				source = cachedSource
			}
		}
		
		res.Source = source
		return res
	}

	// 2. Check local database cache to prevent hitting LRCLIB repeatedly
	if s.db != nil {
		var cachedLyrics string
		var status string
		var lastFetchedStr string
		var cachedSource string
		err := s.db.QueryRow(`
			SELECT lyrics, status, last_fetched, source 
			FROM lyrics_cache 
			WHERE file_path = ?
		`, filePath).Scan(&cachedLyrics, &status, &lastFetchedStr, &cachedSource)

		if err == nil {
			switch status {
			case "found":
				log.Printf("[LyricsService] Cache hit: found lyrics for: %s", filePath)
				res := parseLyrics(cachedLyrics)
				if cachedSource != "" {
					res.Source = cachedSource
				} else {
					res.Source = "LRCLIB"
				}
				return res
			case "not_found":
				// SQLite CURRENT_TIMESTAMP is in "2006-01-02 15:04:05" UTC format
				t, parseErr := time.Parse("2006-01-02 15:04:05", lastFetchedStr)
				if parseErr == nil && time.Since(t) < 24*time.Hour {
					log.Printf("[LyricsService] Cache hit: 'not_found' status within 24h for: %s. Skipping lookup.", filePath)
					return LyricsResult{Synced: false, Lines: []LyricLine{}, Raw: "", Source: "LRCLIB"}
				}
			}
		}
	}

	// 3. Fallback: extract metadata to query LRCLIB online
	var artist, title, album string
	var durationSeconds int

	if s.db != nil {
		err := s.db.QueryRow(`
			SELECT artist, title, album_title, duration_seconds 
			FROM songs 
			WHERE file_path = ?
		`, filePath).Scan(&artist, &title, &album, &durationSeconds)
		if err != nil {
			log.Printf("[LyricsService] Song metadata not found in DB for %s: %v. Fallback to file tags.", filePath, err)
		}
	}

	if artist == "" || title == "" {
		file, err := os.Open(filePath)
		if err == nil {
			m, err := tag.ReadFrom(file)
			if err == nil {
				artist = m.Artist()
				title = m.Title()
				album = m.Album()
			}
			file.Close()
		}
	}

	if artist != "" && title != "" {
		log.Printf("[LyricsService] Local/cache miss. Fetching online from LRCLIB for: %s - %s", artist, title)
		onlineLyrics := fetchLyricsFromLRCLIB(artist, title, album, durationSeconds)
		if onlineLyrics != "" {
			log.Printf("[LyricsService] Online lyrics fetched successfully (length: %d)", len(onlineLyrics))

			// Save found lyrics in cache
			if s.db != nil {
				_, _ = s.db.Exec(`
					INSERT OR REPLACE INTO lyrics_cache (file_path, lyrics, status, source, last_fetched)
					VALUES (?, ?, 'found', 'LRCLIB', CURRENT_TIMESTAMP)
				`, filePath, onlineLyrics)
			}

			res := parseLyrics(onlineLyrics)
			res.Source = "LRCLIB"
			return res
		}
	}

	// 4. Save not_found state in cache if LRCLIB returned nothing
	log.Printf("[LyricsService] No lyrics found anywhere for: %s", filePath)
	if s.db != nil {
		_, _ = s.db.Exec(`
			INSERT OR REPLACE INTO lyrics_cache (file_path, lyrics, status, source, last_fetched)
			VALUES (?, '', 'not_found', 'LRCLIB', CURRENT_TIMESTAMP)
		`, filePath)
	}

	return LyricsResult{Synced: false, Lines: []LyricLine{}, Raw: "", Source: "None"}
}

// GetOnlineLyrics forces a lookup from LRCLIB, bypassing local sidecar/embedded files.
// It returns a structured LyricsResult with synced timing, lines, and raw text.
func (s *LyricsService) GetOnlineLyrics(filePath string) LyricsResult {
	log.Printf("[LyricsService] GetOnlineLyrics (force online) called for: %s", filePath)

	var artist, title, album string
	var durationSeconds int

	if s.db != nil {
		err := s.db.QueryRow(`
			SELECT artist, title, album_title, duration_seconds 
			FROM songs 
			WHERE file_path = ?
		`, filePath).Scan(&artist, &title, &album, &durationSeconds)
		if err != nil {
			log.Printf("[LyricsService] Song metadata not found in DB for %s: %v. Fallback to file tags.", filePath, err)
		}
	}

	if artist == "" || title == "" {
		file, err := os.Open(filePath)
		if err == nil {
			m, err := tag.ReadFrom(file)
			if err == nil {
				artist = m.Artist()
				title = m.Title()
				album = m.Album()
			}
			file.Close()
		}
	}

	if artist != "" && title != "" {
		log.Printf("[LyricsService] Fetching online from LRCLIB for: %s - %s", artist, title)
		onlineLyrics := fetchLyricsFromLRCLIB(artist, title, album, durationSeconds)
		if onlineLyrics != "" {
			log.Printf("[LyricsService] Online lyrics fetched successfully (length: %d)", len(onlineLyrics))

			// Save found lyrics in cache
			if s.db != nil {
				_, _ = s.db.Exec(`
					INSERT OR REPLACE INTO lyrics_cache (file_path, lyrics, status, source, last_fetched)
					VALUES (?, ?, 'found', 'LRCLIB', CURRENT_TIMESTAMP)
				`, filePath, onlineLyrics)
			}

			res := parseLyrics(onlineLyrics)
			res.Source = "LRCLIB"
			return res
		}
	}

	// Save not_found state in cache if LRCLIB returned nothing
	log.Printf("[LyricsService] No online lyrics found for: %s", filePath)
	if s.db != nil {
		_, _ = s.db.Exec(`
			INSERT OR REPLACE INTO lyrics_cache (file_path, lyrics, status, source, last_fetched)
			VALUES (?, '', 'not_found', 'LRCLIB', CURRENT_TIMESTAMP)
		`, filePath)
	}

	return LyricsResult{Synced: false, Lines: []LyricLine{}, Raw: "", Source: "LRCLIB"}
}

// LRCLibSearchResult matches the track structure returned by LRCLIB search.
type LRCLibSearchResult struct {
	ID           int     `json:"id"`
	TrackName    string  `json:"trackName"`
	ArtistName   string  `json:"artistName"`
	AlbumName    string  `json:"albumName"`
	Duration     float64 `json:"duration"`
	PlainLyrics  string  `json:"plainLyrics"`
	SyncedLyrics string  `json:"syncedLyrics"`
}

// SearchOnlineLyrics queries LRCLIB for a search query and returns the matching results.
func (s *LyricsService) SearchOnlineLyrics(query string) []LRCLibSearchResult {
	log.Printf("[LyricsService] SearchOnlineLyrics called with query: %s", query)
	client := &http.Client{Timeout: 15 * time.Second}

	queryVal := url.Values{}
	queryVal.Set("q", query)
	reqURL := "https://lrclib.net/api/search?" + queryVal.Encode()

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil
	}
	req.Header.Set("User-Agent", "Aura-Player/1.0.13 (https://github.com/AnilShebin/Aura-Player)")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[LyricsService] SearchOnlineLyrics request failed: %v", err)
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[LyricsService] SearchOnlineLyrics returned status: %d", resp.StatusCode)
		return nil
	}

	var results []LRCLibSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		log.Printf("[LyricsService] SearchOnlineLyrics failed to decode: %v", err)
		return nil
	}

	return results
}

// SaveCustomLyrics caches the selected custom lyrics text and parses it to return to the UI.
func (s *LyricsService) SaveCustomLyrics(filePath string, lyricsText string) LyricsResult {
	log.Printf("[LyricsService] SaveCustomLyrics called for: %s (lyrics length: %d)", filePath, len(lyricsText))
	if s.db != nil {
		_, _ = s.db.Exec(`
			INSERT OR REPLACE INTO lyrics_cache (file_path, lyrics, status, source, last_fetched)
			VALUES (?, ?, 'found', 'LRCLIB', CURRENT_TIMESTAMP)
		`, filePath, lyricsText)
	}

	res := parseLyrics(lyricsText)
	res.Source = "LRCLIB"
	return res
}

// PackLyrics embeds the lyrics text directly inside the audio file's metadata tags,
// removing any legacy sidecar files (.lrc, .ttml, etc.) from the folder.
// If direct embedding is not supported for the format, it falls back to saving a sidecar.
func (s *LyricsService) PackLyrics(filePath string, lyricsText string, source string) LyricsResult {
	log.Printf("[LyricsService] PackLyrics called for: %s (length: %d, source: %s)", filePath, len(lyricsText), source)

	ext := filepath.Ext(filePath)
	if ext == "" {
		log.Printf("[LyricsService] PackLyrics failed: invalid file path: missing extension")
		return LyricsResult{Synced: false, Lines: []LyricLine{}, Raw: lyricsText, Source: "None"}
	}
	basePathNoExt := filePath[:len(filePath)-len(ext)]

	// Try embedding the lyrics directly into the audio file
	embeddedSuccess := false
	err := embedLyricsInFile(filePath, lyricsText)
	if err == nil {
		log.Printf("[LyricsService] Successfully embedded lyrics into audio file tags for: %s", filePath)
		embeddedSuccess = true
	} else {
		log.Printf("[LyricsService] Embedding failed (will fall back to sidecar): %v", err)
	}

	// Determine fallback sidecar path
	sidecarExt := ".lrc"
	trimmed := strings.TrimSpace(lyricsText)
	if strings.Contains(trimmed, "<tt ") || strings.Contains(trimmed, "<tt>") {
		sidecarExt = ".ttml"
	}
	targetSidecarPath := basePathNoExt + sidecarExt

	if embeddedSuccess {
		// Clean up ANY sidecar files to keep the directory clean as requested
		for _, e := range []string{".lrc", ".ttml", ".srt", ".vtt"} {
			oldPath := basePathNoExt + e
			_ = os.Remove(oldPath)
		}
	} else {
		// Fallback: write a sidecar file
		errWrite := os.WriteFile(targetSidecarPath, []byte(lyricsText), 0644)
		if errWrite != nil {
			log.Printf("[LyricsService] PackLyrics fallback sidecar write failed: %v", errWrite)
		} else {
			log.Printf("[LyricsService] PackLyrics fallback: successfully wrote sidecar: %s", targetSidecarPath)
		}
		// Clean up other mismatched sidecar formats
		for _, e := range []string{".lrc", ".ttml", ".srt", ".vtt"} {
			oldPath := basePathNoExt + e
			if oldPath != targetSidecarPath {
				_ = os.Remove(oldPath)
			}
		}
	}

	// Update local cache database
	if s.db != nil {
		_, _ = s.db.Exec(`
			INSERT OR REPLACE INTO lyrics_cache (file_path, lyrics, status, source, last_fetched)
			VALUES (?, ?, 'found', ?, CURRENT_TIMESTAMP)
		`, filePath, lyricsText, source)
	}

	res := parseLyrics(lyricsText)
	res.Source = source
	return res
}

// embedLyricsInFile writes lyrics directly to the metadata tags of the audio file.
func embedLyricsInFile(filePath string, lyricsText string) error {
	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".mp3":
		tag, err := id3v2.Open(filePath, id3v2.Options{Parse: true})
		if err != nil {
			return fmt.Errorf("failed to open MP3 tags: %w", err)
		}
		defer tag.Close()

		tag.AddUnsynchronisedLyricsFrame(id3v2.UnsynchronisedLyricsFrame{
			Encoding:          id3v2.EncodingUTF8,
			Language:          "eng",
			ContentDescriptor: "",
			Lyrics:            lyricsText,
		})

		if err := tag.Save(); err != nil {
			return fmt.Errorf("failed to save MP3 tags: %w", err)
		}
		return nil
	case ".m4a", ".mp4":
		// Use FFmpeg to write the lyrics metadata securely to avoid container corruption on files with multiple tracks/cover art.
		tempPath := filePath + ".tmp" + ext
		cmd := exec.Command("ffmpeg", "-y", "-i", filePath, "-metadata", "lyrics="+lyricsText, "-c", "copy", tempPath)
		configureCommand(cmd)

		output, err := cmd.CombinedOutput()
		if err != nil {
			_ = os.Remove(tempPath)
			return fmt.Errorf("ffmpeg command failed: %w (output: %s)", err, string(output))
		}

		// Perform atomic swap with backup to protect the file if locked/in-use on Windows
		bakPath := filePath + ".bak" + ext
		err = os.Rename(filePath, bakPath)
		if err != nil {
			_ = os.Remove(tempPath)
			return fmt.Errorf("failed to rename original file to backup (file likely in use/locked by player): %w", err)
		}

		err = os.Rename(tempPath, filePath)
		if err != nil {
			_ = os.Rename(bakPath, filePath)
			_ = os.Remove(tempPath)
			return fmt.Errorf("failed to rename temp file to original: %w", err)
		}

		_ = os.Remove(bakPath)
		return nil
	default:
		return fmt.Errorf("unsupported file format for embedded lyrics: %s", ext)
	}
}
