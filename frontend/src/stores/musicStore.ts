import { create } from 'zustand'
import { Song, Album, Playlist } from '../types/music'
import { AlbumSummary } from '../services/libraryService'
import * as PlayerService from '../services/playbackService'
import * as LyricsService from '../services/lyricsService'
import * as UpdaterService from '../services/updaterService'

const addToRecentlyPlayed = (song: Song) => {
  if (!song || !song.id) return
  try {
    const historyStr = localStorage.getItem('aura-recently-played-songs')
    let history: Song[] = historyStr ? JSON.parse(historyStr) : []
    history = history.filter(s => s.id !== song.id)
    history.unshift(song)
    if (history.length > 15) {
      history = history.slice(0, 15)
    }
    localStorage.setItem('aura-recently-played-songs', JSON.stringify(history))
  } catch (e) {
    console.error('Failed to update recently played history:', e)
  }
}

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
  rawLyricsResult: LyricsService.LyricsResult | null
  lyricsOffset: number
  setLyricsOffset: (offset: number) => void
  lyricsSource: string | null
  fetchOnlineLyrics: (song: Song) => void
  lyricsLoading: boolean
  saveCustomLyrics: (song: Song, text: string) => Promise<void>
  packLyrics: (song: Song, text: string, source?: string) => Promise<void>
  forcePlain: boolean
  setForcePlain: (force: boolean) => void
  volume: number
  isShuffle: boolean
  repeatMode: 'off' | 'all' | 'one'
  isMuted: boolean
  duration: number
  isMaximized: boolean
  showFullscreenPlayer: boolean
  librarySongs: Song[]
  libraryAlbums: AlbumSummary[]
  playlists: Playlist[]
  createPlaylist: (name: string, coverUrl?: string, description?: string) => void
  updatePlaylist: (id: string, name: string, description: string, coverUrl?: string) => void
  deletePlaylist: (id: string) => void
  addSongToPlaylist: (playlistId: string, song: Song) => void
  removeSongFromPlaylist: (playlistId: string, songId: string) => void
  toggleFavorite: (songId: string) => void
  setIsMaximized: (maximized: boolean) => void
  setShowFullscreenPlayer: (show: boolean) => void
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
  clearPlayQueue: () => void
  removeFromPlayQueue: (index: number) => void
  isCreatePlaylistOpen: boolean
  createPlaylistCallback: ((playlistId: string) => void) | null
  setCreatePlaylistOpen: (open: boolean, callback?: ((playlistId: string) => void) | null) => void
  isPropertiesOpen: boolean
  propertiesSong: Song | null
  setPropertiesOpen: (open: boolean, song: Song | null) => void
  updateSongMetadata: (songId: string, updates: Partial<Song>) => void
  autoCheckUpdates: boolean
  autoDownloadUpdates: boolean
  updateChannel: 'stable' | 'beta'
  isUpdateAvailable: boolean
  latestUpdateInfo: UpdaterService.UpdateInfo | null
  isCheckingForUpdates: boolean
  isDownloadingUpdate: boolean
  updateError: string | null
  showUpdateDialog: boolean
  setUpdateSettings: (settings: Partial<{ autoCheckUpdates: boolean; autoDownloadUpdates: boolean; updateChannel: 'stable' | 'beta' }>) => void
  checkForUpdates: (manual: boolean) => Promise<void>
  downloadAndInstallLatestUpdate: () => Promise<void>
  setUpdateDialog: (show: boolean) => void
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTab: 'listen-now',
  selectedAlbum: null,
  selectedPlaylist: null,
  isCreatePlaylistOpen: false,
  createPlaylistCallback: null,
  setCreatePlaylistOpen: (open, callback = null) => set({ isCreatePlaylistOpen: open, createPlaylistCallback: callback }),
  isPropertiesOpen: false,
  propertiesSong: null,
  setPropertiesOpen: (open, song) => set({ isPropertiesOpen: open, propertiesSong: song }),
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
  rawLyricsResult: null,
  lyricsOffset: 0,
  setLyricsOffset: (offset) => set({ lyricsOffset: offset }),
  lyricsSource: null,
  lyricsLoading: false,
  forcePlain: false,
  setForcePlain: (force) => set({ forcePlain: force }),
  volume: 0.8,
  isShuffle: false,
  repeatMode: 'off',
  isMuted: false,
  duration: 0,
  isMaximized: false,
  showFullscreenPlayer: false,
  librarySongs: [],
  libraryAlbums: [],
  playlists: (() => {
    try {
      const saved = localStorage.getItem('aura-playlists')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.length > 0) {
          // Filter out old mock hardcoded playlist IDs (playlist-1 to playlist-8)
          const mockIds = ['playlist-1', 'playlist-2', 'playlist-3', 'playlist-4', 'playlist-5', 'playlist-6', 'playlist-7', 'playlist-8']
          const cleaned = parsed.filter((p: any) => !mockIds.includes(p.id))
          if (!cleaned.some((p: any) => p.id === 'favs')) {
            cleaned.unshift({ id: 'favs', name: 'Favourite Songs', coverUrl: 'fav-star', description: 'Your favorite tracks', songs: [] })
          }
          return cleaned
        }
      }
    } catch (e) {}

    return [
      { id: 'favs', name: 'Favourite Songs', coverUrl: 'fav-star', description: 'Your favorite tracks', songs: [] }
    ]
  })(),

  createPlaylist: (name, coverUrl, description) => set((state) => {
    const defaultGradients = [
      'linear-gradient(135deg, #a5d8ff 0%, #000000 100%)', // Light blue to black (Christian)
      'linear-gradient(135deg, #ffd8a8 0%, #000000 100%)', // Light peach to black (English)
      'linear-gradient(135deg, #e9ecef 0%, #000000 100%)', // Light gray to black (Hindi)
      'linear-gradient(135deg, #f8f9fa 0%, #1e1e24 100%)', // Light pinkish-white to dark gray/black (Love)
      'linear-gradient(135deg, #f3d9fa 0%, #000000 100%)', // Light purple to black (night vibes)
      'linear-gradient(135deg, #d3f9d8 0%, #000000 100%)', // Light green to black
      'linear-gradient(135deg, #ffc9c9 0%, #000000 100%)', // Light pink/red to black
      'linear-gradient(135deg, #ffdeeb 0%, #000000 100%)'  // Light hot-pink to black
    ]
    const newId = 'playlist-' + Date.now()
    const newPlaylist = {
      id: newId,
      name,
      coverUrl: coverUrl || defaultGradients[Math.floor(Math.random() * defaultGradients.length)],
      description: description || '',
      songs: []
    }
    const updated = [...state.playlists, newPlaylist]
    localStorage.setItem('aura-playlists', JSON.stringify(updated))

    // Call callback if exists
    if (state.createPlaylistCallback) {
      setTimeout(() => {
        state.createPlaylistCallback?.(newId)
      }, 50)
    }

    return { 
      playlists: updated,
      createPlaylistCallback: null // reset callback
    }
  }),

  updatePlaylist: (id, name, description, coverUrl) => set((state) => {
    const updated = state.playlists.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          name, 
          description, 
          coverUrl: coverUrl !== undefined ? coverUrl : p.coverUrl 
        }
      }
      return p
    })
    localStorage.setItem('aura-playlists', JSON.stringify(updated))
    const updatedSelected = state.selectedPlaylist && state.selectedPlaylist.id === id
      ? updated.find(p => p.id === id) || null
      : state.selectedPlaylist
    return { playlists: updated, selectedPlaylist: updatedSelected }
  }),

  deletePlaylist: (id) => set((state) => {
    const updated = state.playlists.filter(p => p.id !== id)
    localStorage.setItem('aura-playlists', JSON.stringify(updated))
    return { 
      playlists: updated, 
      selectedPlaylist: state.selectedPlaylist?.id === id ? null : state.selectedPlaylist,
      currentTab: state.selectedPlaylist?.id === id ? 'playlists' : state.currentTab 
    }
  }),

  addSongToPlaylist: (playlistId, song) => set((state) => {
    const updated = state.playlists.map(p => {
      if (p.id === playlistId) {
        if (p.songs.some(s => (s.id || s.filePath) === (song.id || song.filePath))) return p
        return { ...p, songs: [...p.songs, song] }
      }
      return p
    })
    localStorage.setItem('aura-playlists', JSON.stringify(updated))
    const updatedSelected = state.selectedPlaylist && state.selectedPlaylist.id === playlistId
      ? updated.find(p => p.id === playlistId) || null
      : state.selectedPlaylist
    return { playlists: updated, selectedPlaylist: updatedSelected }
  }),

  removeSongFromPlaylist: (playlistId, songId) => set((state) => {
    const updated = state.playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.id !== songId) }
      }
      return p
    })
    localStorage.setItem('aura-playlists', JSON.stringify(updated))
    const updatedSelected = state.selectedPlaylist && state.selectedPlaylist.id === playlistId
      ? updated.find(p => p.id === playlistId) || null
      : state.selectedPlaylist
    return { playlists: updated, selectedPlaylist: updatedSelected }
  }),

  toggleFavorite: (songId) => set((state) => {
    const updatedSongs = state.librarySongs.map(s => 
      s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s
    )
    const isPlayingUpdated = state.playingSong && state.playingSong.id === songId
    
    const updatedSelectedAlbum = state.selectedAlbum
      ? {
          ...state.selectedAlbum,
          songs: state.selectedAlbum.songs.map(s =>
            s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s
          )
        }
      : null

    const updatedSelectedPlaylist = state.selectedPlaylist
      ? {
          ...state.selectedPlaylist,
          songs: state.selectedPlaylist.songs.map(s =>
            s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s
          )
        }
      : null

    return {
      librarySongs: updatedSongs,
      playingSong: isPlayingUpdated 
        ? { ...state.playingSong!, isFavorite: !state.playingSong!.isFavorite }
        : state.playingSong,
      selectedAlbum: updatedSelectedAlbum,
      selectedPlaylist: updatedSelectedPlaylist
    }
  }),

  setIsMaximized: (maximized) => set({ isMaximized: maximized }),
  setShowFullscreenPlayer: (show) => set({ showFullscreenPlayer: show }),
  setCurrentTab: (tab) => set({ currentTab: tab, selectedAlbum: null, selectedPlaylist: null }),
  setSelectedAlbum: (album) => set((state) => ({ selectedAlbum: album, selectedPlaylist: null, currentTab: album ? 'album-detail' : 'albums' })),
  setSelectedPlaylist: (playlist) => set((state) => ({ selectedPlaylist: playlist, selectedAlbum: null, currentTab: playlist ? 'playlist-detail' : 'playlists' })),
  setPlayingSong: (song) => {
    if (song) addToRecentlyPlayed(song)
    set({ playingSong: song })
  },
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
    addToRecentlyPlayed(song)
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
      lyrics: [],
      rawLyricsResult: null,
      lyricsOffset: 0,
      lyricsSource: null,
      lyricsLoading: false
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
    const { isPlaying, playingSong, currentTime } = get()
    if (!playingSong) return
    if (isPlaying) {
      PlayerService.Pause().catch((err) => console.error(err))
    } else {
      if (currentTime === 0 && playingSong.filePath) {
        PlayerService.SetVolume(get().volume).catch(() => {})
        PlayerService.Play(playingSong.filePath).catch((err) => {
          console.error('[PlaybackService] Failed to play from start:', err)
        })
        set({ isPlaying: true })
      } else {
        PlayerService.Resume().catch((err) => console.error(err))
      }
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
    if (nextSong) addToRecentlyPlayed(nextSong)
    if (nextSong?.filePath) {
      PlayerService.SetVolume(get().volume).catch(() => {})
      PlayerService.Play(nextSong.filePath).catch(() => {})
    }
    set({
      playingSong: nextSong,
      currentQueueIndex: nextIdx,
      currentTime: 0,
      isPlaying: true,
      lyrics: [],
      rawLyricsResult: null,
      lyricsOffset: 0,
      lyricsSource: null,
      lyricsLoading: false
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
    if (prevSong) addToRecentlyPlayed(prevSong)
    if (prevSong?.filePath) {
      PlayerService.SetVolume(get().volume).catch(() => {})
      PlayerService.Play(prevSong.filePath).catch(() => {})
    }
    set({
      playingSong: prevSong,
      currentQueueIndex: prevIdx,
      currentTime: 0,
      isPlaying: true,
      lyrics: [],
      rawLyricsResult: null,
      lyricsOffset: 0,
      lyricsSource: null,
      lyricsLoading: false
    })
    if (prevSong) get().fetchLyrics(prevSong)
  },
  fetchLyrics: (song) => {
    if (!song?.filePath) return
    set({ lyricsLoading: true })
    LyricsService.GetLyrics(song.filePath)
      .then((result) => {
        // Only apply if this song is still the playing song
        const current = get().playingSong
        if (current?.filePath === song.filePath) {
          const hasTranslation = result?.lines?.some(l => l.is_translation)
          set({
            lyrics: result?.lines || [],
            rawLyricsResult: result,
            lyricsSource: result?.source || null,
            lyricsLoading: false,
            showTranslation: hasTranslation ? true : get().showTranslation
          })
        }
      })
      .catch((err) => {
        console.error('[LyricsService] Failed to fetch lyrics:', err)
        set({ lyrics: [], rawLyricsResult: null, lyricsSource: null, lyricsLoading: false })
      })
  },
  fetchOnlineLyrics: (song) => {
    if (!song?.filePath) return
    set({ lyrics: [], rawLyricsResult: null, lyricsSource: 'LRCLIB', lyricsLoading: true })
    LyricsService.GetOnlineLyrics(song.filePath)
      .then((result) => {
        const current = get().playingSong
        if (current?.filePath === song.filePath) {
          const hasTranslation = result?.lines?.some(l => l.is_translation)
          set({
            lyrics: result?.lines || [],
            rawLyricsResult: result,
            lyricsSource: result?.source || 'LRCLIB',
            lyricsLoading: false,
            showTranslation: hasTranslation ? true : get().showTranslation
          })
        }
      })
      .catch((err) => {
        console.error('[LyricsService] Failed to fetch online lyrics:', err)
        set({ lyrics: [], rawLyricsResult: null, lyricsSource: null, lyricsLoading: false })
      })
  },
  saveCustomLyrics: async (song, text) => {
    if (!song?.filePath) return
    set({ lyricsLoading: true })
    try {
      const result = await LyricsService.SaveCustomLyrics(song.filePath, text)
      const current = get().playingSong
      if (current?.filePath === song.filePath) {
        const hasTranslation = result?.lines?.some(l => l.is_translation)
        set({
          lyrics: result?.lines || [],
          rawLyricsResult: result,
          lyricsSource: result?.source || 'LRCLIB',
          lyricsLoading: false,
          showTranslation: hasTranslation ? true : get().showTranslation
        })
      }
    } catch (err) {
      console.error('[LyricsService] Failed to save custom lyrics:', err)
      set({ lyricsLoading: false })
    }
  },
  packLyrics: async (song, text, source) => {
    if (!song?.filePath) return
    set({ lyricsLoading: true })
    try {
      const targetSource = source || 'Local'
      const result = await LyricsService.PackLyrics(song.filePath, text, targetSource)
      const current = get().playingSong
      if (current?.filePath === song.filePath) {
        const hasTranslation = result?.lines?.some(l => l.is_translation)
        set({
          lyrics: result?.lines || [],
          rawLyricsResult: result,
          lyricsSource: result?.source || targetSource,
          lyricsLoading: false,
          showTranslation: hasTranslation ? true : get().showTranslation
        })
      }
      get().triggerToast('Song lyrics successfully packed locally!', 'success')
    } catch (err) {
      console.error('[LyricsService] Failed to pack lyrics:', err)
      get().triggerToast('Failed to pack lyrics locally', 'error')
      set({ lyricsLoading: false })
    }
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  clearPlayQueue: () => {
    PlayerService.Pause().catch(() => {})
    set({ playQueue: [], currentQueueIndex: 0, playingSong: null, isPlaying: false, currentTime: 0 })
  },
  removeFromPlayQueue: (index) => set((state) => {
    const newQueue = state.playQueue.filter((_, i) => i !== index)
    // Adjust currentQueueIndex if needed
    let newIndex = state.currentQueueIndex
    if (index < state.currentQueueIndex) newIndex = state.currentQueueIndex - 1
    else if (index === state.currentQueueIndex) newIndex = Math.min(newIndex, newQueue.length - 1)
    return { playQueue: newQueue, currentQueueIndex: Math.max(0, newIndex) }
  }),
  updateSongMetadata: (songId, updates) => set((state) => {
    const updatedLibrary = state.librarySongs.map(s => {
      if (s.id === songId) {
        return { ...s, ...updates }
      }
      return s
    })
    const updatedQueue = state.playQueue.map(s => {
      if (s.id === songId) {
        return { ...s, ...updates }
      }
      return s
    })
    const updatedPlaying = state.playingSong && state.playingSong.id === songId
      ? { ...state.playingSong, ...updates }
      : state.playingSong

    return {
      librarySongs: updatedLibrary,
      playQueue: updatedQueue,
      playingSong: updatedPlaying
    }
  }),
  autoCheckUpdates: localStorage.getItem('aura-auto-check-updates') !== 'false',
  autoDownloadUpdates: localStorage.getItem('aura-auto-download-updates') !== 'false',
  updateChannel: (localStorage.getItem('aura-update-channel') as 'stable' | 'beta') || 'stable',
  isUpdateAvailable: false,
  latestUpdateInfo: null,
  isCheckingForUpdates: false,
  isDownloadingUpdate: false,
  updateError: null,
  showUpdateDialog: false,

  setUpdateSettings: (settings) => {
    const nextSettings = {
      autoCheckUpdates: settings.autoCheckUpdates !== undefined ? settings.autoCheckUpdates : get().autoCheckUpdates,
      autoDownloadUpdates: settings.autoDownloadUpdates !== undefined ? settings.autoDownloadUpdates : get().autoDownloadUpdates,
      updateChannel: settings.updateChannel !== undefined ? settings.updateChannel : get().updateChannel,
    }
    localStorage.setItem('aura-auto-check-updates', String(nextSettings.autoCheckUpdates))
    localStorage.setItem('aura-auto-download-updates', String(nextSettings.autoDownloadUpdates))
    localStorage.setItem('aura-update-channel', nextSettings.updateChannel)
    set(nextSettings)
  },

  checkForUpdates: async (manual) => {
    set({ isCheckingForUpdates: true, updateError: null })
    try {
      const info = await UpdaterService.CheckForUpdates()
      if (info && info.available) {
        set({
          isUpdateAvailable: true,
          latestUpdateInfo: info,
          showUpdateDialog: true,
        })
        if (manual) {
          get().triggerToast('Update available!', 'success')
        }
      } else {
        set({ isUpdateAvailable: false, latestUpdateInfo: null })
        if (manual) {
          get().triggerToast('Aura is up to date!', 'success')
        }
      }
    } catch (err: any) {
      console.error('Failed to check for updates:', err)
      set({ updateError: err.message || 'Check failed' })
      if (manual) {
        get().triggerToast('Failed to check for updates', 'error')
      }
    } finally {
      set({ isCheckingForUpdates: false })
    }
  },

  downloadAndInstallLatestUpdate: async () => {
    const info = get().latestUpdateInfo
    if (!info) return
    set({ isDownloadingUpdate: true, updateError: null })
    try {
      await UpdaterService.DownloadAndInstallUpdate(info.downloadUrl, info.assetName)
    } catch (err: any) {
      console.error('Failed to install update:', err)
      set({ updateError: err.message || 'Installation failed' })
      get().triggerToast('Update installation failed', 'error')
    } finally {
      set({ isDownloadingUpdate: false })
    }
  },

  setUpdateDialog: (show) => set({ showUpdateDialog: show }),
}))
