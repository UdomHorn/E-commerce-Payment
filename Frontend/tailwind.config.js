/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
      },
      backgroundColor: {
        footer: ['rgb(32, 35, 42)'],
      },
      keyframes: {
        shake: {
          '0%':   { transform: 'translateX(0)' },
          '15%':  { transform: 'translateX(-6px)' },
          '30%':  { transform: 'translateX(6px)' },
          '45%':  { transform: 'translateX(-5px)' },
          '60%':  { transform: 'translateX(5px)' },
          '75%':  { transform: 'translateX(-3px)' },
          '90%':  { transform: 'translateX(3px)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        shake: 'shake 0.35s ease-in-out',
      },
    },
  },
  plugins: [],
}