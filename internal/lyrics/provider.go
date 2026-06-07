package lyrics

import (
	"log"
	"os"
	"path/filepath"
	"strings"

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
	}
	return strings.TrimSpace(embedded)
}
