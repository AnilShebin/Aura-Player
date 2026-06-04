import React from 'react'
import { X } from 'lucide-react'
import { Window } from '@wailsio/runtime'

interface WindowControlsProps {
  os: 'mac' | 'windows' | 'linux'
  isHoveredControls: boolean
  setIsHoveredControls: (hovered: boolean) => void
  toggleMaximize: () => void
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  os,
  isHoveredControls,
  setIsHoveredControls,
  toggleMaximize
}) => {
  if (os === 'mac') {
    return (
      <div 
        className="flex items-center gap-2 px-5 pt-4 pb-1"
        onMouseEnter={() => setIsHoveredControls(true)}
        onMouseLeave={() => setIsHoveredControls(false)}
      >
        <button 
          className="w-3 h-3 rounded-full bg-[#ff5f56] flex items-center justify-center text-[9px] font-bold text-[#4c0002] active:bg-[#bf4942] cursor-pointer wails-no-drag relative border border-transparent shadow-[0_0_1px_rgba(0,0,0,0.4)]"
          onClick={() => Window.Close()}
          title="Close"
        >
          {isHoveredControls && <span className="absolute inset-0 flex items-center justify-center leading-none text-[8px] font-bold select-none">×</span>}
        </button>
        <button 
          className="w-3 h-3 rounded-full bg-[#ffbd2e] flex items-center justify-center text-[9px] font-bold text-[#5c3e00] active:bg-[#c08e22] cursor-pointer wails-no-drag relative border border-transparent shadow-[0_0_1px_rgba(0,0,0,0.4)]"
          onClick={() => Window.Minimise()}
          title="Minimize"
        >
          {isHoveredControls && <span className="absolute inset-0 flex items-center justify-center leading-none text-[8px] font-bold select-none" style={{ transform: 'translateY(-1px)' }}>—</span>}
        </button>
        <button 
          className="w-3 h-3 rounded-full bg-[#27c93f] flex items-center justify-center text-[7px] font-bold text-[#024d07] active:bg-[#1b952f] cursor-pointer wails-no-drag relative border border-transparent shadow-[0_0_1px_rgba(0,0,0,0.4)]"
          onClick={toggleMaximize}
          title="Zoom"
        >
          {isHoveredControls && (
            <span className="absolute inset-0 flex items-center justify-center leading-none text-[6px] font-bold select-none">
              <svg width="6" height="6" viewBox="0 0 10 10" fill="currentColor">
                <path d="M0 10h6V4H0v6zM10 0H4v6h6V0z" />
              </svg>
            </span>
          )}
        </button>
      </div>
    )
  }

  // Windows / Linux control style
  return (
    <div className="flex items-stretch h-8 wails-no-drag">
      <button 
        className="w-12 h-8 rounded-none hover:bg-white/10 flex items-center justify-center text-[#c7c7cc] hover:text-white transition-colors duration-100 cursor-pointer" 
        title="Minimize" 
        onClick={() => Window.Minimise()}
      >
        <div className="w-2.5 h-[1px] bg-current" />
      </button>
      <button 
        className="w-12 h-8 rounded-none hover:bg-white/10 flex items-center justify-center text-[#c7c7cc] hover:text-white transition-colors duration-100 cursor-pointer" 
        title="Maximize" 
        onClick={toggleMaximize}
      >
        <div className="w-2.5 h-2.5 border-[1px] border-current rounded-none" />
      </button>
      <button 
        className="w-12 h-8 rounded-none hover:bg-[#e81123] hover:text-white flex items-center justify-center text-[#c7c7cc] transition-colors duration-100 cursor-pointer" 
        title="Close" 
        onClick={() => Window.Close()}
      >
        <X size={14} className="stroke-[2.5]" />
      </button>
    </div>
  )
}
