import React, { useMemo, useState, useCallback } from 'react'
import { Play, Shuffle, Pencil, Music, Clock, MoreHorizontal } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { PlaylistCover } from '@/components/playlist/PlaylistCover'
import { EditPlaylistModal } from '@/components/playlist/EditPlaylistModal'
import { SongContextMenu } from '@/components/songs/SongContextMenu'

export const PlaylistDetail: React.FC = () => {
  const selectedPlaylist = useMusicStore(state => state.selectedPlaylist)
  const setSelectedPlaylist = useMusicStore(state => state.setSelectedPlaylist)
  const librarySongs = useMusicStore(state => state.librarySongs)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const playingSong = useMusicStore(state => state.playingSong)
  const updatePlaylist = useMusicStore(state => state.updatePlaylist)
  const deletePlaylist = useMusicStore(state => state.deletePlaylist)
  const triggerToast = useMusicStore(state => state.triggerToast)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null)
  const [activeSong, setActiveSong] = useState<any>(null)

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>, song: any) => {
    e.stopPropagation()
    if (menuCoords && activeSong?.id === song.id) {
      setMenuCoords(null)
      setActiveSong(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const menuWidth = 240
      const menuHeight = 380
      let top = rect.bottom + window.scrollY + 4
      if (rect.bottom + menuHeight > window.innerHeight) {
        top = rect.top + window.scrollY - menuHeight - 4
      }
      setMenuCoords({
        top,
        left: rect.right - menuWidth + window.scrollX,
      })
      setActiveSong(song)
    }
  }

  // System vs custom playlist checks
  const isFavs = selectedPlaylist?.id === 'favs'

  // Resolve songs list (Favorites are resolved dynamically)
  const playlistSongs = useMemo(() => {
    if (!selectedPlaylist) return []
    if (isFavs) {
      return librarySongs.filter(s => s.isFavorite)
    }
    return selectedPlaylist.songs || []
  }, [selectedPlaylist, librarySongs, isFavs])

  // Total duration math
  const totalDurationStr = useMemo(() => {
    const totalSecs = playlistSongs.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
    const hours = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    if (hours > 0) {
      return `${hours} hr ${mins} min`
    }
    return `${mins} minutes`
  }, [playlistSongs])

  const handlePlayAll = useCallback(() => {
    if (playlistSongs.length === 0) return
    playSongDirect(playlistSongs[0], playlistSongs)
  }, [playlistSongs, playSongDirect])

  const handleShufflePlay = useCallback(() => {
    if (playlistSongs.length === 0) return
    const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5)
    playSongDirect(shuffled[0], shuffled)
  }, [playlistSongs, playSongDirect])

  const handleDelete = useCallback(() => {
    if (!selectedPlaylist) return
    if (window.confirm(`Are you sure you want to delete the playlist "${selectedPlaylist.name}"?`)) {
      deletePlaylist(selectedPlaylist.id)
      setSelectedPlaylist(null)
    }
  }, [selectedPlaylist, deletePlaylist, setSelectedPlaylist])

  const handleSave = useCallback((name: string, description: string, coverUrl: string) => {
    if (!selectedPlaylist) return
    updatePlaylist(selectedPlaylist.id, name, description, coverUrl)
  }, [selectedPlaylist, updatePlaylist])

  if (!selectedPlaylist) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[13px]">
        No Playlist Selected
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-28 select-none overflow-y-auto pr-2 custom-scrollbar">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-end mb-8">
        
        {/* Playlist Cover */}
        <div className="relative w-[200px] h-[200px] md:w-[270px] md:h-[270px] rounded-lg overflow-hidden bg-zinc-950 shrink-0 shadow-2xl border border-white/5">
          <PlaylistCover
            name={selectedPlaylist.name}
            coverUrl={selectedPlaylist.coverUrl}
            className="w-full h-full"
            textClassName="text-[18px] font-extrabold text-black/80"
          />
        </div>

        {/* Info Area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[32px] md:text-[40px] font-extrabold text-white tracking-tight leading-none truncate">
              {selectedPlaylist.name}
            </h1>
            <p className="text-[13px] text-zinc-400 font-light max-w-xl leading-relaxed">
              {selectedPlaylist.description || `Collection of your favorite audio tracks.`}
            </p>
            <div className="text-[12px] text-zinc-500 font-light mt-1">
              {playlistSongs.length} items • {totalDurationStr}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            
            {/* Play/Shuffle Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayAll}
                disabled={playlistSongs.length === 0}
                className="h-9 px-6 rounded-lg bg-[#fa586a] hover:bg-[#fa586a]/90 disabled:opacity-40 disabled:hover:bg-[#fa586a] text-white text-[13px] font-semibold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md"
              >
                <Play size={14} fill="currentColor" /> Play
              </button>
              <button
                onClick={handleShufflePlay}
                disabled={playlistSongs.length === 0}
                className="h-9 px-6 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-white/10 text-white text-[13px] font-semibold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-white/5"
              >
                <Shuffle size={14} /> Shuffle
              </button>
            </div>

             {/* Apple Music styled action icons row (Matches screenshot exactly) */}
             <div className="flex items-center gap-4 pr-1">
               <button
                 onClick={() => setIsEditOpen(true)}
                 className="text-[#fa586a] hover:opacity-80 transition-all cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5"
                 title="Edit Playlist"
               >
                 <Pencil size={17} />
               </button>

               {/* More Options Dropdown Trigger */}
               <div className="relative">
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     setIsPlaylistMenuOpen(!isPlaylistMenuOpen)
                   }}
                   className="text-[#fa586a] hover:opacity-80 transition-all cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5"
                   title="More Actions"
                 >
                   <MoreHorizontal size={18} />
                 </button>
                 
                 {isPlaylistMenuOpen && (
                   <>
                     <div className="fixed inset-0 z-[999]" onClick={() => setIsPlaylistMenuOpen(false)} />
                     <div className="absolute right-0 mt-2 w-48 bg-[#1c1c1e]/98 border border-white/[0.08] rounded-xl shadow-2xl py-1 text-left text-zinc-200 backdrop-blur-xl z-[1000] text-[13px] font-normal select-none">
                       <button
                         onClick={() => {
                           const { playQueue } = useMusicStore.getState()
                           useMusicStore.setState({ playQueue: [...playQueue, ...playlistSongs] })
                           triggerToast?.(`Added ${playlistSongs.length} songs to queue`, 'success')
                           setIsPlaylistMenuOpen(false)
                         }}
                         className="w-full text-left px-3.5 py-2 hover:bg-white/10 transition-colors"
                       >
                         Play Last
                       </button>
                       <button
                         onClick={() => {
                           const { playQueue, currentQueueIndex } = useMusicStore.getState()
                           const newQueue = [...playQueue]
                           newQueue.splice(currentQueueIndex + 1, 0, ...playlistSongs)
                           useMusicStore.setState({ playQueue: newQueue })
                           triggerToast?.(`Playing ${playlistSongs.length} songs next`, 'success')
                           setIsPlaylistMenuOpen(false)
                         }}
                         className="w-full text-left px-3.5 py-2 hover:bg-white/10 transition-colors"
                       >
                         Play Next
                       </button>
                       {!isFavs && (
                         <>
                           <div className="h-[1px] bg-white/[0.08] my-1" />
                           <button
                             onClick={() => {
                               handleDelete();
                               setIsPlaylistMenuOpen(false);
                             }}
                             className="w-full text-left px-3.5 py-2 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                           >
                             Delete Playlist
                           </button>
                         </>
                       )}
                     </div>
                   </>
                 )}
               </div>
             </div>

          </div>

        </div>

      </div>

      {/* Song List Area */}
      <div className="flex flex-col gap-2.5">
        
        {/* Table Header */}
        <div className="flex items-center px-4 py-2 border-b border-white/[0.04] text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          <span className="w-10 text-center shrink-0">#</span>
          <span className="flex-1 min-w-0">Song</span>
          <span className="w-48 hidden md:block truncate">Artist</span>
          <span className="w-48 hidden lg:block truncate">Album</span>
          <span className="w-20 text-right shrink-0 pr-4 flex items-center justify-end gap-1.5"><Clock size={11} /></span>
        </div>

        {/* Table Rows */}
        {playlistSongs.length > 0 ? (
          <div className="flex flex-col">
            {playlistSongs.map((song, idx) => {
              const isCurrent = playingSong && (playingSong.id === song.id || playingSong.filePath === song.filePath)
              return (
                <div
                  key={song.id || idx}
                  onDoubleClick={() => playSongDirect(song, playlistSongs)}
                  className="flex items-center px-4 py-2 hover:bg-white/[0.03] active:bg-white/[0.01] rounded-lg group transition-colors duration-150 cursor-pointer text-[12px]"
                >
                  {/* index */}
                  <span className="w-10 text-center shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    {idx + 1}
                  </span>

                  {/* Song Title and Thumbnail info */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-zinc-800 shrink-0 overflow-hidden relative border border-white/5">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Music className="w-4 h-4 text-zinc-600 m-2" />
                      )}
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          playSongDirect(song, playlistSongs)
                        }}
                        className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex transition-opacity"
                      >
                        <Play size={10} fill="currentColor" className="text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`font-normal truncate leading-tight ${isCurrent ? 'text-[#fa586a] font-medium' : 'text-zinc-100'}`}>
                        {song.title}
                      </span>
                      <span className="text-zinc-400 font-light truncate mt-0.5 md:hidden">
                        {song.artist}
                      </span>
                    </div>
                  </div>

                  {/* Artist */}
                  <span className="w-48 hidden md:block truncate text-zinc-300 font-light">
                    {song.artist}
                  </span>

                  {/* Album */}
                  <span className="w-48 hidden lg:block truncate text-zinc-400 font-light">
                    {song.albumTitle}
                  </span>

                  {/* Time Duration & Options actions */}
                  <div className="w-20 shrink-0 text-right pr-4 text-zinc-400 font-light flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                    <span className="group-hover:hidden">{song.duration}</span>
                    
                    <button
                      onClick={(e) => handleMenuClick(e, song)}
                      className="hidden group-hover:flex w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Song Options"
                    >
                      <MoreHorizontal size={13} />
                    </button>

                    {menuCoords && activeSong?.id === song.id && (
                      <SongContextMenu
                        song={song}
                        coords={menuCoords}
                        onClose={() => { setMenuCoords(null); setActiveSong(null); }}
                        playlistId={selectedPlaylist.id}
                      />
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800/20 border border-white/5 flex items-center justify-center mb-4 text-zinc-600 shadow-md">
              <Music size={18} />
            </div>
            <h3 className="text-zinc-200 text-[13px] font-medium">Empty Playlist</h3>
            <p className="text-zinc-500 text-[11px] font-light max-w-[200px] mt-1">
              {isFavs ? 'Mark tracks as favorite to see them here.' : 'Add tracks to this playlist to get started.'}
            </p>
          </div>
        )}

      </div>

      {/* Edit Playlist Dialog Modal */}
      <EditPlaylistModal
        playlist={selectedPlaylist}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSave}
      />

    </div>
  )
}

export default PlaylistDetail
