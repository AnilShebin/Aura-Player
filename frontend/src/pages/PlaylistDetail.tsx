import React, { useMemo, useState, useCallback } from 'react'
import { Play, Pause, Shuffle, Pencil, Music, Clock, MoreHorizontal } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { PlaylistCover } from '@/components/playlist/PlaylistCover'
import { EditPlaylistModal } from '@/components/playlist/EditPlaylistModal'
import { SongContextMenu } from '@/components/songs/SongContextMenu'
import { ToggleFavorite } from '@/services/libraryService'

export const PlaylistDetail: React.FC = () => {
  const selectedPlaylist = useMusicStore(state => state.selectedPlaylist)
  const setSelectedPlaylist = useMusicStore(state => state.setSelectedPlaylist)
  const librarySongs = useMusicStore(state => state.librarySongs)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const updatePlaylist = useMusicStore(state => state.updatePlaylist)
  const deletePlaylist = useMusicStore(state => state.deletePlaylist)
  const triggerToast = useMusicStore(state => state.triggerToast)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null)
  const [activeSong, setActiveSong] = useState<any>(null)

  const playingSongId = useMusicStore(state => state.playingSong?.id)
  const isPlaying = useMusicStore(state => state.isPlaying)
  const handlePlayPause = useMusicStore(state => state.handlePlayPause)
  const storeToggleFavorite = useMusicStore(state => state.toggleFavorite)

  const handleToggleFavorite = useCallback(async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await ToggleFavorite(songId)
      storeToggleFavorite(songId)
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }, [storeToggleFavorite])

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
      <div className="flex flex-col gap-1.5">
        
        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_40px_60px_40px] md:grid-cols-[40px_1.5fr_1fr_40px_60px_40px] gap-2 items-center px-3 py-2 border-b border-white/[0.04] text-[11px] font-medium text-zinc-500 uppercase tracking-wider select-none">
          <span className="text-center">#</span>
          <span>Song</span>
          <span className="hidden md:block">Album</span>
          <span className="text-center"></span>
          <span className="text-right pr-2 flex items-center justify-end gap-1.5"><Clock size={11} /></span>
          <span className="text-center"></span>
        </div>

        {/* Table Rows */}
        {playlistSongs.length > 0 ? (
          <div className="flex flex-col gap-[2px]">
            {playlistSongs.map((song, index) => {
              const isCurrentPlaying = playingSongId === song.id
              return (
                <div
                  key={song.id || index}
                  onClick={() => {
                    if (isCurrentPlaying) {
                      handlePlayPause()
                    } else {
                      playSongDirect(song, playlistSongs)
                    }
                  }}
                  className="grid grid-cols-[40px_1fr_40px_60px_40px] md:grid-cols-[40px_1.5fr_1fr_40px_60px_40px] gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-white/[0.04] group cursor-pointer transition-colors duration-150 transform-gpu"
                  style={{ contain: 'layout style paint' }}
                >
                  {/* Unified indicator: number / waveform / pause / hover-play-pause */}
                  <div className="relative flex justify-center items-center w-full" style={{ height: '20px' }}>
                    {/* DEFAULT state: fades out on hover */}
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-100 group-hover:opacity-0">
                      {isCurrentPlaying && isPlaying ? (
                        /* 4-bar animated waveform when playing */
                        <div className="flex gap-[2px] items-end" style={{ height: '14px' }}>
                          <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '6px',  transformOrigin: 'bottom', animation: 'musicbar 0.8s ease-in-out 0s infinite' }} />
                          <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '11px', transformOrigin: 'bottom', animation: 'musicbar 0.8s ease-in-out 0.15s infinite' }} />
                          <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '8px',  transformOrigin: 'bottom', animation: 'musicbar 0.8s ease-in-out 0.3s infinite' }} />
                          <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '10px', transformOrigin: 'bottom', animation: 'musicbar 0.8s ease-in-out 0.45s infinite' }} />
                        </div>
                      ) : isCurrentPlaying && !isPlaying ? (
                        /* 4 settled bars when paused */
                        <div className="flex gap-[2px] items-end" style={{ height: '14px' }}>
                          <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '4px' }} />
                          <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '4px' }} />
                          <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '4px' }} />
                          <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '4px' }} />
                        </div>
                      ) : (
                        <span className="text-[12px] text-zinc-500 font-semibold">{index + 1}</span>
                      )}
                    </div>

                    {/* HOVER state: fades in on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                      {isCurrentPlaying && isPlaying ? (
                        <Pause size={12} fill="currentColor" className="text-[#fa586a]" />
                      ) : isCurrentPlaying && !isPlaying ? (
                        <Play size={12} fill="currentColor" className="text-[#fa586a]" />
                      ) : (
                        <Play size={12} fill="currentColor" className="text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Track Title + Artist */}
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    {/* Mini Cover Thumbnail inside Playlist Detail */}
                    <div className="w-8 h-8 rounded bg-zinc-800 shrink-0 overflow-hidden relative border border-white/5">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Music className="w-4 h-4 text-zinc-600 m-2" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className={`text-[14px] ${isCurrentPlaying ? 'font-medium text-[#fa586a]' : 'font-normal text-zinc-100'} truncate leading-tight transition-colors duration-150`}>
                        {song.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span className="text-[12px] text-zinc-400 font-light truncate max-w-[80%] shrink-0">
                          {song.artist}
                        </span>
                        {(song.bitDepth || song.sampleRate || song.bitrate || song.codec) && (
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase tracking-wider overflow-hidden truncate">
                            <span className="text-zinc-700 text-[8px] select-none shrink-0">•</span>
                            <span className="truncate">
                              {[
                                song.bitDepth ? `${song.bitDepth}-BIT` : null,
                                song.sampleRate ? `${(song.sampleRate / 1000).toFixed(1).replace('.0', '')} KHZ` : null,
                                song.bitrate ? `${song.bitrate} KBPS` : null,
                                song.codec
                              ].filter(Boolean).join('  ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Album */}
                  <span className="hidden md:block truncate text-zinc-400 font-light text-[13px]">
                    {song.albumTitle || 'Unknown Album'}
                  </span>

                  {/* Favorite Star */}
                  <div className="flex justify-center items-center w-full" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleFavorite(song.id, e)}
                      className={`text-[13px] w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform duration-150 ${song.isFavorite ? 'text-[#fa586a]' : 'text-zinc-600/40 hover:text-[#fa586a]/40'} cursor-pointer`}
                    >
                      ★
                    </button>
                  </div>

                  {/* Duration */}
                  <div className="text-[12px] text-zinc-400 font-light text-right pr-2">
                    {song.duration}
                  </div>

                  {/* Options three-dots */}
                  <div className="flex justify-center items-center w-full" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleMenuClick(e, song)}
                      className="text-[#fa586a] hover:opacity-85 w-6 h-6 flex items-center justify-center transition-opacity duration-150 cursor-pointer"
                    >
                      <MoreHorizontal size={16} />
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
