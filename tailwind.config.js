/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: '#1B2B4B',
        gold: '#C9A84C',
        cream: '#F5F0E8',
        border: '#E5E7EB',
        'body-text': '#6B7280',
        success: '#10B981',
        primary: {
          DEFAULT: '#B8860B',
          dark: '#8B6914',
          light: '#D4AF37',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F6F3',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          muted: '#6B6B6B',
        },
      },
    },
  },
  plugins: [],
};
