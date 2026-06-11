import type { Config } from 'tailwindcss';

export default {
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1d171a',
        blush: '#f8e5e8',
        rosewood: '#7f334d',
        berry: '#a52456',
        cream: '#fff8f3',
        gold: '#c99a46',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(84, 31, 52, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
