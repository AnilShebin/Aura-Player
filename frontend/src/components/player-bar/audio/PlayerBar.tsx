import React, { useRef, useState, useCallback } from 'react'
import {
  Music2,
  Shuffle,
  SkipBack,
  Pause,
  Play,
  SkipForward,
  Repeat,
  Repeat1,
  List,
  MoreHorizontal
} from "lucide-react"
import { AnimatePresence } from 'framer-motion'
import { useMusicStore } from '@/stores/musicStore'
import { VolumeControl } from './VolumeControl'
import { LosslessIcon } from '@/components/icons/LosslessIcon'
import { DolbyIcon } from '@/components/icons/DolbyIcon'
import { SongContextMenu } from '@/components/songs/SongContextMenu'

// Helper component for auto-scrolling text on hover if it overflows (infinite loop)
const MarqueeText: React.FC<{ text: string; className?: string }> = React.memo(({ text, className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [shouldScroll, setShouldScroll] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [textWidth, setTextWidth] = useState(0)

  // Measure text and container widths on change
  React.useEffect(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const currentTextWidth = textRef.current.scrollWidth
      if (currentTextWidth > containerWidth) {
        setShouldScroll(true)
        setTextWidth(currentTextWidth)
      } else {
        setShouldScroll(false)
        setTextWidth(0)
      }
    } else {
      setShouldScroll(false)
      setTextWidth(0)
    }
  }, [text])

  // Reset hover state when text changes
  React.useEffect(() => {
    setIsHovered(false)
  }, [text])

  const blockWidth = textWidth + 32
  const animationDuration = Math.max(3, blockWidth / 35)

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="overflow-hidden whitespace-nowrap w-full relative flex items-center"
    >
      <div
        className="flex items-center"
        style={{
          width: 'max-content',
          animation: isHovered && shouldScroll ? `marquee-scroll ${animationDuration}s linear infinite` : 'none',
          animationDelay: '0.35s'
        }}
      >
        <span ref={textRef} className={`select-none ${className}`}>
          {text}
        </span>

        {shouldScroll && (
          <>
            <span className="inline-block w-8 shrink-0" />
            <span className={`select-none ${className}`}>
              {text}
            </span>
            <span className="inline-block w-8 shrink-0" />
          </>
        )}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
})
MarqueeText.displayName = 'MarqueeText'

// Isolated ProgressBar component to prevent continuous ticks from re-rendering the whole player bar
const ProgressBar: React.FC = () => {
  const currentTime = useMusicStore(state => state.currentTime)
  const duration = useMusicStore(state => state.duration)
  const seekSong = useMusicStore(state => state.seekSong)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))
    seekSong(percentage * duration)
  }

  return (
    <div
      className="absolute bottom-0 left-2 right-0 h-[2px] bg-white/10 cursor-pointer group/progress z-30 overflow-hidden"
      ref={progressBarRef}
      onClick={handleProgressClick}
    >
      <div
        className="h-full bg-white/50 group-hover/progress:bg-[#fa586a] rounded-full transition-colors relative"
        style={{ width: `${progressPercent}%` }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover/progress:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

export const PlayerBar: React.FC = () => {
  const playingSong = useMusicStore(state => state.playingSong)
  const isPlaying = useMusicStore(state => state.isPlaying)
  const isShuffle = useMusicStore(state => state.isShuffle)
  const setIsShuffle = useMusicStore(state => state.setIsShuffle)
  const repeatMode = useMusicStore(state => state.repeatMode)
  const setRepeatMode = useMusicStore(state => state.setRepeatMode)
  const handlePlayPause = useMusicStore(state => state.handlePlayPause)
  const handleNextTrack = useMusicStore(state => state.handleNextTrack)
  const handlePrevTrack = useMusicStore(state => state.handlePrevTrack)
  const showLyrics = useMusicStore(state => state.showLyrics)
  const setShowLyrics = useMusicStore(state => state.setShowLyrics)
  const showQueue = useMusicStore(state => state.showQueue)
  const setShowQueue = useMusicStore(state => state.setShowQueue)
  const setShowFullscreenPlayer = useMusicStore(state => state.setShowFullscreenPlayer)

  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false)
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null)

  const toggleShuffle = useCallback(() => setIsShuffle(!isShuffle), [isShuffle, setIsShuffle])
  const toggleRepeat = useCallback(() => {
    if (repeatMode === 'one') {
      setRepeatMode('off')
    } else {
      setRepeatMode(repeatMode === 'off' ? 'all' : 'one')
    }
  }, [repeatMode, setRepeatMode])

  const toggleLyrics = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowLyrics(!showLyrics)
  }, [showLyrics, setShowLyrics])

  const toggleQueue = useCallback(() => setShowQueue(!showQueue), [showQueue, setShowQueue])

  const handleMenuClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (menuCoords) {
      setMenuCoords(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const menuWidth = 240
      const menuHeight = 150 // Exact height of the offline-only player bar menu
      let top = rect.bottom + window.scrollY + 4
      if (rect.bottom + menuHeight > window.innerHeight) {
        top = rect.top + window.scrollY - menuHeight - 4
      }
      setMenuCoords({
        top,
        left: rect.right - menuWidth + window.scrollX,
      })
    }
  }, [menuCoords])

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[700px] h-[64px] bg-[#1c1c1e]/60 backdrop-blur-[40px] border border-white/10 rounded-full flex items-center px-6 z-30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden transition-[opacity,transform] duration-300 wails-no-drag"
    >
      {/* Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay z-0">
        <svg className="w-full h-full">
          <filter id="noiseFilterHeader">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilterHeader)" />
        </svg>
      </div>

      {/* Playback Controls (Left Column) */}
      <div className="flex items-center gap-5 mr-4 relative z-10 shrink-0">
        <Shuffle
          className={`w-3.5 h-3.5 cursor-pointer transition-colors duration-150 ${isShuffle ? 'text-[#fa586a]' : 'text-zinc-500 hover:text-white'}`}
          onClick={toggleShuffle}
        />
        <SkipBack
          className="w-5 h-5 text-white cursor-pointer hover:opacity-70 transition-opacity duration-150 fill-current"
          onClick={handlePrevTrack}
        />
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 text-white hover:scale-105 active:scale-95 transition-transform duration-200 ease-out flex items-center justify-center cursor-pointer shrink-0 will-change-transform transform-gpu"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current translate-x-[1px]" />
          )}
        </button>
        <SkipForward
          className="w-5 h-5 text-white cursor-pointer hover:opacity-70 transition-opacity duration-150 fill-current"
          onClick={handleNextTrack}
        />
        {repeatMode === 'one' ? (
          <Repeat1
            className="w-3.5 h-3.5 cursor-pointer transition-colors duration-150 text-[#fa586a]"
            onClick={toggleRepeat}
          />
        ) : (
          <Repeat
            className={`w-3.5 h-3.5 cursor-pointer transition-colors duration-150 ${repeatMode === 'all' ? 'text-[#fa586a]' : 'text-zinc-500 hover:text-white'}`}
            onClick={toggleRepeat}
          />
        )}
      </div>

      {/* Centered Track Info (Integrated Center Column) */}
      <div className="flex-1 flex items-center justify-center h-[46px] min-w-0 relative group z-10">
        {playingSong ? (
          <div className="flex items-center w-full bg-transparent rounded-[14px] h-full pl-2 pr-0 min-w-0 relative">

            {/* Artwork */}
            <div
              onClick={() => setShowFullscreenPlayer(true)}
              className="w-8.5 h-8.5 rounded-md bg-zinc-800 overflow-hidden shrink-0 shadow-md relative group/art transition-transform duration-200 cursor-pointer"
            >
              {playingSong.coverUrl ? (
                <img
                  src={playingSong.coverUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/art:scale-110"
                />
              ) : (
                <Music2 className="w-4 h-4 text-zinc-600 m-2.5" />
              )}

              {/* Hover Overlay with Diagonal Expand Icon */}
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity duration-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                  <polyline points="9 3 3 3 3 9" />
                  <polyline points="15 21 21 21 21 15" />
                  <line x1="3" y1="3" x2="10" y2="10" />
                  <line x1="21" y1="21" x2="14" y2="14" />
                </svg>
              </div>
            </div>

            {/* Song Text details with fade-out mask */}
            <div
              className="flex flex-col flex-1 min-w-0 pl-3 pr-2 justify-center relative h-full select-none"
              style={{ WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)' }}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <MarqueeText
                  text={playingSong.title}
                  className="text-[13px] font-bold text-white tracking-tight"
                />
                {playingSong.isFavorite && (
                  <svg viewBox="0 0 24 24" width="10" height="10" className="fill-[#fa586a] shrink-0">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
                {playingSong.quality?.toLowerCase().includes('lossless') && (
                  <LosslessIcon className="fill-zinc-400 shrink-0 opacity-80" width={14} height={9} />
                )}
                {playingSong.quality?.toLowerCase().includes('dolby') && (
                  <DolbyIcon className="fill-zinc-400 shrink-0 opacity-85" width={20} height={7} />
                )}
              </div>
              <div className="pb-2 min-w-0 flex items-center">
                <MarqueeText
                  text={`${playingSong.artist}${playingSong.albumTitle ? ` — ${playingSong.albumTitle}` : ''}`}
                  className="text-[11px] text-zinc-400 font-medium tracking-tight leading-none"
                />
              </div>
            </div>

            {/* More details button */}
            <button
              onClick={handleMenuClick}
              className="p-1 hover:bg-white/10 rounded-full transition-colors duration-150 shrink-0 text-zinc-400 hover:text-white cursor-pointer ml-1 relative z-10"
              title="More Options"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuCoords && (
              <SongContextMenu
                song={playingSong}
                coords={menuCoords}
                onClose={() => setMenuCoords(null)}
                isPlayerBar={true}
              />
            )}

            {/* Isolated Progress Bar Component */}
            <ProgressBar />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-zinc-300 select-none">
            <svg height="15" viewBox="0 0 32 32" width="15" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
              <defs>
                <linearGradient id="aura-playerbar-logo-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#d1d1d6" />
                  <stop offset="100%" stopColor="#8e8e93" />
                </linearGradient>
              </defs>
              <g fill="url(#aura-playerbar-logo-grad)">
                <rect x="2" y="16" width="2.4" height="12" rx="1.2" />
                <rect x="6" y="9.5" width="2.4" height="18.5" rx="1.2" />
                <rect x="10" y="4.5" width="2.4" height="16" rx="1.2" />
                <rect x="14" y="0" width="2.4" height="14" rx="1.2" />
                <rect x="18" y="4.5" width="2.4" height="16" rx="1.2" />
                <rect x="22" y="9.5" width="2.4" height="18.5" rx="1.2" />
                <rect x="26" y="16" width="2.4" height="12" rx="1.2" />
              </g>
            </svg>
            <span className="text-[12px] font-bold uppercase tracking-[0.25em] text-white/95 mt-[1px]">AURA</span>
          </div>
        )}
      </div>

      {/* Secondary Controls (Right Column) */}
      <div className="flex items-center gap-4 ml-2.5 relative z-10 shrink-0">

        {/* Synced Lyrics Toggle Button */}
        <button
          onClick={toggleLyrics}
          className="p-1 transition-colors duration-150 cursor-pointer"
          title="Toggle Lyrics"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="19"
            viewBox="0 0 18 18"
            fill="currentColor"
            className={`transition-colors duration-150 ${showLyrics ? 'text-[#fa233c] drop-shadow-[0_0_8px_rgba(250,35,60,0.6)]' : 'text-zinc-500 hover:text-white'}`}
          >
            <path d="m9.67 13.982-2.43 2.474c-.472.471-.79.675-1.145.675-.479 0-.623-.314-.623-1.012v-2.137H5.26c-1.406 0-1.915-.146-2.429-.42a2.877 2.877 0 0 1-1.192-1.192c-.274-.514-.421-1.024-.421-2.429V6.464c0-1.405.147-1.915.421-2.428a2.872 2.872 0 0 1 1.192-1.192c.514-.275 1.023-.421 2.429-.421h7.68c1.406 0 1.915.146 2.429.421a2.86 2.86 0 0 1 1.192 1.192c.274.513.421 1.023.421 2.428v3.477c0 1.405-.147 1.915-.421 2.429a2.866 2.866 0 0 1-1.192 1.192c-.514.274-1.023.42-2.429.42H9.67Zm-.974-.957c.257-.261.608-.408.974-.408h3.27c1.076 0 1.426-.068 1.785-.26.276-.147.484-.356.631-.632.192-.358.26-.709.26-1.784V6.464c0-1.075-.068-1.426-.26-1.784a1.49 1.49 0 0 0-.631-.631c-.359-.192-.709-.26-1.785-.26H5.26c-1.075 0-1.425.068-1.785.26a1.5 1.5 0 0 0-.631.631c-.192.358-.26.709-.26 1.784v3.477c0 1.075.068 1.426.26 1.784.148.276.356.485.631.632.36.192.71.26 1.785.26h.212c.754 0 1.365.611 1.365 1.365v.934l1.859-1.891ZM5.422 8.01c0-.821.67-1.383 1.554-1.383.976 0 1.599.726 1.599 1.634 0 1.73-1.46 2.084-2.242 2.084-.222 0-.381-.148-.381-.329 0-.173.084-.294.372-.364.502-.12 1.005.028 1.274-.491h-.056c-.185.208-.483.242-.771.242-.837 0-1.349-.614-1.349-1.393Zm4.204 0c0-.821.669-1.383 1.553-1.383.976 0 1.6.726 1.6 1.634 0 1.73-1.46 2.084-2.242 2.084-.223 0-.381-.148-.381-.329 0-.173.084-.294.372-.364.502-.12 1.004.028 1.274-.491h-.056c-.186.208-.483.242-.772.242-.837 0-1.348-.614-1.348-1.393Z"></path>
          </svg>
        </button>

        {/* Play Queue List Toggle Button */}
        <List
          className={`w-[18px] h-[18px] cursor-pointer transition-colors duration-150 ${showQueue ? 'text-[#fa233c] drop-shadow-[0_0_8px_rgba(250,35,60,0.6)]' : 'text-zinc-500 hover:text-white'}`}
          onClick={toggleQueue}
        />

        {/* Dynamic Inline Volume Pill */}
        <div className="relative flex items-center">
          <AnimatePresence mode="wait">
            <VolumeControl
              showVolumeSlider={showVolumeSlider}
              setShowVolumeSlider={setShowVolumeSlider}
            />
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
export default PlayerBar
