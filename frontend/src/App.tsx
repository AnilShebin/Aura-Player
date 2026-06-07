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
import { PlayerBar } from '@/components/player-bar/audio/PlayerBar'
import { Button } from '@/components/ui/button'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PanelLeft } from 'lucide-react'
import { Window, Events } from '@wailsio/runtime'
import { TitleBar } from '@/components/window-controls/TitleBar'
import { IsFirstTime, GetFolders } from '@/services/settingsService'
import { GetSongs, ScanLibrary, GetAlbums } from '@/services/libraryService'
import { OnboardingWelcome } from '@/components/settings/OnboardingWelcome'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'


const checkIfMaximized = (): boolean => {
  if (document.fullscreenElement) return true
  const widthDiff = Math.abs(window.innerWidth - window.screen.availWidth)
  const heightDiff = Math.abs(window.innerHeight - window.screen.availHeight)
  return widthDiff <= 15 && heightDiff <= 15
}

function App() {
  const playingSong = useMusicStore(state => state.playingSong)
  const showAmbientGlow = useMusicStore(state => state.showAmbientGlow)
  const setShowAmbientGlow = useMusicStore(state => state.setShowAmbientGlow)
  const sidebarCollapsed = useMusicStore(state => state.sidebarCollapsed)
  const setSidebarCollapsed = useMusicStore(state => state.setSidebarCollapsed)
  const showLyrics = useMusicStore(state => state.showLyrics)
  const setShowLyrics = useMusicStore(state => state.setShowLyrics)
  const showQueue = useMusicStore(state => state.showQueue)
  const setShowQueue = useMusicStore(state => state.setShowQueue)
  const playQueue = useMusicStore(state => state.playQueue)
  const playSongDirect = useMusicStore(state => state.playSongDirect)
  const currentTab = useMusicStore(state => state.currentTab)
  const isMaximized = useMusicStore(state => state.isMaximized)
  const setIsMaximized = useMusicStore(state => state.setIsMaximized)

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
              className={`flex-1 ${currentTab === 'songs' || currentTab === 'albums' ? 'overflow-hidden' : 'overflow-y-auto'} relative h-full pb-0 custom-scrollbar min-w-0 transition-[padding] duration-200 ease-linear ${
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
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] w-full">
                  {playingSong && (
                    <div className="relative z-10 w-full max-w-md p-6 bg-secondary/35 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl flex flex-col items-center text-center transition-all duration-300">

                      {/* Artwork Cover */}
                      <div className="relative w-56 h-56 mb-6 rounded-xl overflow-hidden shadow-lg border border-border/10 group">
                        <img
                          src={playingSong.coverUrl}
                          alt={playingSong.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      {/* Song Meta Info */}
                      <h2 className="text-xl font-bold tracking-tight text-foreground mb-1 line-clamp-1">
                        {playingSong.title}
                      </h2>
                      <p className="text-sm text-muted-foreground font-medium mb-6 line-clamp-1">
                        {playingSong.artist}
                      </p>

                      {/* Dynamic Controls */}
                      <div className="w-full flex flex-col gap-4">
                        <div className="flex justify-center gap-2">
                          {playQueue.map((song, idx) => (
                            <Button
                              key={song.id}
                              variant={playingSong?.id === song.id ? "default" : "secondary"}
                              size="sm"
                              onClick={() => playSongDirect(song, playQueue)}
                              className="text-xs transition-colors duration-200"
                            >
                              Track {idx + 1}
                            </Button>
                          ))}
                        </div>

                        <hr className="border-border/30 my-1" />

                        {/* Panel Drawer Toggles */}
                        <div className="flex flex-col gap-2.5 text-sm px-2">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Ambient Background Glow</span>
                            <Button
                              variant={showAmbientGlow ? "default" : "outline"}
                              size="xs"
                              onClick={() => setShowAmbientGlow(!showAmbientGlow)}
                              className="text-xs min-w-[80px]"
                            >
                              {showAmbientGlow ? "Enabled" : "Disabled"}
                            </Button>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Lyrics Drawer Panel</span>
                            <Button
                              variant={showLyrics ? "default" : "outline"}
                              size="xs"
                              onClick={() => setShowLyrics(!showLyrics)}
                              className="text-xs min-w-[80px]"
                            >
                              {showLyrics ? "Active" : "Closed"}
                            </Button>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Playback Queue Drawer</span>
                            <Button
                              variant={showQueue ? "default" : "outline"}
                              size="xs"
                              onClick={() => setShowQueue(!showQueue)}
                              className="text-xs min-w-[80px]"
                            >
                              {showQueue ? "Active" : "Closed"}
                            </Button>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
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
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default App
