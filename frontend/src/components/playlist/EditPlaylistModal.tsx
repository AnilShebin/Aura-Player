import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PlaylistCover } from './PlaylistCover'
import { Playlist } from '@/types/music'

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #00f2fe 0%, #030712 100%)', // Teal-Cyan
  'linear-gradient(135deg, #f43f5e 0%, #030712 100%)', // Rose Red
  'linear-gradient(135deg, #3b82f6 0%, #030712 100%)', // Blue
  'linear-gradient(135deg, #10b981 0%, #030712 100%)', // Emerald Green
  'linear-gradient(135deg, #8b5cf6 0%, #030712 100%)', // Purple
  'linear-gradient(135deg, #f59e0b 0%, #030712 100%)', // Amber-Gold
  'linear-gradient(135deg, #e2e8f0 0%, #030712 100%)', // Beige-Silver
  'linear-gradient(135deg, #ec4899 0%, #030712 100%)'  // Hot Pink
]

interface EditPlaylistModalProps {
  playlist: Playlist
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description: string, coverUrl: string) => void
}

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({
  playlist,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description || '')
  const [showInProfile, setShowInProfile] = useState(true)
  
  // Find index of current coverUrl in presets, or default to 0
  const [gradientIndex, setGradientIndex] = useState(() => {
    const idx = PRESET_GRADIENTS.indexOf(playlist.coverUrl)
    return idx !== -1 ? idx : 0
  })

  useEffect(() => {
    setName(playlist.name)
    setDescription(playlist.description || '')
    const idx = PRESET_GRADIENTS.indexOf(playlist.coverUrl)
    setGradientIndex(idx !== -1 ? idx : 0)
  }, [playlist, isOpen])

  if (!isOpen) return null

  const activeGradient = PRESET_GRADIENTS[gradientIndex]

  const handlePrev = () => {
    setGradientIndex(prev => (prev - 1 + PRESET_GRADIENTS.length) % PRESET_GRADIENTS.length)
  }

  const handleNext = () => {
    setGradientIndex(prev => (prev + 1) % PRESET_GRADIENTS.length)
  }

  const handleDone = () => {
    if (!name.trim()) return
    const isSpecialCover = playlist.coverUrl === 'fav-star'
    // Save coverUrl as the selected gradient unless it's a special system playlist like Favorites
    onSave(
      name,
      description,
      isSpecialCover ? playlist.coverUrl : activeGradient
    )
    onClose()
  }

  const isSpecialPlaylist = playlist.coverUrl === 'fav-star'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-[360px] bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-white">
        
        {/* Title */}
        <h2 className="text-[17px] font-bold text-center tracking-tight">Edit Playlist</h2>

        {/* Cover Preview Selector */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-44 h-44 group">
            <PlaylistCover
              name={name || 'Playlist'}
              coverUrl={isSpecialPlaylist ? playlist.coverUrl : activeGradient}
              className="w-full h-full rounded-xl shadow-lg"
              textClassName="text-[18px] font-extrabold text-black/80"
            />
            
            {/* Navigation Arrows (Only for non-special playlists) */}
            {!isSpecialPlaylist && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {!isSpecialPlaylist && (
            <div className="flex items-center gap-1.5 mt-1">
              {PRESET_GRADIENTS.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setGradientIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-150 ${
                    idx === gradientIndex ? 'bg-[#fa586a] scale-110' : 'bg-zinc-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Title"
            className="w-full h-9 px-3 rounded-lg bg-[#2c2c2e] text-white text-[13px] placeholder-zinc-500 border border-white/5 focus:outline-none focus:border-[#fa586a]/40 focus:bg-[#3a3a3c] transition-all"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (Optional)"
            rows={3}
            className="w-full p-3 rounded-lg bg-[#2c2c2e] text-white text-[13px] placeholder-zinc-500 border border-white/5 focus:outline-none focus:border-[#fa586a]/40 focus:bg-[#3a3a3c] resize-none transition-all"
          />

          {/* Checkbox */}
          <label className="flex items-center gap-2.5 px-1 py-1 cursor-pointer select-none group text-zinc-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showInProfile}
              onChange={(e) => setShowInProfile(e.target.checked)}
              className="w-4 h-4 rounded bg-[#2c2c2e] border-white/10 accent-[#fa586a] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[12px] font-light">Show in My Profile and in Search</span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleDone}
            className="flex-1 h-9 rounded-lg bg-[#fa586a] hover:bg-[#fa586a]/90 active:scale-[0.98] text-white text-[13px] font-medium transition-all cursor-pointer"
          >
            Done
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] active:scale-[0.98] text-zinc-400 hover:text-white text-[13px] font-medium border border-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}

export default EditPlaylistModal
