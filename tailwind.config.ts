import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vinotinto: {
          DEFAULT: '#330000',
          50: '#ffcccc',
          100: '#ff9999',
          200: '#ff6666',
          300: '#ff3333',
          400: '#cc0000',
          500: '#990000',
          600: '#660000',
          700: '#330000',
          800: '#1a0000',
          900: '#0d0000',
        },
      },
    },
  },
  plugins: [],
}
export default config

