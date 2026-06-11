import React, { useCallback, useMemo } from 'react'
import { Play, Shuffle, ArrowDown, MoreHorizontal } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'

export const Favorites: React.FC = () => {
  const librarySongs = useMusicStore(state => state.librarySongs)
  const toggleFavorite = useMusicStore(state => state.toggleFavorite)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const playingSongId = useMusicStore(state => state.playingSong?.id)
  const isPlaying = useMusicStore(state => state.isPlaying)
  const setCurrentTab = useMusicStore(state => state.setCurrentTab)

  // Filter songs that are favorited, memoized
  const favoriteSongs = useMemo(() => librarySongs.filter(s => s.isFavorite), [librarySongs])

  const handlePlayAll = useCallback(() => {
    if (favoriteSongs.length > 0) {
      playSongDirect(favoriteSongs[0], favoriteSongs)
    }
  }, [favoriteSongs, playSongDirect])

  const handleShufflePlay = useCallback(() => {
    if (favoriteSongs.length > 0) {
      const shuffled = [...favoriteSongs].sort(() => Math.random() - 0.5)
      playSongDirect(shuffled[0], shuffled)
    }
  }, [favoriteSongs, playSongDirect])

  const handleToggleFavorite = useCallback((songId: string) => {
    toggleFavorite(songId)
  }, [toggleFavorite])

  const handleTabClick = useCallback(() => {
    setCurrentTab('listen-now')
  }, [setCurrentTab])

  if (favoriteSongs.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center select-none py-10">
        <div className="w-20 h-20 rounded-full bg-zinc-800/30 border border-white/5 flex items-center justify-center mb-6 shadow-xl">
          <span className="text-[32px] text-zinc-600">★</span>
        </div>
        <h2 className="text-[22px] font-bold text-white tracking-tight mb-2">No Favourite Songs</h2>
        <p className="text-zinc-400 text-[13px] max-w-[280px] leading-relaxed mb-6">
          Songs you mark as favourite will appear here. Start building your personal music library.
        </p>
        <button
          onClick={handleTabClick}
          className="px-5 py-2.5 bg-[#fa586a] text-white text-[13px] font-medium rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer"
        >
          Explore Music
        </button>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-8 py-4 pb-28 select-none">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 border-b border-white/5 pb-8">
        
        {/* Large White Rounded Cover with Red Star */}
        <div className="relative w-[200px] h-[200px] md:w-[270px] md:h-[270px] rounded-lg bg-white flex items-center justify-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] shrink-0 border border-zinc-200">
          <svg viewBox="0 0 24 24" className="w-[120px] h-[120px] fill-[#fa586a]" style={{ filter: 'drop-shadow(0 4px 6px rgba(250, 88, 106, 0.15))' }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        {/* Details and Control Row */}
        <div className="flex flex-col text-center md:text-left gap-3 flex-1">
          <h1 className="text-[34px] md:text-[38px] font-extrabold text-white tracking-tight leading-tight">
            Favourite Songs
          </h1>
          <span className="text-[12px] text-zinc-400 font-normal">
            Updated 3d ago
          </span>

          {/* Action Buttons & Icons */}
          <div className="flex items-center justify-between mt-5 w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayAll}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#fa586a] hover:bg-[#fa586a]/90 text-white rounded-lg text-[13px] font-semibold transition-colors duration-150 cursor-pointer min-w-[90px]"
              >
                <Play size={14} fill="currentColor" className="text-white" />
                Play
              </button>
              <button
                onClick={handleShufflePlay}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#fa586a] hover:bg-[#fa586a]/90 text-white rounded-lg text-[13px] font-semibold transition-colors duration-150 cursor-pointer min-w-[100px]"
              >
                <Shuffle size={14} className="text-white" />
                Shuffle
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-[#fa586a] hover:opacity-85 p-1 transition-opacity duration-150 cursor-pointer">
                <ArrowDown size={20} className="stroke-[2.5]" />
              </button>
              <button className="text-[#fa586a] hover:opacity-85 p-1 transition-opacity duration-150 cursor-pointer">
                <MoreHorizontal size={20} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Tracklist */}
      <div className="flex flex-col w-full">
        {/* Table Header */}
        <div className="grid grid-cols-[20px_48px_2.5fr_2fr_2fr_60px_30px] gap-4 items-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-2.5 border-b border-white/[0.06] mb-1">
          <span></span> {/* Star space */}
          <span></span> {/* Cover space */}
          <span className="text-left font-semibold">Song</span>
          <span className="text-left font-semibold">Artist</span>
          <span className="text-left font-semibold">Album</span>
          <span className="text-right font-semibold">Time</span>
          <span></span> {/* Menu space */}
        </div>

        {/* Tracks List */}
        <div className="flex flex-col divide-y divide-white/[0.02]">
          {favoriteSongs.map((song) => {
            const isCurrentPlaying = playingSongId === song.id
            
            return (
              <div
                key={song.id}
                onClick={() => playSongDirect(song, favoriteSongs)}
                className="grid grid-cols-[20px_48px_2.5fr_2fr_2fr_60px_30px] gap-4 items-center px-3 py-2.5 rounded-lg hover:bg-white/[0.04] group cursor-pointer transition-colors duration-150 transform-gpu"
                style={{ contain: 'layout style paint' }}
              >
                {/* Red Star Column */}
                <div className="flex justify-center" onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFavorite(song.id)
                }}>
                  <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] fill-[#fa586a] hover:scale-125 transition-transform duration-150 cursor-pointer">
                    <title>Remove from Favourites</title>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>

                {/* Cover Artwork */}
                <div className="w-[40px] h-[40px] rounded-lg overflow-hidden border border-white/5 bg-zinc-900 shrink-0">
                  <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Song Title */}
                <div className="min-w-0 pr-2 flex items-center gap-2">
                  {isCurrentPlaying && (
                    <div className="flex gap-[2px] items-end shrink-0" style={{ height: '12px' }}>
                      <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '5px',  transformOrigin: 'bottom', animation: isPlaying ? 'musicbar 0.8s ease-in-out 0s infinite' : 'none' }} />
                      <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '10px', transformOrigin: 'bottom', animation: isPlaying ? 'musicbar 0.8s ease-in-out 0.15s infinite' : 'none' }} />
                      <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '7px',  transformOrigin: 'bottom', animation: isPlaying ? 'musicbar 0.8s ease-in-out 0.3s infinite' : 'none' }} />
                      <span className="w-[2.5px] bg-[#fa586a] rounded-full" style={{ height: '9px',  transformOrigin: 'bottom', animation: isPlaying ? 'musicbar 0.8s ease-in-out 0.45s infinite' : 'none' }} />
                    </div>
                  )}
                  <span className={`text-[13px] font-semibold truncate block transition-colors duration-150 ${isCurrentPlaying ? 'text-[#fa586a]' : 'text-zinc-100'}`}>
                    {song.title}
                  </span>
                </div>

                {/* Artist */}
                <div className="min-w-0 pr-2">
                  <span className="text-[12px] text-zinc-400 font-light truncate block">
                    {song.artist}
                  </span>
                </div>

                {/* Album */}
                <div className="min-w-0 pr-2">
                  <span className="text-[12px] text-zinc-400 font-light truncate block">
                    {song.albumTitle || '—'}
                  </span>
                </div>

                {/* Duration / Time */}
                <div className="text-[12px] text-zinc-400 font-light text-right pr-1">
                  {song.duration}
                </div>

                {/* Action Three-Dots */}
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <button className="text-[#fa586a] hover:opacity-85 p-1 transition-opacity duration-150 cursor-pointer">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
export default Favorites
