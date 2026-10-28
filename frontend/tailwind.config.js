/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ucsm: {
          blue: '#1e56a0',
          dark: '#163172',
          light: '#f6f6f6'
        }
      }
    },
  },
  plugins: [],
}