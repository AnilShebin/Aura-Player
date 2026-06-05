// PlaybackService typescript bridge calling Wails backend methods by ID.
import { Call as $Call, CancellablePromise as $CancellablePromise } from "@wailsio/runtime";

export function Play(filePath: string): $CancellablePromise<void> {
    return $Call.ByID(544745199, filePath);
}

export function Pause(): $CancellablePromise<void> {
    return $Call.ByID(3382574585);
}

export function Resume(): $CancellablePromise<void> {
    return $Call.ByID(346432798);
}

export function Seek(seconds: number): $CancellablePromise<void> {
    return $Call.ByID(966061285, seconds);
}

export function SetVolume(volume: number): $CancellablePromise<void> {
    return $Call.ByID(2979321353, volume);
}
