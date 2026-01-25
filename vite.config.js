/// <reference types="vitest" />
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
    plugins: [tailwindcss()],

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
        // Multi-page build configuration
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                rustfava: resolve(__dirname, 'public/rustfava/index.html'),
            },
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]',
            },
        },
    },

    // Worker config - use ES modules for dynamic imports
    worker: {
        format: 'es',
    },

    // Handle WASM files correctly
    assetsInclude: ['**/*.wasm'],
});
