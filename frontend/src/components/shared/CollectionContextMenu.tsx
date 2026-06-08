import React from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { Song } from '@/types/music'

interface CollectionContextMenuProps {
  type: 'album' | 'playlist'
  id: string
  name: string
  songs: Song[]
  coords: { top: number; left: number }
  onClose: () => void
}

export const CollectionContextMenu: React.FC<CollectionContextMenuProps> = ({
  type,
  id,
  name,
  songs,
  coords,
  onClose,
}) => {
  const playlists = useMusicStore(state => state.playlists)
  const addSongToPlaylist = useMusicStore(state => state.addSongToPlaylist)
  const deletePlaylist = useMusicStore(state => state.deletePlaylist)
  const setSelectedPlaylist = useMusicStore(state => state.setSelectedPlaylist)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const triggerToast = useMusicStore(state => state.triggerToast)

  const handlePlay = () => {
    if (songs.length === 0) {
      triggerToast?.('No songs in this collection', 'error')
      onClose()
      return
    }
    playSongDirect(songs[0], songs)
    onClose()
  }

  const handlePlayNext = () => {
    if (songs.length === 0) {
      triggerToast?.('No songs in this collection', 'error')
      onClose()
      return
    }
    const { playQueue, currentQueueIndex } = useMusicStore.getState()
    const newQueue = [...playQueue]
    const targetIdx = currentQueueIndex + 1
    newQueue.splice(targetIdx, 0, ...songs)
    useMusicStore.setState({ playQueue: newQueue })
    triggerToast?.(`Songs from "${name}" will play next`, 'success')
    onClose()
  }

  const handlePlayLast = () => {
    if (songs.length === 0) {
      triggerToast?.('No songs in this collection', 'error')
      onClose()
      return
    }
    const { playQueue } = useMusicStore.getState()
    useMusicStore.setState({ playQueue: [...playQueue, ...songs] })
    triggerToast?.(`Songs from "${name}" added to queue`, 'success')
    onClose()
  }

  const handleAddToPlaylist = (targetPlaylistId: string, targetName: string) => {
    if (songs.length === 0) {
      triggerToast?.('No songs to add', 'error')
      onClose()
      return
    }
    songs.forEach(song => {
      addSongToPlaylist(targetPlaylistId, song)
    })
    triggerToast?.(`Added all songs to ${targetName}`, 'success')
    onClose()
  }

  const handleNewPlaylist = () => {
    if (songs.length === 0) {
      triggerToast?.('No songs to add', 'error')
      onClose()
      return
    }
    const setCreatePlaylistOpen = useMusicStore.getState().setCreatePlaylistOpen
    setCreatePlaylistOpen(true, (newPlaylistId) => {
      songs.forEach(song => {
        addSongToPlaylist(newPlaylistId, song)
      })
      triggerToast?.(`Added all songs to new playlist`, 'success')
    })
    onClose()
  }

  const handleDeletePlaylist = () => {
    if (window.confirm(`Are you sure you want to delete the playlist "${name}"?`)) {
      deletePlaylist(id)
      setSelectedPlaylist(null)
      triggerToast?.(`Deleted playlist "${name}"`, 'success')
    }
    onClose()
  }

  return createPortal(
    <>
      {/* Dimmed click away overlay */}
      <div className="fixed inset-0 z-[9999]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      
      {/* Context Menu Panel */}
      <div
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
        }}
        className="z-[10000] w-60 bg-[#1c1c1e]/98 border border-white/[0.08] rounded-xl shadow-2xl py-1.5 text-left text-zinc-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none text-[13px] font-normal"
      >
        <button onClick={handlePlay} className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors truncate">
          Play
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
              {playlists.filter(p => p.id !== 'favs' && p.id !== id).map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAddToPlaylist(p.id, p.name)}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-white/10 transition-colors truncate block"
                >
                  {p.name}
                </button>
              ))}
              {playlists.filter(p => p.id !== 'favs' && p.id !== id).length === 0 && (
                <div className="px-3.5 py-2 text-[11px] text-zinc-500 font-light italic">
                  No other playlists
                </div>
              )}
            </div>
          </div>
        </div>

        {type === 'playlist' && id !== 'favs' && (
          <>
            {/* Divider */}
            <div className="h-[1px] bg-white/[0.08] my-1" />
            <button
              onClick={handleDeletePlaylist}
              className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-between"
            >
              <span>Delete Playlist</span>
            </button>
          </>
        )}
      </div>
    </>,
    document.body
  )
}
