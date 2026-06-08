# Aura Music Self-Updating Architecture

This document describes the architectural flow of the self-updating mechanism in Aura Music, which queries GitHub Releases directly to download and install updates without a custom database or server.

## 1. Overview Architecture

Aura checks for updates on application boot or manually via Settings.

```text
+-----------------------+
|  Aura Desktop App     |
+-----------------------+
      | (Check Updates)
      v
+-----------------------+
|  GitHub Releases API  | <--- Contains tagged assets (v1.0.0, v1.2.0, etc.)
+-----------------------+
      | (If Update Found)
      v
+-----------------------+
|  Download temp asset  | <--- Downloads Setup.exe, .dmg, or .AppImage
+-----------------------+
      | (Installer Executed)
      v
+-----------------------+
|  Relaunch / Install   | <--- Replaces application & restarts
+-----------------------+
```

---

## 2. Core Components

### 1. Go Updater Service (`internal/updater/service.go`)
Handles all platform-specific network and filesystem actions:
* **CheckForUpdates**: Hits `https://api.github.com/repos/AnilShebin/Aura-Player/releases/latest`. Compares version numbers.
* **DownloadAndInstallUpdate**: Downloads the corresponding file for the running OS to `os.TempDir()` and executes the setup installer or replaces the binary:
  * **Windows**: Runs the downloaded setup `.exe` in background silent mode (`/SILENT`) and exits.
  * **macOS**: Opens the `.dmg` mounting package using shell `open`.
  * **Linux**: Swaps the running AppImage binary with the new downloaded AppImage file and restarts.

### 2. Zustand Store (`frontend/src/stores/musicStore.ts`)
Controls update states and settings toggles:
* `autoCheckUpdates` (Boolean): Determines whether updates are checked automatically on boot.
* `autoDownloadUpdates` (Boolean): Prefetches/downloads installers silently.
* `updateChannel` (`stable` | `beta`): Configures updates track selection.
* `checkForUpdates(manual)`: Initiates update check flow. If `manual` is true, triggers UI Toast success/error.

### 3. Update Modal Dialog (`frontend/src/components/settings/UpdateDialog.tsx`)
* Prompts the user when a newer version is discovered.
* Renders the release notes cleanly as bulleted list items (e.g. `✓ TTML Karaoke Support`).

---

## 3. Storage Persistence

Updater settings are persisted locally in `localStorage`:
* `aura-auto-check-updates`
* `aura-auto-download-updates`
* `aura-update-channel`

---

## 4. Platform-Specific Installers

| Platform | Build Asset Type | Update Action |
|---|---|---|
| **Windows** | Setup.exe (NSIS) | Runs setup.exe in background, kills player process, installs, and restarts. |
| **macOS** | DMG | Launches disk image mounting prompt, allowing user to drag-install. |
| **Linux** | AppImage | Rewrites current running AppImage with the new version and restarts. |
