import React, { useState, useMemo } from 'react'
import { MoreHorizontal, ArrowUp, ArrowDown, Music } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { ToggleFavorite } from '@/services/libraryService'

type SortField = 'title' | 'duration' | 'artist' | 'albumTitle' | 'genre' | 'plays' | 'none'
type SortOrder = 'asc' | 'desc'

export const Songs: React.FC = () => {
  const { playSongDirect, playingSong, librarySongs, toggleFavorite: storeToggleFavorite } = useMusicStore()

  const [sortField, setSortField] = useState<SortField>('artist') // Default sort is Artist in design reference
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')   // Default is Ascending

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleToggleFavorite = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await ToggleFavorite(songId)
      storeToggleFavorite(songId)
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  // Sorted list memo
  const sortedSongs = useMemo(() => {
    const list = [...librarySongs]
    if (sortField === 'none') return list

    return list.sort((a, b) => {
      // Safe access
      let valA = (a as any)[sortField] || ''
      let valB = (b as any)[sortField] || ''

      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [librarySongs, sortField, sortOrder])

  const handlePlaySong = (song: any) => {
    playSongDirect(song, sortedSongs)
  }

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ArrowUp size={11} className="inline ml-1 text-primary shrink-0" />
    ) : (
      <ArrowDown size={11} className="inline ml-1 text-primary shrink-0" />
    )
  }

  if (librarySongs.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center select-none py-10">
        <div className="w-20 h-20 rounded-full bg-zinc-800/30 border border-white/5 flex items-center justify-center mb-6 shadow-xl">
          <Music size={32} className="text-zinc-600" />
        </div>
        <h2 className="text-[22px] font-bold text-white tracking-tight mb-2">No Scanned Songs</h2>
        <p className="text-zinc-400 text-[13px] max-w-[280px] leading-relaxed mb-6">
          Add folder paths in Settings Files page to scan your local audio collection.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 pt-6 pb-0 select-none overflow-hidden">

      {/* Title Header */}
      <div className="flex flex-col mb-1 shrink-0">
        <h1 className="text-[28px] md:text-[34px] font-extrabold text-white tracking-tight leading-none">
          Songs
        </h1>
      </div>

      {/* Songs Table Section */}
      <div className="w-full flex-1 flex flex-col overflow-x-auto overflow-y-hidden custom-scrollbar border-t border-white/[0.06]">
        <div className="min-w-[760px] flex-1 flex flex-col text-[12px] overflow-hidden">

          {/* Table Header Row */}
          <div className="flex items-center text-zinc-400 font-semibold py-2.5 px-3 border-b border-white/[0.06] bg-transparent shrink-0">
            {/* Title */}
            <div
              onClick={() => handleSort('title')}
              className="w-[35%] flex items-center cursor-pointer hover:text-white transition-colors"
            >
              Title {renderSortIndicator('title')}
            </div>

            {/* Time */}
            <div
              onClick={() => handleSort('duration')}
              className="w-[10%] flex items-center cursor-pointer hover:text-white transition-colors"
            >
              Time {renderSortIndicator('duration')}
            </div>

            {/* Artist */}
            <div
              onClick={() => handleSort('artist')}
              className="w-[25%] flex items-center cursor-pointer hover:text-white transition-colors"
            >
              Artist {renderSortIndicator('artist')}
            </div>

            {/* Album */}
            <div
              onClick={() => handleSort('albumTitle')}
              className="w-[23%] flex items-center cursor-pointer hover:text-white transition-colors"
            >
              Album {renderSortIndicator('albumTitle')}
            </div>

            {/* Favorite (Star) */}
            <div className="w-[4%] flex justify-center text-center">
              ★
            </div>

            {/* Plays */}
            <div className="w-[3%] flex items-center justify-end text-right">
              Plays
            </div>
          </div>

          {/* Table Data Rows */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col divide-y divide-white/[0.03] pb-28">
            {sortedSongs.map((song) => {
              const isCurrentPlaying = playingSong?.id === song.id

              return (
                <div
                  key={song.id}
                  onClick={() => handlePlaySong(song)}
                  className="flex items-center text-zinc-300 py-2.5 px-3 hover:bg-white/[0.04] group cursor-pointer transition-colors duration-150"
                >
                  {/* Song Title */}
                  <div className="w-[35%] pr-4 flex items-center justify-between min-w-0">
                    <span className={`text-[13px] font-medium truncate ${isCurrentPlaying ? 'text-[#fa586a]' : 'text-white'}`}>
                      {song.title}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation() }}
                      className="opacity-0 group-hover:opacity-100 text-[#fa586a] hover:opacity-80 p-0.5 transition-all shrink-0 ml-2 cursor-pointer"
                    >
                      <MoreHorizontal size={14} className="stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Time / Duration */}
                  <div className="w-[10%] text-[13px] text-zinc-400 font-light truncate">
                    {song.duration}
                  </div>

                  {/* Artist */}
                  <div className="w-[25%] pr-4 text-[13px] text-zinc-400 font-light truncate">
                    {song.artist}
                  </div>

                  {/* Album */}
                  <div className="w-[23%] pr-4 text-[13px] text-zinc-400 font-light truncate">
                    {song.albumTitle}
                  </div>

                  {/* Favorite Star */}
                  <div className="w-[4%] flex justify-center text-center">
                    <button
                      onClick={(e) => handleToggleFavorite(song.id, e)}
                      className={`text-[13px] hover:scale-110 transition-transform ${song.isFavorite ? 'text-[#fa586a]' : 'text-zinc-600/40 hover:text-[#fa586a]/40'} cursor-pointer`}
                    >
                      ★
                    </button>
                  </div>

                  {/* Plays Count */}
                  <div className="w-[3%] text-[13px] text-zinc-400 font-light text-right pr-1">
                    {(song.plays ?? 0) > 0 ? song.plays : ''}
                  </div>

                </div>
              )
            })}
          </div>

        </div>
      </div>

    </div>
  )
}
export default Songs
