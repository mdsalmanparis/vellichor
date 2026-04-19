/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#fcfbf9',
        surface: '#ffffff',
        surfaceHover: '#f3f1ec',
        border: '#e8e6e1',
        textPrimary: '#2d2b2a',
        textSecondary: '#66635f',
        accent: '#da7b5f',
        accentHover: '#c4664b'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
