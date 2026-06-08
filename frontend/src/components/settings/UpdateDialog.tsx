import React from 'react'
import { useMusicStore } from '@/stores/musicStore'
import { Check } from 'lucide-react'

export const UpdateDialog: React.FC = () => {
  const showUpdateDialog = useMusicStore(state => state.showUpdateDialog)
  const setUpdateDialog = useMusicStore(state => state.setUpdateDialog)
  const latestUpdateInfo = useMusicStore(state => state.latestUpdateInfo)
  const isDownloadingUpdate = useMusicStore(state => state.isDownloadingUpdate)
  const downloadAndInstallLatestUpdate = useMusicStore(state => state.downloadAndInstallLatestUpdate)
  const updateError = useMusicStore(state => state.updateError)

  if (!showUpdateDialog || !latestUpdateInfo) return null

  // Process release notes to look like bullet points
  const getNotesList = () => {
    if (!latestUpdateInfo.releaseNotes) {
      return [
        'TTML Karaoke Support',
        'Spatial Audio / Dolby Atmos Detection',
        'Library Stability & Speed Enhancements'
      ]
    }
    
    const parsed = latestUpdateInfo.releaseNotes
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.startsWith('-') || line.startsWith('*') || line.startsWith('✓') || line.startsWith('+')))
      .map(line => line.replace(/^[\-\*\+✓]\s*/, ''))
      .slice(0, 5) // Limit to top 5 features
      
    if (parsed.length === 0) {
      return [
        'TTML Karaoke Support',
        'Spatial Audio / Dolby Atmos Detection',
        'Library Stability & Speed Enhancements'
      ]
    }
    return parsed
  }

  const notes = getNotesList()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-[360px] bg-[#1c1c1e] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
        
        {/* Aura Logo Header */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#a855f7] to-[#fa586a] flex items-center justify-center shadow-lg">
            <svg height="24" viewBox="0 0 22 20" width="24" xmlns="http://www.w3.org/2000/svg" className="fill-current text-white" aria-hidden="true">
              <path 
                d="M1 10h2.5c1.2 0 1.8-7.5 3-7.5s1.8 14 3 14 1.8-11 3-11 1.8 8 3 8 1.8-3.5 3-3.5" 
                stroke="currentColor" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none"
              />
            </svg>
          </div>
          <h2 className="text-[17px] font-bold text-center tracking-tight text-white mt-1">
            Aura {latestUpdateInfo.latestVersion} Available
          </h2>
          <p className="text-[11.5px] text-zinc-400 font-light text-center px-4 leading-normal">
            A new version of Aura Music is ready to download and install.
          </p>
        </div>

        {/* Bullet features */}
        {notes.length > 0 && (
          <div className="flex flex-col gap-2.5 bg-zinc-900/50 border border-white/[0.03] rounded-xl p-4 my-1">
            {notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-[12.5px] font-medium text-zinc-200">
                <span className="text-[#fa586a] shrink-0 mt-0.5">
                  <Check size={14} strokeWidth={3} className="text-[#fa586a]" />
                </span>
                <span className="leading-tight">{note}</span>
              </div>
            ))}
          </div>
        )}

        {updateError && (
          <p className="text-[11px] text-[#fa586a] text-center font-light leading-tight">
            {updateError}
          </p>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-3 mt-2 border-t border-white/[0.04] pt-4">
          <button
            onClick={() => downloadAndInstallLatestUpdate()}
            disabled={isDownloadingUpdate}
            className="flex-1 h-10 rounded-lg bg-[#fa586a] hover:bg-[#fa586a]/90 disabled:opacity-50 text-white text-[13px] font-bold transition-all active:scale-[0.98] cursor-pointer shadow-md flex items-center justify-center"
          >
            {isDownloadingUpdate ? 'Updating...' : 'Update Now'}
          </button>
          <button
            onClick={() => setUpdateDialog(false)}
            disabled={isDownloadingUpdate}
            className="flex-1 h-10 rounded-lg bg-[#2c2c2e] hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 hover:text-white text-[13px] font-semibold transition-all active:scale-[0.98] cursor-pointer border border-white/5"
          >
            Later
          </button>
        </div>

      </div>
    </div>
  )
}
