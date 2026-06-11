import type { Config } from 'tailwindcss';

// AC-1 keeps the theme minimal. The PRD palette (AC-2) is wired in the next slice.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
