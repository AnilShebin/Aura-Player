//go:build windows

package playback

import (
	"fmt"
	"runtime"
	"syscall"
	"unsafe"
)

type mpvEvent struct {
	EventID       int32
	Error         int32
	ReplyUserdata uint64
	Data          uintptr
}

type mpvEventEndFile struct {
	Error  int32
	Reason int32
}

type mpvEventProperty struct {
	Name   *byte
	Format int32
	_      int32 // Padding to align Data to 8 bytes on 64-bit systems
	Data   unsafe.Pointer
}

var (
	mpv_create            uintptr
	mpv_initialize        uintptr
	mpv_command           uintptr
	mpv_terminate_destroy uintptr
	mpv_set_option_string uintptr
	mpv_set_property      uintptr
	mpv_wait_event        uintptr
	mpv_observe_property  uintptr
)

func mpvCommand(handle uintptr, args []string) error {
	byteSlices := make([][]byte, len(args))
	cArgs := make([]unsafe.Pointer, len(args)+1)
	for i, arg := range args {
		byteSlices[i] = append([]byte(arg), 0)
		cArgs[i] = unsafe.Pointer(&byteSlices[i][0])
	}
	cArgs[len(args)] = nil // null terminated array

	ret, _, _ := syscall.SyscallN(mpv_command, handle, uintptr(unsafe.Pointer(&cArgs[0])))
	runtime.KeepAlive(byteSlices)
	runtime.KeepAlive(cArgs)

	if int32(ret) < 0 {
		return fmt.Errorf("mpv command failed: %d", int32(ret))
	}
	return nil
}

func mpvSetFlag(handle uintptr, name string, val bool) error {
	var cVal int32
	if val {
		cVal = 1
	}
	nameBytes := append([]byte(name), 0)
	ret, _, _ := syscall.SyscallN(mpv_set_property, handle, uintptr(unsafe.Pointer(&nameBytes[0])), 3, uintptr(unsafe.Pointer(&cVal))) // 3 is MPV_FORMAT_FLAG
	runtime.KeepAlive(nameBytes)

	if int32(ret) < 0 {
		return fmt.Errorf("failed to set flag %s to %v: %d", name, val, int32(ret))
	}
	return nil
}

func mpvSetFloat(handle uintptr, name string, val float64) error {
	nameBytes := append([]byte(name), 0)
	ret, _, _ := syscall.SyscallN(mpv_set_property, handle, uintptr(unsafe.Pointer(&nameBytes[0])), 5, uintptr(unsafe.Pointer(&val))) // 5 is MPV_FORMAT_DOUBLE
	runtime.KeepAlive(nameBytes)

	if int32(ret) < 0 {
		return fmt.Errorf("failed to set property %s to %f: %d", name, val, int32(ret))
	}
	return nil
}

func mpvSetOptionString(handle uintptr, name string, val string) error {
	nameBytes := append([]byte(name), 0)
	valBytes := append([]byte(val), 0)
	ret, _, _ := syscall.SyscallN(mpv_set_option_string, handle, uintptr(unsafe.Pointer(&nameBytes[0])), uintptr(unsafe.Pointer(&valBytes[0])))
	runtime.KeepAlive(nameBytes)
	runtime.KeepAlive(valBytes)

	if int32(ret) < 0 {
		return fmt.Errorf("failed to set option %s to %s: %d", name, val, int32(ret))
	}
	return nil
}

func cGoString(p *byte) string {
	if p == nil {
		return ""
	}
	var b []byte
	for {
		val := *p
		if val == 0 {
			break
		}
		b = append(b, val)
		p = (*byte)(unsafe.Pointer(uintptr(unsafe.Pointer(p)) + 1))
	}
	return string(b)
}
