import React from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { Song } from '@/types/music'

interface SongContextMenuProps {
  song: Song
  coords: { top: number; left: number }
  onClose: () => void
  playlistId?: string
  isPlayerBar?: boolean
}

export const SongContextMenu: React.FC<SongContextMenuProps> = ({
  song,
  coords,
  onClose,
  playlistId,
  isPlayerBar
}) => {
  const playlists = useMusicStore(state => state.playlists)
  const addSongToPlaylist = useMusicStore(state => state.addSongToPlaylist)
  const removeSongFromPlaylist = useMusicStore(state => state.removeSongFromPlaylist)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const storeToggleFavorite = useMusicStore(state => state.toggleFavorite)
  const triggerToast = useMusicStore(state => state.triggerToast)

  const handlePlayNext = () => {
    const { playQueue, currentQueueIndex } = useMusicStore.getState()
    const newQueue = [...playQueue]
    const targetIdx = currentQueueIndex + 1
    newQueue.splice(targetIdx, 0, song)
    useMusicStore.setState({ playQueue: newQueue })
    triggerToast?.(`"${song.title}" will play next`, 'success')
    onClose()
  }

  const handlePlayLast = () => {
    const { playQueue } = useMusicStore.getState()
    useMusicStore.setState({ playQueue: [...playQueue, song] })
    triggerToast?.(`"${song.title}" added to queue`, 'success')
    onClose()
  }

  const handleToggleFav = () => {
    storeToggleFavorite(song.id)
    triggerToast?.(song.isFavorite ? 'Removed from Favourites' : 'Added to Favourites', 'success')
    onClose()
  }

  const handleNewPlaylist = () => {
    const setCreatePlaylistOpen = useMusicStore.getState().setCreatePlaylistOpen
    setCreatePlaylistOpen(true, (newPlaylistId) => {
      addSongToPlaylist(newPlaylistId, song)
      triggerToast?.(`Added "${song.title}" to new playlist`, 'success')
    })
    onClose()
  }

  const handleProperties = () => {
    const setPropertiesOpen = useMusicStore.getState().setPropertiesOpen
    setPropertiesOpen(true, song)
    onClose()
  }

  const handleGoToCurrentSong = () => {
    const { libraryAlbums, setSelectedAlbum, setCurrentTab } = useMusicStore.getState()
    const album = libraryAlbums.find(a => a.id === song.albumId)
    if (album) {
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
    } else {
      setCurrentTab('songs')
    }
    onClose()
  }

  return createPortal(
    <>
      {/* Dimmed click away overlay */}
      <div className="fixed inset-0 z-[9999]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      
      {/* Context Menu Panel */}
      <div
        ref={React.useRef<HTMLDivElement>(null)}
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
        }}
        className="z-[10000] w-60 bg-[#1c1c1e]/98 border border-white/[0.08] rounded-xl shadow-2xl py-1.5 text-left text-zinc-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none text-[13px] font-normal"
      >
        {isPlayerBar ? (
          <>
            {/* Add to Playlist Submenu Trigger */}
            <div className="w-full relative group">
              <div className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer">
                <span>Add to Playlist</span>
                <ChevronRight size={14} className="text-zinc-500" />
              </div>

              {/* Submenu */}
              <div className="absolute right-full top-0 mr-1 hidden group-hover:block w-52 bg-[#1c1c1e]/98 border border-white/[0.08] rounded-xl shadow-2xl py-1 text-white backdrop-blur-xl">
                <button
                  onClick={handleNewPlaylist}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-white/10 transition-colors border-b border-white/5 font-semibold text-[#fa586a]"
                >
                  New Playlist
                </button>
                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                  {playlists.filter(p => p.id !== 'favs').map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        addSongToPlaylist(p.id, song)
                        triggerToast?.(`Added to ${p.name}`, 'success')
                        onClose()
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-white/10 transition-colors truncate block"
                    >
                      {p.name}
                    </button>
                  ))}
                  {playlists.filter(p => p.id !== 'favs').length === 0 && (
                    <div className="px-3.5 py-2 text-[11px] text-zinc-500 font-light italic">
                      No custom playlists
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-white/[0.08] my-1" />

            <button onClick={handleToggleFav} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors">
              {song.isFavorite ? 'Unfavourite' : 'Favourite'}
            </button>
            <button onClick={handleProperties} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors">
              Properties
            </button>
            <button onClick={handleGoToCurrentSong} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors">
              Go to Current Song
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { playSongDirect(song, [song]); onClose(); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors truncate">
              Play "{song.title}"
            </button>
            <button onClick={handlePlayNext} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors">
              Play Next
            </button>
            <button onClick={handlePlayLast} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors">
              Play Last
            </button>

            {/* Add to Playlist Submenu Trigger */}
            <div className="w-full relative group">
              <div className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer">
                <span>Add to Playlist</span>
                <ChevronRight size={14} className="text-zinc-500" />
              </div>

              {/* Submenu */}
              <div className="absolute right-full top-0 mr-1 hidden group-hover:block w-52 bg-[#1c1c1e]/98 border border-white/[0.08] rounded-xl shadow-2xl py-1 text-white backdrop-blur-xl">
                <button
                  onClick={handleNewPlaylist}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-white/10 transition-colors border-b border-white/5 font-semibold text-[#fa586a]"
                >
                  New Playlist
                </button>
                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                  {playlists.filter(p => p.id !== 'favs').map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        addSongToPlaylist(p.id, song)
                        triggerToast?.(`Added to ${p.name}`, 'success')
                        onClose()
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-white/10 transition-colors truncate block"
                    >
                      {p.name}
                    </button>
                  ))}
                  {playlists.filter(p => p.id !== 'favs').length === 0 && (
                    <div className="px-3.5 py-2 text-[11px] text-zinc-500 font-light italic">
                      No custom playlists
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-white/[0.08] my-1" />

            <button onClick={handleToggleFav} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors">
              {song.isFavorite ? 'Unfavourite' : 'Favourite'}
            </button>
            <button onClick={handleProperties} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors">
              Properties
            </button>

            {/* Divider */}
            <div className="h-[1px] bg-white/[0.08] my-1" />

            <button onClick={() => { navigator.clipboard.writeText(song.title); triggerToast?.('Copied title!', 'success'); onClose(); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors flex items-center justify-between">
              <span>Copy</span>
              <span className="text-[10px] text-zinc-500 font-mono">Ctrl+C</span>
            </button>

            {playlistId && (
              <button
                onClick={() => {
                  removeSongFromPlaylist(playlistId, song.id)
                  triggerToast?.('Removed from playlist', 'success')
                  onClose()
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-between"
              >
                <span>Remove from Playlist</span>
                <span className="text-[10px] opacity-60 font-mono">Delete</span>
              </button>
            )}
          </>
        )}
      </div>
    </>
  , document.body)
}
