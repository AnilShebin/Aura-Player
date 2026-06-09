package updater

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

var CurrentVersion = "1.0.2"
const RepoOwner = "AnilShebin"
const RepoName = "Aura-Player"

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

// CheckForUpdates queries the GitHub Releases API for the latest release
func (u *UpdaterService) CheckForUpdates() (*UpdateInfo, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", RepoOwner, RepoName)
	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "Aura-Player-Updater")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub returned status code: %d", resp.StatusCode)
	}

	var release struct {
		TagName string `json:"tag_name"`
		Body    string `json:"body"`
		Assets  []struct {
			Name        string `json:"name"`
			DownloadURL string `json:"browser_download_url"`
		} `json:"assets"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}

	latestVersion := strings.TrimPrefix(release.TagName, "v")
	currentVersion := strings.TrimPrefix(CurrentVersion, "v")

	if latestVersion == currentVersion {
		return &UpdateInfo{Available: false, LatestVersion: release.TagName}, nil
	}

	// Simple version comparison (e.g. "1.2.0" > "1.0.0")
	isNewer := compareVersions(latestVersion, currentVersion) > 0

	if !isNewer {
		return &UpdateInfo{Available: false, LatestVersion: release.TagName}, nil
	}

	// Match asset based on OS and Architecture
	var downloadURL string
	var assetName string
	var osSuffix string

	switch runtime.GOOS {
	case "windows":
		osSuffix = ".exe"
	case "darwin":
		osSuffix = ".dmg"
	case "linux":
		osSuffix = ".appimage"
	}

	archTerms := []string{}
	if runtime.GOARCH == "amd64" {
		archTerms = []string{"x64", "x86_64", "amd64"}
	} else if runtime.GOARCH == "arm64" {
		archTerms = []string{"arm64", "aarch64"}
	}

	// First pass: match both OS suffix and architecture terms
	for _, asset := range release.Assets {
		nameLower := strings.ToLower(asset.Name)
		if strings.HasSuffix(nameLower, osSuffix) {
			matchArch := false
			if len(archTerms) == 0 {
				matchArch = true
			} else {
				for _, term := range archTerms {
					if strings.Contains(nameLower, term) {
						matchArch = true
						break
					}
				}
			}
			if matchArch {
				downloadURL = asset.DownloadURL
				assetName = asset.Name
				break
			}
		}
	}

	// Second pass fallback: match OS suffix only
	if downloadURL == "" {
		for _, asset := range release.Assets {
			if strings.HasSuffix(strings.ToLower(asset.Name), osSuffix) {
				downloadURL = asset.DownloadURL
				assetName = asset.Name
				break
			}
		}
	}

	// Fallback to first asset if specific suffix not found
	if downloadURL == "" && len(release.Assets) > 0 {
		downloadURL = release.Assets[0].DownloadURL
		assetName = release.Assets[0].Name
	}

	return &UpdateInfo{
		Available:     true,
		LatestVersion: release.TagName,
		ReleaseNotes:  release.Body,
		DownloadURL:   downloadURL,
		AssetName:     assetName,
	}, nil
}

// DownloadAndInstallUpdate downloads the binary and triggers installation
func (u *UpdaterService) DownloadAndInstallUpdate(downloadURL string, assetName string) error {
	if downloadURL == "" {
		return fmt.Errorf("empty download URL")
	}

	tempDir := os.TempDir()
	tempFile := filepath.Join(tempDir, assetName)

	out, err := os.Create(tempFile)
	if err != nil {
		return err
	}
	defer out.Close()

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Get(downloadURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download returned status: %d", resp.StatusCode)
	}

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}
	out.Close()

	switch runtime.GOOS {
	case "windows":
		if strings.HasSuffix(strings.ToLower(assetName), ".exe") {
			if err := runInstallerWindows(tempFile); err != nil {
				return fmt.Errorf("failed to start windows installer with elevation: %w", err)
			}
			os.Exit(0)
		}
	case "darwin":
		if strings.HasSuffix(strings.ToLower(assetName), ".dmg") {
			cmd := exec.Command("open", tempFile)
			if err := cmd.Start(); err != nil {
				return fmt.Errorf("failed to open dmg: %w", err)
			}
			os.Exit(0)
		}
	case "linux":
		appImagePath := os.Getenv("APPIMAGE")
		if appImagePath != "" && strings.HasSuffix(strings.ToLower(assetName), ".appimage") {
			bakFile := appImagePath + ".bak"
			_ = os.Remove(bakFile)
			if err := os.Rename(appImagePath, bakFile); err == nil {
				if err := copyFile(tempFile, appImagePath); err == nil {
					_ = os.Chmod(appImagePath, 0755)
					cmd := exec.Command(appImagePath)
					_ = cmd.Start()
					os.Exit(0)
				}
			}
		} else {
			currentExe, err := os.Executable()
			if err == nil {
				bakFile := currentExe + ".bak"
				_ = os.Remove(bakFile)
				if err := os.Rename(currentExe, bakFile); err == nil {
					if err := copyFile(tempFile, currentExe); err == nil {
						_ = os.Chmod(currentExe, 0755)
						cmd := exec.Command(currentExe)
						_ = cmd.Start()
						os.Exit(0)
					}
				}
			}
		}
	}

	return nil
}

func compareVersions(v1, v2 string) int {
	var major1, minor1, patch1 int
	var major2, minor2, patch2 int

	fmt.Sscanf(v1, "%d.%d.%d", &major1, &minor1, &patch1)
	fmt.Sscanf(v2, "%d.%d.%d", &major2, &minor2, &patch2)

	if major1 != major2 {
		if major1 > major2 {
			return 1
		}
		return -1
	}
	if minor1 != minor2 {
		if minor1 > minor2 {
			return 1
		}
		return -1
	}
	if patch1 != patch2 {
		if patch1 > patch2 {
			return 1
		}
		return -1
	}
	return 0
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}
