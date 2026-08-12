/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Palette principale Navy/Or (Objetif/index.html)
        navy: {
          DEFAULT: '#172554',
          2: '#0f1b3d',
          3: '#1e3a5f',
        },
        gold: {
          DEFAULT: '#c9a15c',
          deep: '#a97c33',
          soft: '#faf1e1',
        },
        slate: {
          DEFAULT: '#5f7f9c',
          soft: '#eaf1f7',
        },
        // Alias legacy (compatibilité composants existants)
        paper: {
          DEFAULT: '#f5f6fb',
          2: '#f8fafc',
          3: '#eef1f4',
        },
        teal: {
          DEFAULT: '#172554',   // aliasé vers navy
          deep: '#0f1b3d',
          mid: '#5f7f9c',
          light: '#7f9fba',
          pale: '#eaf1f7',
        },
        amber: {
          DEFAULT: '#c9a15c',
          deep: '#a97c33',
          pale: '#faf1e1',
        },
        stamp: {
          DEFAULT: '#b91c1c',
          light: '#dc2626',
          pale: '#fef2f2',
        },
        ok: { DEFAULT: '#15803d', soft: '#f0fdf4' },
        warn: { DEFAULT: '#a97c33', soft: '#faf1e1' },
        danger: { DEFAULT: '#b91c1c', soft: '#fef2f2' },
        info: { DEFAULT: '#5f7f9c', soft: '#eaf1f7' },
        ink: '#172033',
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
