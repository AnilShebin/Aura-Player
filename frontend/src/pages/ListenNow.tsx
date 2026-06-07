import React, { useMemo, useCallback } from 'react'
import { Play, ChevronRight, MoreHorizontal, Disc } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'

const RECENTLY_PLAYED = [
  {
    id: "rp-1",
    title: "Kireedam (Original Motion Picture Soundtrack) - EP",
    artist: "G. V. Prakash Kumar / Various",
    coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop"
  },
  {
    id: "rp-2",
    title: "Indru Netru Naalai (Original Motion Picture Soundtrack)",
    artist: "Hiphop Tamizha",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop"
  },
  {
    id: "rp-3",
    title: "I (Original Motion Picture Soundtrack)",
    artist: "A. R. Rahman",
    coverUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop"
  },
  {
    id: "rp-4",
    title: "Hey Minnale (From \"Amaran\") - Single",
    artist: "G. V. Prakash Kumar & Haricharan",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop"
  },
  {
    id: "rp-5",
    title: "Lutt Putt Gaya (From \"Dunki\") - Single",
    artist: "Pritam & Arijit Singh",
    coverUrl: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=400&h=400&fit=crop"
  }
]

const getRecentlyPlayedSongs = (albumId: string, albumTitle: string, artist: string, coverUrl: string) => {
  if (albumTitle.includes('Kireedam')) {
    return [
      { id: 'kireedam-1', title: 'Akkam Pakkam', artist: 'Sadhana Sargam', albumId, albumTitle, duration: '5:16', durationSeconds: 316, coverUrl, audioUrl: '', playlists: [] },
      { id: 'kireedam-2', title: 'Kanavellaam', artist: 'Jey Chandhran, Karthik', albumId, albumTitle, duration: '5:15', durationSeconds: 315, coverUrl, audioUrl: '', playlists: [] },
      { id: 'kireedam-3', title: 'Kanneer Thuliye', artist: 'Vijay Yesudas', albumId, albumTitle, duration: '5:22', durationSeconds: 322, coverUrl, audioUrl: '', playlists: [] },
      { id: 'kireedam-4', title: 'Theme Music', artist: 'Jey Chandhran, Karthik', albumId, albumTitle, duration: '4:23', durationSeconds: 263, coverUrl, audioUrl: '', playlists: [] },
      { id: 'kireedam-5', title: 'Vilayaadu Vilayaadu', artist: 'Shankar Mahadevan', albumId, albumTitle, duration: '4:10', durationSeconds: 250, coverUrl, audioUrl: '', playlists: [] },
      { id: 'kireedam-6', title: 'Vizhiyil', artist: 'Sonu Nigam, Swetha', albumId, albumTitle, duration: '4:48', durationSeconds: 288, coverUrl, audioUrl: '', playlists: [] },
    ]
  }
  return [
    { id: `${albumId}-t1`, title: 'Track 1', artist, albumId, albumTitle, duration: '4:00', durationSeconds: 240, coverUrl, audioUrl: '', playlists: [] },
    { id: `${albumId}-t2`, title: 'Track 2', artist, albumId, albumTitle, duration: '3:45', durationSeconds: 225, coverUrl, audioUrl: '', playlists: [] },
  ]
}

export const ListenNow: React.FC = () => {
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const setSelectedAlbum = useMusicStore(state => state.setSelectedAlbum)
  const librarySongs = useMusicStore(state => state.librarySongs)
  const libraryAlbums = useMusicStore(state => state.libraryAlbums)

  // Compute recently played albums based on scanned library, falling back to mock details if empty
  const recentlyPlayedAlbums = useMemo(() => {
    if (!libraryAlbums || libraryAlbums.length === 0) {
      return RECENTLY_PLAYED.map(item => ({
        ...item,
        year: '2024',
        genre: 'Tamil Soundtracks',
        songs: getRecentlyPlayedSongs(item.id, item.title, item.artist, item.coverUrl)
      }))
    }

    return libraryAlbums.map(album => ({
      id: album.id,
      title: album.title,
      artist: album.albumArtist || 'Unknown Artist',
      coverUrl: album.coverUrl || '',
      year: album.year || '2026',
      genre: album.genre || 'Local Audio',
      songs: album.songs || []
    })).slice(0, 5)
  }, [libraryAlbums])

  const handlePlayCollection = useCallback((title: string) => {
    if (title === "Recently Played" && recentlyPlayedAlbums.length > 0) {
      const firstAlbum = recentlyPlayedAlbums[0]
      if (firstAlbum.songs && firstAlbum.songs.length > 0) {
        playSongDirect(firstAlbum.songs[0], firstAlbum.songs)
      }
      return
    }

    const queue = librarySongs.length > 0 ? librarySongs : RECENTLY_PLAYED.map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      albumId: s.id,
      albumTitle: s.title,
      duration: "4:00",
      durationSeconds: 240,
      coverUrl: s.coverUrl,
      audioUrl: "",
      playlists: []
    }))
    playSongDirect(queue[0], queue)
  }, [librarySongs, recentlyPlayedAlbums, playSongDirect])

  const handleCardClick = useCallback((album: any) => {
    setSelectedAlbum({
      id: album.id,
      title: album.title,
      artist: album.artist,
      coverUrl: album.coverUrl,
      year: album.year || '2026',
      genre: album.genre || 'Local Audio',
      songs: album.songs,
      codec: album.codec || 'Unknown',
      quality: album.quality || 'High Quality'
    })
  }, [setSelectedAlbum])

  const handlePlayAlbumDirect = useCallback((album: any) => {
    if (album.songs && album.songs.length > 0) {
      playSongDirect(album.songs[0], album.songs)
    }
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

          {/* Card 1: Heavy Rotation */}
          <div
            onClick={() => handlePlayCollection("Heavy Rotation")}
            className="group relative rounded-lg overflow-hidden aspect-[3/4] bg-gradient-to-b from-[#fa7c30] to-[#fa586a] p-6 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300 transform-gpu"
            style={{ contain: 'layout style paint' }}
          >
            <div className="flex justify-end text-white/90 text-xs font-semibold select-none">
               Music
            </div>

            <div className="my-auto flex flex-col items-center justify-center text-center">
              <h3 className="text-[42px] font-black text-white leading-none tracking-tight">
                Heavy
              </h3>
              <h3 className="text-[42px] font-black text-white leading-none tracking-tight mt-1">
                Rotation
              </h3>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Made for You</span>
              <p className="text-xs text-white font-medium line-clamp-2 leading-tight">
                Your scanned library files and favorite recommendations
              </p>
            </div>

            <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 active:scale-95 z-20">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </div>
          </div>

          {/* Card 2: Valiant */}
          <div
            onClick={() => handlePlayCollection("Valiant")}
            className="group relative rounded-lg overflow-hidden aspect-[3/4] bg-[#121212] border border-white/5 p-6 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300 transform-gpu"
            style={{ contain: 'layout style paint' }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-45"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=800&fit=crop')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

            <div className="z-10 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#d8c395] leading-none">ILAIYARAASA</span>
            </div>

            <div className="z-10 my-auto flex flex-col items-center justify-center text-center">
              <h3 className="text-[34px] font-extrabold text-[#faecce] leading-none tracking-tighter uppercase font-serif">
                Valiant
              </h3>
              <span className="text-[10px] font-semibold text-[#ebd7b1] tracking-widest uppercase mt-2 border-t border-[#d8c395]/45 pt-1.5 px-3">
                Symphony Number 1
              </span>
            </div>

            <div className="z-10 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d8c395]">New Release</span>
              <h4 className="text-xs text-white font-semibold line-clamp-1 leading-none">
                Ilaiyaraaja's Symphony Number 1 - Valiant
              </h4>
              <p className="text-[11px] text-zinc-400 leading-none mt-1">Ilaiyaraaja</p>
            </div>

            <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 active:scale-95 z-20">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </div>
          </div>

          {/* Card 3: Anirudh Feature Station */}
          <div
            onClick={() => handlePlayCollection("Featuring Anirudh")}
            className="group relative rounded-lg overflow-hidden aspect-[3/4] bg-gradient-to-b from-[#e57a00] to-[#b83a00] p-6 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300 transform-gpu"
            style={{ contain: 'layout style paint' }}
          >
            <div className="flex justify-end text-white/90 text-xs font-semibold select-none">
               Music
            </div>

            <div className="my-auto relative w-36 h-28 mx-auto z-10 flex items-center justify-center">
              <div className="absolute left-2 w-14 h-14 rounded-full overflow-hidden border-2 border-orange-400 shadow-lg">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" className="object-cover w-full h-full" loading="lazy" />
              </div>
              <div className="absolute right-2 w-14 h-14 rounded-full overflow-hidden border-2 border-orange-400 shadow-lg">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" className="object-cover w-full h-full" loading="lazy" />
              </div>
              <div className="absolute top-0 w-16 h-16 rounded-full overflow-hidden border-2 border-orange-400 shadow-lg">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop" className="object-cover w-full h-full" loading="lazy" />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Featuring Anirudh Ravichander</span>
              <p className="text-xs text-white font-bold line-clamp-1 leading-tight">
                Anirudh Ravichander & Similar Artists
              </p>
            </div>

            <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </div>
          </div>

          {/* Card 4: Station */}
          <div
            onClick={() => handlePlayCollection("Anil Shebin's Station")}
            className="group relative rounded-lg overflow-hidden aspect-[3/4] bg-gradient-to-b from-[#e52d80] to-[#b21c45] p-6 flex flex-col justify-between cursor-pointer shadow-lg transition-shadow duration-300 transform-gpu"
            style={{ contain: 'layout style paint' }}
          >
            <div className="flex justify-end text-white/90 text-xs font-semibold select-none">
               Music
            </div>

            <div className="my-auto flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-24 h-24 text-white drop-shadow-xl opacity-90">
                <polygon points="25,15 75,50 25,85" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="50,30 75,50 50,70" fill="currentColor" />
              </svg>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Made for You</span>
              <p className="text-xs text-white font-bold line-clamp-1 leading-tight">
                Anil Shebin's Station
              </p>
            </div>

            <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </div>
          </div>

        </div>
      </div>

      {/* Recently Played Section */}
      <div className="flex flex-col gap-4">
        <div
          onClick={() => handlePlayCollection("Recently Played")}
          className="flex items-center gap-1 group cursor-pointer w-fit"
        >
          <h2 className="text-[20px] font-bold text-white tracking-tight group-hover:text-white transition-colors duration-150">
            Recently Played
          </h2>
          <ChevronRight size={22} className="text-zinc-500 group-hover:text-white transition-colors duration-150 mt-0.5" />
        </div>

        {/* Square Album Grid — Enforced exactly 5 in a line */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-7">
          {recentlyPlayedAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => handleCardClick(album)}
              className="flex flex-col group cursor-pointer transform-gpu"
              style={{ contain: 'layout style paint' }}
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06] shadow-md transition-shadow duration-300 group-hover:shadow-xl">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
                      handlePlayAlbumDirect(album)
                    }}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-colors duration-150 cursor-pointer"
                  >
                    <Play size={14} fill="white" className="ml-0.5 text-white" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-colors duration-150 cursor-pointer"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col mt-2.5 min-w-0">
                <span className="text-[12px] font-bold text-zinc-100 truncate block leading-snug group-hover:text-white transition-colors duration-150">
                  {album.title}
                </span>
                <span className="text-[10.5px] text-zinc-400 font-light truncate mt-0.5 leading-snug">
                  {album.artist}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
export default ListenNow
