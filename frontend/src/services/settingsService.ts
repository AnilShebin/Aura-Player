// SettingsService typescript bridge calling Wails backend methods directly by ID
import { Call as $Call, CancellablePromise as $CancellablePromise, Create as $Create } from "@wailsio/runtime";

export function AddFolder(path: string): $CancellablePromise<void> {
    return $Call.ByID(3341726428, path);
}

export function DeleteFolder(path: string): $CancellablePromise<void> {
    return $Call.ByID(1653168390, path);
}

export function GetFolders(): $CancellablePromise<string[]> {
    return $Call.ByID(983653516).then(($result: any) => {
        return $$createType0($result);
    });
}

export function IsFirstTime(): $CancellablePromise<boolean> {
    return $Call.ByID(3016220900);
}

export function SetFirstTime(value: boolean): $CancellablePromise<void> {
    return $Call.ByID(3618941146, value);
}

// Private type creation functions
const $$createType0 = $Create.Array($Create.Any);
