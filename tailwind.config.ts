import type { Config } from 'tailwindcss';

// DreamPlay Park — PRD §11 palettes, encoded as Tailwind theme tokens.
//
// The colors are exposed as nested groups so consumers can write
// `bg-sky-sunset`, `text-fantasy-pink`, `border-night-dusk`, etc. and
// Tailwind's JIT will emit a class for each one. The matching CSS custom
// properties are declared in `src/index.css` for use in non-utility contexts
// (inline SVG fills, `getComputedStyle` reads for canvas fills, etc.).
//
// `safelist` keeps the AC-2 verification signal stable: even if no
// component happens to reference a particular shade yet, the JIT will
// still emit a class for it, so the build CSS contains every PRD hex.
const PALETTE_KEYS = {
  sky: ['morning', 'midday', 'sunset'],
  fantasy: ['pink', 'blue', 'green', 'cream'],
  night: ['deep', 'dusk', 'glow'],
} as const;

const safelist: string[] = [];
for (const [group, shades] of Object.entries(PALETTE_KEYS)) {
  for (const shade of shades) {
    for (const prefix of ['bg', 'text', 'border', 'ring', 'from', 'to', 'via']) {
      safelist.push(`${prefix}-${group}-${shade}`);
    }
  }
}

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist,
  theme: {
    extend: {
      colors: {
        sky: {
          morning: '#AEE2FF',
          midday: '#C7F9FF',
          sunset: '#FFF5E4',
        },
        fantasy: {
          pink: '#FFD6EC',
          blue: '#B8E8FC',
          green: '#D7FFD9',
          cream: '#FFF4B8',
        },
        night: {
          deep: '#2B2D42',
          dusk: '#3A506B',
          glow: '#5BC0BE',
        },
      },
      fontFamily: {
        // Matches the system stack applied in `src/index.css`.
        display: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
