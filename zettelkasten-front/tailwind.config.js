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
        'blue': '#0000ff',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333',
            a: {
              color: '#22577a', // Using your palette.darkest color
              '&:hover': {
                color: '#38a3a5', // Using your palette.dark color
              },
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.5em',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.5em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
