import React from 'react'
import { Volume1, Volume2, VolumeX, X } from 'lucide-react'
import { motion } from 'framer-motion'
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

  if (!showVolumeSlider) {
    return (
      <motion.button
        key="volume-icon"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={(e) => { e.stopPropagation(); setShowVolumeSlider(true); }}
        className="p-1.5 flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
        title="Volume Settings"
      >
        {isMuted ? <VolumeX size={16} /> : volume > 0.5 ? <Volume2 size={16} /> : volume > 0 ? <Volume1 size={16} /> : <VolumeX size={16} />}
      </motion.button>
    )
  }

  return (
    <motion.div
      key="volume-pill"
      initial={{ width: 36, opacity: 0 }}
      animate={{ width: 140, opacity: 1 }}
      exit={{ width: 36, opacity: 0 }}
      className="flex items-center gap-2.5 bg-[#242424]/30 border border-white/[0.06] backdrop-blur-[40px] rounded-full px-2.5 py-1 shadow-lg h-8"
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

      <button 
        onClick={() => setShowVolumeSlider(false)}
        className="text-[#8e8e93] hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0"
        title="Collapse"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
})

VolumeControl.displayName = 'VolumeControl'
