/// <reference types="vitest" />
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],

  // Test config
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
  // Serve from root
  root: '.',

  // Dev server config
  server: {
    port: 8080,
    open: false,
    // Watch for changes in all files
    watch: {
      usePolling: false,
    },
  },

  // Build config for GitHub Pages
  build: {
    outDir: 'dist',
    // Don't hash assets for simpler GitHub Pages deployment
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },

  // Handle WASM files correctly
  assetsInclude: ['**/*.wasm'],
});
