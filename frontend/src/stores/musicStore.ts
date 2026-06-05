import { create } from 'zustand'
import { Song, Album, Playlist } from '../types/music'
import * as PlayerService from '../services/playbackService'
import * as LyricsService from '../services/lyricsService'

interface MusicState {
  currentTab: string
  selectedAlbum: Album | null
  selectedPlaylist: Playlist | null
  playingSong: Song | null
  showAmbientGlow: boolean
  sidebarCollapsed: boolean
  showLyrics: boolean
  showQueue: boolean
  playQueue: Song[]
  currentQueueIndex: number
  isLoggedIn: boolean
  username: string
  currentTime: number
  isPlaying: boolean
  showOriginal: boolean
  showTranslation: boolean
  lyrics: any[]
  volume: number
  isShuffle: boolean
  repeatMode: 'off' | 'all' | 'one'
  isMuted: boolean
  duration: number
  isMaximized: boolean
  librarySongs: Song[]
  toggleFavorite: (songId: string) => void
  setIsMaximized: (maximized: boolean) => void
  setCurrentTab: (tab: string) => void
  setSelectedAlbum: (album: Album | null) => void
  setSelectedPlaylist: (playlist: Playlist | null) => void
  setPlayingSong: (song: Song | null) => void
  setShowAmbientGlow: (show: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setShowLyrics: (show: boolean) => void
  setShowQueue: (show: boolean) => void
  playSongDirect: (song: Song, queue: Song[]) => void
  setAuthInfo: (info: { loggedIn: boolean; sessionActive: boolean; username: string }) => void
  triggerToast: (message: string, type: 'success' | 'error') => void
  seekSong: (time: number) => void
  setShowTranslation: (show: boolean) => void
  setVolume: (volume: number) => void
  setIsShuffle: (isShuffle: boolean) => void
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void
  setIsMuted: (isMuted: boolean) => void
  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void
  handlePlayPause: () => void
  handleNextTrack: () => void
  handlePrevTrack: () => void
  fetchLyrics: (song: Song) => void
  setIsPlaying: (isPlaying: boolean) => void
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTab: 'listen-now',
  selectedAlbum: null,
  selectedPlaylist: null,
  playingSong: null,
  showAmbientGlow: localStorage.getItem('aura-ambient-glow') !== 'false',
  sidebarCollapsed: localStorage.getItem('aura-sidebar-collapsed') === 'true',
  showLyrics: false,
  showQueue: false,
  playQueue: [],
  currentQueueIndex: 0,
  isLoggedIn: true,
  username: 'Aura Premium User',
  currentTime: 0,
  isPlaying: false,
  showOriginal: true,
  showTranslation: false,
  lyrics: [],
  volume: 0.8,
  isShuffle: false,
  repeatMode: 'off',
  isMuted: false,
  duration: 0,
  isMaximized: false,
  librarySongs: [
    {
      id: "fav-1",
      title: "Oorum Blood",
      artist: "Sai Abhyankkar, bebhumika, Deepthi Suresh & Pa. Vijay",
      albumId: "dude",
      albumTitle: "Dude (Original Motion Picture Soundtrack)",
      duration: "4:00",
      durationSeconds: 240,
      coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    },
    {
      id: "fav-2",
      title: "Unnaale Unnaale",
      artist: "Karthik, Krish, Harini & Pa. Vijay",
      albumId: "unnale-unnale",
      albumTitle: "Unnale Unnale (Original Motion Picture Soundtrack)",
      duration: "4:43",
      durationSeconds: 283,
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    },
    {
      id: "fav-3",
      title: "Adi Penne (From Naam Series)",
      artist: "Stephen Zechariah, T Suriavelan & Srinisha",
      albumId: "adi-penne",
      albumTitle: "Adi Penne (Duet) [From Naam Series]",
      duration: "5:02",
      durationSeconds: 302,
      coverUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    },
    {
      id: "fav-4",
      title: "Sithira Puthiri (From \"Think Indie\")",
      artist: "Sai Abhyankkar & Vivek",
      albumId: "sithira-puthiri",
      albumTitle: "Sithira Puthiri (From \"Think Indie\") - Single",
      duration: "3:46",
      durationSeconds: 226,
      coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    },
    {
      id: "fav-5",
      title: "Katchi Sera (From \"Think Indie\")",
      artist: "Sai Abhyankkar",
      albumId: "katchi-sera",
      albumTitle: "Katchi Sera (From \"Think Indie\") - Single",
      duration: "3:02",
      durationSeconds: 182,
      coverUrl: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    },
    {
      id: "fav-6",
      title: "Aasa Kooda (From \"Think Indie\")",
      artist: "Sai Abhyankkar & Sai Smriti",
      albumId: "aasa-kooda",
      albumTitle: "Aasa Kooda (From \"Think Indie\") - Single",
      duration: "3:36",
      durationSeconds: 216,
      coverUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    },
    {
      id: "fav-7",
      title: "Vaadi Pulla Vaadi",
      artist: "Hiphop Tamizha",
      albumId: "vaadi-pulla-vaadi",
      albumTitle: "Vaadi Pulla Vaadi - Single",
      duration: "4:07",
      durationSeconds: 247,
      coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    },
    {
      id: "fav-8",
      title: "Iraiva",
      artist: "Hiphop Tamizha",
      albumId: "iraiva",
      albumTitle: "Hiphop Tamizhan",
      duration: "4:38",
      durationSeconds: 278,
      coverUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    },
    {
      id: "fav-9",
      title: "Clubbula Mabbula",
      artist: "Hiphop Tamizha",
      albumId: "clubbula-mabbula",
      albumTitle: "Hiphop Tamizhan",
      duration: "3:34",
      durationSeconds: 214,
      coverUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
      audioUrl: "",
      playlists: [],
      isFavorite: true
    }
  ],

  toggleFavorite: (songId) => set((state) => {
    const updatedSongs = state.librarySongs.map(s => 
      s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s
    )
    const isPlayingUpdated = state.playingSong && state.playingSong.id === songId
    return {
      librarySongs: updatedSongs,
      playingSong: isPlayingUpdated 
        ? { ...state.playingSong!, isFavorite: !state.playingSong!.isFavorite }
        : state.playingSong
    }
  }),

  setIsMaximized: (maximized) => set({ isMaximized: maximized }),
  setCurrentTab: (tab) => set({ currentTab: tab, selectedAlbum: null, selectedPlaylist: null }),
  setSelectedAlbum: (album) => set({ selectedAlbum: album, selectedPlaylist: null, currentTab: 'album-detail' }),
  setSelectedPlaylist: (playlist) => set({ selectedPlaylist: playlist, selectedAlbum: null, currentTab: 'playlist-detail' }),
  setPlayingSong: (song) => set({ playingSong: song }),
  setShowAmbientGlow: (show) => {
    localStorage.setItem('aura-ambient-glow', String(show))
    set({ showAmbientGlow: show })
  },
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('aura-sidebar-collapsed', String(collapsed))
    set({ sidebarCollapsed: collapsed })
  },
  setShowLyrics: (show) => set((state) => ({ 
    showLyrics: show, 
    showQueue: show ? false : state.showQueue 
  })),
  setShowQueue: (show) => set((state) => ({ 
    showQueue: show, 
    showLyrics: show ? false : state.showLyrics 
  })),
  playSongDirect: (song, queue) => {
    const idx = queue.findIndex(s => (s.id || s.filePath) === (song.id || song.filePath))

    // Trigger native libmpv playback via backend
    if (song.filePath) {
      PlayerService.SetVolume(get().volume).catch(() => {})
      PlayerService.Play(song.filePath).catch((err) => {
        console.error('[PlaybackService] Failed to play:', err)
      })
    }

    set({
      playingSong: song,
      playQueue: queue,
      currentQueueIndex: idx !== -1 ? idx : 0,
      isPlaying: true,
      currentTime: 0,
      lyrics: []
    })

    // Fetch lyrics asynchronously after state update
    get().fetchLyrics(song)
  },
  setAuthInfo: (info) => set({ isLoggedIn: info.loggedIn, username: info.username }),
  triggerToast: (message, type) => console.log(`Toast (${type}): ${message}`),
  seekSong: (time) => {
    set({ currentTime: time })
    PlayerService.Seek(time).catch(() => {})
  },
  setShowTranslation: (show) => set({ showTranslation: show }),
  setVolume: (volume) => {
    set({ volume })
    PlayerService.SetVolume(volume).catch(() => {})
  },
  setIsShuffle: (isShuffle) => set({ isShuffle }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setIsMuted: (isMuted) => {
    set({ isMuted })
    const vol = isMuted ? 0 : get().volume
    PlayerService.SetVolume(vol).catch(() => {})
  },
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (time) => set({ currentTime: time }),
  handlePlayPause: () => {
    const { isPlaying, playingSong } = get()
    if (!playingSong) return
    if (isPlaying) {
      PlayerService.Pause().catch((err) => console.error(err))
    } else {
      PlayerService.Resume().catch((err) => console.error(err))
    }
  },
  handleNextTrack: () => {
    const { playQueue, currentQueueIndex, repeatMode, isShuffle, playingSong } = get()
    if (playQueue.length === 0) return

    if (repeatMode === 'one' && playingSong?.filePath) {
      PlayerService.Play(playingSong.filePath).catch(() => {})
      set({ currentTime: 0, isPlaying: true })
      return
    }

    let nextIdx: number
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * playQueue.length)
    } else {
      nextIdx = currentQueueIndex + 1
      if (nextIdx >= playQueue.length) {
        if (repeatMode === 'all') {
          nextIdx = 0
        } else {
          PlayerService.Pause().catch(() => {})
          set({ isPlaying: false, currentTime: 0 })
          return
        }
      }
    }

    const nextSong = playQueue[nextIdx]
    if (nextSong?.filePath) {
      PlayerService.SetVolume(get().volume).catch(() => {})
      PlayerService.Play(nextSong.filePath).catch(() => {})
    }
    set({
      playingSong: nextSong,
      currentQueueIndex: nextIdx,
      currentTime: 0,
      isPlaying: true,
      lyrics: []
    })
    if (nextSong) get().fetchLyrics(nextSong)
  },
  handlePrevTrack: () => {
    const { playQueue, currentQueueIndex, isShuffle, currentTime, playingSong } = get()
    if (playQueue.length === 0) return

    // If more than 3 seconds in, restart current track
    if (currentTime > 3 && playingSong?.filePath) {
      PlayerService.Seek(0).catch(() => {})
      set({ currentTime: 0 })
      return
    }

    let prevIdx: number
    if (isShuffle) {
      prevIdx = Math.floor(Math.random() * playQueue.length)
    } else {
      prevIdx = (currentQueueIndex - 1 + playQueue.length) % playQueue.length
    }

    const prevSong = playQueue[prevIdx]
    if (prevSong?.filePath) {
      PlayerService.SetVolume(get().volume).catch(() => {})
      PlayerService.Play(prevSong.filePath).catch(() => {})
    }
    set({
      playingSong: prevSong,
      currentQueueIndex: prevIdx,
      currentTime: 0,
      isPlaying: true,
      lyrics: []
    })
    if (prevSong) get().fetchLyrics(prevSong)
  },
  fetchLyrics: (song) => {
    if (!song?.filePath) return
    LyricsService.GetLyrics(song.filePath)
      .then((result) => {
        // Only apply if this song is still the playing song
        const current = get().playingSong
        if (current?.filePath === song.filePath) {
          set({ lyrics: result?.lines || [] })
        }
      })
      .catch((err) => {
        console.error('[LyricsService] Failed to fetch lyrics:', err)
        set({ lyrics: [] })
      })
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}))
