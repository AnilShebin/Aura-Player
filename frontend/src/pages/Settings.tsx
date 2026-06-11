import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Sliders, ChevronRight } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { GetCurrentVersion } from '@/services/updaterService'

type SettingSection = 'main' | 'general' | 'advanced'

export const Settings: React.FC = () => {
  const { 
    showAmbientGlow, 
    setShowAmbientGlow,
    sidebarCollapsed,
    setSidebarCollapsed,
    showTranslation,
    setShowTranslation,
  } = useMusicStore()

  // State to track current sub-page
  const [activeSection, setActiveSection] = useState<SettingSection>('main')

  // General States
  const [useListeningHistory, setUseListeningHistory] = useState(true)

  const [currentVersion, setCurrentVersion] = useState('1.0.0')

  useEffect(() => {
    GetCurrentVersion().then(setCurrentVersion).catch(console.error)
  }, [])

  // Sub-navigation breadcrumb component
  const BreadcrumbHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex flex-col mb-6">
      <h1 className="text-[28px] md:text-[34px] font-extrabold text-white tracking-tight leading-none flex items-center">
        <span 
          onClick={() => setActiveSection('main')}
          className="hover:underline cursor-pointer text-zinc-400 font-extrabold transition-colors duration-150"
        >
          Settings
        </span>
        <span className="text-zinc-500 font-light text-[22px] md:text-[26px] mx-2 mt-0.5 select-none">›</span>
        <span className="text-white font-extrabold">{title}</span>
      </h1>
    </div>
  )

  // Render toggle switch custom component
  const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-[12.5px] font-normal text-zinc-300 select-none min-w-[24px] text-right">
        {checked ? 'On' : 'Off'}
      </span>
      <button 
        onClick={onChange}
        className={`w-[42px] h-[22px] rounded-full p-0.5 transition-colors duration-200 cursor-pointer focus:outline-none ${checked ? 'bg-[#fa586a]' : 'bg-zinc-700'}`}
      >
        <div className={`w-[18px] h-[18px] rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )

  // Renders Main Menu Page
  if (activeSection === 'main') {
    return (
      <div className="w-full flex flex-col gap-6 py-6 pb-28 select-none max-w-4xl">
        {/* Title Header */}
        <div className="flex flex-col mb-2">
          <h1 className="text-[28px] md:text-[34px] font-extrabold text-white tracking-tight leading-none">
            Settings
          </h1>
        </div>

        {/* Stack Options */}
        <div className="flex flex-col gap-3">
          
          {/* General Card */}
          <div 
            onClick={() => setActiveSection('general')}
            className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-300 border border-white/[0.02]">
                <SettingsIcon size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-white">General</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5">Choose how to show lists and more.</span>
              </div>
            </div>
            <div className="text-zinc-500 pr-1">
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Advanced Card */}
          <div 
            onClick={() => setActiveSection('advanced')}
            className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-300 border border-white/[0.02]">
                <Sliders size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-white">Advanced</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5">Reset warnings, control MiniPlayer window behaviour and more.</span>
              </div>
            </div>
            <div className="text-zinc-500 pr-1">
              <ChevronRight size={16} />
            </div>
          </div>

        </div>

        {/* Bottom About Section */}
        <div className="flex flex-col mt-6 px-1">
          <h3 className="text-[14px] font-bold text-white mb-2">About this app</h3>
          <span className="text-zinc-400 text-[12px] font-light">Aura Music {currentVersion}</span>
          <span className="text-zinc-400 text-[12px] font-light mt-1">Copyright © 2026 Aura Inc. All rights reserved.</span>
        </div>
      </div>
    )
  }

  // 1. GENERAL SUB-PAGE
  if (activeSection === 'general') {
    return (
      <div className="w-full flex flex-col gap-4 py-6 pb-28 select-none max-w-4xl">
        <BreadcrumbHeader title="General" />

        <div className="flex flex-col gap-3">
          
          {/* Use Listening History */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Use listening history</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Music played on this computer will appear in Recently Played and influence your smart recommendations.
              </span>
            </div>
            <ToggleSwitch checked={useListeningHistory} onChange={() => setUseListeningHistory(!useListeningHistory)} />
          </div>

          {/* Custom Aura App Settings */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Ambient Glow Backdrop</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Animate blurred album artwork colors in the background wrapper.
              </span>
            </div>
            <ToggleSwitch checked={showAmbientGlow} onChange={() => setShowAmbientGlow(!showAmbientGlow)} />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Collapse Sidebar</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Collapse navigation panels into a minimalist icon tray.
              </span>
            </div>
            <ToggleSwitch checked={sidebarCollapsed} onChange={() => setSidebarCollapsed(!sidebarCollapsed)} />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Show Lyrics Translation</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Load secondary translation subtitles alongside original lyric documents.
              </span>
            </div>
            <ToggleSwitch checked={showTranslation} onChange={() => setShowTranslation(!showTranslation)} />
          </div>

        </div>
      </div>
    )
  }

  // 5. ADVANCED SUB-PAGE
  if (activeSection === 'advanced') {
    return (
      <div className="w-full flex flex-col gap-4 py-6 pb-28 select-none max-w-4xl">
        <BreadcrumbHeader title="Advanced" />

        <div className="flex flex-col gap-3">
          
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Reset all dialog warnings</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Restore displaying warning prompts for deleting songs or clearing playlists.
              </span>
            </div>
            <button className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg text-white text-[11px] font-semibold cursor-pointer transition-colors duration-150 shrink-0">
              Reset Warnings
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Clear Artwork Cache</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Re-load all cover image drawings from remote URLs.
              </span>
            </div>
            <button className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg text-white text-[11px] font-semibold cursor-pointer transition-colors duration-150 shrink-0">
              Clear Cache
            </button>
          </div>

        </div>
      </div>
    )
  }

  return null
}
export default Settings
