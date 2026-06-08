import React, { useState } from 'react'
import { Plus } from 'lucide-react'

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #f43f5e 0%, #030712 100%)', // Rose Red
  'linear-gradient(135deg, #00f2fe 0%, #030712 100%)', // Teal-Cyan
  'linear-gradient(135deg, #3b82f6 0%, #030712 100%)', // Blue
  'linear-gradient(135deg, #10b981 0%, #030712 100%)', // Emerald Green
  'linear-gradient(135deg, #8b5cf6 0%, #030712 100%)', // Purple
  'linear-gradient(135deg, #f59e0b 0%, #030712 100%)', // Amber-Gold
  'linear-gradient(135deg, #e2e8f0 0%, #030712 100%)', // Beige-Silver
  'linear-gradient(135deg, #ec4899 0%, #030712 100%)'  // Hot Pink
]

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, description: string, coverUrl: string) => void
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showInProfile, setShowInProfile] = useState(false)
  const [gradientIndex, setGradientIndex] = useState(0)

  if (!isOpen) return null

  const activeGradient = PRESET_GRADIENTS[gradientIndex]

  const handleCycleGradient = () => {
    setGradientIndex(prev => (prev + 1) % PRESET_GRADIENTS.length)
  }

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim(), description.trim(), activeGradient)
    setName('')
    setDescription('')
    setShowInProfile(false)
    setGradientIndex(0)
    onClose()
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    setShowInProfile(false)
    setGradientIndex(0)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-[360px] bg-[#1c1c1e] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-white">
        
        {/* Title */}
        <h2 className="text-[17px] font-bold text-left tracking-tight text-zinc-100">New Playlist</h2>

        {/* Cover Preview Selector (Styled exactly like the screenshot) */}
        <div className="flex flex-col items-center gap-1">
          <div 
            onClick={handleCycleGradient}
            style={{ background: activeGradient }}
            className="relative w-44 h-44 border-[3px] border-[#fa586a] rounded-2xl flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all group overflow-hidden"
            title="Click to change style"
          >
            {/* Center Pink/Red Plus Badge */}
            <div className="w-8 h-8 rounded-full bg-[#fa586a] flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-110">
              <Plus size={18} strokeWidth={3} className="text-white" />
            </div>
            
            {/* Hover tooltip hint */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
              <span className="text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded-full font-light">Change color</span>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist Title"
            className="w-full h-10 px-3 rounded-lg bg-[#2c2c2e] text-white text-[13px] placeholder-zinc-500 border border-white/5 focus:outline-none focus:border-[#fa586a]/40 focus:bg-[#3a3a3c] transition-all"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (Optional)"
            rows={3}
            className="w-full p-3 rounded-lg bg-[#2c2c2e] text-white text-[13px] placeholder-zinc-500 border border-white/5 focus:outline-none focus:border-[#fa586a]/40 focus:bg-[#3a3a3c] resize-none transition-all"
          />

          {/* Checkbox styled exactly like the screenshot */}
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

        {/* Footer Actions (Exactly matches the layout: Create on left, Cancel on right) */}
        <div className="flex items-center gap-3 mt-2 border-t border-white/[0.04] pt-4">
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 h-10 rounded-lg bg-[#7a222c] hover:bg-[#8f2c38] disabled:opacity-40 disabled:hover:bg-[#7a222c] text-white text-[13px] font-medium transition-all active:scale-[0.98] cursor-pointer"
          >
            Create
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 h-10 rounded-lg bg-[#2c2c2e] hover:bg-zinc-700 text-white text-[13px] font-medium transition-all active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
