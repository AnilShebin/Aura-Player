package lyrics

import (
	"fmt"
	"strings"
)

// LyricLine represents a single parsed lyric line with timing.
type LyricLine struct {
	Time          float64 `json:"time"`
	Text          string  `json:"text"`
	IsTranslation bool    `json:"is_translation"`
}

// LyricsResult is the structured response returned to the frontend.
type LyricsResult struct {
	Synced bool        `json:"synced"`
	Lines  []LyricLine `json:"lines"`
	Raw    string      `json:"raw"`
}

// parseLyrics detects format and parses raw lyrics text into structured lines.
func parseLyrics(raw string) LyricsResult {
	normalized := strings.ReplaceAll(raw, "\r\n", "\n")
	normalized = strings.ReplaceAll(normalized, "\r", "\n")

	if strings.Contains(normalized, "-->") {
		return parseSRTVTT(normalized, raw)
	}
	return parseLRC(normalized, raw)
}

// parseSRTVTT handles SRT and VTT subtitle formats.
func parseSRTVTT(normalized, raw string) LyricsResult {
	var lines []LyricLine
	synced := false

	rawLines := strings.Split(normalized, "\n")
	var currentStart float64 = -1
	var textLines []string

	for i := 0; i < len(rawLines); i++ {
		line := strings.TrimSpace(rawLines[i])
		if line == "" {
			if currentStart >= 0 && len(textLines) > 0 {
				txt := strings.Join(textLines, " ")
				lines = append(lines, LyricLine{
					Time:          currentStart,
					Text:          txt,
					IsTranslation: false,
				})
			}
			currentStart = -1
			textLines = nil
			continue
		}

		if strings.Contains(line, "-->") {
			parts := strings.Split(line, "-->")
			if len(parts) >= 1 {
				startStr := strings.TrimSpace(parts[0])
				startStr = strings.ReplaceAll(startStr, ",", ".")
				var hh, mm, ss float64
				if _, err := fmt.Sscanf(startStr, "%f:%f:%f", &hh, &mm, &ss); err == nil {
					currentStart = hh*3600 + mm*60 + ss
				} else if _, err := fmt.Sscanf(startStr, "%f:%f", &mm, &ss); err == nil {
					currentStart = mm*60 + ss
				}
			}
			textLines = nil
			synced = true
		} else if currentStart >= 0 {
			textLines = append(textLines, line)
		}
	}

	// EOF fallback for final cue
	if currentStart >= 0 && len(textLines) > 0 {
		txt := strings.Join(textLines, " ")
		lines = append(lines, LyricLine{
			Time:          currentStart,
			Text:          txt,
			IsTranslation: false,
		})
	}

	return LyricsResult{Synced: synced, Lines: lines, Raw: raw}
}

// parseLRC handles standard LRC format with translation support.
// If two lines share the same timestamp, the second is marked as a translation.
func parseLRC(normalized, raw string) LyricsResult {
	var lines []LyricLine
	synced := false
	timeMap := make(map[float64]int)

	for _, rawLine := range strings.Split(normalized, "\n") {
		rawLine = strings.TrimSpace(rawLine)
		if rawLine == "" {
			continue
		}

		if len(rawLine) > 9 && rawLine[0] == '[' {
			closeBracket := strings.Index(rawLine, "]")
			if closeBracket > 0 {
				timeStr := rawLine[1:closeBracket]
				text := strings.TrimSpace(rawLine[closeBracket+1:])
				var mins, secs float64
				if _, err := fmt.Sscanf(timeStr, "%f:%f", &mins, &secs); err == nil {
					t := mins*60 + secs
					isTrans := false
					if _, exists := timeMap[t]; exists {
						isTrans = true
					} else {
						timeMap[t] = len(lines)
					}
					lines = append(lines, LyricLine{Time: t, Text: text, IsTranslation: isTrans})
					synced = true
					continue
				}
			}
		}

		// Unsynced plain text line
		lines = append(lines, LyricLine{Time: -1, Text: rawLine, IsTranslation: false})
	}

	return LyricsResult{Synced: synced, Lines: lines, Raw: raw}
}
