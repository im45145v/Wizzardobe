/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f1a',
          card: '#1a1a2e',
          surface: '#16213e',
          border: '#2d2d44',
        },
        accent: {
          purple: '#8b5cf6',
          pink: '#ec4899',
          blue: '#3b82f6',
        }
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #8b5cf6, #ec4899)',
      }
    }
  },
  plugins: [],
}
