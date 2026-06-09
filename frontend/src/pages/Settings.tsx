import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Play, ShieldAlert, Folder, Sliders, ChevronRight, ChevronDown, ChevronUp, Trash2, FolderPlus } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'
import { Dialogs } from '@wailsio/runtime'
import { AddFolder, DeleteFolder, GetFolders } from '@/services/settingsService'
import { ScanLibrary, GetSongs, GetAlbums } from '@/services/libraryService'
import { GetCurrentVersion } from '@/services/updaterService'

type SettingSection = 'main' | 'general' | 'playback' | 'restrictions' | 'files' | 'advanced'

export const Settings: React.FC = () => {
  const { 
    showAmbientGlow, 
    setShowAmbientGlow,
    sidebarCollapsed,
    setSidebarCollapsed,
    showTranslation,
    setShowTranslation,
    volume,
    setVolume,
    autoCheckUpdates,
    autoDownloadUpdates,
    updateChannel,
    setUpdateSettings,
    checkForUpdates,
    isCheckingForUpdates
  } = useMusicStore()

  // State to track current sub-page
  const [activeSection, setActiveSection] = useState<SettingSection>('main')

  // Music folders state loaded from SQLite
  const [musicFolders, setMusicFolders] = useState<string[]>([])

  // General States
  const [syncLibrary, setSyncLibrary] = useState(true)
  const [downloadDolby, setDownloadDolby] = useState(false)
  const [alwaysCheckDownloads, setAlwaysCheckDownloads] = useState(false)
  const [useListeningHistory, setUseListeningHistory] = useState(true)
  
  // Show section collapse state & checkboxes
  const [showSectionOpen, setShowSectionOpen] = useState(true)
  const [showITunesStore, setShowITunesStore] = useState(false)
  const [showStarRatings, setShowStarRatings] = useState(true)
  const [showTickboxes, setShowTickboxes] = useState(false)

  // Playback States
  const [crossfade, setCrossfade] = useState(false)
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(4)
  const [soundEnhancer, setSoundEnhancer] = useState(true)
  const [soundCheck, setSoundCheck] = useState(false)
  const [streamingQuality, setStreamingQuality] = useState<'hq' | 'lossless' | 'hires'>('lossless')

  // Restrictions States
  const [restrictionsEnabled, setRestrictionsEnabled] = useState(false)
  const [allowExplicit, setAllowExplicit] = useState(true)

  // Files States
  const [keepOrganised, setKeepOrganised] = useState(true)
  const [copyToFolder, setCopyToFolder] = useState(true)

  // Load music folders on mount or activeSection change to files
  useEffect(() => {
    if (activeSection === 'files') {
      loadFolders()
    }
  }, [activeSection])

  const [currentVersion, setCurrentVersion] = useState('1.0.0')

  useEffect(() => {
    GetCurrentVersion().then(setCurrentVersion).catch(console.error)
  }, [])

  const loadFolders = async () => {
    try {
      const folders = await GetFolders()
      setMusicFolders(folders || [])
      if (folders) {
        await ScanLibrary(folders)
      }
      const songs = await GetSongs()
      useMusicStore.setState({ librarySongs: songs || [] })
      const albums = await GetAlbums()
      useMusicStore.setState({ libraryAlbums: albums || [] })
    } catch (err) {
      console.error('Failed to load music folders:', err)
    }
  }

  const handleAddMusicFolder = async () => {
    try {
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
      console.error('Failed to add music folder:', err)
    }
  }

  const handleDeleteMusicFolder = async (path: string) => {
    try {
      await DeleteFolder(path)
      await loadFolders()
    } catch (err) {
      console.error('Failed to delete music folder:', err)
    }
  }

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

          {/* Playback Card */}
          <div 
            onClick={() => setActiveSection('playback')}
            className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-300 border border-white/[0.02]">
                <Play size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-white">Playback</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5">How to fade songs in and out, change music sound quality during playback and more.</span>
              </div>
            </div>
            <div className="text-zinc-500 pr-1">
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Restrictions Card */}
          <div 
            onClick={() => setActiveSection('restrictions')}
            className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-300 border border-white/[0.02]">
                <ShieldAlert size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-white">Restrictions</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5">Turn content & privacy restrictions on or off.</span>
              </div>
            </div>
            <div className="text-zinc-500 pr-1">
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Files Card */}
          <div 
            onClick={() => setActiveSection('files')}
            className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-300 border border-white/[0.02]">
                <Folder size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-white">Files</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5">Organise your Media folder.</span>
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
          <span className="text-zinc-400 text-[12px] font-light mt-1">Copyright © 2022–2026 Aura Inc. All rights reserved.</span>
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
          
          {/* Sync Library */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Sync library</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Show all the music you've added, purchased and uploaded. The music on this computer will appear on your other devices after syncing with the cloud.
              </span>
            </div>
            <ToggleSwitch checked={syncLibrary} onChange={() => setSyncLibrary(!syncLibrary)} />
          </div>

          {/* Dolby Atmos */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Download Dolby Atmos</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Download immersive, three-dimensional (spatial) audio when available.
              </span>
            </div>
            <ToggleSwitch checked={downloadDolby} onChange={() => setDownloadDolby(!downloadDolby)} />
          </div>

          {/* Always Check Downloads */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Always check for available downloads</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Automatically check for items you previously purchased from the iTunes Store but didn't download.
              </span>
            </div>
            <ToggleSwitch checked={alwaysCheckDownloads} onChange={() => setAlwaysCheckDownloads(!alwaysCheckDownloads)} />
          </div>

          {/* Use Listening History */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Use listening history</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Music played on this computer will appear in Recently Played, Replay mixes, influence your recommendations, and if you set up an Apple Music profile, it will also be seen by your followers.
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

          {/* Updates Settings Section */}
          <div className="flex flex-col bg-[#202022]/40 border border-white/[0.04] rounded-xl p-4 mt-2 gap-4">
            <h3 className="text-[14px] font-bold text-white tracking-tight">Updates</h3>
            
            {/* Current Version */}
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] text-zinc-300 font-light">Current Version</span>
              <span className="text-[12.5px] text-zinc-400 font-bold bg-zinc-800/60 px-2.5 py-0.5 rounded border border-white/5">{currentVersion}</span>
            </div>

            {/* Automatically Check Toggles */}
            <div className="flex items-center justify-between border-t border-white/[0.03] pt-3">
              <div className="flex flex-col pr-6">
                <span className="text-[13px] font-semibold text-white">Automatically check for updates</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                  Keep Aura up to date by checking for new releases automatically in the background.
                </span>
              </div>
              <ToggleSwitch checked={autoCheckUpdates} onChange={() => setUpdateSettings({ autoCheckUpdates: !autoCheckUpdates })} />
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.03] pt-3">
              <div className="flex flex-col pr-6">
                <span className="text-[13px] font-semibold text-white">Download updates automatically</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                  Download new installer/assets in the background to ensure updates are ready to install.
                </span>
              </div>
              <ToggleSwitch checked={autoDownloadUpdates} onChange={() => setUpdateSettings({ autoDownloadUpdates: !autoDownloadUpdates })} />
            </div>

            {/* Update Channel */}
            <div className="flex flex-col gap-2 border-t border-white/[0.03] pt-3">
              <span className="text-[13px] font-semibold text-white">Update Channel</span>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[12.5px] font-light text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="updateChannel"
                    value="stable"
                    checked={updateChannel === 'stable'}
                    onChange={() => setUpdateSettings({ updateChannel: 'stable' })}
                    className="w-4.5 h-4.5 rounded-full bg-[#2c2c2e] border-white/10 accent-[#fa586a] cursor-pointer"
                  />
                  <span>Stable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none text-[12.5px] font-light text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="updateChannel"
                    value="beta"
                    checked={updateChannel === 'beta'}
                    onChange={() => setUpdateSettings({ updateChannel: 'beta' })}
                    className="w-4.5 h-4.5 rounded-full bg-[#2c2c2e] border-white/10 accent-[#fa586a] cursor-pointer"
                  />
                  <span>Beta</span>
                </label>
              </div>
            </div>

            {/* Manual Check Button */}
            <div className="flex border-t border-white/[0.03] pt-4 mt-1 justify-end">
              <button
                onClick={() => checkForUpdates(true)}
                disabled={isCheckingForUpdates}
                className="h-8 px-4 rounded-lg bg-[#fa586a] hover:bg-[#fa586a]/90 disabled:opacity-50 text-white font-semibold text-[12.5px] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                {isCheckingForUpdates ? 'Checking...' : 'Check for Updates'}
              </button>
            </div>
          </div>

          {/* Show Options Block */}
          <div className="flex flex-col bg-[#202022]/40 border border-white/[0.04] rounded-xl overflow-hidden mt-2">
            <div 
              onClick={() => setShowSectionOpen(!showSectionOpen)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.01]"
            >
              <div className="flex flex-col">
                <span className="text-[13.5px] font-semibold text-white">Show</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5">Configure which elements show or hide.</span>
              </div>
              <div className="text-zinc-500 pr-1">
                {showSectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {showSectionOpen && (
              <div className="border-t border-white/[0.04] p-5 bg-black/10 flex flex-col gap-4">
                
                {/* iTunes Store Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer w-fit text-[13px] text-zinc-300 font-light">
                  <input 
                    type="checkbox"
                    checked={showITunesStore}
                    onChange={(e) => setShowITunesStore(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#fa586a] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#fa586a]"
                  />
                  <span>iTunes Store</span>
                </label>

                {/* Star ratings Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer w-fit text-[13px] text-zinc-300 font-light">
                  <input 
                    type="checkbox"
                    checked={showStarRatings}
                    onChange={(e) => setShowStarRatings(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#fa586a] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#fa586a]"
                  />
                  <span>Star ratings</span>
                </label>

                {/* Songs list tickboxes Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer w-fit text-[13px] text-zinc-300 font-light">
                  <input 
                    type="checkbox"
                    checked={showTickboxes}
                    onChange={(e) => setShowTickboxes(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#fa586a] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#fa586a]"
                  />
                  <span>Songs list tickboxes</span>
                </label>

              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  // 2. PLAYBACK SUB-PAGE
  if (activeSection === 'playback') {
    return (
      <div className="w-full flex flex-col gap-4 py-6 pb-28 select-none max-w-4xl">
        <BreadcrumbHeader title="Playback" />

        <div className="flex flex-col gap-3">
          
          {/* Crossfade */}
          <div className="flex flex-col p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col pr-6">
                <span className="text-[13.5px] font-semibold text-white">Crossfade Songs</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                  Transition smoothly between audio files using crossfaded gain curves.
                </span>
              </div>
              <ToggleSwitch checked={crossfade} onChange={() => setCrossfade(!crossfade)} />
            </div>
            
            {crossfade && (
              <div className="flex items-center gap-4 border-t border-white/[0.03] pt-3 text-xs text-zinc-300">
                <span>Duration:</span>
                <input 
                  type="range"
                  min="1"
                  max="12"
                  value={crossfadeSeconds}
                  onChange={(e) => setCrossfadeSeconds(parseInt(e.target.value))}
                  className="w-40 accent-[#fa586a] cursor-pointer"
                />
                <span>{crossfadeSeconds} seconds</span>
              </div>
            )}
          </div>

          {/* Sound Enhancer */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Sound Enhancer</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Expand perceived stereo width and boost transient presence.
              </span>
            </div>
            <ToggleSwitch checked={soundEnhancer} onChange={() => setSoundEnhancer(!soundEnhancer)} />
          </div>

          {/* Sound Check */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Sound Check</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Normalise volume levels across tracks to prevent sudden level spikes.
              </span>
            </div>
            <ToggleSwitch checked={soundCheck} onChange={() => setSoundCheck(!soundCheck)} />
          </div>

          {/* Sound Quality Selector */}
          <div className="flex flex-col p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl gap-4">
            <div className="flex flex-col">
              <span className="text-[13.5px] font-semibold text-white">Audio Quality Settings</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Select your default listening bitrates. Higher settings consume more data.
              </span>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.03] pt-4">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Streaming Fidelity</span>
                <div className="flex bg-zinc-800 rounded-lg p-0.5 border border-white/5">
                  <button 
                    onClick={() => setStreamingQuality('hq')}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${streamingQuality === 'hq' ? 'bg-[#fa586a] text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    High Quality
                  </button>
                  <button 
                    onClick={() => setStreamingQuality('lossless')}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${streamingQuality === 'lossless' ? 'bg-[#fa586a] text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Lossless
                  </button>
                  <button 
                    onClick={() => setStreamingQuality('hires')}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${streamingQuality === 'hires' ? 'bg-[#fa586a] text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Hi-Res Lossless
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-300 border-t border-white/[0.02] pt-3">
                <span>Output Volume</span>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-40 accent-[#fa586a] cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // 3. RESTRICTIONS SUB-PAGE
  if (activeSection === 'restrictions') {
    return (
      <div className="w-full flex flex-col gap-4 py-6 pb-28 select-none max-w-4xl">
        <BreadcrumbHeader title="Restrictions" />

        <div className="flex flex-col gap-3">
          
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Enable Content Restrictions</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Filter content with warning labels out of library lists.
              </span>
            </div>
            <ToggleSwitch checked={restrictionsEnabled} onChange={() => setRestrictionsEnabled(!restrictionsEnabled)} />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Explicit Content</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Allow music and album artwork marked explicit to play.
              </span>
            </div>
            <ToggleSwitch checked={allowExplicit} onChange={() => setAllowExplicit(!allowExplicit)} />
          </div>

        </div>
      </div>
    )
  }

  // 4. FILES SUB-PAGE
  if (activeSection === 'files') {
    return (
      <div className="w-full flex flex-col gap-4 py-6 pb-28 select-none max-w-4xl">
        <BreadcrumbHeader title="Files" />

        <div className="flex flex-col gap-3.5">
          
          {/* Music Folders Section */}
          <div className="flex flex-col bg-[#202022]/40 border border-white/[0.04] rounded-xl p-5 gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-white">Selected Music Folders</span>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5">
                  Configure directory locations scanned by Aura's music database.
                </span>
              </div>
              <button
                onClick={handleAddMusicFolder}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#fa586a]/30 hover:border-[#fa586a] text-[#fa586a] hover:bg-[#fa586a]/5 text-[11px] font-semibold transition-all duration-150 cursor-pointer"
              >
                <FolderPlus size={13} />
                <span>Add Folder</span>
              </button>
            </div>

            {/* Folders List */}
            <div className="flex flex-col gap-2 mt-1">
              {musicFolders.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-lg bg-black/10">
                  <span className="text-[11.5px] text-zinc-500 font-light">No custom music folders selected.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {musicFolders.map((path) => (
                    <div 
                      key={path} 
                      className="flex items-center justify-between gap-4 p-2.5 bg-black/20 border border-white/[0.02] rounded-lg hover:bg-black/35 transition-colors"
                    >
                      <span className="text-[11.5px] text-zinc-300 font-light truncate" title={path}>
                        {path}
                      </span>
                      <button 
                        onClick={() => handleDeleteMusicFolder(path)}
                        className="text-zinc-500 hover:text-[#fa586a] p-1.5 rounded transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* File location */}
          <div className="flex flex-col p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl gap-3">
            <span className="text-[13.5px] font-semibold text-white">Aura Media folder location</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly
                value="C:\Users\anils\Music\Aura" 
                className="flex-1 px-3 py-1.5 rounded bg-zinc-800/80 border border-white/5 text-zinc-400 text-[11px] select-all outline-none" 
              />
              <button className="px-3 py-1.5 bg-[#fa586a] hover:bg-[#fa586a]/90 text-white rounded text-[11px] font-medium cursor-pointer transition-colors duration-150">
                Change...
              </button>
            </div>
          </div>

          {/* Organise media */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Keep Aura Media folder organised</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Place imported music files automatically into neat Artist/Album folders.
              </span>
            </div>
            <ToggleSwitch checked={keepOrganised} onChange={() => setKeepOrganised(!keepOrganised)} />
          </div>

          {/* Copy files */}
          <div className="flex items-center justify-between p-4 bg-[#202022]/40 border border-white/[0.04] rounded-xl">
            <div className="flex flex-col pr-6">
              <span className="text-[13.5px] font-semibold text-white">Copy files to Aura Media folder when adding to library</span>
              <span className="text-[11px] text-zinc-400 font-light mt-0.5 leading-snug">
                Create a local copy of imported files instead of linking to their original path.
              </span>
            </div>
            <ToggleSwitch checked={copyToFolder} onChange={() => setCopyToFolder(!copyToFolder)} />
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
