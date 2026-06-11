import React, { useState, useCallback } from 'react'
import { Play, MoreHorizontal } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { PlaylistCover } from '@/components/playlist/PlaylistCover'
import { CollectionContextMenu } from '@/components/shared/CollectionContextMenu'

export const Playlists: React.FC = () => {
  const playlists = useMusicStore(state => state.playlists)
  const setSelectedPlaylist = useMusicStore(state => state.setSelectedPlaylist)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const librarySongs = useMusicStore(state => state.librarySongs)

  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null)
  const [activePlaylist, setActivePlaylist] = useState<any>(null)

  const getPlaylistSongs = useCallback((playlist: any) => {
    if (playlist.id === 'favs') {
      return librarySongs.filter(s => s.isFavorite)
    }
    return playlist.songs || []
  }, [librarySongs])

  const handlePlayPlaylistClick = useCallback((e: React.MouseEvent, playlist: any) => {
    e.stopPropagation()
    const songs = getPlaylistSongs(playlist)
    if (songs.length === 0) return
    playSongDirect(songs[0], songs)
  }, [getPlaylistSongs, playSongDirect])

  const handleOptionsClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, playlist: any) => {
    e.stopPropagation()
    if (menuCoords && activePlaylist?.id === playlist.id) {
      setMenuCoords(null)
      setActivePlaylist(null)
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
      setActivePlaylist(playlist)
    }
  }, [menuCoords, activePlaylist])

  return (
    <div className="w-full h-full flex flex-col gap-6 pt-6 pb-28 select-none overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col shrink-0">
        <h1 className="text-[28px] md:text-[34px] font-extrabold text-white tracking-tight leading-none">
          My Playlists
        </h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-7 gap-y-7">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            onClick={() => setSelectedPlaylist(playlist)}
            className="flex flex-col gap-3 cursor-pointer group active:scale-[0.98]"
          >
            {/* Playlist Cover wrapper */}
            <div className="relative aspect-square w-full rounded-[6px] overflow-hidden bg-zinc-900 shrink-0 border border-white/[0.06] shadow-md transition-shadow duration-300 group-hover:shadow-xl">
              <PlaylistCover
                name={playlist.name}
                coverUrl={playlist.coverUrl}
                className="w-full h-full"
              />

              {/* Hover Play and Menu Overlays */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-3 select-none">
                <button
                  onClick={(e) => handlePlayPlaylistClick(e, playlist)}
                  className="w-9 h-9 rounded-full bg-black/75 hover:bg-black/90 flex items-center justify-center text-white transition-colors duration-150 cursor-pointer shadow-md z-10"
                >
                  <Play size={13} fill="white" className="ml-0.5 text-white" />
                </button>

                <button
                  onClick={(e) => handleOptionsClick(e, playlist)}
                  className="w-9 h-9 rounded-full bg-black/75 hover:bg-black/90 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer shadow-md z-10"
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>
            </div>
            
            {/* Playlist Name info under cover */}
            <div className="flex flex-col mt-2.5 min-w-0 px-0.5">
              <span className="text-[12px] font-bold text-zinc-100 truncate group-hover:text-white transition-colors leading-snug">
                {playlist.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {menuCoords && activePlaylist && (
        <CollectionContextMenu
          type="playlist"
          id={activePlaylist.id}
          name={activePlaylist.name}
          songs={getPlaylistSongs(activePlaylist)}
          coords={menuCoords}
          onClose={() => {
            setMenuCoords(null)
            setActivePlaylist(null)
          }}
        />
      )}
    </div>
  )
}

export default Playlists
