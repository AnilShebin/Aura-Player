import React, { useCallback, useState } from 'react'
import { Play, Pause, MoreHorizontal } from 'lucide-react'
import { AlbumArtwork } from './AlbumArtwork'
import { CollectionContextMenu } from '../shared/CollectionContextMenu'
import { useMusicStore } from '@/stores/musicStore'

interface AlbumCardProps {
  id: string
  title: string
  artist: string
  coverUrl: string
  isCurrentAlbum: boolean
  isPlaying: boolean
  onClick: (id: string) => void
  onPlay: (id: string, e: React.MouseEvent) => void
  onPlayPause: (e: React.MouseEvent) => void
}

export const AlbumCard: React.FC<AlbumCardProps> = React.memo(({
  id,
  title,
  artist,
  coverUrl,
  isCurrentAlbum,
  isPlaying,
  onClick,
  onPlay,
  onPlayPause
}) => {
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null)
  
  const libraryAlbums = useMusicStore(state => state.libraryAlbums)
  const currentAlbumObj = libraryAlbums.find(a => a.id === id)
  const songs = currentAlbumObj?.songs || []

  const handleClick = useCallback(() => {
    onClick(id)
  }, [id, onClick])

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCurrentAlbum) {
      onPlayPause(e)
    } else {
      onPlay(id, e)
    }
  }, [id, isCurrentAlbum, onPlay, onPlayPause])

  const handleOptionsClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (menuCoords) {
      setMenuCoords(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const menuWidth = 240
      const menuHeight = 200
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
      onClick={handleClick}
      className="flex flex-col group cursor-pointer transform-gpu min-w-0"
      style={{ contain: 'layout style paint' }}
    >
      {/* Cover Art Container */}
      <div className="relative aspect-square w-full rounded-[6px] overflow-hidden bg-zinc-900 border border-white/[0.06] shadow-md transition-shadow duration-300 group-hover:shadow-xl">
        <AlbumArtwork coverUrl={coverUrl} title={title} size={256} />

        {/* Backdrop overlay for active album or general hover */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isCurrentAlbum ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

        {/* Play / Waveform indicator overlay */}
        <div className="absolute inset-0 flex items-end justify-between p-3 select-none">
          {/* Circular Button Container */}
          <div className={`relative w-9 h-9 shrink-0 z-10 transition-opacity duration-200 ${isCurrentAlbum ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button
              onClick={handlePlayClick}
              className="w-full h-full rounded-full bg-white/20 hover:bg-white/35 border border-white/10 flex items-center justify-center text-white transition-colors duration-150 cursor-pointer shadow-md"
            >
              {/* DEFAULT non-hover state: Shows animated or settled waveform inside the circle */}
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0">
                {isCurrentAlbum && isPlaying ? (
                  /* Animated 4-bar waveform */
                  <div className="flex gap-[1.5px] items-end" style={{ height: '12px' }}>
                    <span className="w-[2px] bg-[#fa586a] rounded-full" style={{ height: '5px',  transformOrigin: 'bottom', animation: 'musicbar 0.8s ease-in-out 0s infinite' }} />
                    <span className="w-[2px] bg-[#fa586a] rounded-full" style={{ height: '10px', transformOrigin: 'bottom', animation: 'musicbar 0.8s ease-in-out 0.15s infinite' }} />
                    <span className="w-[2px] bg-[#fa586a] rounded-full" style={{ height: '7px',  transformOrigin: 'bottom', animation: 'musicbar 0.8s ease-in-out 0.3s infinite' }} />
                    <span className="w-[2px] bg-[#fa586a] rounded-full" style={{ height: '9px',  transformOrigin: 'bottom', animation: 'musicbar 0.8s ease-in-out 0.45s infinite' }} />
                  </div>
                ) : isCurrentAlbum && !isPlaying ? (
                  /* Settled waveform bars */
                  <div className="flex gap-[1.5px] items-end" style={{ height: '12px' }}>
                    <span className="w-[2px] bg-[#fa586a] rounded-full" style={{ height: '3.5px' }} />
                    <span className="w-[2px] bg-[#fa586a] rounded-full" style={{ height: '3.5px' }} />
                    <span className="w-[2px] bg-[#fa586a] rounded-full" style={{ height: '3.5px' }} />
                    <span className="w-[2px] bg-[#fa586a] rounded-full" style={{ height: '3.5px' }} />
                  </div>
                ) : (
                  /* Default play icon */
                  <Play size={13} fill="white" className="ml-0.5 text-white" />
                )}
              </div>

              {/* HOVER state: Shows play/pause control overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                {isCurrentAlbum && isPlaying ? (
                  <Pause size={13} fill="white" className="text-white" />
                ) : (
                  <Play size={13} fill="white" className="ml-0.5 text-white" />
                )}
              </div>
            </button>
          </div>

          {/* Options three-dots menu (bottom-right) */}
          <button
            onClick={handleOptionsClick}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 border border-white/10 flex items-center justify-center text-white transition-opacity duration-200 opacity-0 group-hover:opacity-100 cursor-pointer shadow-md z-10"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Album Metadata */}
      <div className="flex flex-col mt-2.5 min-w-0">
        <span className={`text-[12px] font-bold truncate leading-snug transition-colors duration-150 ${isCurrentAlbum ? 'text-[#fa586a]' : 'text-zinc-100 group-hover:text-white'}`}>
          {title}
        </span>

        <span className="text-[10.5px] text-zinc-400 font-light truncate mt-0.5 leading-snug">
          {artist}
        </span>
      </div>

      {menuCoords && (
        <CollectionContextMenu
          type="album"
          id={id}
          name={title}
          songs={songs}
          coords={menuCoords}
          onClose={() => setMenuCoords(null)}
        />
      )}
    </div>
  )
})

AlbumCard.displayName = 'AlbumCard'
