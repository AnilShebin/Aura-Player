import React, { useState, useEffect } from 'react'
import { useMusicStore } from '@/stores/musicStore'

export const AmbientBackdrop: React.FC = () => {
  const { currentTab, selectedAlbum, selectedPlaylist, playingSong, showAmbientGlow } = useMusicStore()

  // Calculate background artwork URL
  const bgArtworkUrl = (currentTab === 'album-detail' && selectedAlbum)
    ? (selectedAlbum.coverUrl || selectedAlbum.artwork)
    : (currentTab === 'playlist-detail' && selectedPlaylist)
      ? selectedPlaylist.coverUrl
      : (playingSong?.coverUrl || playingSong?.artwork)

  const [useFallback, setUseFallback] = useState(false)

  useEffect(() => {
    if (!bgArtworkUrl) {
      setUseFallback(true)
      return
    }

    setUseFallback(false)
    const img = new Image()
    img.src = bgArtworkUrl
    img.onload = () => {
      setUseFallback(false)
    }
    img.onerror = () => {
      setUseFallback(true)
    }
  }, [bgArtworkUrl])

  if (!showAmbientGlow) {
    return null
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {useFallback ? (
        /* Gorgeous premium mesh gradient when cover art is missing or fails to load */
        <div 
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out opacity-80 animate-ambient-slow"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(250, 88, 106, 0.35) 0%, transparent 60%),
              radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(219, 39, 119, 0.25) 0%, transparent 60%)
            `,
            filter: 'blur(80px)'
          }}
        />
      ) : (
        /* Blurred Cover Artwork */
        <div 
          className="absolute inset-0 bg-cover bg-center scale-150 blur-[110px] opacity-[0.52] transition-opacity duration-1000 ease-in-out"
          style={{ backgroundImage: `url(${bgArtworkUrl})` }}
        />
      )}
      {/* Translucent overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/65 to-background/95" />
    </div>
  )
}
export default AmbientBackdrop
