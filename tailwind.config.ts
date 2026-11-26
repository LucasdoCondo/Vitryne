import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#060b19',
        panel: '#0d1938',
        line: '#1b2c4d',
        neon: '#00f0ff',
        cyan: '#00f0ff',
        blue: '#2979ff',
        violet: '#8b7cff',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,229,255,.1), 0 12px 45px rgba(0,0,0,.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
