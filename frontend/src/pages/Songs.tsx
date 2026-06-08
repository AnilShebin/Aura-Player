import React, { useState, useMemo, useRef, useCallback } from 'react'
import { ArrowUp, ArrowDown, Music, MoreHorizontal } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { ToggleFavorite } from '@/services/libraryService'
import { useVirtualizer } from '@tanstack/react-virtual'
import { SongRow } from '@/components/songs/SongRow'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

type SortField = 'title' | 'duration' | 'artist' | 'albumTitle' | 'genre' | 'plays' | 'none'
type SortOrder = 'asc' | 'desc'

export const Songs: React.FC = () => {
  // Broad subscriptions replaced with targeted selectors to avoid ticks/progress updates re-rendering
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const playingSongId = useMusicStore(state => state.playingSong?.id)
  const librarySongs = useMusicStore(state => state.librarySongs)
  const storeToggleFavorite = useMusicStore(state => state.toggleFavorite)

  const [sortField, setSortField] = useState<SortField>('artist') // Default sort is Artist
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')   // Default is Ascending

  const handleSort = useCallback((field: SortField) => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc')
        return prevField
      } else {
        setSortOrder('asc')
        return field
      }
    })
  }, [])

  const handleToggleFavorite = useCallback(async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await ToggleFavorite(songId)
      storeToggleFavorite(songId)
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }, [storeToggleFavorite])

  // Sorted list memoized to prevent sorting on every scroll or unrelated render
  const sortedSongs = useMemo(() => {
    const list = [...librarySongs]
    if (sortField === 'none') return list

    return list.sort((a, b) => {
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

  const handlePlaySong = useCallback((song: any) => {
    playSongDirect(song, sortedSongs)
  }, [playSongDirect, sortedSongs])

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ArrowUp size={11} className="inline ml-1 text-primary shrink-0" />
    ) : (
      <ArrowDown size={11} className="inline ml-1 text-primary shrink-0" />
    )
  }

  // Virtualizer parent ref and setup
  const parentRef = useRef<HTMLDivElement>(null)
  useSmoothScroll(parentRef)

  const rowVirtualizer = useVirtualizer({
    count: sortedSongs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // height of row in pixels
    overscan: 30,           // load extra items off-screen for seamless scrolling
  })

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
              className="w-[42%] flex items-center cursor-pointer hover:text-white transition-colors duration-150"
            >
              Title {renderSortIndicator('title')}
            </div>

            {/* Artist */}
            <div
              onClick={() => handleSort('artist')}
              className="w-[26%] flex items-center cursor-pointer hover:text-white transition-colors duration-150"
            >
              Artist {renderSortIndicator('artist')}
            </div>

            {/* Album */}
            <div
              onClick={() => handleSort('albumTitle')}
              className="w-[22%] flex items-center cursor-pointer hover:text-white transition-colors duration-150"
            >
              Album {renderSortIndicator('albumTitle')}
            </div>

            {/* Favorite (Star) */}
            <div className="w-[5%] shrink-0 flex items-center justify-start pl-1">
              ★
            </div>

            {/* Options */}
            <div className="w-[5%] shrink-0 flex items-center justify-start text-zinc-600/50 pl-1">
              <MoreHorizontal size={14} />
            </div>
          </div>

          {/* Table Data Rows (Virtualized) */}
          <div
            ref={parentRef}
            className="flex-1 overflow-y-auto custom-scrollbar relative pb-28"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const song = sortedSongs[virtualItem.index]
                const isCurrentPlaying = playingSongId === song.id

                return (
                  <div
                    key={song.id}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translate3d(0, ${virtualItem.start}px, 0)`,
                    }}
                  >
                    <SongRow
                      song={song}
                      isCurrentPlaying={isCurrentPlaying}
                      onPlay={handlePlaySong}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Songs
