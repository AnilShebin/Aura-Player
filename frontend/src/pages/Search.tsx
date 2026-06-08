import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Search as SearchIcon, X, Play, Music, Disc, User } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { Song } from '@/types/music'

const CATEGORIES = [
  { name: 'Lossless Audio', query: 'Lossless', gradient: 'from-indigo-600/80 to-blue-500/80' },
  { name: 'Dolby Atmos', query: 'Dolby', gradient: 'from-purple-600/80 to-pink-500/80' },
  { name: 'Hi-Res Lossless', query: 'Hi-Res Lossless', gradient: 'from-emerald-600/80 to-teal-500/80' },
  { name: 'Favorites', query: 'favorite', gradient: 'from-rose-600/80 to-pink-500/80' },
  { name: 'Pop Music', query: 'Pop', gradient: 'from-amber-500/80 to-orange-600/80' },
  { name: 'Hip-Hop', query: 'Hip-Hop', gradient: 'from-violet-600/80 to-purple-800/80' },
  { name: 'Rock', query: 'Rock', gradient: 'from-red-600/80 to-rose-800/80' },
  { name: 'Soundtracks', query: 'Soundtrack', gradient: 'from-sky-500/80 to-blue-700/80' }
]

interface RecentSearchItem {
  id: string
  type: 'song' | 'album'
  title: string
  artist: string
  coverUrl: string
  songData?: Song
  albumData?: any
}

export const Search: React.FC = () => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const librarySongs = useMusicStore(state => state.librarySongs)
  const libraryAlbums = useMusicStore(state => state.libraryAlbums)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const setSelectedAlbum = useMusicStore(state => state.setSelectedAlbum)
  const playingSongId = useMusicStore(state => state.playingSong?.id)

  // LocalStorage state for recent searches
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura-recent-searches')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Persist recent searches
  useEffect(() => {
    localStorage.setItem('aura-recent-searches', JSON.stringify(recentSearches))
  }, [recentSearches])

  // Auto focus search input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Clear query and focus
  const handleClear = useCallback(() => {
    setQuery('')
    inputRef.current?.focus()
  }, [])

  // Listen to escape key to clear search
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('')
    }
  }, [])

  const queryLower = query.toLowerCase().trim()

  // Filter songs optimized via memoization
  const filteredSongs = useMemo(() => {
    if (!queryLower) return []
    return librarySongs.filter(song => {
      const qualityLower = song.quality?.toLowerCase() || ''
      const codecLower = song.codec?.toLowerCase() || ''

      if (queryLower === 'lossless') {
        return qualityLower === 'lossless'
      }
      if (queryLower === 'hi-res lossless') {
        return qualityLower === 'hi-res lossless'
      }
      if (queryLower === 'dolby') {
        return qualityLower.includes('dolby') || 
               codecLower.includes('ec3') || 
               codecLower.includes('ec-3') || 
               codecLower.includes('ac3') || 
               codecLower.includes('ac-3')
      }

      return (
        song.title.toLowerCase().includes(queryLower) ||
        song.artist.toLowerCase().includes(queryLower) ||
        song.albumTitle.toLowerCase().includes(queryLower) ||
        (song.genre && song.genre.toLowerCase().includes(queryLower)) ||
        (song.codec && song.codec.toLowerCase().includes(queryLower)) ||
        (song.quality && song.quality.toLowerCase().includes(queryLower)) ||
        (queryLower === 'favorite' && song.isFavorite)
      )
    })
  }, [librarySongs, queryLower])

  // Filter albums optimized via memoization
  const filteredAlbums = useMemo(() => {
    if (!queryLower) return []
    return libraryAlbums.filter(album => {
      const qualityLower = album.quality?.toLowerCase() || ''
      const codecLower = album.codec?.toLowerCase() || ''

      if (queryLower === 'lossless') {
        return qualityLower === 'lossless' || album.songs?.some(s => s.quality?.toLowerCase() === 'lossless')
      }
      if (queryLower === 'hi-res lossless') {
        return qualityLower === 'hi-res lossless' || album.songs?.some(s => s.quality?.toLowerCase() === 'hi-res lossless')
      }
      if (queryLower === 'dolby') {
        return qualityLower.includes('dolby') || 
               codecLower.includes('ec3') || 
               codecLower.includes('ec-3') || 
               codecLower.includes('ac3') || 
               codecLower.includes('ac-3') ||
               album.songs?.some(s => s.quality?.toLowerCase().includes('dolby') || s.codec?.toLowerCase().includes('ec3') || s.codec?.toLowerCase().includes('ec-3') || s.codec?.toLowerCase().includes('ac3') || s.codec?.toLowerCase().includes('ac-3'))
      }

      return (
        album.title.toLowerCase().includes(queryLower) ||
        album.albumArtist.toLowerCase().includes(queryLower) ||
        (album.genre && album.genre.toLowerCase().includes(queryLower)) ||
        (album.quality && album.quality.toLowerCase().includes(queryLower))
      )
    })
  }, [libraryAlbums, queryLower])

  // Extract unique artists matching the query
  const filteredArtists = useMemo(() => {
    if (!queryLower) return []
    const artistsMap = new Map<string, { name: string; coverUrl?: string }>()
    librarySongs.forEach(song => {
      const matchArtist = song.artist.toLowerCase().includes(queryLower)
      const matchAlbumArtist = song.albumArtist && song.albumArtist.toLowerCase().includes(queryLower)
      if (matchArtist || matchAlbumArtist) {
        const artistName = matchArtist ? song.artist : (song.albumArtist || song.artist)
        const key = artistName.toLowerCase()
        if (!artistsMap.has(key)) {
          artistsMap.set(key, { name: artistName, coverUrl: song.coverUrl })
        }
      }
    })
    return Array.from(artistsMap.values())
  }, [librarySongs, queryLower])

  const addToRecentSearches = useCallback((item: Omit<RecentSearchItem, 'timestamp'>) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(x => !(x.id === item.id && x.type === item.type))
      return [item, ...filtered].slice(0, 10)
    })
  }, [])

  const handlePlaySong = useCallback((song: Song, contextQueue: Song[]) => {
    playSongDirect(song, contextQueue)
    addToRecentSearches({
      id: song.id || song.filePath || '',
      type: 'song',
      title: song.title,
      artist: song.artist,
      coverUrl: song.coverUrl || '',
      songData: song
    })
  }, [playSongDirect, addToRecentSearches])

  const handleSelectAlbum = useCallback((albumSummary: any) => {
    const albumData = {
      id: albumSummary.id,
      title: albumSummary.title,
      artist: albumSummary.albumArtist || albumSummary.artist || '',
      coverUrl: albumSummary.coverUrl || '',
      year: albumSummary.year || '2026',
      genre: albumSummary.genre || 'Local Audio',
      songs: albumSummary.songs || [],
      codec: albumSummary.codec || 'Unknown',
      quality: albumSummary.quality || 'High Quality'
    }
    setSelectedAlbum(albumData)
    addToRecentSearches({
      id: albumSummary.id,
      type: 'album',
      title: albumSummary.title,
      artist: albumSummary.albumArtist || albumSummary.artist || '',
      coverUrl: albumSummary.coverUrl || '',
      albumData: albumSummary
    })
  }, [setSelectedAlbum, addToRecentSearches])

  const showResults = queryLower.length > 0
  const hasResults = filteredSongs.length > 0 || filteredAlbums.length > 0 || filteredArtists.length > 0

  return (
    <div className="w-full h-full flex flex-col gap-6 pt-6 pb-28 select-none overflow-y-auto pr-2 custom-scrollbar">
      {/* Title Header */}
      <div className="flex flex-col shrink-0">
        <h1 className="text-[28px] md:text-[34px] font-extrabold text-white tracking-tight leading-none">
          Search
        </h1>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full max-w-[540px] shrink-0">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <SearchIcon size={16} strokeWidth={1.8} className="text-[#8e8e93]" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Artists, Songs, Albums, or Genres"
          className="w-full h-10 pl-10 pr-10 rounded-lg bg-[#1c1c1e] text-white text-[13px] placeholder-[#8e8e93] border border-white/5 focus:outline-none focus:border-[#fa586a]/40 focus:bg-[#2c2c2e]/60 transition-all duration-150"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8e8e93] hover:text-white transition-colors duration-150 cursor-pointer"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* Conditional Layout Rendering */}
      {!showResults ? (
        <div className="flex flex-col gap-8">
          {/* Recently Searched Songs/Albums */}
          {recentSearches.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-zinc-400 tracking-tight">Recent Searches</h2>
                <button
                  onClick={() => setRecentSearches([])}
                  className="text-[11px] text-zinc-500 hover:text-[#fa586a] transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              </div>
              <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {recentSearches.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (item.type === 'song' && item.songData) {
                        playSongDirect(item.songData, [item.songData])
                      } else if (item.type === 'album' && item.albumData) {
                        // Pass directly to store action
                        setSelectedAlbum({
                          id: item.albumData.id,
                          title: item.albumData.title,
                          artist: item.albumData.albumArtist || item.albumData.artist || '',
                          coverUrl: item.albumData.coverUrl || '',
                          year: item.albumData.year || '2026',
                          genre: item.albumData.genre || 'Local Audio',
                          songs: item.albumData.songs || [],
                          codec: item.albumData.codec || 'Unknown',
                          quality: item.albumData.quality || 'High Quality'
                        })
                      }
                    }}
                    className="flex flex-col gap-2 p-2 w-28 hover:bg-white/[0.03] rounded-xl cursor-pointer transition-colors duration-150 border border-transparent hover:border-white/5 shrink-0 group active:scale-[0.98]"
                  >
                    <div className={`aspect-square w-full overflow-hidden bg-zinc-900 shrink-0 relative shadow-md border border-white/5 ${item.type === 'song' ? 'rounded-lg' : 'rounded-lg'}`}>
                      {item.coverUrl ? (
                        <img src={item.coverUrl} className="w-full h-full object-cover" alt="" />
                      ) : item.type === 'song' ? (
                        <Music className="w-6 h-6 text-zinc-700 m-auto absolute inset-0" />
                      ) : (
                        <Disc className="w-6 h-6 text-zinc-700 m-auto absolute inset-0" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 pt-0.5 px-0.5">
                      <span className="text-[11px] font-medium text-white truncate group-hover:text-[#fa586a] transition-colors leading-tight">
                        {item.title}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-light truncate mt-0.5">
                        {item.type === 'song' ? 'Song' : 'Album'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 className="text-[15px] font-semibold text-zinc-400 tracking-tight">Browse Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => setQuery(cat.query)}
                  className={`h-24 rounded-xl bg-gradient-to-br ${cat.gradient} p-4 relative overflow-hidden group cursor-pointer border border-white/5 shadow-lg active:scale-[0.98] transition-transform duration-100`}
                >
                  <span className="text-[14px] font-semibold text-white tracking-tight leading-snug drop-shadow-sm absolute bottom-4 left-4 max-w-[80%]">
                    {cat.name}
                  </span>
                  <SearchIcon size={44} className="absolute -right-3 -top-3 text-white/5 group-hover:scale-110 transition-transform duration-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {hasResults ? (
            <>
              {/* Songs Column */}
              {filteredSongs.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-[14px] font-semibold text-zinc-400 tracking-tight">Songs</h3>
                  <div className="flex flex-col divide-y divide-white/[0.03] bg-[#1c1c1e]/20 border border-white/5 rounded-xl overflow-hidden px-1">
                    {filteredSongs.slice(0, 5).map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handlePlaySong(song, filteredSongs)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] rounded-lg cursor-pointer transition-colors duration-150 group"
                      >
                        <div className="relative w-9 h-9 rounded-md overflow-hidden bg-zinc-800 shrink-0 shadow-sm border border-white/5">
                          {song.coverUrl ? (
                            <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Music className="w-4 h-4 text-zinc-600 m-2.5" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={12} fill="currentColor" className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className={`text-[13px] font-normal truncate leading-tight ${playingSongId === song.id ? 'text-[#fa586a] font-medium' : 'text-zinc-100'}`}>
                            {song.title}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-light truncate mt-0.5">
                            {song.artist} • {song.albumTitle}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-light pr-1">
                          {song.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Column */}
              {filteredAlbums.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-[14px] font-semibold text-zinc-400 tracking-tight">Albums</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {filteredAlbums.slice(0, 5).map((album) => (
                      <div
                        key={album.id}
                        onClick={() => handleSelectAlbum(album)}
                        className="flex flex-col gap-2 p-2 hover:bg-white/[0.03] rounded-xl cursor-pointer transition-colors duration-150 border border-transparent hover:border-white/5 shadow-sm group"
                      >
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-zinc-900 shrink-0 relative shadow-md border border-white/5">
                          {album.coverUrl ? (
                            <img src={album.coverUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Disc className="w-8 h-8 text-zinc-700 m-auto absolute inset-0" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 pt-0.5 px-0.5">
                          <span className="text-[12px] font-medium text-white truncate group-hover:text-[#fa586a] transition-colors leading-tight">
                            {album.title}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-light truncate mt-0.5">
                            {album.albumArtist}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists Column */}
              {filteredArtists.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-[14px] font-semibold text-zinc-400 tracking-tight">Artists</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {filteredArtists.slice(0, 5).map((artist) => (
                      <div
                        key={artist.name}
                        onClick={() => setQuery(artist.name)}
                        className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] group"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/5 flex items-center justify-center">
                          <User size={18} className="text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium text-zinc-200 group-hover:text-white truncate block">
                            {artist.name}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-light uppercase tracking-wider block mt-0.5">
                            Artist
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center min-h-[40vh] text-center select-none py-10">
              <div className="w-16 h-16 rounded-full bg-zinc-800/30 border border-white/5 flex items-center justify-center mb-5 shadow-xl">
                <SearchIcon size={24} className="text-zinc-600" />
              </div>
              <h2 className="text-[18px] font-bold text-white tracking-tight mb-1">No Results</h2>
              <p className="text-zinc-400 text-[12px] max-w-[260px] leading-relaxed">
                We couldn't find any matching songs, albums, or artists for "{query}".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Search;
