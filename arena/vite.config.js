import { defineConfig } from 'vite';

// base: './' keeps asset paths relative so the build works on any static host
// (GitHub Pages, Netlify, itch.io) — useful for your optional deployment link.
export default defineConfig({
  base: './',
  server: { open: true, port: 5173 }
});
