/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel renk paleti - çocuklar için
        'candy': {
          pink: '#FFB5C5',
          peach: '#FFDAB9',
          mint: '#B5EAD7',
          sky: '#A8D8EA',
          lavender: '#C3B1E1',
          lemon: '#FFF9B0',
          coral: '#FFB7B2',
          turquoise: '#88D8B0',
        },
        // Ana tema renkleri
        'postur': {
          primary: '#7C83FD',    // Soft mor
          secondary: '#96E6A1',  // Soft yeşil
          accent: '#FFA8A8',     // Soft kırmızı
          warning: '#FFE066',    // Soft sarı
          success: '#6BCB77',    // Yeşil
          danger: '#FF6B6B',     // Kırmızı
          info: '#4ECDC4',       // Turkuaz
        }
      },
      fontFamily: {
        'display': ['Nunito', 'sans-serif'],
        'body': ['Poppins', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 131, 253, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 131, 253, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glow': '0 0 20px rgba(124, 131, 253, 0.4)',
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

