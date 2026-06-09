//go:build !windows && !linux

package playback

type PlaybackService struct {
	currentFile string
	isPlaying   bool
	volume      float64
}

func NewPlaybackService() (*PlaybackService, error) {
	return &PlaybackService{
		volume: 80.0,
	}, nil
}

func (s *PlaybackService) Play(filePath string) error {
	s.currentFile = filePath
	s.isPlaying = true
	return nil
}

func (s *PlaybackService) Pause() error {
	s.isPlaying = false
	return nil
}

func (s *PlaybackService) Resume() error {
	s.isPlaying = true
	return nil
}

func (s *PlaybackService) Seek(seconds float64) error {
	return nil
}

func (s *PlaybackService) SetVolume(volume float64) error {
	s.volume = volume * 100.0
	return nil
}

func (s *PlaybackService) GetStatus() (PlayerStatus, error) {
	return PlayerStatus{
		FilePath:    s.currentFile,
		IsPlaying:   s.isPlaying,
		CurrentTime: 0,
		Duration:    0,
		Volume:      s.volume / 100.0,
		Ended:       false,
	}, nil
}

func (s *PlaybackService) Close() {
}
