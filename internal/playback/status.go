package playback

type PlayerStatus struct {
	FilePath    string  `json:"filePath"`
	IsPlaying   bool    `json:"isPlaying"`
	CurrentTime float64 `json:"currentTime"`
	Duration    float64 `json:"duration"`
	Volume      float64 `json:"volume"`
	Ended       bool    `json:"ended"`
}
