import React, { useRef, useState, useEffect } from 'react'
import { useTTMLPlayback, useSmoothPlaybackTime } from '../useTTMLPlayback'
import { TTMLLineComponent } from '../ttmlRenderer'

interface KaraokeViewProps {
  rawTTML: string
  currentTime: number
  isPlaying: boolean
  onSeek: (time: number) => void
  showLyrics: boolean
  activeTrack: { title: string; artist: string; artwork: string }
  compact?: boolean
  hideScrollbar?: boolean
  noHorizontalShift?: boolean
}

export const KaraokeView: React.FC<KaraokeViewProps> = ({
  rawTTML,
  currentTime,
  isPlaying,
  onSeek,
  showLyrics,
  activeTrack,
  compact = false,
  hideScrollbar = false,
  noHorizontalShift = false
}) => {
  const { ttml, activeLineIdx, agentAlignments } = useTTMLPlayback(rawTTML, currentTime)
  const smoothTimeMs = useSmoothPlaybackTime(isPlaying, currentTime)

  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isManualScrolling, setIsManualScrolling] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const scrollbarTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProgrammaticScroll = useRef(false)
  const wasLyricsShown = useRef(showLyrics)
  const lastTitleRef = useRef(activeTrack.title)

  const lastLayoutShiftTime = useRef(0)
  useEffect(() => {
    lastLayoutShiftTime.current = Date.now()
  }, [rawTTML])

  const lastProgrammaticScrollTime = useRef(0)

  useEffect(() => {
    return () => {
      if (scrollbarTimeoutRef.current) clearTimeout(scrollbarTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (activeLineIdx !== -1 && !isManualScrolling && lineRefs.current[activeLineIdx]) {
      const element = lineRefs.current[activeLineIdx]
      const container = containerRef.current
      if (element && container) {
        const offsetRatio = compact ? 0.15 : 0.5
        const targetScroll = element.offsetTop - container.offsetHeight * offsetRatio + element.offsetHeight / 2
        
        isProgrammaticScroll.current = true

        const isNewSong = lastTitleRef.current !== activeTrack.title
        const isInstantJump = isNewSong || (showLyrics && !wasLyricsShown.current) || !showLyrics

        container.scrollTo({
          top: targetScroll,
          behavior: isInstantJump ? 'auto' : 'smooth'
        })

        if (isNewSong) {
          lastTitleRef.current = activeTrack.title
        }

        const timer = setTimeout(() => {
          isProgrammaticScroll.current = false
          lastProgrammaticScrollTime.current = Date.now()
        }, 600)

        return () => clearTimeout(timer)
      }
    }
    wasLyricsShown.current = showLyrics
  }, [activeLineIdx, isManualScrolling, showLyrics, compact, activeTrack.title])

  useEffect(() => {
    setIsManualScrolling(false)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
  }, [rawTTML, activeTrack.title])

  const handleScroll = () => {
    if (isProgrammaticScroll.current) return
    if (Date.now() - lastProgrammaticScrollTime.current < 500) return
    if (Date.now() - lastLayoutShiftTime.current < 500) return

    setIsScrolling(true)
    if (scrollbarTimeoutRef.current) clearTimeout(scrollbarTimeoutRef.current)
    scrollbarTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1000)

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    if (!isManualScrolling) setIsManualScrolling(true)
    
    scrollTimeout.current = setTimeout(() => {
      setIsManualScrolling(false)
    }, 2500)
  }

  const handleInteraction = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    if (!isManualScrolling) setIsManualScrolling(true)
  }

  if (!ttml.lines || ttml.lines.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-8">
        <h3 className="text-foreground/90 text-[18px] font-bold text-center mb-2">
          No lyrics available
        </h3>
        <p className="text-muted-foreground text-[13px] font-medium text-center max-w-[200px]">
          There are no lyrics available for this song.
        </p>
      </div>
    )
  }

  const isEndingPhase = compact ? (activeLineIdx >= ttml.lines.length - 8) : false

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      onWheel={handleInteraction}
      onTouchStart={handleInteraction}
      className={`relative w-full h-full overflow-y-auto overflow-x-hidden select-none ${hideScrollbar ? 'scrollbar-hidden' : `custom-scrollbar ${isScrolling ? 'is-scrolling' : ''}`} ${compact ? 'px-8' : 'px-6 md:px-10 lg:px-12'}`}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        scrollBehavior: 'auto'
      }}
    >
      <div style={{ height: compact ? '15vh' : '35vh' }} />

      <div className={compact ? 'space-y-2' : 'space-y-12'}>
        {ttml.lines.map((line, i) => {
          const isActive = activeLineIdx === i
          const isPast = activeLineIdx > i
          const isFuture = !isActive && !isPast
          const alignment = line.agent ? (agentAlignments.get(line.agent) || 'left') : 'left'
          
          return (
            <TTMLLineComponent
              key={`${i}-${line.startMs}`}
              line={line}
              currentTimeMs={smoothTimeMs}
              isActive={isActive}
              isPast={isPast}
              isFuture={isFuture}
              compact={compact}
              alignment={alignment}
              onSeek={(timeSecs) => {
                onSeek(timeSecs)
                setIsManualScrolling(false)
              }}
              isEndingPhase={isEndingPhase}
              setRef={el => { lineRefs.current[i] = el }}
              isManualScrolling={isManualScrolling}
              isPlaying={isPlaying}
              noHorizontalShift={noHorizontalShift}
            />
          )
        })}
      </div>

      {/* Credits block is contiguous with the lyrics list, separated by standard margins */}
      <div className={`w-full border-t border-border/40 ${compact ? 'mt-8 pb-10 pt-4' : 'mt-20 pb-20 pl-6 pt-12'}`}>
         <div className="flex gap-1.5 items-baseline mb-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Written by:</span>
            <span className={`font-normal text-foreground/85 leading-tight ${compact ? 'text-[14px]' : 'text-[18px]'}`}>
              {ttml.metadata?.songwriters && ttml.metadata.songwriters.length > 0 
                ? ttml.metadata.songwriters.join(', ')
                : activeTrack.artist}
            </span>
        </div>
      </div>
      
      {/* Spacer to allow centering the last lines of the song */}
      <div style={{ height: compact ? '15vh' : '50vh' }} />
    </div>
  )
}
