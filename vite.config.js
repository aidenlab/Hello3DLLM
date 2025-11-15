import { defineConfig } from 'vite';

export default defineConfig({
  // Vite will automatically expose env variables prefixed with VITE_
  // These are available in the client code via import.meta.env.VITE_*
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
  },
});

