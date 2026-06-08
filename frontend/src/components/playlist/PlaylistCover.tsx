import React from 'react'
import { Star } from 'lucide-react'

interface PlaylistCoverProps {
  name: string
  coverUrl: string
  className?: string
  textClassName?: string
}

export const PlaylistCover: React.FC<PlaylistCoverProps> = ({
  name,
  coverUrl,
  className = 'w-full aspect-square',
  textClassName = 'text-[18px] sm:text-[20px] font-bold text-zinc-950 tracking-tight'
}) => {
  const isFav = coverUrl === 'fav-star' || name.toLowerCase().includes('favourite') || name.toLowerCase().includes('favorite')

  if (isFav) {
    return (
      <div className={`flex items-center justify-center bg-[#f5f5f7] ${className} rounded-[6px] relative overflow-hidden select-none border border-black/5 shadow-sm`}>
        <Star size={56} fill="#fa586a" stroke="#fa586a" className="drop-shadow-sm" />
      </div>
    )
  }

  const isGradient = coverUrl && (coverUrl.startsWith('linear-gradient') || coverUrl.startsWith('bg-') || coverUrl.includes('gradient'))

  return (
    <div
      style={isGradient ? { background: coverUrl } : undefined}
      className={`relative ${className} rounded-[6px] overflow-hidden select-none shadow-md flex flex-col justify-between`}
    >
      {isGradient ? (
        <>
          <div className={`p-4 truncate leading-snug font-extrabold ${textClassName}`}>
            {name}
          </div>
          {/* Subtle bottom shading for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15 pointer-events-none" />
        </>
      ) : coverUrl ? (
        <img
          src={coverUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback gradient if image fails
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #4b5563 0%, #111827 100%)'
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
          <span className="text-[12px] font-medium text-zinc-400">No Cover</span>
        </div>
      )}
    </div>
  )
}

export default PlaylistCover
