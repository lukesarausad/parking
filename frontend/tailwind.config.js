/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        seattle: {
          blue: '#003DA5',
          green: '#00843D',
          navy: '#001B3A',
          gray: '#58595B',
        }
      }
    },
  },
  plugins: [],
}
