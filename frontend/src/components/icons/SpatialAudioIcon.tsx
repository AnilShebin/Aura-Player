import React from 'react';

interface SpatialAudioIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * Generic spatial/immersive audio icon — three concentric arcs representing
 * surround-sound waves. Replaces the trademarked Dolby logo.
 */
export const SpatialAudioIcon: React.FC<SpatialAudioIconProps> = ({
  className = '',
  width = 20,
  height = 14,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 20 14"
      fill="none"
      className={className}
      {...props}
    >
      {/* Inner arc */}
      <path
        d="M8 5.5a2.5 2.5 0 0 1 0 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 5.5a2.5 2.5 0 0 0 0 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Middle arc */}
      <path
        d="M5.5 3a5.5 5.5 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14.5 3a5.5 5.5 0 0 0 0 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Outer arc */}
      <path
        d="M3 1a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17 1a8.5 8.5 0 0 0 0 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default SpatialAudioIcon;
