import React from 'react'
import { WindowControls } from './WindowControls'

interface TitleBarProps {
  os: 'mac' | 'windows' | 'linux'
  isHoveredControls: boolean
  setIsHoveredControls: (hovered: boolean) => void
  toggleMaximize: () => void
}

export const TitleBar: React.FC<TitleBarProps> = ({
  os,
  isHoveredControls,
  setIsHoveredControls,
  toggleMaximize
}) => {
  return (
    <div className="absolute top-0 right-0 z-50 flex items-center wails-no-drag select-none">
      {/* Window Controls (Windows / Linux) — compact transparent overlay */}
      {os !== 'mac' && (
        <WindowControls
          os={os}
          isHoveredControls={isHoveredControls}
          setIsHoveredControls={setIsHoveredControls}
          toggleMaximize={toggleMaximize}
        />
      )}
    </div>
  )
}
