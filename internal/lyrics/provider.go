package lyrics

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/dhowden/tag"
)

// sidecarExtensions lists the lyric sidecar file extensions to check in priority order.
var sidecarExtensions = []string{".lrc", ".srt", ".vtt"}

// extractRawLyrics attempts to read lyrics for the given audio file.
// Priority: sidecar .lrc/.srt/.vtt files → embedded metadata via dhowden/tag.
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

	embedded := m.Lyrics()
	if strings.TrimSpace(embedded) != "" {
		log.Printf("[LyricsService] Found embedded lyrics (length: %d)", len(embedded))
	}
	return strings.TrimSpace(embedded)
}
