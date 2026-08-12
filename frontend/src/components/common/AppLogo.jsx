import React from 'react';

export default function AppLogo({ height = 38, showText = true, variant = 'auto', className = '' }) {
  const isFooter = variant === 'footer';
  const isDark = variant === 'dark';

  let navyColor = 'var(--navy)';
  let goldColor = 'var(--gold)';
  let textColor = 'var(--navy)';
  let subColor = 'var(--slate)';

  if (isFooter) {
    navyColor = '#ffffff';
    goldColor = '#fbbf24';
    textColor = '#ffffff';
    subColor = '#fbbf24';
  } else if (isDark) {
    navyColor = '#38bdf8';
    goldColor = '#fbbf24';
    textColor = '#f8fafc';
    subColor = '#fbbf24';
  }

  return (
    <div 
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }} 
      className={`app-logo-container logo-${variant} ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 470"
        style={{ height, width: 'auto', display: 'block', flexShrink: 0 }}
      >
        <g id="icone">
          {/* Cercle d'entourage du logo */}
          <circle cx="200" cy="180" r="170" fill="none" stroke={goldColor} strokeWidth="12" opacity="0.9" />
          
          {/* Toit - grand chevron exterieur */}
          <path fill={navyColor} d="M 90,145 L 200,58 L 310,145 L 310,122 L 200,35 L 90,122 Z" />
          {/* Toit - petit chevron interieur */}
          <path fill={navyColor} d="M 118,168 L 200,103 L 282,168 L 282,148 L 200,83 L 118,148 Z" />
          {/* Pilier gauche */}
          <path fill={navyColor} d="M 118,168 L 152,168 L 152,320 L 118,320 Z" />
          {/* Pilier droit */}
          <path fill={navyColor} d="M 248,168 L 282,168 L 282,320 L 248,320 Z" />
          {/* Fleche / clef doree */}
          <path fill={goldColor} d="M 200,110 L 250,168 L 222,168 L 222,255 L 178,255 L 178,168 L 150,168 Z" />
          {/* Trou de serrure */}
          <circle fill={navyColor} cx="200" cy="282" r="15" />
          <path fill={navyColor} d="M 190,290 L 210,290 L 216,320 L 184,320 Z" />
        </g>
      </svg>
      {showText && (
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: textColor }}>
            SyLOC-T
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: subColor }}>
            CROUS de Thiès
          </div>
        </div>
      )}
    </div>
  );
}
