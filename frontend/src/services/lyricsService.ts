// LyricsService typescript bridge calling Wails backend methods by ID.
import { Call as $Call, CancellablePromise as $CancellablePromise } from "@wailsio/runtime";

export interface LyricsResult {
    synced: boolean;
    lines: LyricLine[];
    raw: string;
    hasTTML?: boolean;
    source?: string;
}

export interface LyricLine {
    time: number;
    text: string;
    is_translation: boolean;
}

export interface LRCLibSearchResult {
    id: number;
    trackName: string;
    artistName: string;
    albumName: string;
    duration: number;
    plainLyrics: string;
    syncedLyrics: string;
}

export function GetLyrics(filePath: string): $CancellablePromise<LyricsResult> {
    return $Call.ByID(3985102649, filePath);
}

export function GetOnlineLyrics(filePath: string): $CancellablePromise<LyricsResult> {
    return $Call.ByID(1481514762, filePath);
}

export function SaveCustomLyrics(filePath: string, lyricsText: string): $CancellablePromise<LyricsResult> {
    return $Call.ByID(1059049617, filePath, lyricsText);
}

export function PackLyrics(filePath: string, lyricsText: string, source: string): $CancellablePromise<LyricsResult> {
    return $Call.ByID(1619569814, filePath, lyricsText, source);
}

export function SearchOnlineLyrics(query: string): $CancellablePromise<LRCLibSearchResult[]> {
    return $Call.ByID(1029338320, query);
}
