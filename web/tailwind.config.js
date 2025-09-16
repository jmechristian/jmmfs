/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nfl: {
          primary: '#013369',
          secondary: '#D50A0A',
          gold: '#FFB612',
        },
      },
    },
  },
  plugins: [],
};
