package lyrics

import (
	"log"
)

// LyricsService provides lyrics fetching capabilities as a Wails-bound service.
type LyricsService struct{}

// NewLyricsService creates a new LyricsService instance.
func NewLyricsService() *LyricsService {
	return &LyricsService{}
}

// GetLyrics extracts and parses lyrics for the given audio file path.
// It returns a structured LyricsResult with synced timing, lines, and raw text.
func (s *LyricsService) GetLyrics(filePath string) LyricsResult {
	log.Printf("[LyricsService] GetLyrics called: %s", filePath)

	raw := extractRawLyrics(filePath)
	if raw == "" {
		log.Printf("[LyricsService] No lyrics found for: %s", filePath)
		return LyricsResult{Synced: false, Lines: []LyricLine{}, Raw: ""}
	}

	result := parseLyrics(raw)
	log.Printf("[LyricsService] Parsed %d lines (synced=%v) for: %s", len(result.Lines), result.Synced, filePath)
	return result
}
