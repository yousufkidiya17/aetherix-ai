import React from 'react'

interface AetherixLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  variant?: 'light' | 'dark' | 'monochrome'
  className?: string
}

const sizeMap = {
  sm: 80,
  md: 120,
  lg: 160,
  xl: 200,
}

export default function AetherixLogo({
  size = 'md',
  animated = true,
  variant = 'light',
  className = '',
}: AetherixLogoProps) {
  const dimension = sizeMap[size]

  const glowColor = variant === 'monochrome' ? '#001a4d' : '#0066FF'
  const bgOpacity = variant === 'dark' ? 1 : 0.4

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width={dimension}
      height={dimension}
      className={`${animated ? 'animate-glow' : ''} ${className}`}
      style={{
        filter: animated ? 'drop-shadow(0 0 20px rgba(0, 102, 255, 0.3))' : 'none',
      }}
    >
      <defs>
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: glowColor, stopOpacity: bgOpacity }} />
          <stop offset="100%" style={{ stopColor: glowColor, stopOpacity: bgOpacity * 0.25 }} />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow background */}
      <circle cx="100" cy="100" r="85" fill="url(#glowGradient)" />

      {/* Nodes */}
      <circle cx="100" cy="40" r="6" fill={glowColor} filter="url(#glow)" />
      <circle cx="60" cy="65" r="5.5" fill={glowColor} filter="url(#glow)" />
      <circle cx="140" cy="65" r="5.5" fill={glowColor} filter="url(#glow)" />
      <circle cx="40" cy="100" r="5.5" fill={glowColor} filter="url(#glow)" />
      <circle cx="100" cy="100" r="5" fill={glowColor} filter="url(#glow)" />
      <circle cx="160" cy="100" r="5.5" fill={glowColor} filter="url(#glow)" />
      <circle cx="65" cy="140" r="5" fill={glowColor} filter="url(#glow)" />
      <circle cx="135" cy="140" r="5" fill={glowColor} filter="url(#glow)" />
      <circle cx="100" cy="165" r="6" fill={glowColor} filter="url(#glow)" />
      <circle cx="80" cy="80" r="4.5" fill={glowColor} filter="url(#glow)" />
      <circle cx="120" cy="80" r="4.5" fill={glowColor} filter="url(#glow)" />
      <circle cx="80" cy="120" r="4.5" fill={glowColor} filter="url(#glow)" />
      <circle cx="120" cy="120" r="4.5" fill={glowColor} filter="url(#glow)" />

      {/* Lines */}
      <line x1="100" y1="40" x2="60" y2="65" stroke={glowColor} strokeWidth="1.5" opacity="0.8" />
      <line x1="100" y1="40" x2="140" y2="65" stroke={glowColor} strokeWidth="1.5" opacity="0.8" />
      <line x1="60" y1="65" x2="140" y2="65" stroke={glowColor} strokeWidth="1.5" opacity="0.8" />
      <line x1="60" y1="65" x2="40" y2="100" stroke={glowColor} strokeWidth="1.5" opacity="0.7" />
      <line x1="100" y1="40" x2="100" y2="100" stroke={glowColor} strokeWidth="1.5" opacity="0.7" />
      <line x1="140" y1="65" x2="160" y2="100" stroke={glowColor} strokeWidth="1.5" opacity="0.7" />
      <line x1="40" y1="100" x2="160" y2="100" stroke={glowColor} strokeWidth="1.5" opacity="0.8" />
      <line x1="65" y1="140" x2="100" y2="165" stroke={glowColor} strokeWidth="1.5" opacity="0.8" />
      <line x1="135" y1="140" x2="100" y2="165" stroke={glowColor} strokeWidth="1.5" opacity="0.8" />
      <line x1="65" y1="140" x2="135" y2="140" stroke={glowColor} strokeWidth="1.5" opacity="0.8" />
    </svg>
  )
}
