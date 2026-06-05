package playback

import (
	"log"
	"math"
	"syscall"
	"time"
	"unsafe"
)

func (s *PlaybackService) pumpEvents() {
	for {
		s.mu.Lock()
		h := s.handle
		s.mu.Unlock()

		if h == 0 {
			break
		}

		r1, _, _ := syscall.SyscallN(mpv_wait_event, h, uintptr(math.Float64bits(0.05)))
		eventPtr := r1
		if eventPtr == 0 {
			continue
		}

		evt := (*mpvEvent)(unsafe.Pointer(eventPtr))
		if evt.EventID == 1 { // MPV_EVENT_SHUTDOWN
			log.Println("[PlaybackService] MPV_EVENT_SHUTDOWN")
			break
		}

		if evt.EventID == 7 { // MPV_EVENT_END_FILE
			endFile := (*mpvEventEndFile)(unsafe.Pointer(evt.Data))
			reason := int32(-1)
			errVal := int32(-1)
			if endFile != nil {
				reason = endFile.Reason
				errVal = endFile.Error
			}
			log.Printf("[PlaybackService] MPV_EVENT_END_FILE: reason=%d, error=%d, file=%s", reason, errVal, s.currentFile)

			s.mu.Lock()
			ignore := false
			if s.ignoredEndFileCount > 0 {
				ignore = true
				s.ignoredEndFileCount--
			}
			s.mu.Unlock()

			if ignore {
				continue
			}

			if endFile != nil && endFile.Reason == 0 && endFile.Error >= 0 {
				s.mu.Lock()
				s.isPlaying = false
				s.currentTime = 0
				currentF := s.currentFile
				s.currentFile = "" // Clear currentFile on natural end
				s.mu.Unlock()

				if s.app != nil {
					s.app.Event.Emit("audio-ended", map[string]interface{}{
						"filePath": currentF,
					})
				}
			}
		}

		if evt.EventID == 22 { // MPV_EVENT_PROPERTY_CHANGE
			prop := (*mpvEventProperty)(unsafe.Pointer(evt.Data))
			if prop != nil {
				propName := cGoString(prop.Name)
				switch propName {
				case "time-pos":
					if prop.Format == 5 && prop.Data != nil {
						s.mu.Lock()
						s.currentTime = *(*float64)(prop.Data)
						s.mu.Unlock()
					}
				case "duration":
					if prop.Format == 5 && prop.Data != nil {
						s.mu.Lock()
						s.duration = *(*float64)(prop.Data)
						s.mu.Unlock()
					}
				case "pause":
					if prop.Format == 3 && prop.Data != nil {
						s.mu.Lock()
						pauseVal := *(*int32)(prop.Data)
						s.isPlaying = (pauseVal == 0) && s.currentFile != ""
						s.mu.Unlock()
					}
				case "volume":
					if prop.Format == 5 && prop.Data != nil {
						s.mu.Lock()
						s.volume = *(*float64)(prop.Data)
						s.mu.Unlock()
					}
				}
			}
		}
	}
}

func (s *PlaybackService) statusEmitLoop() {
	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		h := s.handle
		s.mu.Unlock()

		if h == 0 {
			break
		}

		status, err := s.GetStatus()
		if err == nil && s.app != nil {
			s.app.Event.Emit("audio-status-update", status)
		}
	}
}
