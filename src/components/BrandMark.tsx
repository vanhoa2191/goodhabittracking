import React from 'react';

interface BrandMarkProps {
  readonly className?: string;
  readonly label?: string;
}

export function BrandMark({ className = 'h-10 w-10', label }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id="brand-surface" x1="70" y1="40" x2="440" y2="470" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="brand-sprout" x1="164" y1="340" x2="337" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
        <filter id="brand-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#312e81" floodOpacity="0.28" />
        </filter>
      </defs>
      <rect x="28" y="28" width="456" height="456" rx="132" fill="url(#brand-surface)" filter="url(#brand-shadow)" />
      <path d="M256 103c18 47 54 62 101 64-36 25-51 61-44 108-31-27-68-27-114 0 10-46-4-82-44-108 48-2 82-17 101-64Z" fill="#fff" fillOpacity="0.16" />
      <path d="M256 362V214" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="24" />
      <path d="M256 280c-60-3-92-38-82-91 54-2 88 28 82 91Z" fill="url(#brand-sprout)" />
      <path d="M256 250c60-3 92-38 82-91-54-2-88 28-82 91Z" fill="#fde68a" />
      <path d="M172 365c51 28 117 28 168 0" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="18" strokeOpacity="0.9" />
    </svg>
  );
}
