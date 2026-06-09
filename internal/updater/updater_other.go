//go:build !windows

package updater

import "fmt"

func runInstallerWindows(tempFile string) error {
	return fmt.Errorf("Windows installer execution is not supported on this platform")
}
