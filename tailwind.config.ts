import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#08090d',
        panel: '#101218',
        line: '#272b36',
        neon: '#a3ff5d',
        violet: '#9b8afb',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(163,255,93,.12), 0 12px 45px rgba(0,0,0,.28)',
      },
    },
  },
  plugins: [],
} satisfies Config;
