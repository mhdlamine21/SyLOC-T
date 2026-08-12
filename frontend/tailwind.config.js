/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Palette principale Navy/Or (Objetif/index.html)
        navy: {
          DEFAULT: 'var(--navy)',
          2: 'var(--navy-2)',
          3: 'var(--navy-3)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          deep: 'var(--gold-deep)',
          soft: 'var(--gold-soft)',
        },
        slate: {
          DEFAULT: 'var(--slate)',
          soft: 'var(--slate-soft)',
        },
        // Alias legacy (compatibilité composants existants)
        paper: {
          DEFAULT: 'var(--paper)',
          2: 'var(--paper2)',
          3: 'var(--paper3)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          deep: 'var(--teal-deep)',
          mid: 'var(--teal-mid)',
          light: 'var(--teal-light)',
          pale: 'var(--teal-pale)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          deep: 'var(--amber-deep)',
          pale: 'var(--amber-pale)',
        },
        stamp: {
          DEFAULT: 'var(--stamp)',
          light: 'var(--red-light)',
          pale: 'var(--red-pale)',
        },
        ok: { DEFAULT: 'var(--ok)', soft: 'var(--ok-soft)' },
        warn: { DEFAULT: 'var(--warn)', soft: 'var(--warn-soft)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
        info: { DEFAULT: 'var(--info)', soft: 'var(--info-soft)' },
        ink: 'var(--ink)',
        muted: '#64748b',
        soft: '#eef1f4',
      },
      fontFamily: {
        display: ['Sora', 'Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        xs: '0 1px 4px rgba(23,37,84,.06)',
        sm: '0 4px 12px rgba(23,37,84,.08)',
        md: '0 10px 30px rgba(23,37,84,.10)',
        lg: '0 20px 50px rgba(23,37,84,.15)',
      },
    },
  },
  plugins: [],
};
