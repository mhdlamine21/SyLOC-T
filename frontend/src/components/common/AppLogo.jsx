import React from 'react';

export default function AppLogo({ height = 38, showText = true, variant = 'auto', className = '' }) {
  const isDarkVariant = variant === 'dark' || variant === 'footer';

  return (
    <div 
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }} 
      className={`${isDarkVariant ? 'logo-variant-dark' : ''} ${className}`}
      data-testid="app-logo-container"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 470"
        style={{ height, width: 'auto', display: 'block', flexShrink: 0 }}
        className="syloct-svg-logo"
      >
        <g id="icone">
          {/* Toit - grand chevron exterieur */}
          <path className="syloct-navy" d="M 90,145 L 200,58 L 310,145 L 310,122 L 200,35 L 90,122 Z" />
          {/* Toit - petit chevron interieur */}
          <path className="syloct-navy" d="M 118,168 L 200,103 L 282,168 L 282,148 L 200,83 L 118,148 Z" />
          {/* Pilier gauche */}
          <path className="syloct-navy" d="M 118,168 L 152,168 L 152,320 L 118,320 Z" />
          {/* Pilier droit */}
          <path className="syloct-navy" d="M 248,168 L 282,168 L 282,320 L 248,320 Z" />
          {/* Fleche / clef doree */}
          <path className="syloct-gold" d="M 200,110 L 250,168 L 222,168 L 222,255 L 178,255 L 178,168 L 150,168 Z" />
          {/* Trou de serrure */}
          <circle className="syloct-navy" cx="200" cy="282" r="15" />
          <path className="syloct-navy" d="M 190,290 L 210,290 L 216,320 L 184,320 Z" />
        </g>
      </svg>
      {showText && (
        <div style={{ lineHeight: 1.15 }}>
          <div className="logo-text-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
            SyLOC-T
          </div>
          <div className="logo-text-sub" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            CROUS de Thiès
          </div>
        </div>
      )}
    </div>
  );
}
