//go:build windows

package playback

import (
	"fmt"
	"log"
	"sync"
	"syscall"
	"unsafe"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type PlayerStatus struct {
	FilePath    string  `json:"filePath"`
	IsPlaying   bool    `json:"isPlaying"`
	CurrentTime float64 `json:"currentTime"`
	Duration    float64 `json:"duration"`
	Volume      float64 `json:"volume"`
	Ended       bool    `json:"ended"`
}

type PlaybackService struct {
	mu                  sync.Mutex
	handle              uintptr
	lib                 uintptr
	currentFile         string
	isPlaying           bool
	lastVolume          float64
	app                 *application.App
	ignoredEndFileCount int

	currentTime float64
	duration    float64
	volume      float64

	pinnedStrings [][]byte
}

func NewPlaybackService() (*PlaybackService, error) {
	return &PlaybackService{
		lastVolume: 80.0,
		volume:     80.0,
	}, nil
}

func (s *PlaybackService) initPlayer() error {
	s.mu.Lock()
	inited := s.handle != 0
	s.mu.Unlock()
	if inited {
		return nil
	}

	s.app = application.Get()

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.handle != 0 {
		return nil
	}

	var lib syscall.Handle
	var err error
	for _, dll := range []string{"libmpv-2.dll", "mpv-1.dll", "mpv.dll"} {
		lib, err = syscall.LoadLibrary(dll)
		if err == nil {
			break
		}
	}

	if err != nil {
		return fmt.Errorf("failed to load libmpv: %w. Ensure libmpv-2.dll is in the application folder", err)
	}

	s.lib = uintptr(lib)

	mpv_create, _ = syscall.GetProcAddress(lib, "mpv_create")
	mpv_initialize, _ = syscall.GetProcAddress(lib, "mpv_initialize")
	mpv_command, _ = syscall.GetProcAddress(lib, "mpv_command")
	mpv_terminate_destroy, _ = syscall.GetProcAddress(lib, "mpv_terminate_destroy")
	mpv_set_option_string, _ = syscall.GetProcAddress(lib, "mpv_set_option_string")
	mpv_set_property, _ = syscall.GetProcAddress(lib, "mpv_set_property")
	mpv_wait_event, _ = syscall.GetProcAddress(lib, "mpv_wait_event")
	mpv_observe_property, _ = syscall.GetProcAddress(lib, "mpv_observe_property")

	r1, _, _ := syscall.SyscallN(mpv_create)
	handle := r1
	if handle == 0 {
		_ = syscall.FreeLibrary(syscall.Handle(s.lib))
		s.lib = 0
		return fmt.Errorf("failed to create mpv instance")
	}

	s.pinnedStrings = [][]byte{
		append([]byte("gapless-audio"), 0),
		append([]byte("yes"), 0),
		append([]byte("ao"), 0),
		append([]byte("wasapi"), 0),
		append([]byte("time-pos"), 0),
		append([]byte("duration"), 0),
		append([]byte("pause"), 0),
		append([]byte("volume"), 0),
		append([]byte("video"), 0),
		append([]byte("no"), 0),
		append([]byte("audio-display"), 0),
		append([]byte("no"), 0),
	}

	_, _, _ = syscall.SyscallN(mpv_set_option_string, handle, uintptr(unsafe.Pointer(&s.pinnedStrings[0][0])), uintptr(unsafe.Pointer(&s.pinnedStrings[1][0])))
	_, _, _ = syscall.SyscallN(mpv_set_option_string, handle, uintptr(unsafe.Pointer(&s.pinnedStrings[2][0])), uintptr(unsafe.Pointer(&s.pinnedStrings[3][0])))
	_, _, _ = syscall.SyscallN(mpv_set_option_string, handle, uintptr(unsafe.Pointer(&s.pinnedStrings[8][0])), uintptr(unsafe.Pointer(&s.pinnedStrings[9][0])))
	_, _, _ = syscall.SyscallN(mpv_set_option_string, handle, uintptr(unsafe.Pointer(&s.pinnedStrings[10][0])), uintptr(unsafe.Pointer(&s.pinnedStrings[11][0])))

	ret, _, _ := syscall.SyscallN(mpv_initialize, handle)
	if int32(ret) < 0 {
		_, _, _ = syscall.SyscallN(mpv_terminate_destroy, handle)
		_ = syscall.FreeLibrary(syscall.Handle(s.lib))
		s.lib = 0
		return fmt.Errorf("failed to initialize mpv: %d", int32(ret))
	}

	_, _, _ = syscall.SyscallN(mpv_observe_property, handle, 1, uintptr(unsafe.Pointer(&s.pinnedStrings[4][0])), 5) // 5 is MPV_FORMAT_DOUBLE
	_, _, _ = syscall.SyscallN(mpv_observe_property, handle, 2, uintptr(unsafe.Pointer(&s.pinnedStrings[5][0])), 5) // 5 is MPV_FORMAT_DOUBLE
	_, _, _ = syscall.SyscallN(mpv_observe_property, handle, 3, uintptr(unsafe.Pointer(&s.pinnedStrings[6][0])), 3) // 3 is MPV_FORMAT_FLAG
	_, _, _ = syscall.SyscallN(mpv_observe_property, handle, 4, uintptr(unsafe.Pointer(&s.pinnedStrings[7][0])), 5) // 5 is MPV_FORMAT_DOUBLE

	s.handle = handle

	go s.pumpEvents()
	go s.statusEmitLoop()

	return nil
}

func (s *PlaybackService) Play(filePath string) error {
	log.Printf("[PlaybackService] Play called: %s", filePath)
	if err := s.initPlayer(); err != nil {
		return err
	}

	s.mu.Lock()
	if s.currentFile != "" {
		s.ignoredEndFileCount++
	}
	s.mu.Unlock()

	err := mpvCommand(s.handle, []string{"loadfile", filePath})
	if err != nil {
		s.mu.Lock()
		if s.ignoredEndFileCount > 0 {
			s.ignoredEndFileCount--
		}
		s.mu.Unlock()
		return fmt.Errorf("failed to play file: %w", err)
	}

	s.mu.Lock()
	s.currentFile = filePath
	s.isPlaying = true
	_ = mpvSetFlag(s.handle, "pause", false)
	s.mu.Unlock()

	return nil
}

func (s *PlaybackService) Pause() error {
	if err := s.initPlayer(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	err := mpvSetFlag(s.handle, "pause", true)
	if err == nil {
		s.isPlaying = false
	}
	return err
}

func (s *PlaybackService) Resume() error {
	if err := s.initPlayer(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	err := mpvSetFlag(s.handle, "pause", false)
	if err == nil {
		s.isPlaying = true
	}
	return err
}

func (s *PlaybackService) Seek(seconds float64) error {
	if err := s.initPlayer(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	return mpvCommand(s.handle, []string{"seek", fmt.Sprintf("%f", seconds), "absolute"})
}

func (s *PlaybackService) SetVolume(volume float64) error {
	if err := s.initPlayer(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	volPercent := volume * 100.0
	if volPercent < 0 {
		volPercent = 0
	}
	if volPercent > 100 {
		volPercent = 100
	}

	s.lastVolume = volPercent
	return mpvSetFloat(s.handle, "volume", volPercent)
}

func (s *PlaybackService) GetStatus() (PlayerStatus, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.handle == 0 {
		return PlayerStatus{}, fmt.Errorf("player not initialized")
	}

	return PlayerStatus{
		FilePath:    s.currentFile,
		IsPlaying:   s.isPlaying,
		CurrentTime: s.currentTime,
		Duration:    s.duration,
		Volume:      s.volume / 100.0,
		Ended:       false,
	}, nil
}

func (s *PlaybackService) Close() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.handle != 0 {
		_, _, _ = syscall.SyscallN(mpv_terminate_destroy, s.handle)
		s.handle = 0
	}
	if s.lib != 0 {
		_ = syscall.FreeLibrary(syscall.Handle(s.lib))
		s.lib = 0
	}
}
