//go:build windows

package updater

import (
	"fmt"
	"syscall"
	"unsafe"
)

func runInstallerWindows(tempFile string) error {
	shell32 := syscall.NewLazyDLL("shell32.dll")
	shellExecuteW := shell32.NewProc("ShellExecuteW")

	op, err := syscall.UTF16PtrFromString("runas")
	if err != nil {
		return err
	}
	file, err := syscall.UTF16PtrFromString(tempFile)
	if err != nil {
		return err
	}
	params, err := syscall.UTF16PtrFromString("/SILENT")
	if err != nil {
		return err
	}

	ret, _, err := shellExecuteW.Call(
		0,
		uintptr(unsafe.Pointer(op)),
		uintptr(unsafe.Pointer(file)),
		uintptr(unsafe.Pointer(params)),
		0,
		5, // SW_SHOW
	)

	// If it fails (e.g., failed to execute or command error, but not User Canceled UAC which is usually 1223),
	// try running it without the /SILENT flag to allow the installer UI to show up.
	if ret <= 32 {
		emptyParams, _ := syscall.UTF16PtrFromString("")
		ret, _, err = shellExecuteW.Call(
			0,
			uintptr(unsafe.Pointer(op)),
			uintptr(unsafe.Pointer(file)),
			uintptr(unsafe.Pointer(emptyParams)),
			0,
			5, // SW_SHOW
		)
		if ret <= 32 {
			return fmt.Errorf("ShellExecute failed with code %d: %w", ret, err)
		}
	}
	return nil
}
