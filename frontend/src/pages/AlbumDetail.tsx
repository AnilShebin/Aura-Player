import React from 'react'
import { Play, Shuffle, Plus, MoreHorizontal } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'

export const AlbumDetail: React.FC = () => {
  const { selectedAlbum, playSongDirect, playingSong, isPlaying } = useMusicStore()

  if (!selectedAlbum) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh] text-zinc-500 text-[13px]">
        No album selected
      </div>
    )
  }

  const handlePlayAll = () => {
    if (selectedAlbum.songs && selectedAlbum.songs.length > 0) {
      playSongDirect(selectedAlbum.songs[0], selectedAlbum.songs)
    }
  }

  const handleShufflePlay = () => {
    if (selectedAlbum.songs && selectedAlbum.songs.length > 0) {
      const shuffled = [...selectedAlbum.songs].sort(() => Math.random() - 0.5)
      playSongDirect(shuffled[0], shuffled)
    }
  }

  // Calculate total duration
  const totalSongs = selectedAlbum.songs?.length || 0
  const totalDurationMinutes = selectedAlbum.songs 
    ? Math.round(selectedAlbum.songs.reduce((acc, s) => {
        const parts = s.duration.split(':')
        const mins = parseInt(parts[0], 10) || 0
        const secs = parseInt(parts[1], 10) || 0
        return acc + (mins * 60) + secs
      }, 0) / 60)
    : 0

  return (
    <div className="w-full flex flex-col gap-8 py-4 pb-28 select-none">
      
      {/* Top Header Section (Pixel Perfect match to design reference) */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 border-b border-white/5 pb-8">
        
        {/* Album Cover with rounded corners and drop shadow */}
        <div className="relative w-[190px] h-[190px] md:w-[220px] md:h-[220px] rounded-2xl overflow-hidden bg-zinc-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] shrink-0 border border-white/5">
          <img 
            src={selectedAlbum.coverUrl} 
            alt={selectedAlbum.title} 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Album Details */}
        <div className="flex flex-col text-center md:text-left gap-2 flex-1">
          <h1 className="text-[26px] md:text-[30px] font-extrabold text-white tracking-tight leading-tight">
            {selectedAlbum.title}
          </h1>
          <h2 className="text-[#fa586a] text-[16px] md:text-[18px] font-semibold tracking-tight hover:underline cursor-pointer">
            {selectedAlbum.artist}
          </h2>
          
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] text-zinc-400 font-light mt-0.5">
            <span>{selectedAlbum.genre || 'Tamil'}</span>
            <span>•</span>
            <span>{selectedAlbum.year || '2009'}</span>
            <span>•</span>
            
            {/* Lossless badge and text */}
            <div className="flex items-center gap-1 font-normal text-zinc-300">
              <svg viewBox="0 0 24 24" width="12" height="12" className="fill-zinc-300 shrink-0">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span>Lossless</span>
            </div>
          </div>

          {/* Action Buttons & Icons */}
          <div className="flex items-center justify-between mt-6 w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayAll}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#fa586a] hover:bg-[#fa586a]/90 text-white rounded-lg text-[13px] font-semibold transition-colors cursor-pointer min-w-[90px]"
              >
                <Play size={14} fill="currentColor" className="text-white" />
                Play
              </button>
              <button
                onClick={handleShufflePlay}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#fa586a] hover:bg-[#fa586a]/90 text-white rounded-lg text-[13px] font-semibold transition-colors cursor-pointer min-w-[100px]"
              >
                <Shuffle size={14} className="text-white" />
                Shuffle
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-[#fa586a] hover:opacity-85 flex items-center gap-1 text-[13px] font-semibold transition-opacity cursor-pointer">
                <Plus size={16} className="stroke-[2.5]" />
                Add
              </button>
              <button className="text-[#fa586a] hover:opacity-85 p-1 transition-opacity cursor-pointer">
                <MoreHorizontal size={20} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="flex flex-col w-full">
        <div className="flex flex-col divide-y divide-white/[0.02]">
          {selectedAlbum.songs?.map((song, index) => {
            const isCurrentPlaying = playingSong?.id === song.id
            
            return (
              <div
                key={song.id}
                onClick={() => playSongDirect(song, selectedAlbum.songs)}
                className="grid grid-cols-[30px_30px_1fr_60px_40px] gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-white/[0.04] group cursor-pointer transition-colors duration-150"
              >
                {/* Playing bullet dot indicator on the far left */}
                <div className="flex justify-center items-center w-full">
                  {isCurrentPlaying && isPlaying ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fa586a]" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-zinc-700/40" />
                  )}
                </div>

                {/* Index / Hover Play State */}
                <div className="text-[12px] text-zinc-500 font-semibold pl-1">
                  <span className="group-hover:hidden">
                    {index + 1}
                  </span>
                  <Play size={11} fill="currentColor" className="hidden group-hover:block text-zinc-300" />
                </div>

                {/* Track Title + Artist */}
                <div className="flex flex-col min-w-0 pr-4">
                  <span className={`text-[13px] font-semibold truncate leading-tight ${isCurrentPlaying ? 'text-[#fa586a]' : 'text-zinc-100'}`}>
                    {song.title}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-light truncate mt-0.5">
                    {song.artist}
                  </span>
                </div>

                {/* Duration */}
                <div className="text-[12px] text-zinc-400 font-light text-right pr-2">
                  {song.duration}
                </div>

                {/* Options three-dots */}
                <div className="flex justify-end pr-1" onClick={(e) => e.stopPropagation()}>
                  <button className="text-[#fa586a] hover:opacity-85 p-1 transition-opacity cursor-pointer">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Metadata Section */}
      <div className="flex flex-col text-zinc-500 text-[11px] font-light mt-4 px-3 gap-1">
        <span>{selectedAlbum.year ? `14 October ${selectedAlbum.year}` : '14 October 2009'}</span>
        <span>{totalSongs} {totalSongs === 1 ? 'song' : 'songs'}, {totalDurationMinutes} minutes</span>
        <span>℗ {selectedAlbum.year || '2009'} Super Cassettes Industries Private Limited</span>
        
        <div className="flex flex-col mt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Record Label</span>
          <span className="text-[#fa586a] text-[12px] font-medium mt-1 hover:underline cursor-pointer">T-Series</span>
        </div>
      </div>

    </div>
  )
}
export default AlbumDetail
