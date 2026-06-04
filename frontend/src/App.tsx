import { useEffect, useState } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { AmbientBackdrop } from '@/components/player/AmbientBackdrop'
import { AppSidebar } from '@/components/app-sidebar'
import { LyricsDrawer } from '@/components/lyrics/LyricsDrawer'
import { QueueDrawer } from '@/components/player-bar/audio/QueueDrawer'
import { Button } from '@/components/ui/button'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Window } from '@wailsio/runtime'
import { TitleBar } from '@/components/window-controls/TitleBar'

const MOCK_SONGS = [
  {
    id: "yaathi-1",
    title: "Yaathi Yaathi",
    artist: "Abhishek C S, Yazin Nizar & Haripriya",
    albumId: "yaathi-yaathi",
    albumTitle: "Yaathi Yaathi - Single",
    duration: "3:45",
    durationSeconds: 225,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=600&fit=crop",
    audioUrl: "",
    playlists: []
  },
  {
    id: "unnale-1",
    title: "June Ponal July Kaatru",
    artist: "Harris Jayaraj, Krish & Arun",
    albumId: "unnale-unnale",
    albumTitle: "Unnale Unnale OST",
    duration: "5:52",
    durationSeconds: 352,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop",
    audioUrl: "",
    playlists: []
  },
  {
    id: "minnal-1",
    title: "Minnalvala",
    artist: "Jakes Bejoy, Sid Sriram & Sithara",
    albumId: "minnalvala",
    albumTitle: "Narivetta - Single",
    duration: "3:40",
    durationSeconds: 220,
    coverUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=600&fit=crop",
    audioUrl: "",
    playlists: []
  }
]

function App() {
  const {
    playingSong,
    showAmbientGlow,
    setShowAmbientGlow,
    sidebarCollapsed,
    setSidebarCollapsed,
    showLyrics,
    setShowLyrics,
    showQueue,
    setShowQueue,
    playQueue,
    playSongDirect
  } = useMusicStore()

  const [isAppFullscreen, setIsAppFullscreen] = useState(!!document.fullscreenElement)
  const [os, setOs] = useState<'mac' | 'windows' | 'linux'>('windows')
  const [isHoveredControls, setIsHoveredControls] = useState<boolean>(false)

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
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Auto-collapse sidebar in fullscreen mode when lyrics or queue are enabled
  useEffect(() => {
    if (isAppFullscreen && (showLyrics || showQueue)) {
      setSidebarCollapsed(true)
    }
  }, [isAppFullscreen, showLyrics, showQueue, setSidebarCollapsed])

  // Populate mock play queue if empty
  useEffect(() => {
    if (!playingSong) {
      playSongDirect(MOCK_SONGS[0], MOCK_SONGS)
    }
  }, [playingSong, playSongDirect])


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
        <AppSidebar variant="transparent" />

        {/* Main Layout Area — Offset handled automatically by sidebar-gap */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">

          {/* Header Title Bar Area (Draggable) */}
          <header className={`w-full h-10 shrink-0 flex items-center justify-between px-6 z-30 relative wails-drag select-none transition-[padding-left] duration-200 ease-linear ${
            sidebarCollapsed ? 'pl-6' : 'pl-[194px]'
          }`}>
            {/* Left side actions (No Drag) */}
            <div className="wails-no-drag flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8 rounded-lg border border-border/20 hover:bg-secondary/50 text-muted-foreground hover:text-foreground shadow-sm transition-colors cursor-pointer pointer-events-auto" />
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
            <main className="flex-1 overflow-y-auto relative h-full px-8 pb-10 custom-scrollbar flex flex-col items-center justify-center min-w-0">
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
            </main>

            {/* RIGHT DRAWERS — Sits absolute, floats on top from the right */}
            <LyricsDrawer />
            <QueueDrawer />

          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default App
