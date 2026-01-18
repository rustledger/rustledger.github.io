// Document symbols panel for navigation

import { getDocumentSymbols } from './wasm.js';
import { escapeHtml } from './utils.js';

/** @type {ReturnType<typeof setTimeout> | null} */
let updateTimeout = null;

/** @type {number} */
let symbolsVersion = 0;

/** @type {boolean} */
let symbolsInitialized = false;

// Symbol kind to icon/color mapping
/** @type {Record<string, { icon: string, color: string }>} */
const symbolKindStyles = {
    transaction: { icon: 'T', color: '#fcd34d' }, // amber
    account: { icon: 'A', color: '#22d3ee' }, // cyan
    balance: { icon: 'B', color: '#a78bfa' }, // violet
    commodity: { icon: 'C', color: '#fdba74' }, // orange
    open: { icon: 'O', color: '#6ee7b7' }, // emerald
    close: { icon: 'X', color: '#f87171' }, // red
    pad: { icon: 'P', color: '#94a3b8' }, // slate
    event: { icon: 'E', color: '#f0abfc' }, // fuchsia
    query: { icon: 'Q', color: '#67e8f9' }, // cyan
    note: { icon: 'N', color: '#fef08a' }, // yellow
    document: { icon: 'D', color: '#d1d5db' }, // gray
    custom: { icon: '*', color: '#e879f9' }, // fuchsia
    price: { icon: '$', color: '#4ade80' }, // green
    posting: { icon: '-', color: 'rgba(255,255,255,0.5)' },
};

/**
 * Get style for a symbol kind
 * @param {string} kind
 * @returns {{ icon: string, color: string }}
 */
function getSymbolStyle(kind) {
    return symbolKindStyles[kind] || { icon: '?', color: 'rgba(255,255,255,0.5)' };
}

/**
 * Render a single symbol item
 * @param {import('./wasm.js').EditorDocumentSymbol} symbol
 * @param {number} depth
 * @param {(line: number, char: number) => void} onNavigate
 * @returns {string}
 */
function renderSymbol(symbol, depth, onNavigate) {
    const style = getSymbolStyle(symbol.kind);
    const indent = depth * 16;
    const hasChildren = symbol.children && symbol.children.length > 0;
    const deprecatedClass = symbol.deprecated ? 'symbol-deprecated' : '';

    // Create data attributes for navigation
    const line = symbol.range.start.line;
    const char = symbol.range.start.character;

    let html = `
        <div class="symbol-item ${deprecatedClass}"
             style="padding-left: ${indent + 8}px"
             data-line="${line}"
             data-char="${char}"
             role="treeitem"
             tabindex="0">
            <span class="symbol-icon" style="color: ${style.color}">${style.icon}</span>
            <span class="symbol-name">${escapeHtml(symbol.name)}</span>
            ${symbol.detail ? `<span class="symbol-detail">${escapeHtml(symbol.detail)}</span>` : ''}
        </div>
    `;

    // Render children
    if (hasChildren && symbol.children) {
        html += symbol.children.map((child) => renderSymbol(child, depth + 1, onNavigate)).join('');
    }

    return html;
}

/**
 * Render all symbols into the panel
 * @param {import('./wasm.js').EditorDocumentSymbol[]} symbols
 * @param {HTMLElement} container
 * @param {(line: number, char: number) => void} onNavigate
 */
function renderSymbols(symbols, container, onNavigate) {
    if (!symbols || symbols.length === 0) {
        container.innerHTML = '<div class="symbols-empty">No symbols found</div>';
        return;
    }

    container.innerHTML = symbols.map((s) => renderSymbol(s, 0, onNavigate)).join('');

    // Add click handlers for navigation
    container.querySelectorAll('.symbol-item').forEach((el) => {
        const item = /** @type {HTMLElement} */ (el);
        const line = parseInt(item.dataset.line || '0', 10);
        const char = parseInt(item.dataset.char || '0', 10);

        item.addEventListener('click', () => onNavigate(line, char));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate(line, char);
            }
        });
    });
}

/**
 * Update document symbols (debounced)
 * @param {string} source
 * @param {HTMLElement} container
 * @param {(line: number, char: number) => void} onNavigate
 */
export function updateSymbols(source, container, onNavigate) {
    // Debounce updates
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    const currentVersion = ++symbolsVersion;

    updateTimeout = setTimeout(async () => {
        // Show loading state
        container.innerHTML = '<div class="symbols-loading">Loading...</div>';

        const symbols = await getDocumentSymbols(source);

        // Check if this is still the latest request
        if (currentVersion !== symbolsVersion) return;

        if (symbols) {
            renderSymbols(symbols, container, onNavigate);
        } else {
            container.innerHTML = '<div class="symbols-empty">Unable to load symbols</div>';
        }
    }, 300);
}

/**
 * Initialize symbols panel
 * @param {HTMLElement} container
 * @param {() => string} getSource
 * @param {(line: number, char: number) => void} onNavigate
 */
export function initSymbolsPanel(container, getSource, onNavigate) {
    if (symbolsInitialized) return;

    // Initial load
    updateSymbols(getSource(), container, onNavigate);
    symbolsInitialized = true;
}

/**
 * Clear symbols panel state (for cleanup)
 */
export function clearSymbolsPanel() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
    }
    symbolsVersion = 0;
    symbolsInitialized = false;
}
