import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { Play, ChevronRight, MoreHorizontal, Disc } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { SongContextMenu } from '@/components/songs/SongContextMenu'

const CardMarquee: React.FC<{ text: string; isParentHovered: boolean }> = React.memo(({ text, isParentHovered }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [shouldScroll, setShouldScroll] = useState(false)
  const [textWidth, setTextWidth] = useState(0)

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const currentTextWidth = textRef.current.scrollWidth
      if (currentTextWidth > containerWidth) {
        setShouldScroll(true)
        setTextWidth(currentTextWidth)
      } else {
        setShouldScroll(false)
        setTextWidth(0)
      }
    }
  }, [text])

  const blockWidth = textWidth + 32
  const animationDuration = Math.max(4, blockWidth / 30)

  return (
    <div
      ref={containerRef}
      className="overflow-hidden whitespace-nowrap w-full relative flex items-center mt-0.5"
    >
      <div
        className="flex items-center"
        style={{
          width: 'max-content',
          animation: isParentHovered && shouldScroll ? `marquee-scroll ${animationDuration}s linear infinite` : 'none',
          animationDelay: '0.3s'
        }}
      >
        <span ref={textRef} className="text-[11px] text-white/60 font-light leading-none select-none">
          {text}
        </span>

        {shouldScroll && (
          <>
            <span className="inline-block w-8 shrink-0" />
            <span className="text-[11px] text-white/60 font-light leading-none select-none">
              {text}
            </span>
          </>
        )}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
})
CardMarquee.displayName = 'CardMarquee'


export const ListenNow: React.FC = () => {
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const librarySongs = useMusicStore(state => state.librarySongs)
  const playingSong = useMusicStore(state => state.playingSong)

  const [songMenuCoords, setSongMenuCoords] = useState<{ top: number; left: number } | null>(null)
  const [activeSong, setActiveSong] = useState<any>(null)
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)

  const handleSongOptionsClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, song: any) => {
    e.stopPropagation()
    if (songMenuCoords && activeSong?.id === song.id) {
      setSongMenuCoords(null)
      setActiveSong(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const menuWidth = 240
      const menuHeight = 350
      let top = rect.bottom + window.scrollY + 4
      if (rect.bottom + menuHeight > window.innerHeight) {
        top = rect.top + window.scrollY - menuHeight - 4
      }
      setSongMenuCoords({
        top,
        left: rect.right - menuWidth + window.scrollX,
      })
      setActiveSong(song)
    }
  }, [songMenuCoords, activeSong])

  // Get recently played songs from localStorage history (re-runs when playingSong changes)
  const recentlyPlayedSongs = useMemo(() => {
    try {
      const historyStr = localStorage.getItem('aura-recently-played-songs')
      if (historyStr) {
        const parsed = JSON.parse(historyStr)
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5) // Return up to 5 recently played songs
        }
      }
    } catch (e) {
      console.error('Failed to parse recently played songs history:', e)
    }
    return []
  }, [playingSong])

  // Generate random cards once when component mounts (on close/open/restart)
  const topPicks = useMemo<any[]>(() => {
    const songs = librarySongs || []
    const pool: any[] = []

    // 1. Heavy Rotation (always available)
    pool.push({
      id: 'heavy-rotation',
      title: 'Heavy Rotation',
      subtitle: 'Aura Music',
      tag: 'MADE FOR YOU',
      description: 'Your scanned library files and favorite recommendations',
      gradient: 'from-[#fa7c30] to-[#fa586a]',
      songs: songs.length > 0 ? songs : []
    })

    // 2. Top Artist
    const artistCounts: Record<string, number> = {}
    songs.forEach(s => {
      if (s.artist && s.artist !== 'Unknown Artist') {
        artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1
      }
    })
    const sortedArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])
    if (sortedArtists.length > 0) {
      const topArtist = sortedArtists[0][0]
      const artistSongs = songs.filter(s => s.artist === topArtist)
      pool.push({
        id: 'top-artist',
        title: topArtist,
        subtitle: 'Aura Music',
        tag: 'TOP ARTIST',
        description: `Featured songs by your most played artist, ${topArtist}`,
        gradient: 'from-[#a25cf7] to-[#fa586a]',
        songs: artistSongs
      })
    }

    // 3. Recently Added
    if (songs.length > 0) {
      const recentlyAdded = [...songs].slice(-10).reverse()
      pool.push({
        id: 'recently-added',
        title: 'Recently Added',
        subtitle: 'Aura Music',
        tag: 'NEW RELEASES',
        description: 'Check out the latest tracks scanned in your library',
        gradient: 'from-[#0052d4] to-[#4364f7]',
        songs: recentlyAdded
      })
    }

    // 4. Continue Listening
    let historySongs: any[] = []
    try {
      const historyStr = localStorage.getItem('aura-recently-played-songs')
      if (historyStr) {
        historySongs = JSON.parse(historyStr)
      }
    } catch (e) {}
    if (historySongs.length > 0) {
      pool.push({
        id: 'continue-listening',
        title: 'Continue Listening',
        subtitle: historySongs[0].artist,
        tag: 'CONTINUE LISTENING',
        description: `Resume playing: ${historySongs[0].title}`,
        gradient: 'from-[#11998e] to-[#38ef7d]',
        songs: historySongs
      })
    }

    // 5. Library Intelligence
    if (songs.length > 0) {
      pool.push({
        id: 'library-intelligence',
        title: 'Smart Mix',
        subtitle: 'Aura Music',
        tag: 'LIBRARY INTELLIGENCE',
        description: 'AI-curated selection from your local audio files',
        gradient: 'from-[#e52d80] to-[#b21c45]',
        songs: [...songs].sort(() => Math.random() - 0.5)
      })
    }

    // 6. By Lyricist
    if (songs.length > 0) {
      pool.push({
        id: 'by-lyricist',
        title: 'Wordcraft',
        subtitle: 'Aura Music',
        tag: 'BY LYRICIST',
        description: 'Focus on rich writing, poetry and lyric tracks',
        gradient: 'from-[#3a7bd5] to-[#3a6073]',
        songs: songs
      })
    }

    // 7. By Decade
    const decades: Record<string, any[]> = {}
    songs.forEach(s => {
      if (s.year) {
        const y = parseInt(s.year)
        if (y >= 1980 && y < 1990) (decades['80s Classics'] = decades['80s Classics'] || []).push(s)
        else if (y >= 1990 && y < 2000) (decades['90s Hits'] = decades['90s Hits'] || []).push(s)
        else if (y >= 2000 && y < 2010) (decades['2000s Hits'] = decades['2000s Hits'] || []).push(s)
        else if (y >= 2010 && y < 2020) (decades['2010s Hits'] = decades['2010s Hits'] || []).push(s)
        else if (y >= 2020) (decades['2020s Hits'] = decades['2020s Hits'] || []).push(s)
      }
    })
    const availableDecades = Object.entries(decades)
    if (availableDecades.length > 0) {
      const [decadeName, decadeSongs] = availableDecades[Math.floor(Math.random() * availableDecades.length)]
      pool.push({
        id: 'by-decade',
        title: decadeName,
        subtitle: 'Aura Music',
        tag: 'BY DECADE',
        description: `Enjoy local tracks from the ${decadeName}`,
        gradient: 'from-[#ff9966] to-[#ff5e62]',
        songs: decadeSongs
      })
    }

    // 8. Aura Exclusive
    pool.push({
      id: 'aura-exclusive',
      title: 'Pure Audio',
      subtitle: 'Aura Music',
      tag: 'AURA EXCLUSIVE',
      description: 'Experience studio quality offline playback and clean response',
      gradient: 'from-[#e57a00] to-[#b83a00]',
      songs: [...songs].sort(() => Math.random() - 0.5)
    })

    // 9. TTML Karaoke
    const songsWithLyrics = songs.filter(s => s.lyrics)
    if (songsWithLyrics.length > 0) {
      pool.push({
        id: 'ttml-karaoke',
        title: 'Karaoke',
        subtitle: 'Aura Music',
        tag: 'TTML KARAOKE',
        description: 'Sing along with real-time synchronized local lyrics',
        gradient: 'from-[#4e54c8] to-[#8f94fb]',
        songs: songsWithLyrics
      })
    }

    // 10. Favorite Artists
    const favSongs = songs.filter(s => s.isFavorite)
    const favArtists = Array.from(new Set(favSongs.map(s => s.artist))).filter(Boolean)
    if (favArtists.length > 0) {
      const selectedFavArtist = favArtists[Math.floor(Math.random() * favArtists.length)]
      const artistSongs = songs.filter(s => s.artist === selectedFavArtist)
      pool.push({
        id: 'favorite-artists',
        title: selectedFavArtist,
        subtitle: 'Aura Music',
        tag: 'FAVORITE ARTIST',
        description: `Enjoy tracks by your favorite artist: ${selectedFavArtist}`,
        gradient: 'from-[#11998e] to-[#38ef7d]',
        songs: artistSongs
      })
    }

    // Shuffle the pool and take 4
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    
    // Fallback to static mock cards if library is completely empty
    if (songs.length === 0) {
      return [
        {
          id: 'heavy-rotation',
          title: 'Heavy Rotation',
          subtitle: 'Aura Music',
          tag: 'MADE FOR YOU',
          description: 'Your scanned library files and favorite recommendations',
          gradient: 'from-[#fa7c30] to-[#fa586a]',
          songs: []
        },
        {
          id: 'get-started',
          title: 'Get Started',
          subtitle: 'Aura Music',
          tag: 'WELCOME',
          description: 'Add your music folders in Settings → Files to begin library scanning',
          gradient: 'from-[#121212] to-[#2c2c2e]',
          songs: []
        },
        {
          id: 'pure-audio',
          title: 'Pure Audio',
          subtitle: 'Aura Music',
          tag: 'LOSSLESS PLAYBACK',
          description: 'Experience studio quality offline playback and clean response',
          gradient: 'from-[#e57a00] to-[#b83a00]',
          songs: []
        },
        {
          id: 'local-library',
          title: 'Local Library',
          subtitle: 'Aura Music',
          tag: 'SUPPORTED FORMATS',
          description: 'FLAC, ALAC, WAV, AIFF, AAC, MP3, OGG, and more',
          gradient: 'from-[#e52d80] to-[#b21c45]',
          songs: []
        }
      ]
    }

    return shuffled.slice(0, 4)
  }, [librarySongs])

  const handlePlayTopPick = useCallback((card: any) => {
    if (card.songs && card.songs.length > 0) {
      playSongDirect(card.songs[0], card.songs)
    }
  }, [playSongDirect])

  const handlePlaySongDirect = useCallback((song: any) => {
    playSongDirect(song, [song])
  }, [playSongDirect])

  return (
    <div className="w-full flex flex-col gap-10 py-6 pb-28 select-none">

      {/* Title Header */}
      <div className="flex flex-col">
        <h1 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight leading-tight">Home</h1>
      </div>

      {/* Top Picks for You Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[20px] font-bold text-white tracking-tight">Top Picks for You</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topPicks.map((card) => {
            // Dynamically assign designType based on card ID to match Apple Music vector styles
            let designType = 'station-spiral';
            if (card.id === 'heavy-rotation' || card.id === 'by-lyricist' || card.id === 'local-library') {
              designType = 'station-circles';
            } else if (card.id === 'top-artist' || card.id === 'continue-listening') {
              designType = 'station-zen';
            } else if (card.id === 'recently-added' || card.id === 'by-decade') {
              designType = 'station-spiral';
            } else if (card.id === 'library-intelligence' || card.id === 'get-started') {
              designType = 'station-anil';
            } else if (card.id === 'favorite-artists') {
              designType = 'station-heart';
            } else if (card.id === 'ttml-karaoke' || card.id === 'aura-exclusive' || card.id === 'pure-audio') {
              designType = 'station-energy';
            }

            return (
              <div
                key={card.id}
                onClick={() => handlePlayTopPick(card)}
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                className={`group relative rounded-[6px] overflow-hidden aspect-[3/4] p-6 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform-gpu bg-gradient-to-b ${card.gradient}`}
                style={{ contain: 'layout style paint' }}
              >
                {/* Custom SVG Design overlays in the center background */}
                {designType === 'station-anil' && (
                  <svg viewBox="0 0 200 250" className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-50,-20 L20,-20 L105,125 L20,270 L-50,270 L35,125 Z" fill="#d33c52" opacity="0.9" />
                    <path d="M-10,-20 L50,-20 L135,125 L50,270 L-10,270 L65,125 Z" fill="#e66c43" opacity="0.9" />
                    <path d="M30,-20 L90,-20 L175,125 L90,270 L30,270 L105,125 Z" fill="#f49c38" opacity="0.9" />
                    <path d="M70,-20 L220,-20 L220,270 L70,270 L145,125 Z" fill="#fbc531" opacity="0.9" />
                  </svg>
                )}

                {designType === 'station-spiral' && (
                  <svg viewBox="0 0 200 250" className="absolute inset-0 w-full h-full flex items-center justify-center p-6 pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 100, 205
                             C  80, 205   80, 198  100, 198
                             C 125, 198  125, 189  100, 189
                             C  65, 189   65, 177  100, 177
                             C 140, 177  140, 161  100, 161
                             C  50, 161   50, 141  100, 141
                             C 155, 141  155, 115  100, 115
                             C  30, 115   30,  85  100,  85
                             C 175,  85  175,  50  100,  50
                             C  15,  50   15,  20   45,  20"
                          fill="none" stroke="#2fb8fc" strokeWidth="4.5" strokeLinecap="round" opacity="0.85" />
                  </svg>
                )}

                {designType === 'station-circles' && (
                  <svg viewBox="0 0 200 250" className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="115" r="22" stroke="#fbc531" strokeWidth="4.5" fill="none" opacity="0.9" />
                    <circle cx="100" cy="115" r="50" stroke="#fbc531" strokeWidth="4.5" fill="none" opacity="0.8" />
                    <circle cx="100" cy="115" r="78" stroke="#fbc531" strokeWidth="4.5" fill="none" opacity="0.7" />
                  </svg>
                )}

                {designType === 'station-zen' && (
                  <svg viewBox="0 0 200 250" className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="100" cy="70" rx="26" ry="14" stroke="#ffffff" strokeWidth="4.5" fill="none" opacity="0.8" />
                    <ellipse cx="100" cy="115" rx="46" ry="20" stroke="#ffffff" strokeWidth="4.5" fill="none" opacity="0.8" />
                    <ellipse cx="100" cy="170" rx="60" ry="28" stroke="#ffffff" strokeWidth="4.5" fill="none" opacity="0.8" />
                  </svg>
                )}

                {designType === 'station-heart' && (
                  <svg viewBox="0 0 200 250" className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 100 175 
                             C  80 150,  35 120,  35 85 
                             C  35 60,   55 40,   75 40 
                             C  88 40,   96 48,  100 55 
                             C 104 48,  112 40,  125 40 
                             C 145 40,  165 60,  165 85 
                             C 165 120, 120 150, 100 175 Z"
                          stroke="#ffb3d9" strokeWidth="4.5" strokeLinejoin="round" fill="none" opacity="0.85" />
                  </svg>
                )}

                {designType === 'station-energy' && (
                  <svg viewBox="0 0 200 250" className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="120,40 60,130 95,130 70,210 145,115 105,115"
                             stroke="#c7f9cc" strokeWidth="4.5" strokeLinejoin="round" fill="none" opacity="0.85" />
                  </svg>
                )}

                {/* Aura logo & subtitle in top right */}
                <div className="relative z-10 flex items-center justify-end gap-1 text-white/90 text-[11px] font-light select-none tracking-tight">
                  {card.subtitle && card.subtitle.includes('Music') && (
                    <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 text-white shrink-0 fill-current mr-0.5 animate-pulse" aria-hidden="true">
                      <rect x="2" y="16" width="2.4" height="12" rx="1.2" />
                      <rect x="6" y="9.5" width="2.4" height="18.5" rx="1.2" />
                      <rect x="10" y="4.5" width="2.4" height="16" rx="1.2" />
                      <rect x="14" y="0" width="2.4" height="14" rx="1.2" />
                      <rect x="18" y="4.5" width="2.4" height="16" rx="1.2" />
                      <rect x="22" y="9.5" width="2.4" height="18.5" rx="1.2" />
                      <rect x="26" y="16" width="2.4" height="12" rx="1.2" />
                    </svg>
                  )}
                  <span>{card.subtitle}</span>
                </div>

                {/* Bottom Metadata Text */}
                <div className="relative z-10 flex flex-col gap-0.5 select-none w-full pr-2">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-white/70">{card.tag}</span>
                  <h3 className="text-[15px] font-medium text-white/95 leading-tight tracking-tight">
                    {card.title}
                  </h3>
                  <CardMarquee text={card.description} isParentHovered={hoveredCardId === card.id} />
                </div>

                {/* Play Button (black circle with white play arrow, shows on hover, positioned on the middle-right exactly like the screenshot) */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayTopPick(card);
                  }}
                  className="absolute right-5 bottom-[44px] w-9 h-9 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95 z-20 cursor-pointer"
                >
                  <Play size={14} fill="currentColor" className="ml-0.5 text-white" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently Played Section (Only visible if history exists) */}
      {recentlyPlayedSongs.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1 group cursor-pointer w-fit">
            <h2 className="text-[20px] font-bold text-white tracking-tight group-hover:text-white transition-colors duration-150">
              Recently Played
            </h2>
            <ChevronRight size={22} className="text-zinc-500 group-hover:text-white transition-colors duration-150 mt-0.5" />
          </div>

          {/* Square Song Grid — Enforced exactly 5 in a line */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-7">
            {recentlyPlayedSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => handlePlaySongDirect(song)}
                className="flex flex-col group cursor-pointer transform-gpu"
                style={{ contain: 'layout style paint' }}
              >
                <div className="relative aspect-square w-full rounded-[6px] overflow-hidden bg-zinc-900 border border-white/[0.06] shadow-md transition-shadow duration-300 group-hover:shadow-xl">
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <Disc size={40} className="text-zinc-700" />
                    </div>
                  )}

                  {/* Hover Play and Menu Overlays */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlaySongDirect(song)
                      }}
                      className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-colors duration-150 cursor-pointer"
                    >
                      <Play size={14} fill="white" className="ml-0.5 text-white" />
                    </button>

                    <button
                      onClick={(e) => handleSongOptionsClick(e, song)}
                      className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-colors duration-150 cursor-pointer"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col mt-2.5 min-w-0">
                  <span className="text-[12px] font-bold text-zinc-100 truncate block leading-snug group-hover:text-white transition-colors duration-150">
                    {song.title}
                  </span>
                  <span className="text-[10.5px] text-zinc-400 font-light truncate mt-0.5 leading-snug">
                    {song.artist}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Song Context Menu Portal */}
      {songMenuCoords && activeSong && (
        <SongContextMenu
          song={activeSong}
          coords={songMenuCoords}
          onClose={() => {
            setSongMenuCoords(null)
            setActiveSong(null)
          }}
        />
      )}
    </div>
  )
}

export default ListenNow
