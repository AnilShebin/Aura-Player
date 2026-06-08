import React from 'react';

interface DolbyIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const DolbyIcon: React.FC<DolbyIconProps> = ({
  className = '',
  width = 28,
  height = 10,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 28 10"
      className={className}
      {...props}
    >
      {/* Left 'D' - flat edge on left, round edge on right */}
      <path d="M 4 0 h 2.5 a 5 5 0 0 1 0 10 h -2.5 z" />
      {/* Right 'D' - flat edge on right, round edge on left */}
      <path d="M 24 0 h -2.5 a 5 5 0 0 0 0 10 h 2.5 z" />
    </svg>
  );
};

export default DolbyIcon;
