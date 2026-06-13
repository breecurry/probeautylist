import type { Config } from 'tailwindcss';

export default {
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2f241f',
        blush: '#efe4d8',
        rosewood: '#5f4638',
        berry: '#8a5a2b',
        cream: '#f7f0e8',
        gold: '#c99a46',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(95, 70, 56, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
