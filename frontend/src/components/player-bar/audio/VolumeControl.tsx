import React, { useRef, useEffect } from 'react'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMusicStore } from '@/stores/musicStore'

interface VolumeControlProps {
  showVolumeSlider: boolean
  setShowVolumeSlider: (show: boolean) => void
}

export const VolumeControl: React.FC<VolumeControlProps> = React.memo(({
  showVolumeSlider,
  setShowVolumeSlider
}) => {
  const volume = useMusicStore(state => state.volume)
  const setVolume = useMusicStore(state => state.setVolume)
  const isMuted = useMusicStore(state => state.isMuted)
  const setIsMuted = useMusicStore(state => state.setIsMuted)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false)
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div 
      className="relative w-8 h-8 flex items-center justify-center select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Volume Icon Trigger (Always occupies layout space to prevent shifting other icons) */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowVolumeSlider(!showVolumeSlider); }}
        className="p-1.5 flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer w-8 h-8 shrink-0"
        title="Volume Settings"
      >
        {isMuted ? <VolumeX size={16} /> : volume > 0.5 ? <Volume2 size={16} /> : volume > 0 ? <Volume1 size={16} /> : <VolumeX size={16} />}
      </button>

      {/* Absolutely positioned Slider Panel overlays other icons to the left */}
      <AnimatePresence>
        {showVolumeSlider && (
          <motion.div
            key="volume-pill"
            initial={{ width: 32, opacity: 0 }}
            animate={{ width: 120, opacity: 1 }}
            exit={{ width: 32, opacity: 0 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2.5 bg-[#1c1c1e]/98 border border-white/[0.08] backdrop-blur-[40px] rounded-full px-3 py-1 shadow-2xl h-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:opacity-85 transition-opacity flex items-center justify-center cursor-pointer shrink-0"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={14} /> : volume > 0.5 ? <Volume2 size={14} /> : volume > 0 ? <Volume1 size={14} /> : <VolumeX size={14} />}
            </button>
            
            <div className="flex-1 relative h-[3px] rounded-full bg-white/20 group/vol overflow-hidden flex items-center">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value))
                  setIsMuted(false)
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div 
                className="h-full bg-white rounded-full transition-[width] duration-75" 
                style={{ width: `${isMuted ? 0 : volume * 100}%` }} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

VolumeControl.displayName = 'VolumeControl'
