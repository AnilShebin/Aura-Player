import React, { useMemo } from 'react'
import { Play, MoreHorizontal, Disc } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'

export const Albums: React.FC = () => {
  const { playSongDirect, setSelectedAlbum, librarySongs } = useMusicStore()

  // Compute album list dynamically from librarySongs
  const albumsList = useMemo(() => {
    const albumMap = new Map<string, any>()
    
    librarySongs.forEach(song => {
      const albumId = song.albumId || 'unknown-album'
      if (!albumMap.has(albumId)) {
        albumMap.set(albumId, {
          id: albumId,
          title: song.albumTitle || 'Unknown Album',
          artist: song.artist || 'Unknown Artist',
          coverUrl: song.coverUrl || '',
          year: '2026',
          genre: 'Local Audio',
          songs: []
        })
      }
      albumMap.get(albumId)!.songs.push(song)
    })

    return Array.from(albumMap.values())
  }, [librarySongs])

  const handleCardClick = (album: any) => {
    setSelectedAlbum({
      id: album.id,
      title: album.title,
      artist: album.artist,
      coverUrl: album.coverUrl,
      year: album.year,
      genre: album.genre,
      songs: album.songs
    })
  }

  const handlePlayAlbum = (album: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (album.songs && album.songs.length > 0) {
      playSongDirect(album.songs[0], album.songs)
    }
  }

  if (albumsList.length === 0) {
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
    <div className="w-full flex flex-col gap-6 py-6 pb-28 select-none">
      
      {/* Title Header */}
      <div className="flex flex-col mb-4">
        <h1 className="text-[28px] md:text-[34px] font-extrabold text-white tracking-tight leading-none">
          Albums
        </h1>
      </div>

      {/* Grid of Albums — Enforced exactly 5 in a line */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-7">
        {albumsList.map((album) => {
          return (
            <div 
              key={album.id}
              onClick={() => handleCardClick(album)}
              className="flex flex-col group cursor-pointer"
            >
              {/* Cover Art Container */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06] shadow-md transition-all duration-300 group-hover:shadow-xl">
                {album.coverUrl ? (
                  <img 
                    src={album.coverUrl} 
                    alt={album.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <Disc size={40} className="text-zinc-700" />
                  </div>
                )}
                
                {/* Hover Play and Menu Overlays */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-3">
                  {/* Play circle icon on bottom-left */}
                  <button 
                    onClick={(e) => handlePlayAlbum(album, e)}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <Play size={14} fill="white" className="ml-0.5 text-white" />
                  </button>
                  
                  {/* Option three-dots icon on bottom-right */}
                  <button 
                    onClick={(e) => { e.stopPropagation() }}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              {/* Album Metadata */}
              <div className="flex flex-col mt-2.5 min-w-0">
                <span className="text-[12px] font-bold text-zinc-100 truncate leading-snug group-hover:text-white">
                  {album.title}
                </span>
                
                <span className="text-[10.5px] text-zinc-400 font-light truncate mt-0.5 leading-snug">
                  {album.artist}
                </span>
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}
export default Albums
