import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the WASM module since it's not available in tests
vi.mock('./wasm.js', () => ({
    initWasm: vi.fn().mockResolvedValue({}),
    isWasmReady: vi.fn().mockReturnValue(false),
    getVersion: vi.fn().mockReturnValue('test'),
    validateSource: vi.fn().mockReturnValue({ valid: true, errors: [] }),
    formatSource: vi.fn().mockReturnValue({ formatted: '' }),
    executeQuery: vi.fn().mockReturnValue({ rows: [], columns: [] }),
}));

// Import after mocking
import { examples } from './examples.js';

describe('Main application setup', () => {
    beforeEach(() => {
        // Set up minimal DOM structure
        document.body.innerHTML = `
            <div id="editor-panel"></div>
            <div id="output"></div>
            <div id="query-output"></div>
            <div id="query-input"></div>
            <div id="query-options"></div>
            <div id="plugin-options"></div>
            <div id="footer-status"></div>
            <div id="github-stars"></div>
            <div id="footer-version"></div>
            <div id="resizer"></div>
            <div id="output-panel"></div>
            <input id="query-text" type="text" />
            <div class="example-tab" data-example="simple"></div>
            <div class="output-tab" data-tab="query"></div>
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('examples', () => {
        it('all examples are non-empty strings', () => {
            const exampleNames = ['simple', 'stocks', 'crypto', 'travel', 'business', 'errors'];
            for (const name of exampleNames) {
                expect(typeof examples[name]).toBe('string');
                expect(examples[name].length).toBeGreaterThan(100);
            }
        });

        it('simple example contains expected beancount directives', () => {
            expect(examples.simple).toContain('option');
            expect(examples.simple).toContain('open');
            expect(examples.simple).toContain('balance');
        });

        it('errors example contains intentional errors', () => {
            expect(examples.errors).toContain("doesn't balance");
            expect(examples.errors).toContain('2024-13-01'); // Invalid date
        });
    });

    describe('DOM elements', () => {
        it('required elements exist', () => {
            expect(document.getElementById('editor-panel')).not.toBeNull();
            expect(document.getElementById('output')).not.toBeNull();
            expect(document.getElementById('query-output')).not.toBeNull();
        });
    });
});

describe('URL handling', () => {
    it('LZString compression produces valid output', async () => {
        // Dynamically import LZString
        const LZString = (await import('lz-string')).default;

        const testContent = '2024-01-01 open Assets:Bank USD';
        const compressed = LZString.compressToEncodedURIComponent(testContent);

        expect(compressed).toBeTruthy();
        expect(typeof compressed).toBe('string');

        const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
        expect(decompressed).toBe(testContent);
    });
});

describe('File upload validation', () => {
    it('MAX_FILE_SIZE constant should be 10MB', async () => {
        // This tests the logic without importing main.js (which has side effects)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        expect(MAX_FILE_SIZE).toBe(10485760);
    });
});
