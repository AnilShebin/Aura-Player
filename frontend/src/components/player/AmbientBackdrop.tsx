import React from 'react'
import { useMusicStore } from '@/stores/musicStore'

export const AmbientBackdrop: React.FC = () => {
  const { currentTab, selectedAlbum, selectedPlaylist, playingSong, showAmbientGlow } = useMusicStore()

  // Calculate background artwork URL
  const bgArtworkUrl = (currentTab === 'album-detail' && selectedAlbum)
    ? (selectedAlbum.coverUrl || selectedAlbum.artwork)
    : (currentTab === 'playlist-detail' && selectedPlaylist)
      ? selectedPlaylist.coverUrl
      : (playingSong?.coverUrl || playingSong?.artwork)

  if (!showAmbientGlow || !bgArtworkUrl) {
    return null
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute inset-0 bg-cover bg-center scale-150 blur-[140px] opacity-[0.22] transition-opacity duration-1000 ease-in-out"
        style={{ backgroundImage: `url(${bgArtworkUrl})` }}
      />
      {/* Use theme token variable rather than hardcoded background colors */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background" />
    </div>
  )
}
