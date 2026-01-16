// WASM loading and initialization

/**
 * @typedef {{ valid: boolean, errors: Array<{line: number, message: string}>, error_count: number }} ValidationResult
 * @typedef {{ formatted: string | null, error: string | null, errors?: Array<{line: number, message: string}> }} FormatResult
 * @typedef {{ output: string, error: string | null, rows?: any[][], columns?: string[] }} QueryResult
 * @typedef {{ text: string, category: string }} Completion
 */

/**
 * @typedef {Object} WasmModule
 * @property {(source: string) => ValidationResult} validateSource
 * @property {(source: string) => FormatResult} format
 * @property {(source: string, query: string) => QueryResult} query
 * @property {() => string} version
 * @property {(prefix: string, cursorPos: number) => { completions: Completion[] }} bqlCompletions
 */

/** @type {WasmModule | null} */
let wasmModule = null;

/** @type {boolean} */
let wasmReady = false;

/** @type {string | null} */
let wasmError = null;

/**
 * Initialize the WASM module
 * @returns {Promise<WasmModule>}
 * @throws {Error} If WASM fails to load
 */
export async function initWasm() {
    if (wasmModule) {
        return wasmModule;
    }

    try {
        // @ts-ignore - Dynamic import for WASM module
        const wasm = await import('/pkg/rustledger_wasm.js');
        await wasm.default();

        wasmModule = {
            validateSource: wasm.validateSource,
            format: wasm.format,
            query: wasm.query,
            version: wasm.version,
            bqlCompletions: wasm.bqlCompletions,
        };

        wasmReady = true;
        wasmError = null;

        return wasmModule;
    } catch (e) {
        wasmReady = false;
        wasmError = e instanceof Error ? e.message : String(e);

        // Provide user-friendly error messages
        let userMessage = 'Failed to load the WASM module. ';

        if (wasmError.includes('Failed to fetch') || wasmError.includes('NetworkError')) {
            userMessage += 'Please check your internet connection and try refreshing the page.';
        } else if (wasmError.includes('CompileError') || wasmError.includes('instantiate')) {
            userMessage +=
                'Your browser may not support WebAssembly. Please try using a modern browser like Chrome, Firefox, Safari, or Edge.';
        } else if (wasmError.includes('Out of memory') || wasmError.includes('OOM')) {
            userMessage +=
                'Your device ran out of memory. Please close some browser tabs and try again.';
        } else {
            userMessage +=
                'Please try refreshing the page. If the problem persists, try a different browser.';
        }

        const error = new Error(userMessage);
        error.cause = e;
        throw error;
    }
}

/**
 * Check if WASM is ready
 * @returns {boolean}
 */
export function isWasmReady() {
    return wasmReady;
}

/**
 * Get the WASM module (throws if not initialized)
 * @returns {WasmModule}
 * @throws {Error} If WASM is not initialized
 */
export function getWasm() {
    if (!wasmModule) {
        throw new Error('WASM module not initialized. Call initWasm() first.');
    }
    return wasmModule;
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
    if (!wasmModule) {
        return 'unknown';
    }
    try {
        return wasmModule.version();
    } catch {
        return 'unknown';
    }
}

/**
 * Validate beancount source
 * @param {string} source
 * @returns {ValidationResult | null}
 */
export function validateSource(source) {
    if (!wasmModule) return null;
    return wasmModule.validateSource(source);
}

/**
 * Format beancount source
 * @param {string} source
 * @returns {FormatResult | null}
 */
export function formatSource(source) {
    if (!wasmModule) return null;
    return wasmModule.format(source);
}

/**
 * Execute a BQL query
 * @param {string} source
 * @param {string} queryStr
 * @returns {QueryResult | null}
 */
export function executeQuery(source, queryStr) {
    if (!wasmModule) return null;
    return wasmModule.query(source, queryStr);
}

/**
 * Get BQL completions
 * @param {string} text
 * @param {number} cursorPos
 * @returns {{ completions: Completion[] } | null}
 */
export function getBqlCompletions(text, cursorPos) {
    if (!wasmModule) return null;
    return wasmModule.bqlCompletions(text, cursorPos);
}
