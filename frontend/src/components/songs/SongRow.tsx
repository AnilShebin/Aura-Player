import React, { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { SongContextMenu } from './SongContextMenu'

interface Song {
  id: string
  title: string
  artist: string
  albumTitle: string
  duration: string
  isFavorite?: boolean
  plays?: number
}

interface SongRowProps {
  song: Song
  isCurrentPlaying: boolean
  onPlay: (song: Song) => void
  onToggleFavorite: (songId: string, e: React.MouseEvent) => void
}

export const SongRow: React.FC<SongRowProps> = React.memo(({
  song,
  isCurrentPlaying,
  onPlay,
  onToggleFavorite
}) => {
  const isPlaying = useMusicStore(state => state.isPlaying)

  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null)

  const handleRowClick = () => {
    onPlay(song)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    onToggleFavorite(song.id, e)
  }

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (menuCoords) {
      setMenuCoords(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const menuWidth = 240 // updated menu width (w-60 = 240px)
      const menuHeight = 350 // updated approximate height
      let top = rect.bottom + window.scrollY + 4
      if (rect.bottom + menuHeight > window.innerHeight) {
        top = rect.top + window.scrollY - menuHeight - 4
      }
      setMenuCoords({
        top,
        left: rect.right - menuWidth + window.scrollX,
      })
    }
  }

  return (
    <div
      onClick={handleRowClick}
      className="flex items-center text-zinc-300 h-10 px-3 hover:bg-white/[0.04] group cursor-pointer border-b border-white/[0.03] transition-colors duration-150 transform-gpu contain-strict-layout-style"
      style={{
        contain: 'layout style paint',
        contentVisibility: 'auto',
      }}
    >
      {/* Song Title */}
      <div className="w-[42%] pr-4 flex items-center min-w-0 gap-2">
        {isCurrentPlaying && (
          <div className="flex gap-[2px] items-end shrink-0" style={{ height: '12px' }}>
            <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '5px',  transformOrigin: 'bottom', animation: isPlaying ? 'musicbar 0.8s ease-in-out 0s infinite' : 'none' }} />
            <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '10px', transformOrigin: 'bottom', animation: isPlaying ? 'musicbar 0.8s ease-in-out 0.15s infinite' : 'none' }} />
            <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '7px',  transformOrigin: 'bottom', animation: isPlaying ? 'musicbar 0.8s ease-in-out 0.3s infinite' : 'none' }} />
            <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '9px',  transformOrigin: 'bottom', animation: isPlaying ? 'musicbar 0.8s ease-in-out 0.45s infinite' : 'none' }} />
          </div>
        )}
        <span className={`text-[13px] font-medium truncate transition-colors duration-150 ${isCurrentPlaying ? 'text-[#fa586a]' : 'text-white'}`}>
          {song.title}
        </span>
      </div>

      {/* Artist */}
      <div className="w-[26%] pr-4 text-[13px] text-zinc-400 font-light truncate">
        {song.artist}
      </div>

      {/* Album */}
      <div className="w-[22%] pr-4 text-[13px] text-zinc-400 font-light truncate">
        {song.albumTitle}
      </div>

      {/* Favorite Star */}
      <div className="w-[5%] shrink-0 flex items-center justify-start pl-1">
        <button
          onClick={handleFavoriteClick}
          className={`text-[13px] w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform duration-150 ${song.isFavorite ? 'text-[#fa586a]' : 'text-zinc-600/40 hover:text-[#fa586a]/40'} cursor-pointer`}
        >
          ★
        </button>
      </div>

      {/* Options column with dropdown */}
      <div className="w-[5%] shrink-0 flex items-center justify-start pl-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleMenuClick}
          className="text-zinc-500 hover:text-[#fa586a] hover:opacity-85 w-6 h-6 flex items-center justify-center transition-colors duration-150 cursor-pointer"
        >
          <MoreHorizontal size={14} />
        </button>

        {menuCoords && (
          <SongContextMenu
            song={song as any}
            coords={menuCoords}
            onClose={() => setMenuCoords(null)}
          />
        )}
      </div>
    </div>
  )
})

SongRow.displayName = 'SongRow'
