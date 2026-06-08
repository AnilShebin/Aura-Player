import React from 'react'
import { TTMLWord, TTMLLine } from './ttmlModels'

// Custom comparison function to optimize word highlights
const isWordEqual = (prevProps: any, nextProps: any) => {
  if (prevProps.word !== nextProps.word) return false
  if (prevProps.lineState !== nextProps.lineState) return false
  if (prevProps.isBackground !== nextProps.isBackground) return false

  // If the line is not active, we don't need high-frequency updates
  if (nextProps.lineState !== 'active') return true

  const prevTime = prevProps.currentTimeMs
  const nextTime = nextProps.currentTimeMs
  const start = prevProps.word.startMs
  const end = prevProps.word.endMs

  // Check if both times are in the same state:
  // State 1: Both before start (future word)
  if (prevTime < start && nextTime < start) return true

  // State 2: Both after end (past word)
  if (prevTime >= end && nextTime >= end) return true

  // Otherwise, we are transitioning through this word, so we need to update
  return false
}

export const TTMLWordComponent = React.memo<{
  word: TTMLWord
  currentTimeMs: number
  lineState: 'past' | 'active' | 'future'
  isBackground?: boolean
}>(({ word, currentTimeMs, lineState, isBackground }) => {
  const isWordActive = lineState === 'active' && currentTimeMs >= word.startMs && currentTimeMs < word.endMs

  if (isWordActive) {
    const duration = word.endMs - word.startMs
    const progress = duration > 0 ? (currentTimeMs - word.startMs) / duration : 0
    return (
      <span 
        className="karaoke-word-gradient whitespace-pre-wrap"
        style={{
          ['--gradient-progress' as any]: `${progress * 100}%`
        }}
      >
        {word.text}
      </span>
    )
  }

  // Fallback for non-active words (past is fully lit, future is dim)
  const isPastWord = lineState === 'past' || (lineState === 'active' && currentTimeMs >= word.endMs)
  if (isBackground) {
    return (
      <span className={`whitespace-pre-wrap ${isPastWord ? 'text-foreground/90' : 'text-foreground/15'}`}>
        {word.text}
      </span>
    )
  }

  return (
    <span className={`whitespace-pre-wrap ${isPastWord ? 'text-foreground' : 'text-foreground/22'}`}>
      {word.text}
    </span>
  )
}, isWordEqual)

TTMLWordComponent.displayName = 'TTMLWordComponent'

const isLineEqual = (prevProps: any, nextProps: any) => {
  if (prevProps.line !== nextProps.line) return false
  if (prevProps.isActive !== nextProps.isActive) return false
  if (prevProps.isPast !== nextProps.isPast) return false
  if (prevProps.isFuture !== nextProps.isFuture) return false
  if (prevProps.compact !== nextProps.compact) return false
  if (prevProps.alignment !== nextProps.alignment) return false
  if (prevProps.isEndingPhase !== nextProps.isEndingPhase) return false
  if (prevProps.isManualScrolling !== nextProps.isManualScrolling) return false
  if (prevProps.isPlaying !== nextProps.isPlaying) return false

  // If it is not active, the visual presentation is static, so skip re-rendering on time update
  if (!nextProps.isActive) return true

  // For active lines, re-render only if time changes
  return prevProps.currentTimeMs === nextProps.currentTimeMs
}

export const TTMLLineComponent = React.memo<{
  line: TTMLLine
  currentTimeMs: number
  isActive: boolean
  isPast: boolean
  isFuture: boolean
  compact: boolean
  alignment: 'left' | 'right'
  onSeek: (timeSeconds: number) => void
  isEndingPhase: boolean
  setRef: (el: HTMLDivElement | null) => void
  isManualScrolling: boolean
  isPlaying: boolean
  noHorizontalShift?: boolean
}>(({ line, currentTimeMs, isActive, isPast, isFuture, compact, alignment, onSeek, isEndingPhase, setRef, isManualScrolling, isPlaying, noHorizontalShift = false }) => {
  let opacity = 0.22
  let scale = 0.98
  let translateY = 0
  let translateX = 0

  const shouldHidePast = isPast && !isEndingPhase

  if (isManualScrolling) {
    opacity = isActive ? 1 : 0.3
  } else {
    if (isActive) {
      opacity = 1
      scale = noHorizontalShift ? 1 : (compact ? 1.02 : 1.05)
      translateX = noHorizontalShift ? 0 : (compact ? 0 : (alignment === 'left' ? 15 : -15))
    } else if (shouldHidePast) {
      opacity = 0
      translateY = compact ? -10 : -20
    } else {
      opacity = 0.22
      scale = 0.98
    }
  }

  const originClass = noHorizontalShift ? '' : (alignment === 'left' ? 'origin-left' : 'origin-right')
  const alignClass = alignment === 'left'
    ? `text-left ${compact ? 'py-2.5' : 'py-3 pl-6 pr-12'}`
    : `text-right ${compact ? 'py-2.5' : 'py-3 pl-12 pr-6'}`

  const isInstrumental = line.isInstrumental
  const primaryWords = line.words.filter(w => !w.isBackground)
  const backgroundWords = line.words.filter(w => w.isBackground)
  const hasBackgroundVocals = backgroundWords.length > 0
  const lineState = isActive ? 'active' : (isPast ? 'past' : 'future')

  return (
    <div
      ref={setRef}
      className={`relative w-full transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${originClass} cursor-pointer ${
        isActive ? 'line-active-state-active' : 'line-active-state-inactive'
      }`}
      style={{
        opacity,
        transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
        pointerEvents: (opacity === 0 && !isManualScrolling) ? 'none' : 'auto',
        willChange: 'transform, opacity'
      }}
      onClick={() => onSeek(line.startMs / 1000)}
    >
      <div className={`w-full ${alignClass}`}>
        {isInstrumental ? (
          <div className="instrumental-dots">
            <span className="dot" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
            <span className="dot" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
            <span className="dot" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
          </div>
        ) : hasBackgroundVocals ? (
          <div className="flex flex-col">
            <p className={`primary-vocals tracking-tight break-words whitespace-pre-wrap ${
              compact 
                ? 'text-[26px] font-light leading-[1.2]' 
                : 'text-[30px] md:text-[40px] lg:text-[48px] leading-[1.1] font-light'
            }`}>
              {primaryWords.map((word, idx) => (
                <TTMLWordComponent
                  key={`prim-${idx}-${word.startMs}`}
                  word={word}
                  currentTimeMs={currentTimeMs}
                  lineState={lineState}
                  isBackground={false}
                />
              ))}
            </p>
            <p className={`background-vocals tracking-tight break-words whitespace-pre-wrap ${
              compact
                ? 'text-[18px] font-light leading-[1.2] mt-1'
                : 'text-[20px] md:text-[28px] lg:text-[34px] leading-[1.1] font-light mt-2'
            }`}>
              {backgroundWords.map((word, idx) => (
                <TTMLWordComponent
                  key={`bg-${idx}-${word.startMs}`}
                  word={word}
                  currentTimeMs={currentTimeMs}
                  lineState={lineState}
                  isBackground={true}
                />
              ))}
            </p>
          </div>
        ) : (
          <p className={`tracking-tight break-words whitespace-pre-wrap ${
            compact 
              ? 'text-[26px] font-light leading-[1.2]' 
              : 'text-[30px] md:text-[40px] lg:text-[48px] leading-[1.1] font-light'
          }`}>
            {line.words.map((word, idx) => (
              <TTMLWordComponent
                key={`${idx}-${word.startMs}`}
                word={word}
                currentTimeMs={currentTimeMs}
                lineState={lineState}
              />
            ))}
          </p>
        )}
      </div>
    </div>
  )
}, isLineEqual)

TTMLLineComponent.displayName = 'TTMLLineComponent'

