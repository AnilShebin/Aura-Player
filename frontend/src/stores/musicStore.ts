import { create } from 'zustand'
import { Song, Album, Playlist } from '../types/music'

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
}

export const useMusicStore = create<MusicState>((set) => ({
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
    set({ 
      playingSong: song, 
      playQueue: queue, 
      currentQueueIndex: idx !== -1 ? idx : 0 
    })
  },
  setAuthInfo: (info) => set({ isLoggedIn: info.loggedIn, username: info.username }),
  triggerToast: (message, type) => console.log(`Toast (${type}): ${message}`),
  seekSong: (time) => set({ currentTime: time }),
  setShowTranslation: (show) => set({ showTranslation: show }),
}))
