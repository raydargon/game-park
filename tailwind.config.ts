import type { Config } from 'tailwindcss';

// DreamPlay Park — PRD §11 palettes, encoded as Tailwind theme tokens.
//
// The colors are exposed as nested groups so consumers can write
// `bg-sky-sunset`, `text-fantasy-pink`, `border-night-dusk`, etc. and
// Tailwind's JIT will emit a class for each one. The matching CSS custom
// properties are declared in `src/index.css` for use in non-utility
// contexts (inline SVG fills, `getComputedStyle` reads for canvas fills,
// day/night gradient interpolations in AC-4).
//
// No `safelist`: by AC-3 the real ParkPage, GamePage, and NotFoundPage
// consume the palette directly, so the JIT picks up every class
// naturally. The safelist that was added for AC-2's verification signal
// has been removed to keep the production CSS lean.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
