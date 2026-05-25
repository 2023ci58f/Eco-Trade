/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0',
          300: '#86efac', 400: '#4ade80', 500: '#22c55e',
          600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d',
          primary: '#2D6A4F', light: '#52B788', pale: '#D8F3DC',
        },
        amber: { primary: '#E9C46A', dark: '#F4A261' },
        slate: { primary: '#1B2838', mid: '#2D3F50' },
        cream: { DEFAULT: '#F8F5F0', dark: '#EDE8E0' },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem', '3xl': '2rem' },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.08)',
        hover: '0 8px 40px rgba(0,0,0,0.14)',
        green: '0 4px 20px rgba(45,106,79,0.25)',
      },
    },
  },
  plugins: [],
};
