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
      backgroundColor:{
        footer:['rgb(32, 35, 42)'],
      }
    },
  },
  plugins: [],
}