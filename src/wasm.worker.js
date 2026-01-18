// Web Worker for WASM operations - runs off main thread

/** @type {any} */
let wasmModule = null;

/** @type {boolean} */
let isReady = false;

/**
 * Initialize the WASM module
 */
async function initWasm() {
    if (wasmModule) return;

    try {
        // Import and initialize WASM
        // @ts-ignore - Runtime WASM module loaded from /pkg/, not available at build time
        const wasm = await import('/pkg/rustledger_wasm.js');
        await wasm.default();

        wasmModule = {
            validateSource: wasm.validateSource,
            format: wasm.format,
            query: wasm.query,
            version: wasm.version,
            bqlCompletions: wasm.bqlCompletions,
            ParsedLedger: wasm.ParsedLedger,
        };

        isReady = true;
        self.postMessage({ type: 'ready', version: wasmModule.version() });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        self.postMessage({ type: 'error', error: errorMessage });
    }
}

/**
 * Handle messages from main thread
 * @param {MessageEvent} event
 */
self.onmessage = async function (event) {
    const { id, action, payload } = event.data;

    // Initialize on first message if needed
    if (!isReady && action !== 'init') {
        await initWasm();
    }

    try {
        let result;

        switch (action) {
            case 'init':
                await initWasm();
                return; // Ready message sent in initWasm

            case 'validateSource':
                result = wasmModule.validateSource(payload.source);
                break;

            case 'format':
                result = wasmModule.format(payload.source);
                break;

            case 'query':
                result = wasmModule.query(payload.source, payload.queryStr);
                break;

            case 'bqlCompletions':
                result = wasmModule.bqlCompletions(payload.text, payload.cursorPos);
                break;

            case 'version':
                result = wasmModule.version();
                break;

            case 'getCompletions': {
                const ledger = new wasmModule.ParsedLedger(payload.source);
                result = ledger.getCompletions(payload.line, payload.character);
                ledger.free();
                break;
            }

            case 'getHoverInfo': {
                const ledger = new wasmModule.ParsedLedger(payload.source);
                result = ledger.getHoverInfo(payload.line, payload.character);
                ledger.free();
                break;
            }

            case 'getDefinition': {
                const ledger = new wasmModule.ParsedLedger(payload.source);
                result = ledger.getDefinition(payload.line, payload.character);
                ledger.free();
                break;
            }

            case 'getDocumentSymbols': {
                const ledger = new wasmModule.ParsedLedger(payload.source);
                result = ledger.getDocumentSymbols();
                ledger.free();
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        self.postMessage({ id, type: 'result', result });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        self.postMessage({ id, type: 'error', error: errorMessage });
    }
};

// Start initialization immediately
initWasm();
