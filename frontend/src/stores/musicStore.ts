import { create } from 'zustand'
import { Song, Album, Playlist } from '../types/music'

interface MusicState {
  currentTab: string
  selectedAlbum: Album | null
  selectedPlaylist: Playlist | null
  playingSong: Song | null
  showAmbientGlow: boolean
  
  setCurrentTab: (tab: string) => void
  setSelectedAlbum: (album: Album | null) => void
  setSelectedPlaylist: (playlist: Playlist | null) => void
  setPlayingSong: (song: Song | null) => void
  setShowAmbientGlow: (show: boolean) => void
}

export const useMusicStore = create<MusicState>((set) => ({
  currentTab: 'listen-now',
  selectedAlbum: null,
  selectedPlaylist: null,
  playingSong: null,
  showAmbientGlow: localStorage.getItem('aura-ambient-glow') !== 'false',

  setCurrentTab: (tab) => set({ currentTab: tab, selectedAlbum: null, selectedPlaylist: null }),
  setSelectedAlbum: (album) => set({ selectedAlbum: album, selectedPlaylist: null, currentTab: 'album-detail' }),
  setSelectedPlaylist: (playlist) => set({ selectedPlaylist: playlist, selectedAlbum: null, currentTab: 'playlist-detail' }),
  setPlayingSong: (song) => set({ playingSong: song }),
  setShowAmbientGlow: (show) => {
    localStorage.setItem('aura-ambient-glow', String(show))
    set({ showAmbientGlow: show })
  },
}))
