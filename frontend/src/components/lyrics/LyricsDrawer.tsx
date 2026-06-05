import React from 'react'
import { motion } from 'framer-motion'
import { useMusicStore } from '@/stores/musicStore'
import { SyncedLyrics } from './SyncedLyrics'

export const LyricsDrawer: React.FC = () => {
  const {
    showLyrics,
    playingSong,
    currentTime,
    isPlaying,
    seekSong,
    showOriginal,
    showTranslation,
    setShowTranslation,
    lyrics,
    isMaximized,
  } = useMusicStore()

  // Derived: does this song have bilingual lyrics?
  const hasTranslations = lyrics.some((l: any) => l.is_translation === true)

  return (
    <motion.div
      initial={false}
      animate={{ width: showLyrics ? 300 : 0 }}
      transition={{ duration: 0.2, ease: 'linear' }}
      className={`${isMaximized ? 'relative' : 'absolute'} right-0 ${isMaximized ? 'right-auto' : ''} top-0 ${isMaximized ? 'top-auto' : ''} bottom-0 ${isMaximized ? 'bottom-auto' : ''} z-20 h-full overflow-hidden ${isMaximized ? 'bg-transparent' : 'bg-[#161616]/80 backdrop-blur-2xl'} ${isMaximized ? 'border-l-0' : 'border-l border-white/5'} shrink-0`}
      style={{ willChange: 'width' }}
    >
      {/* Inner fixed-width content — stays 340px wide, hidden by parent overflow:hidden */}
      <div className="w-[300px] h-full flex flex-col pb-[92px] relative z-10">

        {/* Translation Toggle Button — only shown for bilingual songs */}
        {hasTranslations && (
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`absolute bottom-[100px] right-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${showTranslation
                ? 'bg-secondary'
                : 'bg-transparent hover:bg-secondary/50'
              }`}
            title="Lyrics translation"
          >
            <svg viewBox="0 0 28 28" width="22" height="22" className="fill-foreground">
              <mask id="sidebar-translation-mask-drawer">
                <rect width="100%" height="100%" fill="black" />
                <svg width="22" height="22" viewBox="0 0 17 16" x="3" y="3" fill="white">
                  <path d="M12.46-.44c0-12.76 8.13-20.17 20.37-20.17h47.4c12.24 0 20.4 7.41 20.4 20.17v4.47H98.3c-1.98 0-3.83.18-5.55.52v-4.7c0-8.62-4.82-13.14-13-13.14H33.3c-8.13-.01-13 4.52-13 13.14v28.34c0 8.62 4.88 13.04 12.99 13.04h5.16c2.07 0 3.76 1.24 3.76 4v12.32l15.71-14.03c1.92-1.7 3.1-2.3 5.76-2.3h14.24v7.37H63.37l-16.3 13.92c-2.92 2.56-4.53 3.87-6.9 3.87-3.41 0-5.27-2.38-5.27-6.07V48.59h-2.07c-12.24 0-20.37-7.39-20.37-20.2V-.44Z" transform="matrix(.101 0 0 .101 -.51 4.44)" />
                  <path d="M39.43 28.52c-1.04 2.73.48 5.21 3.3 5.21 1.85 0 3-.98 3.71-3.05l2.96-8.6h14.37l3.01 8.6c.66 2.07 1.8 3.05 3.68 3.05 2.87 0 4.3-2.5 3.34-5.2L61.7-3.8c-.88-2.4-2.66-3.71-5.16-3.71-2.47 0-4.25 1.3-5.13 3.7L39.43 28.53ZM51.4 16.07l5.14-14.95 5.2 14.95H51.41Zm80.04 71.09-16.31-13.93H98.3c-12.77 0-20.38-7.38-20.38-20.13V24.2c0-12.77 7.6-20.17 20.38-20.17h47.38c12.24 0 20.37 7.4 20.37 20.16v28.83c0 12.81-8.13 20.2-20.37 20.2h-2.02v11.72c0 3.69-1.92 6.07-5.26 6.07-2.39 0-3.98-1.3-6.97-3.85Zm-6.9-66.08-2.42-4.92c-.93-1.85-2.8-2.68-4.58-1.7a3.35 3.35 0 0 0-1.55 4.57l2.37 4.97a3.35 3.35 0 0 0 4.47 1.66c1.84-.9 2.53-2.87 1.7-4.58Zm-21.63 9.57c0 1.87 1.5 3.25 3.46 3.25h3.74a32.44 32.44 0 0 0 7.25 13.18 35.93 35.93 0 0 1-11.69 4.86c-1.87.45-3 2.25-2.62 4.22.55 1.93 2.5 2.8 4.6 2.23a38.7 38.7 0 0 0 14.74-6.69 38.3 38.3 0 0 0 14.14 6.69c2.42.52 4.41-.2 4.9-2.23.6-2.12-.37-3.77-2.5-4.22a34.42 34.42 0 0 1-11.64-4.86 30.51 30.51 0 0 0 7.2-13.18h3.74c2.02 0 3.5-1.38 3.5-3.25s-1.48-3.26-3.5-3.26h-31.86c-1.97 0-3.46 1.4-3.46 3.26Zm19.48 12.3a26.45 26.45 0 0 1-5.46-9.05h10.74a27.3 27.3 0 0 1-5.28 9.05Z" transform="matrix(.101 0 0 .101 -.51 4.44)" />
                </svg>
              </mask>
              <rect width="100%" height="100%" mask="url(#sidebar-translation-mask-drawer)" />
            </svg>
          </button>
        )}

        <div className="flex-1 overflow-hidden pt-3 pb-4">
          {playingSong ? (
            <SyncedLyrics
              lyrics={lyrics}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={(time) => {
                seekSong(time)
              }}
              showLyrics={showLyrics}
              showOriginal={showOriginal}
              showTranslation={showTranslation}
              compact={true}
              activeTrack={{
                title: playingSong.title,
                artist: playingSong.artist,
                artwork: playingSong.coverUrl
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <p className="text-[20px] font-bold text-foreground mb-2">No track active</p>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Load a track from your library to view lyrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
