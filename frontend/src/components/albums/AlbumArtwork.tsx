import React, { useState, useMemo } from 'react'
import { Disc } from 'lucide-react'

interface AlbumArtworkProps {
  coverUrl?: string
  title: string
  size?: 128 | 256 | 'original'
  className?: string
}

export const AlbumArtwork: React.FC<AlbumArtworkProps> = React.memo(({
  coverUrl,
  title,
  size = 256,
  className = ''
}) => {
  const [hasError, setHasError] = useState(false)

  // Append size query parameter if thumbnail requested
  const src = useMemo(() => {
    if (!coverUrl) return ''
    if (size === 'original') return coverUrl
    return `${coverUrl}?size=${size}`
  }, [coverUrl, size])

  if (!coverUrl || hasError) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center ${className}`}>
        <Disc size={40} className="text-zinc-700" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={title}
      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${className}`}
      loading="eager"
      fetchPriority="high"
      onError={() => setHasError(true)}
    />
  )
})

AlbumArtwork.displayName = 'AlbumArtwork'
