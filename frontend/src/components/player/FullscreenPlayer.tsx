import React, { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Pause, Play, SkipBack, SkipForward, Volume2, Music2, Maximize2, Minimize2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMusicStore } from '@/stores/musicStore'
import { SyncedLyrics } from '@/components/lyrics/SyncedLyrics'
import { LosslessIcon } from '@/components/icons/LosslessIcon'
import { SpatialAudioIcon } from '@/components/icons/SpatialAudioIcon'

// Extracts a 9-color palette from artwork via canvas sampling
function extractColorPalette(img: HTMLImageElement): string[] {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 50; canvas.height = 50
    const ctx = canvas.getContext('2d')
    if (!ctx) return Array(9).fill('rgba(30,10,10,0.8)')
    ctx.drawImage(img, 0, 0, 50, 50)
    const d = ctx.getImageData(0, 0, 50, 50).data

    // Sample 9 regions across the image
    const regions = [
      [0, 0], [25, 0], [49, 0],
      [0, 25], [25, 25], [49, 25],
      [0, 49], [25, 49], [49, 49]
    ]
    return regions.map(([rx, ry]) => {
      const idx = (ry * 50 + rx) * 4
      const r = d[idx], g = d[idx + 1], b = d[idx + 2]
      return `rgb(${r},${g},${b})`
    })
  } catch {
    return Array(9).fill('rgba(30,10,10,0.8)')
  }
}

export const FullscreenPlayer: React.FC = () => {
  const showFullscreenPlayer = useMusicStore(s => s.showFullscreenPlayer)
  const setShowFullscreenPlayer = useMusicStore(s => s.setShowFullscreenPlayer)
  const playingSong = useMusicStore(s => s.playingSong)
  const isPlaying = useMusicStore(s => s.isPlaying)
  const handlePlayPause = useMusicStore(s => s.handlePlayPause)
  const handleNextTrack = useMusicStore(s => s.handleNextTrack)
  const handlePrevTrack = useMusicStore(s => s.handlePrevTrack)
  const currentTime = useMusicStore(s => s.currentTime)
  const duration = useMusicStore(s => s.duration)
  const seekSong = useMusicStore(s => s.seekSong)
  const volume = useMusicStore(s => s.volume)
  const setVolume = useMusicStore(s => s.setVolume)
  const lyrics = useMusicStore(s => s.lyrics)
  const showOriginal = useMusicStore(s => s.showOriginal)
  const showTranslation = useMusicStore(s => s.showTranslation)
  const setShowTranslation = useMusicStore(s => s.setShowTranslation)

  const [showLyrics, setShowLyrics] = useState(true)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [palette, setPalette] = useState<string[]>(Array(9).fill('rgb(30,10,20)'))
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err))
    } else {
      document.documentElement.requestFullscreen().catch(err => console.error(err))
    }
  }

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
        .catch(err => console.error('Failed to exit fullscreen:', err))
        .finally(() => {
          setShowFullscreenPlayer(false)
        })
    } else {
      setShowFullscreenPlayer(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [])

  const artworkUrl = playingSong?.coverUrl || playingSong?.artwork || ''

  // Extract color palette from artwork whenever track changes
  useEffect(() => {
    if (!artworkUrl) {
      setPalette(Array(9).fill('rgb(30,10,20)'))
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setPalette(extractColorPalette(img))
    img.onerror = () => setPalette(Array(9).fill('rgb(30,10,20)'))
    img.src = artworkUrl
  }, [artworkUrl])

  const meshGradient = useMemo(() => ({
    backgroundColor: palette[4],
    backgroundImage: `
      radial-gradient(at 0% 0%,   ${palette[0]} 0px, transparent 55%),
      radial-gradient(at 50% 0%,  ${palette[1]} 0px, transparent 55%),
      radial-gradient(at 100% 0%, ${palette[2]} 0px, transparent 55%),
      radial-gradient(at 0% 50%,  ${palette[3]} 0px, transparent 55%),
      radial-gradient(at 100% 50%,${palette[5]} 0px, transparent 55%),
      radial-gradient(at 0% 100%, ${palette[6]} 0px, transparent 55%),
      radial-gradient(at 50% 100%,${palette[7]} 0px, transparent 55%),
      radial-gradient(at 100% 100%,${palette[8]} 0px, transparent 55%),
      radial-gradient(at 50% 50%, ${palette[4]} 0px, transparent 55%)
    `,
    filter: 'saturate(2.2) contrast(1.1) brightness(0.85)'
  }), [palette])

  const activeTrack = useMemo(() => ({
    title: playingSong?.title || '',
    artist: playingSong?.artist || '',
    artwork: artworkUrl
  }), [playingSong, artworkUrl])

  const hasTranslations = useMemo(() =>
    lyrics.some((l: any) => l.is_translation === true), [lyrics])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  const remainingTime = useMemo(() => {
    const rem = Math.max(0, duration - currentTime)
    const m = Math.floor(rem / 60)
    return `-${m}:${Math.floor(rem % 60).toString().padStart(2, '0')}`
  }, [currentTime, duration])

  const qualityLabel = useMemo(() => {
    if (!playingSong) return ''
    const q = playingSong.quality || ''
    return q
  }, [playingSong])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    seekSong(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration)
  }

  if (!showFullscreenPlayer || !playingSong) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden font-sans selection:bg-white/20 wails-no-drag">
      <style>{`
        /* Hide all scrollbars globally when fullscreen player is active */
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Background: blurred artwork + mesh gradient + grain overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-150 blur-[120px] opacity-40 transform-gpu"
          style={{ backgroundImage: `url(${artworkUrl})` }}
        />
        <div
          className="absolute inset-0 transition-all duration-1000 ease-in-out scale-110"
          style={meshGradient}
        />
        <div className="absolute inset-0 backdrop-blur-[140px] opacity-90 transform-gpu" />
        {/* Grain noise */}
        <div className="absolute inset-0 opacity-[0.2] pointer-events-none mix-blend-overlay">
          <svg className="w-full h-full">
            <filter id="fsNoiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#fsNoiseFilter)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      {/* Top bar: close + translation toggle */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-8 pointer-events-none">
        {/* Left corner: Translation toggle */}
        <div className="flex items-center pointer-events-auto">
          {hasTranslations && (
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-xl backdrop-blur-3xl border cursor-pointer ${showTranslation ? 'bg-white border-white text-black' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
            >
              <svg viewBox="0 0 28 28" width="32" height="32" className={showTranslation ? 'fill-black' : 'fill-white'}>
                <mask id="fs-trans-mask">
                  <rect width="100%" height="100%" fill="black" />
                  <svg width="22" height="22" viewBox="0 0 17 16" x="3" y="3" fill="white">
                    <path d="M12.46-.44c0-12.76 8.13-20.17 20.37-20.17h47.4c12.24 0 20.4 7.41 20.4 20.17v4.47H98.3c-1.98 0-3.83.18-5.55.52v-4.7c0-8.62-4.82-13.14-13-13.14H33.3c-8.13-.01-13 4.52-13 13.14v28.34c0 8.62 4.88 13.04 12.99 13.04h5.16c2.07 0 3.76 1.24 3.76 4v12.32l15.71-14.03c1.92-1.7 3.1-2.3 5.76-2.3h14.24v7.37H63.37l-16.3 13.92c-2.92 2.56-4.53 3.87-6.9 3.87-3.41 0-5.27-2.38-5.27-6.07V48.59h-2.07c-12.24 0-20.37-7.39-20.37-20.2V-.44Z" transform="matrix(.101 0 0 .101 -.51 4.44)" />
                    <path d="M39.43 28.52c-1.04 2.73.48 5.21 3.3 5.21 1.85 0 3-.98 3.71-3.05l2.96-8.6h14.37l3.01 8.6c.66 2.07 1.8 3.05 3.68 3.05 2.87 0 4.3-2.5 3.34-5.2L61.7-3.8c-.88-2.4-2.66-3.71-5.16-3.71-2.47 0-4.25 1.3-5.13 3.7L39.43 28.53ZM51.4 16.07l5.14-14.95 5.2 14.95H51.41Zm80.04 71.09-16.31-13.93H98.3c-12.77 0-20.38-7.38-20.38-20.13V24.2c0-12.77 7.6-20.17 20.38-20.17h47.38c12.24 0 20.37 7.4 20.37 20.16v28.83c0 12.81-8.13 20.2-20.37 20.2h-2.02v11.72c0 3.69-1.92 6.07-5.26 6.07-2.39 0-3.98-1.3-6.97-3.85Zm-6.9-66.08-2.42-4.92c-.93-1.85-2.8-2.68-4.58-1.7a3.35 3.35 0 0 0-1.55 4.57l2.37 4.97a3.35 3.35 0 0 0 4.47 1.66c1.84-.9 2.53-2.87 1.7-4.58Zm-21.63 9.57c0 1.87 1.5 3.25 3.46 3.25h3.74a32.44 32.44 0 0 0 7.25 13.18 35.93 35.93 0 0 1-11.69 4.86c-1.87.45-3 2.25-2.62 4.22.55 1.93 2.5 2.8 4.6 2.23a38.7 38.7 0 0 0 14.74-6.69 38.3 38.3 0 0 0 14.14 6.69c2.42.52 4.41-.2 4.9-2.23.6-2.12-.37-3.77-2.5-4.22a34.42 34.42 0 0 1-11.64-4.86 30.51 30.51 0 0 0 7.2-13.18h3.74c2.02 0 3.5-1.38 3.5-3.25s-1.48-3.26-3.5-3.26h-31.86c-1.97 0-3.46 1.4-3.46 3.26Zm19.48 12.3a26.45 26.45 0 0 1-5.46-9.05h10.74a27.3 27.3 0 0 1-5.28 9.05Z" transform="matrix(.101 0 0 .101 -.51 4.44)" />
                  </svg>
                </mask>
                <rect width="100%" height="100%" mask="url(#fs-trans-mask)" />
              </svg>
            </button>
          )}
        </div>

        {/* Right corner: Fullscreen toggle and Close button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main body */}
      <div className="absolute inset-0 flex flex-col md:flex-row z-10 overflow-hidden">

        {/* Left column: artwork + controls */}
        <motion.div
          initial={false}
          animate={{ width: showLyrics ? '45%' : '100%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-full flex flex-col items-center justify-center px-8 lg:px-12 relative z-10"
        >
          <div className="w-full max-w-[340px] lg:max-w-[420px] flex flex-col items-center min-h-0">

            {/* Artwork — bounded by both width and height so it never overflows */}
            <div className="w-full relative mb-6 group" style={{ maxHeight: 'min(100%, 42vh)', aspectRatio: '1/1' }}>
              <div
                className="absolute inset-0 blur-[80px] opacity-40 rounded-full scale-125 transition-colors duration-1000"
                style={{ backgroundColor: palette[4] }}
              />
              <motion.div
                animate={{ scale: isPlaying ? 1 : 0.94 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="w-full h-full rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative z-10 border border-white/10"
              >
                {artworkUrl
                  ? <img src={artworkUrl} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Music2 className="w-20 h-20 text-zinc-700" /></div>
                }
              </motion.div>
            </div>

            {/* Title & Artist */}
            <div className="w-full text-center space-y-0.5 mb-3">
              <h2 className="text-[19px] lg:text-[21px] font-medium text-white tracking-tight leading-tight w-full line-clamp-1 px-4">
                {activeTrack.title}
              </h2>
              <p className="text-[15px] lg:text-[17px] text-white/60 font-normal w-full truncate px-4">
                {activeTrack.artist}
              </p>
            </div>

            {/* Quality badge */}
            {qualityLabel && (
              <div className="flex items-center justify-center gap-1.5 mb-5 opacity-55">
                {qualityLabel.toLowerCase().includes('lossless') ? (
                  <LosslessIcon className="fill-white" width={18} height={11} />
                ) : qualityLabel.toLowerCase().includes('spatial') ? (
                  <SpatialAudioIcon className="text-white" width={20} height={14} />
                ) : (
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-white">
                    <path d="M12 4v16M8 8v8M4 11v2M16 8v8M20 11v2" />
                  </svg>
                )}
                <span className="text-[11px] font-semibold tracking-wide text-white/95">{qualityLabel}</span>
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full flex items-center gap-3 mb-6 px-4">
              <span className="text-[11px] font-medium text-white/30 w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
              <div
                className="flex-1 h-[5px] bg-white/10 rounded-full overflow-hidden relative group cursor-pointer"
                onClick={handleProgressClick}
              >
                <div
                  className="absolute h-full bg-white/70 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-white/30 w-10 tabular-nums">{remainingTime}</span>
            </div>

            {/* Controls row */}
            <div className="w-full flex items-center justify-between px-6">

              {/* Volume */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className={`transition-all duration-300 cursor-pointer ${showVolumeSlider ? 'text-white' : 'text-white/40 hover:text-white'}`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    opacity: showVolumeSlider ? 1 : 0,
                    scale: showVolumeSlider ? 1 : 0.9,
                    y: showVolumeSlider ? -70 : -50,
                    pointerEvents: showVolumeSlider ? 'auto' : 'none'
                  }}
                  className="absolute left-[-10px] bg-[#1c1c1e] rounded-xl px-4 py-3 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5 min-w-[280px] z-50"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  </svg>
                  <div className="flex-1 relative h-1.5 flex items-center cursor-pointer">
                    <input
                      type="range" min="0" max="1" step="0.01" value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF2D55]" style={{ width: `${volume * 100}%` }} />
                    </div>
                    <div
                      className="absolute w-4 h-4 bg-[#FF2D55] rounded-full border-[3px] border-[#2c2c2e] shadow-lg pointer-events-none"
                      style={{ left: `calc(${volume * 100}% - 8px)` }}
                    />
                  </div>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                </motion.div>
              </div>

              {/* Skip / Play / Skip */}
              <div className="flex items-center gap-10">
                <button onClick={handlePrevTrack} className="text-white hover:opacity-70 transition-all cursor-pointer">
                  <SkipBack className="w-7 h-7 fill-current" />
                </button>
                <button onClick={handlePlayPause} className="text-white hover:scale-110 transition-all cursor-pointer">
                  {isPlaying
                    ? <Pause className="w-9 h-9 fill-current" />
                    : <Play className="w-9 h-9 fill-current" />
                  }
                </button>
                <button onClick={handleNextTrack} className="text-white hover:opacity-70 transition-all cursor-pointer">
                  <SkipForward className="w-7 h-7 fill-current" />
                </button>
              </div>

              {/* Lyrics toggle */}
              <div className="flex items-center">
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                    showLyrics 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-transparent text-white/40 hover:text-white/75'
                  }`}
                >
                  <svg viewBox="0 0 28 28" width="28" height="28" className="fill-current">
                    <svg viewBox="0 0 64 64" width="22" height="22" x="3" y="3">
                      <path d="M18.53 62.724c1.764 0 3.115-.81 5.257-2.707l9.816-8.638h16.62c8.72 0 13.777-5.152 13.777-13.777V15.053c0-8.625-5.056-13.777-13.777-13.777H13.777C5.057 1.276 0 6.42 0 15.053v22.549c0 8.633 5.27 13.777 13.456 13.777h1.016v6.793c0 2.812 1.511 4.552 4.057 4.552zm1.57-7.16v-8.11c0-1.81-.805-2.485-2.486-2.485h-3.55c-5.165 0-7.654-2.603-7.654-7.654V15.34c0-5.033 2.489-7.632 7.654-7.632h35.872c5.149 0 7.654 2.599 7.654 7.632v21.975c0 5.051-2.505 7.654-7.654 7.654H33.188c-1.835 0-2.702.33-4.012 1.65zm-2.212-32.177c0 3.398 2.156 5.936 5.388 5.936 1.361 0 2.592-.302 3.372-1.263h.385c-.868 2.231-3 3.845-5.303 4.4-.95.243-1.327.737-1.327 1.425 0 .8.658 1.36 1.51 1.36 3.174 0 8.8-3.775 8.8-10.6 0-4.138-2.602-7.336-6.588-7.336-3.576 0-6.237 2.518-6.237 6.078zm15.663 0c0 3.398 2.134 5.936 5.387 5.936 1.34 0 2.593-.302 3.373-1.263h.39c-.865 2.231-3.023 3.845-5.308 4.4-.947.243-1.327.737-1.327 1.425 0 .8.636 1.36 1.51 1.36 3.178 0 8.779-3.775 8.779-10.6 0-4.138-2.577-7.336-6.567-7.336-3.577 0-6.237 2.518-6.237 6.078z" />
                    </svg>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Right column: lyrics panel (absolute, slides in from right) */}
        <motion.div
          initial={false}
          animate={{
            x: showLyrics ? '0%' : '100%',
            opacity: showLyrics ? 1 : 0
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute top-0 right-0 w-[55%] h-full overflow-hidden z-20"
          style={{ pointerEvents: showLyrics ? 'auto' : 'none' }}
        >
          {/* Wrapper adds right padding matching the left column's px-8 lg:px-12 */}
          <div className="w-full h-full pr-8 lg:pr-12">
            <SyncedLyrics
              lyrics={lyrics}
              currentTime={currentTime}
              isPlaying={isPlaying}
              showOriginal={showOriginal}
              showTranslation={showTranslation}
              showLyrics={showLyrics}
              activeTrack={activeTrack}
              compact={false}
              noHorizontalShift={true}
              onSeek={seekSong}
            />
          </div>
        </motion.div>

      </div>
    </div>,
    document.body
  )
}

export default FullscreenPlayer
