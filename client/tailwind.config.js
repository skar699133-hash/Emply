/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // User's exact 5-color palette
        palette: {
          midnight: '#2C3E50', // 1. Deep Midnight Navy
          slate: '#34495E',    // 2. Slate Navy
          muted: '#7F8C8D',    // 3. Asbestos / Muted Gray
          silver: '#BDC3C7',   // 4. Silver Border
          cloud: '#ECF0F1',    // 5. Clouds Canvas
        },
        // Overriding blue with user palette for instant global consistency
        blue: {
          50: '#f4f6f8',
          100: '#ecf0f1', // Cloud
          200: '#dce1e5',
          300: '#bdc3c7', // Silver
          400: '#9aa5aa',
          500: '#7f8c8d', // Muted Gray
          600: '#2C3E50', // Primary Accent (Midnight)
          700: '#34495E', // Hover Accent (Slate)
          800: '#202d3a',
          900: '#17202a',
          950: '#0f151c',
        },
        // Overriding brand with user palette
        brand: {
          50: '#f4f6f8',
          100: '#ecf0f1', // Cloud
          200: '#dce1e5',
          300: '#bdc3c7', // Silver
          400: '#9aa5aa',
          500: '#7f8c8d', // Muted Gray
          600: '#2C3E50', // Midnight
          700: '#34495E', // Slate
          800: '#202d3a',
          900: '#17202a',
          950: '#0f151c',
        },
        // Overriding slate with user palette
        slate: {
          50: '#f7f9fa',
          100: '#ecf0f1', // Cloud (#ECF0F1)
          200: '#bdc3c7', // Silver (#BDC3C7)
          300: '#9ea9ab',
          400: '#7f8c8d', // Muted Gray (#7F8C8D)
          500: '#5f6f72',
          600: '#465667',
          700: '#34495e', // Slate Navy (#34495E)
          800: '#2c3e50', // Midnight Navy (#2C3E50)
          850: '#243342',
          900: '#1c2834',
          950: '#121a22',
        },
      },
      boxShadow: {
        '3d': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.95), 0 1px 2px 0 rgba(44, 62, 80, 0.04), 0 5px 18px -2px rgba(44, 62, 80, 0.08), 0 2px 6px -1px rgba(44, 62, 80, 0.04)',
        '3d-hover': 'inset 0 1px 0 0 #FFFFFF, 0 2px 6px 0 rgba(44, 62, 80, 0.04), 0 12px 28px -4px rgba(44, 62, 80, 0.13), 0 4px 10px -2px rgba(44, 62, 80, 0.06)',
        '3d-subtle': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 1px 3px 0 rgba(44, 62, 80, 0.03), 0 3px 10px -1px rgba(44, 62, 80, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap, 1rem)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap, 1rem)))' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        marquee: 'marquee var(--duration, 40s) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration, 40s) linear infinite',
      }
    },
  },
  plugins: [],
}
