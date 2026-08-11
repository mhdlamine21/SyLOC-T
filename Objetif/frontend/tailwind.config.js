/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#faf9f6',
        surface: '#ffffff',
        soft: '#f2f1ec',
        ink: '#181c26',
        muted: '#6b6f7a',
        navy: {
          DEFAULT: '#1b2a4e',
          deep: '#0f1b34',
          mid: '#2c4270',
          pale: '#e8ebf3',
        },
        gold: {
          DEFAULT: '#c99a3d',
          deep: '#a67b24',
          pale: '#f7ecd4',
        },
        ok: { DEFAULT: '#2f7d4f', soft: '#e6f3ea' },
        warn: { DEFAULT: '#b06a12', soft: '#fbeed9' },
        danger: { DEFAULT: '#a5342a', soft: '#f8e3df' },
      },
      fontFamily: {
        display: ['Lora', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '16px',
      },
    },
  },
  plugins: [],
}
