/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#030014', // Deep space blue/black
        surface: '#0f0c29',    // Slightly lighter dark
        primary: {
          DEFAULT: '#00f3ff', // Neon Cyan
          glow: 'rgba(0, 243, 255, 0.5)',
        },
        secondary: {
          DEFAULT: '#bc13fe', // Electric Purple
          glow: 'rgba(188, 19, 254, 0.5)',
        },
        accent: {
          DEFAULT: '#0aff0a', // Matrix Green
          glow: 'rgba(10, 255, 10, 0.5)',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': "linear-gradient(to right, rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 243, 255, 0.05) 1px, transparent 1px)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px theme("colors.primary.DEFAULT"), 0 0 10px theme("colors.primary.DEFAULT")' },
          '100%': { boxShadow: '0 0 10px theme("colors.primary.DEFAULT"), 0 0 20px theme("colors.primary.DEFAULT")' },
        }
      }
    },
  },
  plugins: [],
}
