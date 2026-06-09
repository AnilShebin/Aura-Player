//go:build linux

package playback

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"unsafe"

	"github.com/ebitengine/purego"
	"github.com/wailsapp/wails/v3/pkg/application"
)

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

	exePath, err := os.Executable()
	var exeDir string
	if err == nil {
		exeDir = filepath.Dir(exePath)
	}

	var candidates []string
	if exeDir != "" {
		candidates = append(candidates,
			filepath.Join(exeDir, "libmpv.so.2"),
			filepath.Join(exeDir, "libmpv.so.1"),
			filepath.Join(exeDir, "libmpv.so"),
		)
	}
	candidates = append(candidates, "libmpv.so.2", "libmpv.so.1", "libmpv.so")

	var lib uintptr
	for _, path := range candidates {
		lib, err = purego.Dlopen(path, purego.RTLD_NOW|purego.RTLD_GLOBAL)
		if err == nil {
			break
		}
	}

	if err != nil {
		return fmt.Errorf("failed to load libmpv: %w. Ensure libmpv is installed or placed in the application folder", err)
	}

	s.lib = lib

	mpv_create, err = purego.Dlsym(lib, "mpv_create")
	if err != nil {
		purego.Dlclose(s.lib)
		s.lib = 0
		return fmt.Errorf("failed to find symbol mpv_create: %w", err)
	}
	mpv_initialize, _ = purego.Dlsym(lib, "mpv_initialize")
	mpv_command, _ = purego.Dlsym(lib, "mpv_command")
	mpv_terminate_destroy, _ = purego.Dlsym(lib, "mpv_terminate_destroy")
	mpv_set_option_string, _ = purego.Dlsym(lib, "mpv_set_option_string")
	mpv_set_property, _ = purego.Dlsym(lib, "mpv_set_property")
	mpv_wait_event, _ = purego.Dlsym(lib, "mpv_wait_event")
	mpv_observe_property, _ = purego.Dlsym(lib, "mpv_observe_property")

	r1, _, _ := purego.SyscallN(mpv_create)
	handle := r1
	if handle == 0 {
		purego.Dlclose(s.lib)
		s.lib = 0
		return fmt.Errorf("failed to create mpv instance")
	}

	s.pinnedStrings = [][]byte{
		append([]byte("gapless-audio"), 0),
		append([]byte("yes"), 0),
		append([]byte("video"), 0),
		append([]byte("no"), 0),
		append([]byte("audio-display"), 0),
		append([]byte("no"), 0),
		append([]byte("time-pos"), 0),
		append([]byte("duration"), 0),
		append([]byte("pause"), 0),
		append([]byte("volume"), 0),
	}

	_, _, _ = purego.SyscallN(mpv_set_option_string, handle, uintptr(unsafe.Pointer(&s.pinnedStrings[0][0])), uintptr(unsafe.Pointer(&s.pinnedStrings[1][0])))
	_, _, _ = purego.SyscallN(mpv_set_option_string, handle, uintptr(unsafe.Pointer(&s.pinnedStrings[2][0])), uintptr(unsafe.Pointer(&s.pinnedStrings[3][0])))
	_, _, _ = purego.SyscallN(mpv_set_option_string, handle, uintptr(unsafe.Pointer(&s.pinnedStrings[4][0])), uintptr(unsafe.Pointer(&s.pinnedStrings[5][0])))

	ret, _, _ := purego.SyscallN(mpv_initialize, handle)
	if int32(ret) < 0 {
		_, _, _ = purego.SyscallN(mpv_terminate_destroy, handle)
		purego.Dlclose(s.lib)
		s.lib = 0
		return fmt.Errorf("failed to initialize mpv: %d", int32(ret))
	}

	_, _, _ = purego.SyscallN(mpv_observe_property, handle, 1, uintptr(unsafe.Pointer(&s.pinnedStrings[6][0])), 5) // 5 is MPV_FORMAT_DOUBLE
	_, _, _ = purego.SyscallN(mpv_observe_property, handle, 2, uintptr(unsafe.Pointer(&s.pinnedStrings[7][0])), 5) // 5 is MPV_FORMAT_DOUBLE
	_, _, _ = purego.SyscallN(mpv_observe_property, handle, 3, uintptr(unsafe.Pointer(&s.pinnedStrings[8][0])), 3) // 3 is MPV_FORMAT_FLAG
	_, _, _ = purego.SyscallN(mpv_observe_property, handle, 4, uintptr(unsafe.Pointer(&s.pinnedStrings[9][0])), 5) // 5 is MPV_FORMAT_DOUBLE

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
		_, _, _ = purego.SyscallN(mpv_terminate_destroy, s.handle)
		s.handle = 0
	}
	if s.lib != 0 {
		purego.Dlclose(s.lib)
		s.lib = 0
	}
}
