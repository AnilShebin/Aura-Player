package lyrics

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dhowden/tag"
)

// sidecarExtensions lists the lyric sidecar file extensions to check in priority order.
var sidecarExtensions = []string{".ttml", ".lrc", ".srt", ".vtt"}

// extractRawLyrics attempts to read lyrics for the given audio file.
// Priority: sidecar .ttml/.lrc/.srt/.vtt files → embedded metadata via dhowden/tag.
func extractRawLyrics(audioFilePath string) string {
	ext := filepath.Ext(audioFilePath)
	basePathNoExt := audioFilePath[:len(audioFilePath)-len(ext)]

	// Check for sidecar lyric files in the same directory
	for _, sidecarExt := range sidecarExtensions {
		sidecarPath := basePathNoExt + sidecarExt
		if content, err := os.ReadFile(sidecarPath); err == nil {
			trimmed := strings.TrimSpace(string(content))
			if trimmed != "" {
				log.Printf("[LyricsService] Found sidecar %s file: %s", sidecarExt, sidecarPath)
				return trimmed
			}
		}
	}

	// Fallback: extract embedded lyrics via dhowden/tag
	file, err := os.Open(audioFilePath)
	if err != nil {
		return ""
	}
	defer file.Close()

	m, err := tag.ReadFrom(file)
	if err != nil {
		return ""
	}

	// First search raw tags for iTunes custom atoms containing TTML
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
				if idx := strings.Index(strVal, "<tt"); idx >= 0 {
					cleanVal := strVal[idx:]
					log.Printf("[LyricsService] Found embedded TTML lyrics in key %s (length: %d, cleaned length: %d)", k, len(strVal), len(cleanVal))
					return cleanVal
				}
			}
		}
	}

	embedded := m.Lyrics()
	if strings.TrimSpace(embedded) != "" {
		log.Printf("[LyricsService] Found embedded lyrics (length: %d)", len(embedded))
		return strings.TrimSpace(embedded)
	}

	return ""
}

type LRCLibTrack struct {
	ID           int     `json:"id"`
	TrackName    string  `json:"trackName"`
	ArtistName   string  `json:"artistName"`
	AlbumName    string  `json:"albumName"`
	Duration     float64 `json:"duration"`
	PlainLyrics  string  `json:"plainLyrics"`
	SyncedLyrics string  `json:"syncedLyrics"`
}

func fetchLyricsFromLRCLIB(artist, title, album string, durationSeconds int) string {
	if artist == "" || title == "" {
		return ""
	}

	client := &http.Client{Timeout: 15 * time.Second}

	// 1. Try /api/get (exact lookup)
	queryGet := url.Values{}
	queryGet.Set("track_name", title)
	queryGet.Set("artist_name", artist)
	if album != "" {
		queryGet.Set("album_name", album)
	}
	if durationSeconds > 0 {
		queryGet.Set("duration", fmt.Sprintf("%d", durationSeconds))
	}

	reqURL := "https://lrclib.net/api/get?" + queryGet.Encode()
	req, err := http.NewRequest("GET", reqURL, nil)
	if err == nil {
		req.Header.Set("User-Agent", "Aura-Player/1.0.13 (https://github.com/AnilShebin/Aura-Player)")
		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				var track LRCLibTrack
				if err := json.NewDecoder(resp.Body).Decode(&track); err == nil {
					log.Printf("[LyricsService] Exact signature hit via /api/get")
					if track.SyncedLyrics != "" {
						return track.SyncedLyrics
					}
					return track.PlainLyrics
				}
			}
		}
	}

	// 2. Fallback to /api/search
	querySearch := url.Values{}
	querySearch.Set("q", fmt.Sprintf("%s - %s", artist, title))

	searchURL := "https://lrclib.net/api/search?" + querySearch.Encode()
	reqSearch, err := http.NewRequest("GET", searchURL, nil)
	if err != nil {
		return ""
	}
	reqSearch.Header.Set("User-Agent", "Aura-Player/1.0.13 (https://github.com/AnilShebin/Aura-Player)")

	respSearch, err := client.Do(reqSearch)
	if err != nil {
		return ""
	}
	defer respSearch.Body.Close()

	if respSearch.StatusCode != http.StatusOK {
		return ""
	}

	var tracks []LRCLibTrack
	if err := json.NewDecoder(respSearch.Body).Decode(&tracks); err != nil {
		return ""
	}

	if len(tracks) == 0 {
		return ""
	}

	log.Printf("[LyricsService] Search results lookup hit: %d results", len(tracks))
	bestTrack := tracks[0]
	if bestTrack.SyncedLyrics != "" {
		return bestTrack.SyncedLyrics
	}
	return bestTrack.PlainLyrics
}
