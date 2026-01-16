// Query functionality and BQL autocomplete

import { isWasmReady, executeQuery, getBqlCompletions } from './wasm.js';
import { escapeHtml } from './utils.js';

/** @type {HTMLDivElement | null} */
let autocompleteDropdown = null;

/** @type {number} */
let autocompleteSelectedIndex = -1;

/** @type {Array<{text: string, category: string, description?: string}>} */
let autocompleteItems = [];

/** @type {{ tokenStart: number, tokenEnd: number, value: string } | null} */
let autocompleteContext = null;

/** @type {ReturnType<typeof setTimeout> | null} */
let queryValidationTimeout = null;

/**
 * Create the BQL autocomplete dropdown
 */
function createAutocompleteDropdown() {
    if (autocompleteDropdown) return;

    autocompleteDropdown = document.createElement('div');
    autocompleteDropdown.id = 'bql-autocomplete';
    autocompleteDropdown.className =
        'absolute z-50 bg-zinc-900 border border-white/20 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden';
    autocompleteDropdown.style.minWidth = '200px';
    autocompleteDropdown.setAttribute('role', 'listbox');
    autocompleteDropdown.setAttribute('aria-label', 'BQL completions');

    // Position it below the query input
    const queryContainer = document.getElementById('query-input');
    if (queryContainer) {
        queryContainer.style.position = 'relative';
        queryContainer.appendChild(autocompleteDropdown);
    }
}

/**
 * Show autocomplete suggestions
 * @param {Array<{text: string, category: string, description?: string}>} completions
 * @param {string} filter
 */
function showAutocomplete(completions, filter = '') {
    if (!autocompleteDropdown) createAutocompleteDropdown();
    if (!autocompleteDropdown) return;

    // Filter completions based on current partial input
    const lowerFilter = filter.toLowerCase();
    autocompleteItems = completions.filter((c) => c.text.toLowerCase().startsWith(lowerFilter));

    if (autocompleteItems.length === 0) {
        hideAutocomplete();
        return;
    }

    autocompleteSelectedIndex = -1;

    // Category colors
    /** @type {Record<string, string>} */
    const categoryColors = {
        keyword: 'text-purple-400',
        function: 'text-yellow-400',
        column: 'text-cyan-400',
        operator: 'text-orange-400',
        literal: 'text-green-400',
    };

    autocompleteDropdown.innerHTML = autocompleteItems
        .map(
            (item, idx) => `
        <div class="autocomplete-item px-3 py-2 cursor-pointer hover:bg-white/10 flex items-center gap-2 ${idx === autocompleteSelectedIndex ? 'bg-white/10' : ''}"
             data-index="${idx}"
             role="option"
             aria-selected="${idx === autocompleteSelectedIndex}">
            <span class="${categoryColors[item.category] || 'text-white'} font-mono text-sm">${escapeHtml(item.text)}</span>
            ${item.description ? `<span class="text-white/40 text-xs">${escapeHtml(item.description)}</span>` : ''}
        </div>
    `
        )
        .join('');

    // Add click handlers
    autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach((el) => {
        el.addEventListener('click', () => {
            const htmlEl = /** @type {HTMLElement} */ (el);
            const idx = parseInt(htmlEl.dataset.index || '0');
            selectAutocompleteItem(idx);
        });
    });

    autocompleteDropdown.classList.remove('hidden');
}

/**
 * Hide the autocomplete dropdown
 */
export function hideAutocomplete() {
    if (autocompleteDropdown) {
        autocompleteDropdown.classList.add('hidden');
    }
    autocompleteSelectedIndex = -1;
    autocompleteItems = [];
    autocompleteContext = null;
}

/**
 * Select an autocomplete item
 * @param {number} index
 */
function selectAutocompleteItem(index) {
    if (index < 0 || index >= autocompleteItems.length) return;
    if (!autocompleteContext) return;

    const item = autocompleteItems[index];
    const queryInput = /** @type {HTMLInputElement | null} */ (
        document.getElementById('query-text')
    );
    if (!queryInput) return;

    // Use stored context
    const { tokenStart, tokenEnd, value } = autocompleteContext;

    // Replace current token with completion
    const before = value.substring(0, tokenStart);
    const after = value.substring(tokenEnd);
    const completion = item.text;

    queryInput.value = before + completion + after;

    // Position cursor after completion
    const newPos = tokenStart + completion.length;
    queryInput.setSelectionRange(newPos, newPos);

    hideAutocomplete();
    validateQueryInput();
    queryInput.focus();
}

/**
 * Update autocomplete selection with keyboard navigation
 * @param {number} direction - 1 for down, -1 for up
 */
function updateAutocompleteSelection(direction) {
    if (autocompleteItems.length === 0) return;
    if (!autocompleteDropdown) return;

    autocompleteSelectedIndex += direction;
    if (autocompleteSelectedIndex < 0) autocompleteSelectedIndex = autocompleteItems.length - 1;
    if (autocompleteSelectedIndex >= autocompleteItems.length) autocompleteSelectedIndex = 0;

    // Update visual selection and aria-selected
    autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach((el, idx) => {
        const htmlEl = /** @type {HTMLElement} */ (el);
        if (idx === autocompleteSelectedIndex) {
            htmlEl.classList.add('bg-white/10');
            htmlEl.setAttribute('aria-selected', 'true');
            htmlEl.scrollIntoView({ block: 'nearest' });
        } else {
            htmlEl.classList.remove('bg-white/10');
            htmlEl.setAttribute('aria-selected', 'false');
        }
    });
}

/**
 * Handle keydown events on the query input
 * @param {KeyboardEvent} e
 */
export function handleQueryInputKeydown(e) {
    const isVisible = autocompleteDropdown && !autocompleteDropdown.classList.contains('hidden');

    if (isVisible) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateAutocompleteSelection(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateAutocompleteSelection(-1);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (autocompleteSelectedIndex >= 0) {
                e.preventDefault();
                selectAutocompleteItem(autocompleteSelectedIndex);
            } else if (autocompleteItems.length > 0 && e.key === 'Tab') {
                e.preventDefault();
                selectAutocompleteItem(0);
            } else if (e.key === 'Enter') {
                hideAutocomplete();
                // Let Enter run the query
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideAutocomplete();
        }
    } else if (e.key === 'Enter') {
        // Run query on Enter when autocomplete not visible
        const queryInput = /** @type {HTMLInputElement | null} */ (
            document.getElementById('query-text')
        );
        if (queryInput && queryInput.value.trim()) {
            e.preventDefault();
            // Dispatch custom event to run query
            queryInput.dispatchEvent(new CustomEvent('runquery', { bubbles: true }));
        }
    }
}

/**
 * Handle input events for autocomplete
 * @param {Event} e
 */
export function handleQueryInput(e) {
    if (!isWasmReady()) return;

    const queryInput = /** @type {HTMLInputElement} */ (e.target);
    const value = queryInput.value;
    const cursorPos = queryInput.selectionStart || 0;

    // Get completions from WASM
    const result = getBqlCompletions(value, cursorPos);

    if (result && result.completions && result.completions.length > 0) {
        // Find current partial token for filtering
        let tokenStart = cursorPos;
        while (tokenStart > 0 && !value[tokenStart - 1].match(/[\s(),]/)) {
            tokenStart--;
        }
        // Find end of current token
        let tokenEnd = cursorPos;
        while (tokenEnd < value.length && !value[tokenEnd].match(/[\s(),]/)) {
            tokenEnd++;
        }
        const currentToken = value.substring(tokenStart, cursorPos);

        // Store context for when user selects an item
        autocompleteContext = { tokenStart, tokenEnd, value };

        showAutocomplete(result.completions, currentToken);
    } else {
        hideAutocomplete();
    }

    // Also validate
    validateQueryInput();
}

/**
 * Validate the BQL query input and update styling
 */
export function validateQueryInput() {
    const queryContainer = document.getElementById('query-input');
    const queryInput = /** @type {HTMLInputElement | null} */ (
        document.getElementById('query-text')
    );
    if (!queryInput || !queryContainer) return;

    const currentQuery = queryInput.value.trim();

    // Clear previous timeout
    if (queryValidationTimeout) clearTimeout(queryValidationTimeout);

    // Empty query - neutral background
    if (!currentQuery) {
        queryContainer.style.backgroundColor = '';
        return;
    }

    // Debounce validation
    queryValidationTimeout = setTimeout(() => {
        if (!isWasmReady()) return;

        try {
            // We need access to the editor content - this will be passed via event
            const editorContent = queryInput.dataset.editorContent || '';
            if (!editorContent) return;

            const result = executeQuery(editorContent, currentQuery);
            // @ts-ignore - result structure may vary
            if (result && result.errors && result.errors.length > 0) {
                // Invalid query - red tint
                queryContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            } else {
                // Valid query - green tint
                queryContainer.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
            }
        } catch {
            // Error - red tint
            queryContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        }
    }, 150);
}

/**
 * Update query button styling based on current query
 */
export function updateQueryButtons() {
    const queryInput = /** @type {HTMLInputElement | null} */ (
        document.getElementById('query-text')
    );
    if (!queryInput) return;

    const currentQuery = queryInput.value.trim();

    document.querySelectorAll('.query-btn').forEach((btn) => {
        const htmlBtn = /** @type {HTMLElement} */ (btn);
        const btnQuery = htmlBtn.dataset.query;
        if (currentQuery === btnQuery) {
            htmlBtn.className =
                'query-btn px-3 py-1 text-xs rounded transition bg-white/20 text-white hover:bg-white/30';
        } else {
            htmlBtn.className =
                'query-btn px-3 py-1 text-xs rounded transition bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80';
        }
    });

    // Also validate the query
    validateQueryInput();
}

/**
 * Initialize query autocomplete
 */
export function initQueryAutocomplete() {
    const queryInput = document.getElementById('query-text');
    if (!queryInput) return;

    queryInput.addEventListener('input', handleQueryInput);
    queryInput.addEventListener('keydown', handleQueryInputKeydown);
    queryInput.addEventListener('blur', () => {
        // Delay hiding so click events can fire
        setTimeout(hideAutocomplete, 150);
    });
    queryInput.addEventListener('focus', handleQueryInput);

    createAutocompleteDropdown();
}

/** Empty/null placeholder */
const EMPTY_CELL = '<span class="text-white/30">-</span>';

/**
 * Format an Amount object { number, currency }
 * @param {number} num
 * @param {string} currency
 * @returns {string}
 */
function formatAmount(num, currency) {
    return `<span class="text-yellow-300">${num}</span> <span class="text-orange-300">${currency}</span>`;
}

/**
 * Format an Inventory object { positions: [...] }
 * @param {Array<any>} positions
 * @returns {string}
 */
function formatInventory(positions) {
    if (positions.length === 0) return EMPTY_CELL;
    return positions
        .map(
            /** @param {any} p */ (p) => {
                if (p.units && p.units.number !== undefined && p.units.currency) {
                    return formatAmount(p.units.number, p.units.currency);
                }
                return escapeHtml(JSON.stringify(p));
            }
        )
        .join('<br>');
}

/**
 * Format a Position object { units, cost? }
 * @param {{ number: number, currency: string }} units
 * @param {{ number: number, currency: string } | null} cost
 * @returns {string}
 */
function formatPosition(units, cost) {
    let result = formatAmount(units.number, units.currency);
    if (cost) {
        result += ` <span class="text-white/40">{${cost.number} ${cost.currency}}</span>`;
    }
    return result;
}

/**
 * Format a query result cell for display
 * @param {any} cell
 * @returns {string}
 */
export function formatCell(cell) {
    if (cell === null || cell === undefined) return EMPTY_CELL;

    if (typeof cell === 'object') {
        // Amount: { number, currency }
        if (cell.number !== undefined && cell.currency) {
            return formatAmount(cell.number, cell.currency);
        }
        // Inventory: { positions: [...] }
        if (cell.positions && Array.isArray(cell.positions)) {
            return formatInventory(cell.positions);
        }
        // Position: { units, cost? }
        if (cell.units && cell.units.number !== undefined && cell.units.currency) {
            return formatPosition(cell.units, cell.cost || null);
        }
        // Fallback: stringify
        const json = JSON.stringify(cell);
        return json === '{}' ? EMPTY_CELL : escapeHtml(json);
    }

    // Check if it's an account string
    const str = String(cell);
    if (/^[A-Z][A-Za-z0-9-]*:[A-Za-z0-9-:]+$/.test(str)) {
        return formatAccount(str);
    }
    return escapeHtml(str);
}

/**
 * Colorize account hierarchy parts
 * @param {string} account
 * @returns {string}
 */
export function formatAccount(account) {
    const parts = account.split(':');
    const colors = [
        'text-cyan-400', // Root (Assets, Expenses, etc.)
        'text-teal-300', // Level 1
        'text-emerald-300', // Level 2
        'text-amber-300', // Level 3
        'text-orange-300', // Level 4+
    ];

    return parts
        .map((part, i) => {
            const colorClass = colors[Math.min(i, colors.length - 1)];
            const separator = i < parts.length - 1 ? '<span class="text-white/50">:</span>' : '';
            return `<span class="${colorClass}">${escapeHtml(part)}</span>${separator}`;
        })
        .join('');
}
