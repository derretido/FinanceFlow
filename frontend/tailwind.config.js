/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        serif: ['DM Serif Display', 'serif'],
      },
      colors: {
        bg: '#0f0f0f',
        surface: '#1a1a1a',
        surface2: '#222222',
        border: '#2e2e2e',
        accent: '#e8d5a3',
      }
    }
  },
  plugins: []
}
