import { useMemo, useState, useEffect, useRef } from 'react'
import { TTMLLyrics } from './ttmlModels'
import { parseTTML } from './ttmlParser'

export function useTTMLPlayback(rawTTML: string, currentTime: number) {
  // Parse TTML once when rawTTML changes (satisfies requirement 8: parse once, never during playback)
  const ttml = useMemo<TTMLLyrics>(() => {
    if (!rawTTML) return { lines: [] }
    try {
      return parseTTML(rawTTML)
    } catch (e) {
      console.error('Error parsing TTML lyrics:', e)
      return { lines: [] }
    }
  }, [rawTTML])

  const currentTimeMs = currentTime * 1000

  // Binary search to find the active line index in O(log n) time
  const activeLineIdx = useMemo(() => {
    const lines = ttml.lines
    if (lines.length === 0) return -1

    // If currentTimeMs is before the first line
    if (currentTimeMs < lines[0].startMs) {
      return -1
    }

    let low = 0
    let high = lines.length - 1
    let result = -1

    while (low <= high) {
      const mid = (low + high) >> 1
      const line = lines[mid]

      if (currentTimeMs >= line.startMs && currentTimeMs < line.endMs) {
        return mid
      } else if (currentTimeMs < line.startMs) {
        high = mid - 1
      } else {
        // Since currentTimeMs >= line.endMs, this line is in the past,
        // but it could still be the active one if we are in a gap between lines.
        result = mid
        low = mid + 1
      }
    }

    return result
  }, [ttml, currentTimeMs])

  // Create a stable map of agent styles (Requirement 3: align agents left/right based on discovery order)
  const agentAlignments = useMemo(() => {
    const map = new Map<string, 'left' | 'right'>()
    let seenCount = 0

    for (const line of ttml.lines) {
      if (line.agent && !map.has(line.agent)) {
        // Alternate alignments: 1st -> right, 2nd -> left, 3rd -> right, etc.
        map.set(line.agent, seenCount % 2 === 0 ? 'right' : 'left')
        seenCount++
      }
    }
    return map
  }, [ttml])

  return {
    ttml,
    activeLineIdx,
    agentAlignments
  }
}

// Custom hook to interpolate playing time smoothly at 60/120 FPS without micro-stutters
export function useSmoothPlaybackTime(isPlaying: boolean, storeTime: number) {
  const [smoothTimeMs, setSmoothTimeMs] = useState(storeTime * 1000)
  const lastStoreTimeRef = useRef(storeTime * 1000)
  const lastLocalTimeRef = useRef(performance.now())

  useEffect(() => {
    const newStoreTimeMs = storeTime * 1000
    const currentInterpolated = lastStoreTimeRef.current + (performance.now() - lastLocalTimeRef.current)
    const diff = Math.abs(currentInterpolated - newStoreTimeMs)

    // Only snap if the difference is significant (e.g. > 250ms, indicating a seek) or if paused
    if (diff > 250 || !isPlaying) {
      lastStoreTimeRef.current = newStoreTimeMs
      lastLocalTimeRef.current = performance.now()
      setSmoothTimeMs(newStoreTimeMs)
    }
  }, [storeTime, isPlaying])

  useEffect(() => {
    if (!isPlaying) return

    let frameId: number
    const update = () => {
      const elapsed = performance.now() - lastLocalTimeRef.current
      const current = lastStoreTimeRef.current + elapsed
      setSmoothTimeMs(current)
      frameId = requestAnimationFrame(update)
    }

    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [isPlaying])

  return smoothTimeMs
}
