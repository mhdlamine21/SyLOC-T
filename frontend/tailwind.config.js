/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Palette principale Navy/Or
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
        // Surfaces
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          card: 'var(--surface-card)',
        },
        // Alias legacy (compatibilité)
        paper: {
          DEFAULT: 'var(--paper)',
          2: 'var(--paper2)',
          3: 'var(--paper3)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          deep: 'var(--teal-deep)',
          mid: 'var(--teal-mid)',
          light: 'var(--slate)',
          pale: 'var(--slate-soft)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          deep: 'var(--amber-deep)',
          pale: 'var(--amber-pale)',
        },
        stamp: {
          DEFAULT: 'var(--stamp)',
          light: 'var(--red)',
          pale: 'var(--red-soft)',
        },
        ok: { DEFAULT: 'var(--ok)', soft: 'var(--ok-soft)' },
        warn: { DEFAULT: 'var(--amber-deep)', soft: 'var(--amber-pale)' },
        danger: { DEFAULT: 'var(--red)', soft: 'var(--red-soft)' },
        info: { DEFAULT: 'var(--slate)', soft: 'var(--slate-soft)' },
        // Tokens de contraste dynamiques (inversion navy <-> beige)
        'navy-text': 'var(--text-navy)',
        'on-navy': 'var(--text-on-navy)',
        'on-gold': 'var(--text-on-gold)',
        ink: 'var(--ink)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        soft: 'var(--soft)',
        border: 'var(--border)',
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
