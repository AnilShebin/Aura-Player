import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Music } from 'lucide-react'
import { Song } from '@/types/music'
import * as LyricsService from '@/services/lyricsService'

interface SongPropertiesModalProps {
  isOpen: boolean
  onClose: () => void
  song: Song | null
  onSave: (updatedSong: Partial<Song>) => void
}

type TabType = 'details' | 'artwork' | 'lyrics' | 'file'

export const SongPropertiesModal: React.FC<SongPropertiesModalProps> = ({
  isOpen,
  onClose,
  song,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('details')

  // Details States
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [album, setAlbum] = useState('')
  const [albumArtist, setAlbumArtist] = useState('')
  const [composer, setComposer] = useState('')
  const [genre, setGenre] = useState('')
  const [year, setYear] = useState('')
  const [lyricsText, setLyricsText] = useState('')
  const [customLyrics, setCustomLyrics] = useState(false)

  // Sync state with song when opened
  useEffect(() => {
    if (song) {
      setTitle(song.title || '')
      setArtist(song.artist || '')
      setAlbum(song.albumTitle || '')
      setAlbumArtist(song.albumArtist || song.artist || '')
      setComposer(song.copyright ? song.copyright.replace(/©\s*\d*\s*/, '') : '')
      setGenre(song.genre || 'Alternative')
      setYear(song.year || '')
      setLyricsText(song.lyrics || '')
      setCustomLyrics(!!song.lyrics)
      setActiveTab('details')

      // Fetch lyrics if not present on the song object
      if (!song.lyrics && song.filePath) {
        LyricsService.GetLyrics(song.filePath)
          .then((res) => {
            if (res && res.raw) {
              setLyricsText(res.raw)
              setCustomLyrics(true)
            }
          })
          .catch((e) => console.error('Failed to load lyrics for properties modal:', e))
      }
    }
  }, [song, isOpen])

  if (!isOpen || !song) return null

  // Calculate file details
  const getFileFormat = () => {
    if (!song.filePath) return 'MPEG Audio File'
    const ext = song.filePath.split('.').pop()?.toUpperCase()
    if (ext === 'FLAC') return 'FLAC Lossless Audio File'
    if (ext === 'M4A' || ext === 'ALAC') return 'Apple Lossless ALAC Audio File'
    if (ext === 'MP3') return 'MPEG Audio File (MP3)'
    return `${ext} Audio File`
  }

  const getFileSize = () => {
    // Generate realistic size based on duration and format
    const isLossless = getFileFormat().includes('Lossless') || getFileFormat().includes('FLAC')
    const bitrate = isLossless ? 1411 : (song.bitrate || 256)
    const durationSec = song.durationSeconds || 180
    const bytes = (durationSec * (bitrate * 1000)) / 8
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const handleOK = () => {
    onSave({
      title,
      artist,
      albumTitle: album,
      albumArtist,
      genre,
      year,
      lyrics: lyricsText
    })
    onClose()
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'artwork', label: 'Artwork' },
    { id: 'lyrics', label: 'Lyrics' },
    { id: 'file', label: 'File' }
  ]

  const isLossless = getFileFormat().includes('Lossless') || getFileFormat().includes('FLAC')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-[500px] bg-[#1c1c1e] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col text-white overflow-hidden">
        
        {/* Close button top right */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Block (Cover Art & Title info) */}
        <div className="p-6 pb-4 flex items-center gap-4 border-b border-white/[0.03]">
          {song.coverUrl ? (
            <img
              src={song.coverUrl}
              alt={song.title}
              className="w-16 h-16 rounded-lg object-cover shadow-md border border-white/5"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 border border-white/5">
              <Music size={28} />
            </div>
          )}
          
          <div className="flex-1 min-w-0 pr-6">
            <h2 className="text-[16px] font-bold text-white leading-tight truncate">{title || 'Unknown Song'}</h2>
            <p className="text-[12px] text-zinc-400 mt-0.5 truncate">{artist || 'Unknown Artist'}</p>
            <p className="text-[12px] text-zinc-500 truncate">{album || 'Unknown Album'}</p>
            
            {/* Lossless badge */}
            {isLossless && (
              <span className="inline-flex items-center gap-1 mt-1 bg-zinc-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-zinc-300 uppercase tracking-wider border border-white/5">
                <svg viewBox="0 0 32 32" className="w-2.5 h-2.5 fill-current text-[#fa586a]" aria-hidden="true">
                  <rect x="2" y="16" width="2.4" height="12" rx="1.2" />
                  <rect x="6" y="9.5" width="2.4" height="18.5" rx="1.2" />
                  <rect x="10" y="4.5" width="2.4" height="16" rx="1.2" />
                  <rect x="14" y="0" width="2.4" height="14" rx="1.2" />
                  <rect x="18" y="4.5" width="2.4" height="16" rx="1.2" />
                  <rect x="22" y="9.5" width="2.4" height="18.5" rx="1.2" />
                  <rect x="26" y="16" width="2.4" height="12" rx="1.2" />
                </svg>
                Lossless
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="px-6 flex gap-6 text-[13px] font-semibold text-zinc-400 border-b border-white/[0.03]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 relative transition-colors cursor-pointer ${
                activeTab === tab.id ? 'text-white' : 'hover:text-zinc-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#fa586a]" />
              )}
            </button>
          ))}
        </div>

        {/* Modal Main Content Box */}
        <div className="p-6 h-[290px] overflow-y-auto custom-scrollbar">
          
          {/* 1. DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="flex flex-col gap-4">
              
              {/* Title field */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-white border-b border-zinc-800 focus:border-[#fa586a]/60 text-[13px] py-0.5 outline-none transition-colors"
                />
              </div>

              {/* Album field */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">album</span>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full bg-transparent text-white border-b border-zinc-800 focus:border-[#fa586a]/60 text-[13px] py-0.5 outline-none transition-colors"
                />
              </div>

              {/* Artist field */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">artist</span>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-transparent text-white border-b border-zinc-800 focus:border-[#fa586a]/60 text-[13px] py-0.5 outline-none transition-colors"
                />
              </div>

              {/* Album Artist field */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">album artist</span>
                <input
                  type="text"
                  value={albumArtist}
                  onChange={(e) => setAlbumArtist(e.target.value)}
                  className="w-full bg-transparent text-white border-b border-zinc-800 focus:border-[#fa586a]/60 text-[13px] py-0.5 outline-none transition-colors"
                />
              </div>

              {/* Composer field */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">composer</span>
                <input
                  type="text"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-transparent text-white border-b border-zinc-800 focus:border-[#fa586a]/60 text-[13px] py-0.5 outline-none transition-colors placeholder-zinc-700"
                />
              </div>

              {/* Genre / Year Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">genre</span>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-transparent text-white border-b border-zinc-800 focus:border-[#fa586a]/60 text-[13px] py-0.5 outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">year</span>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-transparent text-white border-b border-zinc-800 focus:border-[#fa586a]/60 text-[13px] py-0.5 outline-none transition-colors placeholder-zinc-700"
                  />
                </div>
              </div>

            </div>
          )}

          {/* 2. ARTWORK TAB */}
          {activeTab === 'artwork' && (
            <div className="flex flex-col items-center justify-center gap-4 h-full">
              {song.coverUrl ? (
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-44 h-44 rounded-xl object-cover shadow-xl border border-white/5 bg-zinc-900"
                />
              ) : (
                <div className="w-44 h-44 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 border border-white/5">
                  <Music size={48} />
                </div>
              )}
              
              <button 
                onClick={() => alert('Add Artwork is not supported for native offline audio files in this preview.')}
                className="text-[#fa586a] hover:opacity-85 font-medium text-[13px] tracking-tight cursor-pointer mt-1 flex items-center gap-1 active:scale-95"
              >
                + Add Artwork
              </button>
            </div>
          )}

          {/* 3. LYRICS TAB */}
          {activeTab === 'lyrics' && (
            <div className="flex flex-col gap-3 h-full">
              <textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="No lyrics available. Paste or type lyrics here..."
                className="w-full flex-1 bg-[#2c2c2e] text-white/90 text-[13px] font-light leading-relaxed p-3 rounded-lg border border-white/5 focus:outline-none focus:border-[#fa586a]/30 resize-none overflow-y-auto custom-scrollbar"
              />
              <label className="flex items-center gap-2 px-1 cursor-pointer select-none group text-zinc-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={customLyrics}
                  onChange={(e) => setCustomLyrics(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#2c2c2e] border-white/10 accent-[#fa586a] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[12px] font-light">Custom Lyrics</span>
              </label>
            </div>
          )}

          {/* 4. FILE TAB */}
          {activeTab === 'file' && (
            <div className="flex flex-col gap-3.5 text-[13px] text-zinc-300 font-light select-text">
              <div className="grid grid-cols-3 gap-1">
                <span className="text-zinc-500 font-normal">kind</span>
                <span className="col-span-2 font-medium text-white truncate">{getFileFormat()}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <span className="text-zinc-500 font-normal">audio formats</span>
                <span className="col-span-2 font-medium text-white">{isLossless ? 'Lossless' : 'High Quality'}</span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <span className="text-zinc-500 font-normal">duration</span>
                <span className="col-span-2 font-medium text-white">{song.duration || 'Unknown'}</span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <span className="text-zinc-500 font-normal">size</span>
                <span className="col-span-2 font-medium text-white">{getFileSize()}</span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <span className="text-zinc-500 font-normal">bit rate</span>
                <span className="col-span-2 font-medium text-white">{isLossless ? '1411 kbps' : `${song.bitrate || 256} kbps`}</span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <span className="text-zinc-500 font-normal">sample rate</span>
                <span className="col-span-2 font-medium text-white">{song.sampleRate ? `${(song.sampleRate / 1000).toFixed(3)} kHz` : '44.100 kHz'}</span>
              </div>

              <div className="grid grid-cols-3 gap-1 border-t border-white/[0.03] pt-3 mt-1">
                <span className="text-zinc-500 font-normal">location</span>
                <span className="col-span-2 font-medium text-white break-all text-[11.5px] leading-tight select-all">
                  {song.filePath || 'Unknown Local File'}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions row */}
        <div className="p-6 bg-zinc-950/20 border-t border-white/[0.03] flex items-center justify-between">
          {/* Navigation buttons (For visually matching the screenshot) */}
          <div className="flex items-center gap-1">
            <button 
              disabled 
              className="w-7 h-7 rounded bg-zinc-800/40 hover:bg-zinc-800 flex items-center justify-center text-zinc-600 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled 
              className="w-7 h-7 rounded bg-zinc-800/40 hover:bg-zinc-800 flex items-center justify-center text-zinc-600 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleOK}
              className="h-8 px-6 rounded-lg bg-[#fa586a] hover:bg-[#fa586a]/90 text-white font-semibold text-[13px] transition-all active:scale-[0.98] cursor-pointer shadow-md"
            >
              OK
            </button>
            <button
              onClick={onClose}
              className="h-8 px-6 rounded-lg bg-[#2c2c2e] hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-[13px] transition-all active:scale-[0.98] cursor-pointer ml-3 border border-white/5"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
