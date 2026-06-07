import React, { useCallback } from 'react'
import { Play, Pause, Shuffle, Plus, MoreHorizontal, ChevronLeft } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'

export const AlbumDetail: React.FC = () => {
  const selectedAlbum = useMusicStore(state => state.selectedAlbum)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const playingSongId = useMusicStore(state => state.playingSong?.id)
  const isPlaying = useMusicStore(state => state.isPlaying)
  const handlePlayPause = useMusicStore(state => state.handlePlayPause)

  const setSelectedAlbum = useMusicStore(state => state.setSelectedAlbum)

  const handleBackClick = useCallback(() => {
    setSelectedAlbum(null)
  }, [setSelectedAlbum])

  const handlePlayAll = useCallback(() => {
    if (selectedAlbum?.songs && selectedAlbum.songs.length > 0) {
      playSongDirect(selectedAlbum.songs[0], selectedAlbum.songs)
    }
  }, [selectedAlbum, playSongDirect])

  const handleShufflePlay = useCallback(() => {
    if (selectedAlbum?.songs && selectedAlbum.songs.length > 0) {
      const shuffled = [...selectedAlbum.songs].sort(() => Math.random() - 0.5)
      playSongDirect(shuffled[0], shuffled)
    }
  }, [selectedAlbum, playSongDirect])

  if (!selectedAlbum) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh] text-zinc-500 text-[13px]">
        No album selected
      </div>
    )
  }

  // Find first non-empty year/genre/codec/quality from songs
  const albumYear = selectedAlbum.year && selectedAlbum.year !== '2026' 
    ? selectedAlbum.year 
    : (selectedAlbum.songs?.find(s => s.year && s.year !== '2026')?.year || selectedAlbum.year || '2026')

  const albumCodec = selectedAlbum.codec && selectedAlbum.codec !== 'Unknown'
    ? selectedAlbum.codec
    : (selectedAlbum.songs?.find(s => s.codec && s.codec !== 'Unknown')?.codec || selectedAlbum.codec || 'Unknown')

  const albumQuality = selectedAlbum.quality && selectedAlbum.quality !== 'High Quality'
    ? selectedAlbum.quality
    : (selectedAlbum.songs?.find(s => s.quality && s.quality !== 'High Quality')?.quality || selectedAlbum.quality || 'High Quality')

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

  const albumCopyright = selectedAlbum.songs?.find(s => s.copyright && s.copyright !== 'none')?.copyright || ''

  return (
    <div className="w-full flex flex-col gap-6 py-4 pb-28 select-none">
      
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 shrink-0">
        <button 
          onClick={handleBackClick}
          className="hover:text-[#fa586a] transition-colors duration-150 cursor-pointer flex items-center gap-0.5"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Albums
        </button>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-200 truncate max-w-[250px]">{selectedAlbum.title}</span>
      </div>

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 border-b border-white/5 pb-8">
        
        {/* Album Cover with rounded corners and drop shadow */}
        <div className="relative w-[200px] h-[200px] md:w-[270px] md:h-[270px] rounded-2xl overflow-hidden bg-zinc-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] shrink-0 border border-white/5">
          <img 
            src={selectedAlbum.coverUrl} 
            alt={selectedAlbum.title} 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Album Details */}
        <div className="flex flex-col text-center md:text-left gap-2 flex-1">
          <h1 className="text-[26px] md:text-[34px] font-medium text-white tracking-tight leading-tight">
            {selectedAlbum.title}
          </h1>
          <h2 className="text-[#fa586a] text-[16px] md:text-[18px] font-medium tracking-tight hover:underline cursor-pointer">
            {selectedAlbum.artist}
          </h2>
          
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] text-zinc-400 font-light mt-0.5">
            <span>{albumYear}</span>
            <span>•</span>
            <span>{totalSongs} {totalSongs === 1 ? 'song' : 'songs'}</span>
            <span>•</span>
            <span>{albumCodec}</span>
            <span>•</span>
            
            {/* Quality badge and text */}
            <div className="flex items-center gap-1 font-normal text-zinc-300">
              <svg viewBox="0 0 24 24" width="12" height="12" className="fill-zinc-300 shrink-0">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span>{albumQuality}</span>
            </div>
          </div>

          {/* Action Buttons & Icons */}
          <div className="flex items-center justify-between mt-6 w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayAll}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#fa586a] hover:bg-[#fa586a]/90 text-white rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer min-w-[90px]"
              >
                <Play size={14} fill="currentColor" className="text-white" />
                Play
              </button>
              <button
                onClick={handleShufflePlay}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#fa586a] hover:bg-[#fa586a]/90 text-white rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer min-w-[100px]"
              >
                <Shuffle size={14} className="text-white" />
                Shuffle
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-[#fa586a] hover:opacity-85 flex items-center gap-1 text-[13px] font-medium transition-opacity duration-150 cursor-pointer">
                <Plus size={16} className="stroke-[2.5]" />
                Add
              </button>
              <button className="text-[#fa586a] hover:opacity-85 p-1 transition-opacity duration-150 cursor-pointer">
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
            const isCurrentPlaying = playingSongId === song.id
            
            return (
              <div
                key={song.id}
                onClick={() => {
                  if (isCurrentPlaying) {
                    handlePlayPause()
                  } else {
                    playSongDirect(song, selectedAlbum.songs)
                  }
                }}
                className="grid grid-cols-[40px_1fr_60px_40px] gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-white/[0.04] group cursor-pointer transition-colors duration-150 transform-gpu"
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
                <div className="flex flex-col min-w-0 pr-4">
                  <span className={`text-[14px] ${isCurrentPlaying ? 'font-medium text-[#fa586a]' : 'font-normal text-zinc-100'} truncate leading-tight transition-colors duration-150`}>
                    {song.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <span className="text-[12px] text-zinc-400 font-light truncate max-w-[60%] shrink-0">
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

                {/* Duration */}
                <div className="text-[12px] text-zinc-400 font-light text-right pr-2">
                  {song.duration}
                </div>

                {/* Options three-dots */}
                <div className="flex justify-end pr-1" onClick={(e) => e.stopPropagation()}>
                  <button className="text-[#fa586a] hover:opacity-85 p-1 transition-opacity duration-150 cursor-pointer">
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
        {albumCopyright && <span className="text-zinc-500 font-normal">{albumCopyright}</span>}
        <span>Released: {albumYear}</span>
        <span>{totalSongs} {totalSongs === 1 ? 'song' : 'songs'}, {totalDurationMinutes} minutes</span>
      </div>

    </div>
  )
}
export default AlbumDetail
