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

    // Alias /pkg/ to the npm package so we use the installed version
    resolve: {
        alias: {
            '/pkg': resolve(__dirname, 'node_modules/@rustledger/wasm'),
        },
    },

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
                playground: resolve(__dirname, 'playground.html'),
            },
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name].[ext]',
                // Split heavy libraries into separate chunks for better caching
                manualChunks: {
                    // CodeMirror core (loaded immediately for editor)
                    codemirror: [
                        'codemirror',
                        '@codemirror/autocomplete',
                        '@codemirror/commands',
                        '@codemirror/language',
                        '@codemirror/state',
                        '@codemirror/view',
                        '@lezer/highlight',
                    ],
                    // D3 visualization (lazy loaded)
                    d3: ['d3', 'd3-sankey'],
                },
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
