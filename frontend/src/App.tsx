import { useEffect } from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { AmbientBackdrop } from '@/components/player/AmbientBackdrop'
import { Button } from '@/components/ui/button'

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
  const { playingSong, setPlayingSong, showAmbientGlow, setShowAmbientGlow } = useMusicStore()

  // Set default song on load
  useEffect(() => {
    if (!playingSong) {
      setPlayingSong(MOCK_SONGS[0])
    }
  }, [playingSong, setPlayingSong])

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground select-none overflow-hidden font-sans">
      {/* Global Grain/Noise Overlay */}
      <div className="grain-overlay" />

      {/* Dynamic Blurred Artwork Background */}
      <AmbientBackdrop />

      {/* Premium Content Card */}
      <div className="relative z-10 w-full max-w-md p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center text-center transition-all duration-300">
        {playingSong && (
          <div className="w-full flex flex-col items-center">
            {/* Artwork Cover */}
            <div className="relative w-56 h-56 mb-6 rounded-xl overflow-hidden shadow-lg border border-white/5 group">
              <img
                src={playingSong.coverUrl}
                alt={playingSong.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Song Meta info */}
            <h2 className="text-xl font-bold tracking-tight text-white mb-1 line-clamp-1">
              {playingSong.title}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mb-6 line-clamp-1">
              {playingSong.artist}
            </p>
          </div>
        )}

        {/* Dynamic Controls */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            {MOCK_SONGS.map((song, idx) => (
              <Button
                key={song.id}
                variant={playingSong?.id === song.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setPlayingSong(song)}
                className="text-xs transition-colors duration-200"
              >
                Track {idx + 1}
              </Button>
            ))}
          </div>

          <hr className="border-white/10 my-1" />

          {/* Toggle Ambient Backdrop */}
          <div className="flex justify-between items-center text-sm px-2">
            <span className="text-zinc-400 font-medium">Ambient Background Glow</span>
            <Button
              variant={showAmbientGlow ? "default" : "outline"}
              size="xs"
              onClick={() => setShowAmbientGlow(!showAmbientGlow)}
              className="text-xs min-w-[70px]"
            >
              {showAmbientGlow ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
