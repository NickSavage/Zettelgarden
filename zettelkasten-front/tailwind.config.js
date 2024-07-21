/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'palette': {
          darkest: '#22577a',
          dark: '#38a3a5',
          mid: '#57cc99',
          light: '#80ed99',
          lighest: '#c7f9cc'
        },
      },
    },
  },
  plugins: [],
}

