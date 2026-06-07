// LyricsService typescript bridge calling Wails backend methods by ID.
import { Call as $Call, CancellablePromise as $CancellablePromise } from "@wailsio/runtime";

export interface LyricsResult {
    synced: boolean;
    lines: LyricLine[];
    raw: string;
    hasTTML?: boolean;
}

export interface LyricLine {
    time: number;
    text: string;
    is_translation: boolean;
}

export function GetLyrics(filePath: string): $CancellablePromise<LyricsResult> {
    return $Call.ByID(3985102649, filePath);
}
