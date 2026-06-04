import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

interface LyricLine {
  time: number
  text: string
  is_translation?: boolean
}

interface SyncedLyricsProps {
  lyrics: LyricLine[]
  currentTime: number
  isPlaying: boolean
  onSeek: (time: number) => void
  showOriginal: boolean
  showTranslation: boolean
  showLyrics?: boolean
  activeTrack: { title: string; artist: string; url?: string; artwork?: string }
  compact?: boolean
}

const InstrumentalDots = React.memo(({ isVisible, opacity, compact }: { isVisible: boolean; opacity: number; compact: boolean }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: isVisible ? opacity : 0 }}
    transition={{ duration: 0.2 }}
    className={`flex gap-2.5 mt-4 mb-4 ${compact ? 'ml-0' : 'ml-6'}`}
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.1, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1.1 }}
        transition={{
          duration: 0.9,
          repeat: Infinity,
          repeatType: "reverse",
          delay: i * 0.3
        }}
        className="w-2.5 h-2.5 rounded-full bg-foreground/60 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
      />
    ))}
  </motion.div>
))
InstrumentalDots.displayName = 'InstrumentalDots'

interface LyricLineItemProps {
  line: { time: number; original: string; translation?: string; isGap: boolean }
  isActive: boolean
  isPast: boolean
  isFuture: boolean
  isManualScrolling: boolean
  compact: boolean
  showOriginal: boolean
  showTranslation: boolean
  onSeek: (time: number) => void
  setRef: (el: HTMLDivElement | null) => void
  isSynced: boolean
}

const LyricLineItem = React.memo<LyricLineItemProps>(({
  line,
  isActive,
  isPast,
  isFuture,
  isManualScrolling,
  compact,
  showOriginal,
  showTranslation,
  onSeek,
  setRef,
  isSynced
}) => {
  let opacity = 0.22
  let scale = 0.98
  let translateY = 0
  let translateX = 0

  if (!isSynced) {
    opacity = 0.95
    scale = 1
  } else if (isManualScrolling) {
    opacity = isActive ? 1 : 0.3
  } else {
    if (isActive) {
      opacity = 1
      scale = compact ? 1.02 : 1.05
      translateX = compact ? 0 : 15
    } else if (isPast) {
      opacity = 0
      translateY = compact ? -10 : -20
      scale = line.isGap ? 0.7 : 0.95
    } else {
      opacity = 0.22
      scale = 0.98
    }
  }

  return (
    <div
      ref={setRef}
      className="relative w-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-left"
      style={{
        opacity,
        transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
        pointerEvents: (opacity === 0 && !isManualScrolling) ? 'none' : 'auto'
      }}
      onClick={isSynced ? () => onSeek(line.time) : undefined}
    >
      {line.isGap ? (
        <InstrumentalDots isVisible={isActive || isManualScrolling || isFuture} opacity={isActive ? 1 : 0.15} compact={compact} />
      ) : (
        <div className={`w-full text-left ${compact ? 'py-2.5' : 'pl-6 pr-12'}`}>
          <div className="primary-vocals">
            <p className={`tracking-tight break-words whitespace-pre-wrap text-foreground cursor-pointer ${compact ? 'text-[26px] font-light leading-[1.2]' : 'text-[30px] md:text-[40px] lg:text-[48px] leading-[1.1] font-medium'}`}>
              {showOriginal ? line.original : (line.translation || line.original)}
            </p>
          </div>

          {line.translation && showOriginal && showTranslation && (
            <div className={`static-supplementary transition-opacity duration-500 ${compact ? 'mt-2 opacity-70' : 'mt-4 opacity-40'}`}>
              <p className={`leading-[1.2] font-light text-muted-foreground ${compact ? 'text-[18px]' : 'text-[1.2rem] md:text-[1.6rem] lg:text-[2.0rem]'}`}>
                {line.translation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
LyricLineItem.displayName = 'LyricLineItem'

export const SyncedLyrics: React.FC<SyncedLyricsProps> = ({ 
  lyrics, 
  currentTime, 
  onSeek,
  showOriginal,
  showTranslation,
  showLyrics,
  activeTrack,
  compact
}) => {
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
  }, [showOriginal, showTranslation, lyrics])

  const lastProgrammaticScrollTime = useRef(0)

  useEffect(() => {
    return () => {
      if (scrollbarTimeoutRef.current) clearTimeout(scrollbarTimeoutRef.current)
    }
  }, [])

  const processedLines = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return []
    const lines: Array<{ time: number; original: string; translation?: string; isGap: boolean }> = []
    if (lyrics.length > 0 && lyrics[0].time > 1.5) {
      lines.push({ time: 0, original: '...', isGap: true })
    }

    for (let i = 0; i < lyrics.length; i++) {
      const line = lyrics[i]
      if (line.is_translation) continue

      const nextLine = lyrics[i + 1]
      const translation = (nextLine && nextLine.is_translation && nextLine.time === line.time) ? nextLine.text : undefined
      const isGapLine = line.text.includes('...') || line.text.trim() === ''

      lines.push({
        time: line.time,
        original: isGapLine ? '...' : line.text,
        translation,
        isGap: isGapLine
      })

      const nextOriginal = lyrics.slice(i + 1).find(l => !l.is_translation)
      if (nextOriginal && (nextOriginal.time - line.time) > 8) {
        lines.push({ time: line.time + 4.5, original: '...', isGap: true })
      }
    }

    const result: typeof lines = []
    for (let i = 0; i < lines.length; i++) {
      const current = lines[i]
      const prev = result[result.length - 1]
      if (current.isGap && prev && prev.isGap) {
        continue
      }
      result.push(current)
    }
    return result
  }, [lyrics])

  const isSynced = useMemo(() => {
    return lyrics && lyrics.length > 0 && lyrics.some(line => line.time > 0)
  }, [lyrics])

  const activeIdx = isSynced
    ? processedLines.findIndex((line, i) => {
        const nextLine = processedLines[i + 1]
        return currentTime >= line.time && (!nextLine || currentTime < nextLine.time)
      })
    : -1

  useEffect(() => {
    if (activeIdx !== -1 && !isManualScrolling && lineRefs.current[activeIdx]) {
      const element = lineRefs.current[activeIdx]
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
  }, [activeIdx, isManualScrolling, showLyrics, compact, activeTrack.title])

  useEffect(() => {
    setIsManualScrolling(false)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
  }, [lyrics, activeTrack.title])

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

  if (!lyrics || lyrics.length === 0) {
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

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      onWheel={handleInteraction}
      onTouchStart={handleInteraction}
      className={`relative w-full h-full overflow-y-auto custom-scrollbar select-none ${isScrolling ? 'is-scrolling' : ''} ${compact ? 'px-8' : 'px-6 md:px-10 lg:px-12'}`}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        scrollBehavior: 'auto'
      }}
    >
      <div style={{ height: compact ? '15vh' : '35vh' }} />

      <div className={compact ? 'space-y-0' : 'space-y-10'}>
        {processedLines.map((line, i) => {
          const isActive = activeIdx === i
          const isPast = activeIdx > i
          const isFuture = !isActive && !isPast
          
          return (
            <LyricLineItem
              key={`${i}-${line.time}`}
              line={line}
              isActive={isActive}
              isPast={isPast}
              isFuture={isFuture}
              isManualScrolling={isManualScrolling}
              compact={compact ?? false}
              showOriginal={showOriginal}
              showTranslation={showTranslation}
              onSeek={(time) => {
                onSeek(time)
                setIsManualScrolling(false)
              }}
              setRef={el => { lineRefs.current[i] = el }}
              isSynced={isSynced}
            />
          )
        })}
      </div>

      <div className={`w-full border-t border-border/40 ${compact ? 'mt-8 mb-8 pt-4' : 'mt-20 mb-20 pl-6 pt-12'}`}>
         <div className="flex gap-1.5 items-baseline mb-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Written by:</span>
            <span className={`font-normal text-foreground/85 leading-tight ${compact ? 'text-[14px]' : 'text-[18px]'}`}>{activeTrack.artist}</span>
         </div>
      </div>

      <div style={{ height: compact ? '70vh' : '35vh' }} />
    </div>
  )
}
