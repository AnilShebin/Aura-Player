import React, { useState, useEffect } from 'react'
import { Search, ArrowLeft, Loader2, Music2 } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { Song } from '@/types/music'
import { SearchOnlineLyrics, LRCLibSearchResult } from '@/services/lyricsService'

interface LyricsSearchPanelProps {
  song: Song
  onClose: () => void
}

export const LyricsSearchPanel: React.FC<LyricsSearchPanelProps> = ({ song, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<LRCLibSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const packLyrics = useMusicStore((state) => state.packLyrics)

  // Initialize search query with current song metadata
  useEffect(() => {
    if (song) {
      const query = song.artist ? `${song.artist} - ${song.title}` : song.title
      setSearchQuery(query)
      handleSearch(query)
    }
  }, [song])

  const handleSearch = async (queryToUse?: string) => {
    const query = queryToUse !== undefined ? queryToUse : searchQuery
    if (!query.trim()) return

    setSearching(true)
    setError(null)
    setHasSearched(true)

    try {
      const res = await SearchOnlineLyrics(query)
      setResults(res || [])
    } catch (err) {
      console.error('[LyricsSearchPanel] Search failed:', err)
      setError('Failed to fetch search results from online provider.')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectTrack = async (track: LRCLibSearchResult) => {
    // Prefer synced lyrics, fall back to plain lyrics
    const lyricsText = track.syncedLyrics || track.plainLyrics
    if (!lyricsText) return

    await packLyrics(song, lyricsText, 'LRCLIB')
    onClose()
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-6 px-6 md:px-10 lg:px-12 text-white">
      {/* Back navigation */}
      <div className="mb-5">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-semibold tracking-wider text-white/40 hover:text-white transition-all uppercase cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lyrics
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search song title, artist..."
            className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-white/20 rounded-2xl px-4 py-3 pl-11 text-sm outline-none transition-all placeholder:text-white/30 text-white shadow-inner"
          />
          <Search className="w-4 h-4 text-white/30 group-focus-within:text-white/60 absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
        </div>
        <button
          onClick={() => handleSearch()}
          className="px-6 bg-white/10 hover:bg-white/20 border border-white/10 active:scale-95 rounded-2xl font-semibold text-sm transition-all cursor-pointer flex items-center justify-center text-white"
        >
          Search
        </button>
      </div>

      {/* Search keyword indicator */}
      {hasSearched && (
        <div className="text-xs text-white/40 mb-4 uppercase tracking-wider font-semibold flex items-center justify-between">
          <span>Search results</span>
          <span className="text-white/60 normal-case font-normal">{results.length} matches found</span>
        </div>
      )}

      {/* Results / Searching / Error Views */}
      <div className="flex-1 overflow-y-auto pr-1 select-none custom-scrollbar">
        {searching ? (
          <div className="w-full h-48 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            <p className="text-white/40 text-sm font-medium animate-pulse">Searching online database...</p>
          </div>
        ) : error ? (
          <div className="w-full h-32 flex items-center justify-center text-sm text-red-400 font-medium">
            {error}
          </div>
        ) : results.length === 0 ? (
          hasSearched && (
            <div className="w-full h-48 flex flex-col items-center justify-center text-center px-4">
              <Music2 className="w-10 h-10 text-white/20 mb-2.5" />
              <p className="text-white/50 text-sm font-semibold mb-1">No matches found</p>
              <p className="text-white/30 text-xs max-w-[220px]">Try searching with a different keyword or artist name.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((track) => {
              const isSynced = !!track.syncedLyrics
              const hasLyrics = !!(track.syncedLyrics || track.plainLyrics)

              return (
                <div
                  key={track.id}
                  onClick={() => hasLyrics && handleSelectTrack(track)}
                  className={`w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 hover:border-white/10 hover:shadow-lg rounded-2xl transition-all hover:scale-[1.005] ${
                    hasLyrics ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-[15px] font-medium text-white line-clamp-1 mb-1.5 leading-tight">
                      {track.trackName}
                    </h4>
                    <p className="text-xs text-white/50 line-clamp-1 font-normal leading-normal">
                      {track.albumName ? `${track.albumName} - ` : ''}{track.artistName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-semibold tracking-wide bg-white/5 text-white/75 px-2.5 py-1 rounded-md border border-white/5">
                      {formatDuration(track.duration)}
                    </span>
                    {hasLyrics ? (
                      isSynced ? (
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                          Synced
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-zinc-500/20 text-zinc-400 border border-zinc-500/10 px-2.5 py-1 rounded-md">
                          Plain
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/10 px-2.5 py-1 rounded-md">
                        No Lyrics
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
