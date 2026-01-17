// Service Worker for WASM caching
const CACHE_NAME = 'rustledger-v1';

// Assets to cache
const CACHE_ASSETS = ['/pkg/rustledger_wasm.js', '/pkg/rustledger_wasm_bg.wasm'];

// WASM magic bytes: \0asm (0x00 0x61 0x73 0x6d)
const WASM_MAGIC = new Uint8Array([0x00, 0x61, 0x73, 0x6d]);

/**
 * Validate that the response contains valid WASM
 * @param {Response} response - The response to validate
 * @returns {Promise<boolean>} - True if valid WASM
 */
async function isValidWasm(response) {
    try {
        const clone = response.clone();
        const buffer = await clone.arrayBuffer();
        const bytes = new Uint8Array(buffer.slice(0, 4));

        // Check WASM magic bytes
        for (let i = 0; i < 4; i++) {
            if (bytes[i] !== WASM_MAGIC[i]) {
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
}

// Install: cache WASM files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CACHE_ASSETS).catch((err) => {
                console.warn('Failed to cache some assets:', err);
            });
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only cache WASM files
    if (url.pathname.startsWith('/pkg/')) {
        const isWasmFile = url.pathname.endsWith('.wasm');

        event.respondWith(
            caches.match(event.request).then(async (cachedResponse) => {
                if (cachedResponse) {
                    // Validate cached WASM before serving
                    if (isWasmFile && !(await isValidWasm(cachedResponse))) {
                        console.warn('Cached WASM file failed validation, fetching fresh copy');
                        // Delete invalid cached response and fetch fresh
                        await caches.open(CACHE_NAME).then((cache) =>
                            cache.delete(event.request)
                        );
                    } else {
                        return cachedResponse;
                    }
                }

                return fetch(event.request)
                    .then(async (response) => {
                        // Don't cache non-OK responses
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Validate WASM before caching
                        if (isWasmFile && !(await isValidWasm(response))) {
                            console.error('Fetched WASM file failed validation');
                            return response;
                        }

                        // Clone and cache the response
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        }).catch((err) => {
                            // Handle quota exceeded or other cache errors
                            console.warn('Failed to cache response:', err.message || err);
                        });

                        return response;
                    })
                    .catch(() => {
                        // Return cached version on network failure
                        return caches.match(event.request);
                    });
            })
        );
    }
});
