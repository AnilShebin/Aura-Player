import { Call as $Call, CancellablePromise as $CancellablePromise } from "@wailsio/runtime";

export interface UpdateInfo {
    available: boolean;
    latestVersion: string;
    releaseNotes: string;
    downloadUrl: string;
    assetName: string;
}

/**
 * CheckForUpdates queries the GitHub Releases API for the latest release
 */
export function CheckForUpdates(): $CancellablePromise<UpdateInfo | null> {
    return $Call.ByID(2783407158);
}

/**
 * DownloadAndInstallUpdate downloads the binary and triggers installation
 */
export function DownloadAndInstallUpdate(downloadURL: string, assetName: string): $CancellablePromise<void> {
    return $Call.ByID(1630227666, downloadURL, assetName);
}

/**
 * GetCurrentVersion returns the hardcoded current application version
 */
export function GetCurrentVersion(): $CancellablePromise<string> {
    return $Call.ByID(67086334);
}
