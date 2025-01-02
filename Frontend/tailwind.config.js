/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customDark: '#0D1126', // Name the color as 'customDark'
        cardColor : '#232A44'
      },
    },
  },
  plugins: [],
}

