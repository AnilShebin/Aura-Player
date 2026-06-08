import { useEffect, useState, useRef } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { AmbientBackdrop } from '@/components/player/AmbientBackdrop'
import { FullscreenPlayer } from '@/components/player/FullscreenPlayer'
import { AppSidebar } from '@/components/app-sidebar'
import { LyricsDrawer } from '@/components/lyrics/LyricsDrawer'
import { QueueDrawer } from '@/components/player-bar/audio/QueueDrawer'
import { ListenNow } from '@/pages/ListenNow'
import { Favorites } from '@/pages/Favorites'
import { Albums } from '@/pages/Albums'
import { AlbumDetail } from '@/pages/AlbumDetail'
import { Songs } from '@/pages/Songs'
import { Settings } from '@/pages/Settings'
import { Search } from '@/pages/Search'
import { Playlists } from '@/pages/Playlists'
import { PlaylistDetail } from '@/pages/PlaylistDetail'
import { CreatePlaylistModal } from '@/components/playlist/CreatePlaylistModal'
import { SongPropertiesModal } from '@/components/songs/SongPropertiesModal'
import { PlayerBar } from '@/components/player-bar/audio/PlayerBar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PanelLeft } from 'lucide-react'
import { Window, Events } from '@wailsio/runtime'
import { TitleBar } from '@/components/window-controls/TitleBar'
import { IsFirstTime, GetFolders } from '@/services/settingsService'
import { GetSongs, ScanLibrary, GetAlbums } from '@/services/libraryService'
import { OnboardingWelcome } from '@/components/settings/OnboardingWelcome'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import { UpdateDialog } from '@/components/settings/UpdateDialog'


const checkIfMaximized = (): boolean => {
  if (document.fullscreenElement) return true
  const widthDiff = Math.abs(window.innerWidth - window.screen.availWidth)
  const heightDiff = Math.abs(window.innerHeight - window.screen.availHeight)
  return widthDiff <= 15 && heightDiff <= 15
}

function App() {
  const sidebarCollapsed = useMusicStore(state => state.sidebarCollapsed)
  const setSidebarCollapsed = useMusicStore(state => state.setSidebarCollapsed)
  const showLyrics = useMusicStore(state => state.showLyrics)
  const showQueue = useMusicStore(state => state.showQueue)
  const currentTab = useMusicStore(state => state.currentTab)
  const isMaximized = useMusicStore(state => state.isMaximized)
  const setIsMaximized = useMusicStore(state => state.setIsMaximized)

  const isCreatePlaylistOpen = useMusicStore(state => state.isCreatePlaylistOpen)
  const setCreatePlaylistOpen = useMusicStore(state => state.setCreatePlaylistOpen)
  const createPlaylist = useMusicStore(state => state.createPlaylist)

  const isPropertiesOpen = useMusicStore(state => state.isPropertiesOpen)
  const setPropertiesOpen = useMusicStore(state => state.setPropertiesOpen)
  const propertiesSong = useMusicStore(state => state.propertiesSong)
  const updateSongMetadata = useMusicStore(state => state.updateSongMetadata)

  const mainRef = useRef<HTMLDivElement>(null)
  useSmoothScroll(mainRef, currentTab !== 'songs' && currentTab !== 'albums')

  const [isAppFullscreen, setIsAppFullscreen] = useState(!!document.fullscreenElement)
  const [os, setOs] = useState<'mac' | 'windows' | 'linux'>('windows')
  const [isHoveredControls, setIsHoveredControls] = useState<boolean>(false)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)

  // Load library songs and folders from SQLite, then run tag scanner
  const loadLibrary = async () => {
    try {
      const folders = await GetFolders()
      if (folders && folders.length > 0) {
        await ScanLibrary(folders)
      }
      const songs = await GetSongs()
      useMusicStore.setState({ librarySongs: songs || [] })
      
      const albums = await GetAlbums()
      useMusicStore.setState({ libraryAlbums: albums || [] })

      // Pre-select the first song so the player bar shows info, but do NOT auto-play
      if (songs && songs.length > 0 && !useMusicStore.getState().playingSong) {
        useMusicStore.setState({
          playingSong: songs[0],
          playQueue: songs,
          currentQueueIndex: 0,
          isPlaying: false
        })
      }
    } catch (err) {
      console.error('Failed to load library:', err)
    }
  }

  // Refresh songs/albums data when files change on disk
  const refreshLibraryData = async () => {
    try {
      const songs = await GetSongs()
      useMusicStore.setState({ librarySongs: songs || [] })
      
      const albums = await GetAlbums()
      useMusicStore.setState({ libraryAlbums: albums || [] })

      // If the currently selected album is still open, refresh it in the UI as well
      const selectedAlbum = useMusicStore.getState().selectedAlbum
      if (selectedAlbum) {
        const updatedAlbum = (albums || []).find(a => a.id === selectedAlbum.id)
        if (updatedAlbum) {
          useMusicStore.setState({ 
            selectedAlbum: {
              id: updatedAlbum.id,
              title: updatedAlbum.title,
              artist: updatedAlbum.albumArtist,
              coverUrl: updatedAlbum.coverUrl || '',
              year: updatedAlbum.year || '2026',
              genre: updatedAlbum.genre || 'Local Audio',
              songs: updatedAlbum.songs || [],
              codec: updatedAlbum.codec || 'Unknown',
              quality: updatedAlbum.quality || 'High Quality',
              sampleRate: updatedAlbum.sampleRate,
              bitDepth: updatedAlbum.bitDepth,
              bitrate: updatedAlbum.bitrate
            }
          })
        } else {
          useMusicStore.setState({ selectedAlbum: null })
        }
      }
    } catch (err) {
      console.error('Failed to refresh library:', err)
    }
  }

  // Check if it's the first time launch
  useEffect(() => {
    IsFirstTime()
      .then((firstTime) => {
        if (firstTime) {
          setShowOnboarding(true)
        } else {
          loadLibrary()
        }
      })
      .catch((err) => {
        console.error('Failed to check first time:', err)
      })
  }, [])

  // Auto update check on startup
  useEffect(() => {
    const timer = setTimeout(() => {
      const autoCheck = useMusicStore.getState().autoCheckUpdates
      if (autoCheck) {
        useMusicStore.getState().checkForUpdates(false).catch(console.error)
      }
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  // Subscribe to native libmpv playback events from backend
  useEffect(() => {
    const handleStatusUpdate = (event: any) => {
      const status = event.data
      if (status) {
        useMusicStore.setState({
          currentTime: status.currentTime,
          duration: status.duration,
          isPlaying: status.isPlaying
        })
      }
    }

    const handleEnded = () => {
      useMusicStore.getState().handleNextTrack()
    }

    const handleLibraryChanged = () => {
      refreshLibraryData()
    }

    const unsubStatus = Events.On('audio-status-update', handleStatusUpdate)
    const unsubEnded = Events.On('audio-ended', handleEnded)
    const unsubLibrary = Events.On('library-changed', handleLibraryChanged)

    return () => {
      unsubStatus()
      unsubEnded()
      unsubLibrary()
    }
  }, [])

  useEffect(() => {
    // Initial sync on mount
    setIsMaximized(checkIfMaximized())

    const handleResize = () => {
      setIsMaximized(checkIfMaximized())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setIsMaximized])

  // Detect Host OS
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('mac')) {
      setOs('mac')
    } else if (userAgent.includes('linux')) {
      setOs('linux')
    } else {
      setOs('windows')
    }
  }, [])

  const toggleMaximize = () => {
    Window.ToggleMaximise()
  }



  // Listen to fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsAppFullscreen(!!document.fullscreenElement)
      setIsMaximized(checkIfMaximized())
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Unified sidebar collapse/expand state controller based on window maximization and drawer visibility
  useEffect(() => {
    if (!isMaximized) {
      setSidebarCollapsed(true)
    } else {
      if (showLyrics || showQueue) {
        setSidebarCollapsed(true)
      } else {
        setSidebarCollapsed(false)
      }
    }
  }, [isMaximized, showLyrics, showQueue, setSidebarCollapsed])




  return (
    <TooltipProvider>
      <SidebarProvider
        open={!sidebarCollapsed}
        onOpenChange={(open) => setSidebarCollapsed(!open)}
        className="relative w-screen h-screen flex bg-background text-foreground select-none overflow-hidden font-sans"
      >
        {/* Global Grain/Noise Overlay */}
        <div className="grain-overlay" />

        {/* Dynamic Blurred Artwork Background */}
        <AmbientBackdrop />

        {/* AppSidebar (Shadcn layout) */}
        <AppSidebar variant="transparent" isMaximized={isMaximized} />

        {/* Main Layout Area — Offset handled automatically by sidebar-gap */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">

          {/* Header Title Bar Area (Draggable) */}
          <header className={`w-full h-10 shrink-0 flex items-center justify-between px-6 z-30 relative wails-drag select-none transition-[padding-left] duration-200 ease-linear ${sidebarCollapsed ? 'pl-[32px]' : 'pl-[188px]'}`}>
            {/* Left side actions (No Drag) */}
            <div className="wails-no-drag flex items-center h-8">
              {!isMaximized && (
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="h-8 w-8 rounded-lg border border-border/20 hover:bg-secondary/50 text-muted-foreground hover:text-foreground shadow-sm transition-colors cursor-pointer pointer-events-auto flex items-center justify-center focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:outline-none active:ring-0"
                  title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right side custom window controls (No Drag) */}
            {!isAppFullscreen && (
              <div className="wails-no-drag pointer-events-auto">
                <TitleBar
                  os={os}
                  isHoveredControls={isHoveredControls}
                  setIsHoveredControls={setIsHoveredControls}
                  toggleMaximize={toggleMaximize}
                />
              </div>
            )}
          </header>

          {/* Content Viewport Container */}
          <div className="flex flex-1 w-full overflow-hidden relative">

            {/* CENTER AREA — Standard Routed Content Viewport */}
            {/* Extra px-[35px] compensates for the 70px collapsed sidebar icon bar (35px each side)   */}
            {/* so opening a drawer doesn't visually shift the content center.                          */}
            <main
              ref={mainRef}
              className={`flex-1 ${currentTab === 'songs' || currentTab === 'albums' || currentTab === 'search' ? 'overflow-hidden' : 'overflow-y-auto'} relative h-full pb-0 custom-scrollbar min-w-0 transition-[padding] duration-200 ease-linear ${
                isMaximized && !showLyrics && !showQueue ? 'px-[67px]' : 'px-8'
              }`}
            >
              {currentTab === 'listen-now' ? (
                <ListenNow />
              ) : currentTab === 'favorites' ? (
                <Favorites />
              ) : currentTab === 'albums' ? (
                <Albums />
              ) : currentTab === 'album-detail' ? (
                <AlbumDetail />
              ) : currentTab === 'songs' ? (
                <Songs />
              ) : currentTab === 'settings' ? (
                <Settings />
              ) : currentTab === 'search' ? (
                <Search />
              ) : currentTab === 'playlists' ? (
                <Playlists />
              ) : currentTab === 'playlist-detail' ? (
                <PlaylistDetail />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] w-full text-center px-4 select-none">
                  <span className="text-[#fa586a] opacity-90 mb-4">
                    <svg height="40" viewBox="0 0 22 20" width="44" xmlns="http://www.w3.org/2000/svg" className="fill-current" aria-hidden="true">
                      <defs>
                        <linearGradient id="aura-logo-grad-placeholder" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#fa586a" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M1 10h2.5c1.2 0 1.8-7.5 3-7.5s1.8 14 3 14 1.8-11 3-11 1.8 8 3 8 1.8-3.5 3-3.5" 
                        stroke="url(#aura-logo-grad-placeholder)" 
                        strokeWidth="2.2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill="none"
                      />
                    </svg>
                  </span>
                  <h3 className="text-[17px] font-medium text-foreground mb-1">
                    {currentTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </h3>
                  <p className="text-[13px] text-muted-foreground max-w-[280px]">
                    This section is under construction. Select another view from the sidebar to listen.
                  </p>
                </div>
              )}
            </main>

            {/* RIGHT DRAWERS — Sits absolute, floats on top from the right */}
            <LyricsDrawer />
            <QueueDrawer />

          </div>

          {/* Floating bottom PLAYER BAR */}
          <PlayerBar />

          {/* Onboarding Welcome Overlay */}
          {showOnboarding && (
            <OnboardingWelcome onComplete={() => {
              setShowOnboarding(false)
              loadLibrary()
            }} />
          )}

          {/* Fullscreen Full Page Player Overlay */}
          <FullscreenPlayer />

          {/* Global Create Playlist Modal */}
          <CreatePlaylistModal
            isOpen={isCreatePlaylistOpen}
            onClose={() => setCreatePlaylistOpen(false)}
            onCreate={(name, description, coverUrl) => createPlaylist(name, coverUrl, description)}
          />

          {/* Global Song Properties Modal */}
          <SongPropertiesModal
            isOpen={isPropertiesOpen}
            onClose={() => setPropertiesOpen(false, null)}
            song={propertiesSong}
            onSave={(updates) => {
              if (propertiesSong) {
                updateSongMetadata(propertiesSong.id, updates)
              }
            }}
          />

          {/* Global Update Dialog Modal */}
          <UpdateDialog />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default App


