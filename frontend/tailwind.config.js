/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#0a0a12',
          800: '#0f1018',
          700: '#16182a',
          600: '#1d2036',
          500: '#262a45',
        },
        neon: {
          purple: '#a855f7',
          violet: '#8b5cf6',
          cyan: '#22d3ee',
          magenta: '#e879f9',
          blue: '#6366f1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 24px -4px rgba(168,85,247,0.45)',
        'glow-cyan': '0 0 24px -4px rgba(34,211,238,0.45)',
        'glow-soft': '0 8px 40px -12px rgba(139,92,246,0.35)',
      },
      backgroundImage: {
        'grad-neon': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #22d3ee 100%)',
        'grad-purple': 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        'grad-cyan': 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
        'grad-magenta': 'linear-gradient(135deg, #e879f9 0%, #a855f7 100%)',
      },
      keyframes: {
        'flame': {
          '0%, 100%': { transform: 'scale(1) rotate(-2deg)' },
          '50%': { transform: 'scale(1.12) rotate(2deg)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        flame: 'flame 1.4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
