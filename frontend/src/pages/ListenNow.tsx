import React, { useMemo, useCallback, useState } from 'react'
import { Play, ChevronRight, MoreHorizontal, Disc } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { SongContextMenu } from '@/components/songs/SongContextMenu'

export const ListenNow: React.FC = () => {
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const librarySongs = useMusicStore(state => state.librarySongs)
  const playingSong = useMusicStore(state => state.playingSong)

  const [songMenuCoords, setSongMenuCoords] = useState<{ top: number; left: number } | null>(null)
  const [activeSong, setActiveSong] = useState<any>(null)

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
          {topPicks.map((card) => (
            <div
              key={card.id}
              onClick={() => handlePlayTopPick(card)}
              className={`group relative rounded-[6px] overflow-hidden aspect-[3/4] p-6 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform-gpu bg-gradient-to-b ${card.gradient}`}
              style={{ contain: 'layout style paint' }}
            >
              {card.backgroundImage && (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-45"
                    style={{ backgroundImage: `url('${card.backgroundImage}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
                </>
              )}

              <div className="z-10 flex items-center justify-end gap-1 text-white/95 text-xs font-semibold select-none">
                {card.subtitle.includes('Music') && (
                  <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 text-white shrink-0 fill-current mr-0.5" aria-hidden="true">
                    <rect x="2" y="16" width="2.4" height="12" rx="1.2" />
                    <rect x="6" y="9.5" width="2.4" height="18.5" rx="1.2" />
                    <rect x="10" y="4.5" width="2.4" height="16" rx="1.2" />
                    <rect x="14" y="0" width="2.4" height="14" rx="1.2" />
                    <rect x="18" y="4.5" width="2.4" height="16" rx="1.2" />
                    <rect x="22" y="9.5" width="2.4" height="18.5" rx="1.2" />
                    <rect x="26" y="16" width="2.4" height="12" rx="1.2" />
                  </svg>
                )}
                <span>{card.subtitle.replace('', '').trim()}</span>
              </div>

              {card.avatars && (
                <div className="my-auto relative w-36 h-28 mx-auto z-10 flex items-center justify-center">
                  <div className="absolute left-2 w-14 h-14 rounded-full overflow-hidden border-2 border-orange-400 shadow-lg">
                    <img src={card.avatars[0]} className="object-cover w-full h-full" loading="lazy" />
                  </div>
                  <div className="absolute right-2 w-14 h-14 rounded-full overflow-hidden border-2 border-orange-400 shadow-lg">
                    <img src={card.avatars[1]} className="object-cover w-full h-full" loading="lazy" />
                  </div>
                  <div className="absolute top-0 w-16 h-16 rounded-full overflow-hidden border-2 border-orange-400 shadow-lg">
                    <img src={card.avatars[2]} className="object-cover w-full h-full" loading="lazy" />
                  </div>
                </div>
              )}

              {card.isStation && (
                <div className="my-auto flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-24 h-24 text-white drop-shadow-xl opacity-90">
                    <polygon points="25,15 75,50 25,85" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    <polygon points="50,30 75,50 50,70" fill="currentColor" />
                  </svg>
                </div>
              )}

              {!card.avatars && !card.isStation && !card.backgroundImage && (
                <div className="my-auto flex flex-col items-center justify-center text-center z-10">
                  <h3 className="text-[32px] font-black text-white leading-none tracking-tight break-words max-w-full">
                    {card.title}
                  </h3>
                </div>
              )}

              <div className="z-10 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">{card.tag}</span>
                <p className="text-xs text-white font-medium line-clamp-2 leading-tight">
                  {card.description}
                </p>
              </div>

              <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 active:scale-95 z-20">
                <Play size={20} fill="currentColor" className="ml-0.5" />
              </div>
            </div>
          ))}
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
                      loading="lazy"
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
