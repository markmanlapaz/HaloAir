/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Halo Air brand — extracted from the client logo.
        // Cool side (AC/refrigeration) = blue. Hot side (heating/gas) = orange-red.
        brand: {
          blue: {
            DEFAULT: '#1E90FF',
            50: '#EAF5FF',
            100: '#D0E8FF',
            500: '#1E90FF',
            600: '#0A6FD8',
            700: '#0858AC',
            900: '#03203F',
          },
          orange: {
            DEFAULT: '#FF5A1F',
            50: '#FFF1EB',
            100: '#FFDDCC',
            500: '#FF5A1F',
            600: '#E03A00',
            700: '#B82F00',
          },
          // Light/cream background per user direction — "approachable trades" feel.
          cream: '#FAF7F2',
          ink: '#0E1320',     // deep near-black for body text
          slate: '#3A4256',   // secondary body text
          line: '#E6E1D8',    // hairline borders on cream
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(14, 19, 32, 0.15)',
        'glow-blue': '0 10px 40px -10px rgba(30, 144, 255, 0.35)',
        'glow-orange': '0 10px 40px -10px rgba(255, 90, 31, 0.35)',
      },
    },
  },
  plugins: [],
};
