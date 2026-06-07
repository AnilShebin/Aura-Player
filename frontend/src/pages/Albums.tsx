import React, { useMemo, useCallback, useEffect, useRef } from 'react'
import { Disc } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { AlbumCard } from '@/components/albums/AlbumCard'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

const useGridColumns = () => {
  const [columns, setColumns] = React.useState(5)
  React.useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth
      if (w >= 1024) setColumns(5)
      else if (w >= 768) setColumns(4)
      else if (w >= 640) setColumns(3)
      else setColumns(2)
    }
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])
  return columns
}

// Persistent scroll position cache for back-button transitions
let savedScrollTop = 0

export const Albums: React.FC = () => {
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const setSelectedAlbum = useMusicStore(state => state.setSelectedAlbum)
  const librarySongs = useMusicStore(state => state.librarySongs)
  const libraryAlbums = useMusicStore(state => state.libraryAlbums)
  const playingSong = useMusicStore(state => state.playingSong)
  const isPlaying = useMusicStore(state => state.isPlaying)
  const handlePlayPause = useMusicStore(state => state.handlePlayPause)

  const parentRef = useRef<HTMLDivElement>(null)
  const columns = useGridColumns()

  // Apply smooth scrolling momentum to the Albums grid container
  useSmoothScroll(parentRef, true)

  // Restore scroll position after DOM rendering and virtualization layout is ready
  useEffect(() => {
    if (savedScrollTop > 0 && parentRef.current) {
      const timer = setTimeout(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = savedScrollTop
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [])

  // Debug logging to compare total songs vs total albums and verify grouping correctness
  useEffect(() => {
    if (libraryAlbums.length > 0) {
      console.log(`[AlbumsPage] Debug Grouping: Total Songs = ${librarySongs.length}, Unique Grouped Albums = ${libraryAlbums.length}`)
    }
  }, [librarySongs, libraryAlbums])

  // Track scroll position to persist state when navigating to album details
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    savedScrollTop = e.currentTarget.scrollTop
  }, [])

  const handleCardClick = useCallback((albumId: string) => {
    const album = libraryAlbums.find(a => a.id === albumId)
    if (!album) return

    setSelectedAlbum({
      id: album.id,
      title: album.title,
      artist: album.albumArtist,
      coverUrl: album.coverUrl || '',
      year: album.year || '2026',
      genre: album.genre || 'Local Audio',
      songs: album.songs || [],
      codec: album.codec || 'Unknown',
      quality: album.quality || 'High Quality'
    })
  }, [libraryAlbums, setSelectedAlbum])

  const handlePlayAlbum = useCallback((albumId: string) => {
    const album = libraryAlbums.find(a => a.id === albumId)
    if (album && album.songs && album.songs.length > 0) {
      playSongDirect(album.songs[0], album.songs)
    }
  }, [libraryAlbums, playSongDirect])

  const handlePlayPauseAlbum = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    handlePlayPause()
  }, [handlePlayPause])

  // Virtualizer row count computation
  const rowCount = useMemo(() => {
    return Math.ceil(libraryAlbums.length / columns)
  }, [libraryAlbums, columns])

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 290, // Increased row height to prevent vertical crowding
    overscan: 10, // Preload hidden cards above and below viewport
  })

  if (librarySongs.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center select-none py-10">
        <div className="w-20 h-20 rounded-full bg-zinc-800/30 border border-white/5 flex items-center justify-center mb-6 shadow-xl">
          <Disc size={32} className="text-zinc-600" />
        </div>
        <h2 className="text-[22px] font-bold text-white tracking-tight mb-2">No Scanned Albums</h2>
        <p className="text-zinc-400 text-[13px] max-w-[280px] leading-relaxed mb-6">
          Add folder paths in Settings Files page to scan your local audio collection.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 pt-6 pb-0 select-none overflow-hidden">
      
      {/* Title Header */}
      <div className="flex flex-col mb-1 shrink-0">
        <h1 className="text-[28px] md:text-[34px] font-extrabold text-white tracking-tight leading-none">
          Albums
        </h1>
      </div>

      {/* Grid Container (Scrollable) */}
      <div 
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar relative pr-1 pb-28"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columns
            const rowAlbums = libraryAlbums.slice(startIndex, startIndex + columns)

            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-7 py-4"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translate3d(0, ${virtualRow.start}px, 0)`,
                }}
              >
                {rowAlbums.map((album) => {
                  // Check if any song from this album is the currently playing song
                  const isCurrentAlbum = !!playingSong && album.songs.some(s => s.id === playingSong.id)
                  return (
                    <AlbumCard
                      key={album.id}
                      id={album.id}
                      title={album.title}
                      artist={album.albumArtist}
                      coverUrl={album.coverUrl || ''}
                      isCurrentAlbum={isCurrentAlbum}
                      isPlaying={isPlaying}
                      onClick={handleCardClick}
                      onPlay={handlePlayAlbum}
                      onPlayPause={handlePlayPauseAlbum}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export default Albums
