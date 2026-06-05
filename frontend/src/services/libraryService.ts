// LibraryService typescript bridge calling Wails backend methods directly by ID
import { Call as $Call, CancellablePromise as $CancellablePromise } from "@wailsio/runtime";
import { Song } from "../types/music";

export function GetSongs(): $CancellablePromise<Song[]> {
    return $Call.ByID(848293877);
}

export function ScanLibrary(folders: string[]): $CancellablePromise<number> {
    return $Call.ByID(2258434701, folders);
}

export function ToggleFavorite(songID: string): $CancellablePromise<boolean> {
    return $Call.ByID(3775055103, songID);
}
