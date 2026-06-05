import React, { useState, useEffect } from 'react'
import { FolderPlus, Trash2, Music } from 'lucide-react'
import { Dialogs } from '@wailsio/runtime'
import { AddFolder, DeleteFolder, GetFolders, SetFirstTime } from '@/services/settingsService'

interface OnboardingWelcomeProps {
  onComplete: () => void
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onComplete }) => {
  const [folders, setFolders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch already selected folders on mount
  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      const list = await GetFolders()
      setFolders(list || [])
    } catch (err) {
      console.error('Failed to load folders:', err)
    }
  }

  const handleAddFolder = async () => {
    try {
      setIsLoading(true)
      const selected = await Dialogs.OpenFile({
        CanChooseDirectories: true,
        CanChooseFiles: false,
        Title: 'Select Music Folder',
        Message: 'Choose a folder containing your audio files'
      })

      if (selected && typeof selected === 'string' && selected.trim() !== '') {
        await AddFolder(selected)
        await loadFolders()
      } else if (Array.isArray(selected) && selected.length > 0) {
        for (const p of selected) {
          if (p && p.trim() !== '') {
            await AddFolder(p)
          }
        }
        await loadFolders()
      }
    } catch (err) {
      console.error('Failed to add folder:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFolder = async (path: string) => {
    try {
      await DeleteFolder(path)
      await loadFolders()
    } catch (err) {
      console.error('Failed to delete folder:', err)
    }
  }

  const handleFinish = async () => {
    try {
      // Save that first time onboarding is completed
      await SetFirstTime(false)
      onComplete()
    } catch (err) {
      console.error('Failed to finish onboarding:', err)
      onComplete() // Proceed anyway so user isn't stuck
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in p-4 select-none">
      
      {/* Decorative top ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#fa586a]/15 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[440px] bg-[#202022]/90 border border-white/[0.08] rounded-2xl shadow-2xl p-7 md:p-8 flex flex-col gap-6 text-center backdrop-blur-md">
        
        {/* Header Icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-tr from-[#fa586a] to-[#ff7e8d] flex items-center justify-center text-white shadow-[0_0_20px_rgba(250,88,106,0.3)]">
          <Music size={24} />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome to Aura</h2>
          <p className="text-zinc-400 text-[12.5px] leading-relaxed font-light px-2">
            Let's configure your music library. Select the folders on your system where your audio tracks are stored to start.
          </p>
        </div>

        {/* Folders List Container */}
        <div className="flex flex-col gap-2.5 text-left">
          <span className="text-[12px] font-semibold text-zinc-300 px-1">Selected Folders</span>
          
          <div className="min-h-[120px] max-h-[180px] overflow-y-auto bg-black/20 border border-white/[0.04] rounded-lg p-3 flex flex-col gap-2 custom-scrollbar">
            {folders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <span className="text-[11.5px] text-zinc-500 font-light">No folders selected yet.</span>
              </div>
            ) : (
              folders.map((path) => (
                <div key={path} className="flex items-center justify-between gap-3 p-2 bg-white/[0.02] border border-white/[0.02] rounded-md group hover:bg-white/[0.04] transition-colors">
                  <span className="text-[11px] text-zinc-300 font-light truncate" title={path}>
                    {path}
                  </span>
                  <button 
                    onClick={() => handleDeleteFolder(path)}
                    className="text-zinc-500 hover:text-[#fa586a] p-1 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleAddFolder}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-[#fa586a]/30 hover:border-[#fa586a] text-[#fa586a] hover:bg-[#fa586a]/5 text-[12.5px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <FolderPlus size={15} />
            <span>Add Folder</span>
          </button>

          <button
            onClick={handleFinish}
            disabled={folders.length === 0 || isLoading}
            className="w-full px-4 py-2.5 rounded-lg bg-[#fa586a] hover:bg-[#fa586a]/90 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-[12.5px] font-bold shadow-lg shadow-[#fa586a]/10 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
          >
            Get Started
          </button>
        </div>

      </div>
    </div>
  )
}
