// WASM loading and initialization via Web Worker

/**
 * @typedef {{ valid: boolean, errors: Array<{line: number, message: string}>, error_count: number }} ValidationResult
 * @typedef {{ formatted: string | null, error: string | null, errors?: Array<{line: number, message: string}> }} FormatResult
 * @typedef {{ output: string, error: string | null, rows?: any[][], columns?: string[] }} QueryResult
 * @typedef {{ text: string, category: string }} Completion
 */

/** @type {Worker | null} */
let worker = null;

/** @type {boolean} */
let wasmReady = false;

/** @type {string | null} */
let wasmError = null;

/** @type {string} */
let wasmVersion = 'unknown';

/** @type {number} */
let messageId = 0;

/** @type {Map<number, { resolve: Function, reject: Function }>} */
const pendingRequests = new Map();

/**
 * Send a message to the worker and wait for response
 * @template T
 * @param {string} action
 * @param {object} payload
 * @returns {Promise<T>}
 */
function sendMessage(action, payload = {}) {
    return new Promise((resolve, reject) => {
        if (!worker) {
            reject(new Error('Worker not initialized'));
            return;
        }

        const id = messageId++;
        pendingRequests.set(id, { resolve, reject });
        worker.postMessage({ id, action, payload });
    });
}

/**
 * Handle messages from the worker
 * @param {MessageEvent} event
 */
function handleWorkerMessage(event) {
    const { id, type, result, error, version } = event.data;

    if (type === 'ready') {
        wasmReady = true;
        wasmVersion = version || 'unknown';
        wasmError = null;
        return;
    }

    if (type === 'error' && id === undefined) {
        // Initialization error
        wasmReady = false;
        wasmError = error;
        return;
    }

    const pending = pendingRequests.get(id);
    if (pending) {
        pendingRequests.delete(id);
        if (type === 'error') {
            pending.reject(new Error(error));
        } else {
            pending.resolve(result);
        }
    }
}

/**
 * Initialize the WASM module via Web Worker
 * @returns {Promise<void>}
 * @throws {Error} If WASM fails to load
 */
export async function initWasm() {
    if (worker && wasmReady) {
        return;
    }

    return new Promise((resolve, reject) => {
        try {
            // Create worker
            worker = new Worker(new URL('./wasm.worker.js', import.meta.url), {
                type: 'module',
            });

            const timeout = setTimeout(() => {
                reject(new Error('WASM initialization timed out'));
            }, 30000);

            worker.onmessage = (event) => {
                handleWorkerMessage(event);

                if (event.data.type === 'ready') {
                    clearTimeout(timeout);
                    resolve();
                } else if (event.data.type === 'error' && event.data.id === undefined) {
                    clearTimeout(timeout);
                    const errorMsg = formatWasmError(event.data.error);
                    reject(new Error(errorMsg));
                }
            };

            worker.onerror = (event) => {
                clearTimeout(timeout);
                wasmReady = false;
                wasmError = event.message;
                reject(new Error(formatWasmError(event.message)));
            };
        } catch (e) {
            wasmReady = false;
            wasmError = e instanceof Error ? e.message : String(e);
            reject(new Error(formatWasmError(wasmError)));
        }
    });
}

/**
 * Format WASM error into user-friendly message
 * @param {string} error
 * @returns {string}
 */
function formatWasmError(error) {
    let userMessage = 'Failed to load the WASM module. ';

    if (error.includes('Failed to fetch') || error.includes('NetworkError')) {
        userMessage += 'Please check your internet connection and try refreshing the page.';
    } else if (error.includes('CompileError') || error.includes('instantiate')) {
        userMessage +=
            'Your browser may not support WebAssembly. Please try using a modern browser like Chrome, Firefox, Safari, or Edge.';
    } else if (error.includes('Out of memory') || error.includes('OOM')) {
        userMessage +=
            'Your device ran out of memory. Please close some browser tabs and try again.';
    } else {
        userMessage +=
            'Please try refreshing the page. If the problem persists, try a different browser.';
    }

    return userMessage;
}

/**
 * Check if WASM is ready
 * @returns {boolean}
 */
export function isWasmReady() {
    return wasmReady;
}

/**
 * Get the WASM error message if loading failed
 * @returns {string | null}
 */
export function getWasmError() {
    return wasmError;
}

/**
 * Get the rustledger version from WASM
 * @returns {string}
 */
export function getVersion() {
    return wasmVersion;
}

/**
 * Validate beancount source (async)
 * @param {string} source
 * @returns {Promise<ValidationResult | null>}
 */
export async function validateSource(source) {
    if (!wasmReady) return null;
    try {
        return await sendMessage('validateSource', { source });
    } catch {
        return null;
    }
}

/**
 * Format beancount source (async)
 * @param {string} source
 * @returns {Promise<FormatResult | null>}
 */
export async function formatSource(source) {
    if (!wasmReady) return null;
    try {
        return await sendMessage('format', { source });
    } catch {
        return null;
    }
}

/**
 * Execute a BQL query (async)
 * @param {string} source
 * @param {string} queryStr
 * @returns {Promise<QueryResult | null>}
 */
export async function executeQuery(source, queryStr) {
    if (!wasmReady) return null;
    try {
        return await sendMessage('query', { source, queryStr });
    } catch {
        return null;
    }
}

/**
 * Get BQL completions (async)
 * @param {string} text
 * @param {number} cursorPos
 * @returns {Promise<{ completions: Completion[] } | null>}
 */
export async function getBqlCompletions(text, cursorPos) {
    if (!wasmReady) return null;
    try {
        return await sendMessage('bqlCompletions', { text, cursorPos });
    } catch {
        return null;
    }
}

/**
 * Terminate the worker (for cleanup)
 */
export function terminateWorker() {
    if (worker) {
        worker.terminate();
        worker = null;
        wasmReady = false;
    }
}
