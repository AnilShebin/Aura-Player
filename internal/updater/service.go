package updater

import (
	"fmt"
)

var CurrentVersion = "1.0.10"

type UpdateInfo struct {
	Available     bool   `json:"available"`
	LatestVersion string `json:"latestVersion"`
	ReleaseNotes  string `json:"releaseNotes"`
	DownloadURL   string `json:"downloadUrl"`
	AssetName     string `json:"assetName"`
}

type UpdaterService struct{}

func NewUpdaterService() *UpdaterService {
	return &UpdaterService{}
}

// GetCurrentVersion returns the hardcoded current application version
func (u *UpdaterService) GetCurrentVersion() string {
	return CurrentVersion
}

// CheckForUpdates reports that no updates are available via external channels,
// as the application is packaged and updated through system package managers / Microsoft Store.
func (u *UpdaterService) CheckForUpdates() (*UpdateInfo, error) {
	return &UpdateInfo{
		Available:     false,
		LatestVersion: CurrentVersion,
		ReleaseNotes:  "Updates are managed by the application store or package manager.",
		DownloadURL:   "",
		AssetName:     "",
	}, nil
}

// DownloadAndInstallUpdate is disabled since updates are managed externally by the system.
func (u *UpdaterService) DownloadAndInstallUpdate(downloadURL string, assetName string) error {
	return fmt.Errorf("self-updating is disabled; updates are managed by the application store or package manager")
}
