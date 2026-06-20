import { defineConfig } from 'vite';
import { resolve } from 'path';

// base: './' keeps asset paths relative so the build works on any static host
// (GitHub Pages, Netlify, itch.io) — useful for your optional deployment link.
export default defineConfig({
  base: './',
  server: { open: true, port: 5173 },
  build: {
    rollupOptions: {
      input: {
        // Two pages: the landing (index.html) and the game (play.html).
        main: resolve(__dirname, 'index.html'),
        play: resolve(__dirname, 'play.html')
      }
    }
  }
});
