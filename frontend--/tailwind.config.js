/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF9500',
        'primary-dark': '#E88800',
        secondary: '#FFFFFF',
        'dark-bg': '#1F1F1F',
        'light-text': '#333333',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(to right, #FFFFFF, #FFD699)',
      },
    },
  },
  plugins: [],
}