import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// DreamPlay Park Vite config.
// Dev server defaults to port 5173 (matches AC-1 verification).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
  },
});
