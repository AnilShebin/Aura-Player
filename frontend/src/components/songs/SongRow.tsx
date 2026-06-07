import React from 'react'
import { useMusicStore } from '@/stores/musicStore'

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

  const handleRowClick = () => {
    onPlay(song)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    onToggleFavorite(song.id, e)
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
      <div className="w-[45%] pr-4 flex items-center min-w-0 gap-2">
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
      <div className="w-[28%] pr-4 text-[13px] text-zinc-400 font-light truncate">
        {song.artist}
      </div>

      {/* Album */}
      <div className="w-[23%] pr-4 text-[13px] text-zinc-400 font-light truncate">
        {song.albumTitle}
      </div>

      {/* Favorite Star */}
      <div className="w-[4%] flex justify-center text-center">
        <button
          onClick={handleFavoriteClick}
          className={`text-[13px] hover:scale-110 transition-transform duration-150 ${song.isFavorite ? 'text-[#fa586a]' : 'text-zinc-600/40 hover:text-[#fa586a]/40'} cursor-pointer`}
        >
          ★
        </button>
      </div>
    </div>
  )
})

SongRow.displayName = 'SongRow'
