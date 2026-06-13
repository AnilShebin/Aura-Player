//go:build !windows
package lyrics

import "os/exec"

func configureCommand(cmd *exec.Cmd) {}
