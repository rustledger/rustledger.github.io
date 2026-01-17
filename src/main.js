// Main application entry point
import { createEditor } from './editor.js';
import { examples } from './examples.js';
import {
    initWasm,
    isWasmReady,
    getVersion,
    validateSource,
    formatSource,
    executeQuery,
} from './wasm.js';
import { initQueryAutocomplete, updateQueryButtons, formatCell } from './query.js';
import {
    updatePluginButtons,
    togglePlugin as togglePluginInContent,
    getEnabledPlugins,
} from './plugins.js';
import {
    showToast,
    initResizer,
    initStatsAnimation,
    initScrollReveal,
    updateFooterStatus,
    showErrorModal,
} from './ui.js';
import { escapeHtml, extractAccounts, extractLedgerStats, formatLedgerStats } from './utils.js';
import { queryPresets, plugins } from './presets.js';
import { fetchGitHubInfo, fetchBenchmarkStats } from './github.js';
import { initInstallTabs, copyInstallCommand } from './install.js';
import { initKeyboardShortcuts, showShortcutsModal, hideShortcutsModal } from './shortcuts.js';
import './style.css';
import LZString from 'lz-string';

/**
 * @typedef {ReturnType<typeof createEditor>} Editor
 * @typedef {'simple' | 'stocks' | 'crypto' | 'travel' | 'business' | 'errors'} ExampleName
 */

// Global state
/** @type {Editor | null} */
let editor = null;

/** @type {ReturnType<typeof setTimeout> | null} */
let liveValidationTimeout = null;

/** @type {Set<number>} */
const errorLines = new Set();

/** @type {Map<number, string>} Map<lineNumber, errorMessage> for tooltips */
const errorMessages = new Map();

/** @type {Set<string>} For autocomplete */
const knownAccounts = new Set();

/**
 * Live validation of editor content (async - runs in Web Worker)
 */
async function liveValidate() {
    if (!isWasmReady() || !editor) return;

    const source = editor.getContent();
    const statusTab = document.getElementById('status-tab');

    try {
        const start = performance.now();
        const result = await validateSource(source);
        const elapsed = (performance.now() - start).toFixed(1);

        if (!result) return;

        errorLines.clear();
        errorMessages.clear();

        // Extract accounts for autocomplete
        const accounts = extractAccounts(source);
        knownAccounts.clear();
        accounts.forEach((a) => knownAccounts.add(a));

        // Update editor's known accounts for autocomplete
        if (editor.setKnownAccounts) {
            editor.setKnownAccounts(knownAccounts);
        }

        // Update query input with editor content for validation
        const queryInput = document.getElementById('query-text');
        if (queryInput) {
            /** @type {HTMLElement} */ (queryInput).dataset.editorContent = source;
        }

        if (result.valid) {
            if (statusTab) {
                statusTab.textContent = '✓ Valid';
                statusTab.className =
                    'output-tab text-green-400' +
                    (statusTab.classList.contains('active') ? ' active' : '');
            }

            // Calculate and display stats
            const enabledPlugins = getEnabledPlugins(source);
            const stats = extractLedgerStats(source, accounts, enabledPlugins);
            const statsText = formatLedgerStats(stats);

            let outputHtml = `<span class="text-green-400">✓ No errors found</span> <span class="text-white/30">(${elapsed}ms)</span>`;
            if (statsText) {
                outputHtml += `\n<span class="text-white/50">${statsText}</span>`;
            }
            showOutput(outputHtml);

            // Clear error highlights
            if (editor.highlightErrorLines) {
                editor.highlightErrorLines(new Set(), new Map());
            }
        } else {
            result.errors.forEach((err) => {
                if (err.line) {
                    errorLines.add(err.line);
                    errorMessages.set(err.line, err.message);
                }
            });
            const errorCount = result.errors.length;
            if (statusTab) {
                statusTab.textContent = `✗ ${errorCount} error${errorCount > 1 ? 's' : ''}`;
                statusTab.className =
                    'output-tab text-red-400' +
                    (statusTab.classList.contains('active') ? ' active' : '');
            }

            const errorHtml = result.errors
                .map(
                    (err) =>
                        `<span class="text-red-400">Line ${err.line || '?'}:</span> ${escapeHtml(err.message)}`
                )
                .join('\n');
            showOutput(errorHtml + `\n<span class="text-white/30">(${elapsed}ms)</span>`);

            // Highlight error lines in editor with tooltips
            if (editor.highlightErrorLines) {
                editor.highlightErrorLines(errorLines, errorMessages);
            }
        }

        // Update plugin button states
        updatePluginButtons(source);
    } catch (err) {
        if (statusTab) statusTab.textContent = 'Error';
        console.error('Validation error:', err);
    }
}

/**
 * Show output in output panel
 * @param {string} html
 */
function showOutput(html) {
    const output = document.getElementById('output');
    if (output) output.innerHTML = html;
}

/**
 * Handle editor content changes
 * @param {string} _content
 */
function onEditorChange(_content) {
    if (liveValidationTimeout) clearTimeout(liveValidationTimeout);
    liveValidationTimeout = setTimeout(() => {
        if (isWasmReady()) {
            liveValidate();
        }
    }, 300);
}

/**
 * Load an example file
 * @param {ExampleName} name
 */
window.loadExample = async function (name) {
    if (!examples[name]) return;

    // Update active tab and aria-selected
    document.querySelectorAll('.example-tab').forEach((tab) => {
        const tabEl = /** @type {HTMLElement} */ (tab);
        const isActive = tabEl.dataset.example === name;
        tabEl.classList.toggle('active', isActive);
        tabEl.setAttribute('aria-selected', String(isActive));
    });

    // Set editor content
    if (editor) {
        editor.setContent(examples[name]);
    }

    // Validate and show query results
    if (isWasmReady()) {
        await liveValidate();
        showTab('query');
        await window.runQueryPreset('BALANCES');
    }
};

/**
 * Switch output tabs
 * @param {string} tabName
 */
function showTab(tabName) {
    // Update tab buttons and aria-selected
    document.querySelectorAll('.output-tab').forEach((tab) => {
        const tabEl = /** @type {HTMLElement} */ (tab);
        const isActive = tabEl.dataset.tab === tabName;
        tabEl.classList.toggle('active', isActive);
        tabEl.setAttribute('aria-selected', String(isActive));
    });

    // Show/hide option bars
    const queryInput = document.getElementById('query-input');
    const queryOptions = document.getElementById('query-options');
    const pluginOptions = document.getElementById('plugin-options');
    const output = document.getElementById('output');
    const queryOutput = document.getElementById('query-output');

    queryInput?.classList.add('hidden');
    queryOptions?.classList.add('hidden');
    pluginOptions?.classList.add('hidden');

    if (tabName === 'query') {
        queryInput?.classList.remove('hidden');
        queryOptions?.classList.remove('hidden');
        updateQueryButtons();
    } else if (tabName === 'plugin') {
        pluginOptions?.classList.remove('hidden');
        if (editor) updatePluginButtons(editor.getContent());
    }

    // Show corresponding content
    output?.classList.add('hidden');
    queryOutput?.classList.add('hidden');

    if (tabName === 'query') {
        queryOutput?.classList.remove('hidden');
    } else {
        output?.classList.remove('hidden');
    }
}

window.switchTab = showTab;

/**
 * Format the editor content (async - runs in Web Worker)
 */
window.runFormat = async function () {
    if (!isWasmReady() || !editor) return;

    try {
        const result = await formatSource(editor.getContent());
        if (!result) return;

        if (result.formatted) {
            editor.setContent(result.formatted);
            await liveValidate();
        } else if (result.errors) {
            showTab('output');
            const errors = result.errors
                .map(
                    (err) =>
                        `<span class="text-red-400">Line ${err.line || '?'}:</span> ${escapeHtml(err.message)}`
                )
                .join('\n');
            showOutput(errors);
        }
    } catch (err) {
        console.error('Format error:', err);
    }
};

/**
 * Run a query preset
 * @param {string} queryStr
 */
window.runQueryPreset = async function (queryStr) {
    if (!queryStr || !isWasmReady()) return;
    const queryInput = /** @type {HTMLInputElement | null} */ (
        document.getElementById('query-text')
    );
    if (queryInput) {
        queryInput.value = queryStr;
    }
    updateQueryButtons();
    await runQuery(queryStr);
};

/**
 * Run query from input field
 */
window.runQueryFromInput = async function () {
    const queryInput = /** @type {HTMLInputElement | null} */ (
        document.getElementById('query-text')
    );
    if (queryInput && queryInput.value) {
        await runQuery(queryInput.value);
    }
};

/** Default page size for query results */
const QUERY_PAGE_SIZE = 100;

/** @type {{ rows: any[][], headers: string[], elapsed: string } | null} */
let currentQueryResult = null;

/**
 * Render a page of query results
 * @param {number} page - Page number (0-indexed)
 */
function renderQueryPage(page) {
    if (!currentQueryResult) return;

    const { rows, headers, elapsed } = currentQueryResult;
    const queryOutput = document.getElementById('query-output');
    if (!queryOutput) return;

    const totalRows = rows.length;
    const totalPages = Math.ceil(totalRows / QUERY_PAGE_SIZE);
    const startIdx = page * QUERY_PAGE_SIZE;
    const endIdx = Math.min(startIdx + QUERY_PAGE_SIZE, totalRows);
    const pageRows = rows.slice(startIdx, endIdx);

    let html = '<table class="w-full text-left" role="grid">';
    html +=
        '<thead><tr>' +
        headers
            .map(
                (h) =>
                    `<th scope="col" class="px-2 py-1 text-white/50 border-b border-white/10">${escapeHtml(String(h))}</th>`
            )
            .join('') +
        '</tr></thead>';
    html += '<tbody>';
    pageRows.forEach((row) => {
        html += '<tr class="hover:bg-white/5">';
        if (Array.isArray(row)) {
            row.forEach((val) => {
                html += `<td class="px-2 py-1 border-b border-white/5">${formatCell(val)}</td>`;
            });
        } else {
            headers.forEach((h, i) => {
                const val = row[h] !== undefined ? row[h] : row[i];
                html += `<td class="px-2 py-1 border-b border-white/5">${formatCell(val)}</td>`;
            });
        }
        html += '</tr>';
    });
    html += '</tbody></table>';

    // Stats and pagination controls
    html += '<div class="mt-3 flex items-center justify-between text-xs">';
    html += `<span class="text-white/30">Showing ${startIdx + 1}-${endIdx} of ${totalRows} rows (${elapsed}ms)</span>`;

    if (totalPages > 1) {
        html += '<div class="flex items-center gap-2">';
        html += `<button onclick="window.goToQueryPage(0)" class="px-2 py-1 rounded ${page === 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/10'}" ${page === 0 ? 'disabled' : ''} aria-label="First page">«</button>`;
        html += `<button onclick="window.goToQueryPage(${page - 1})" class="px-2 py-1 rounded ${page === 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/10'}" ${page === 0 ? 'disabled' : ''} aria-label="Previous page">‹</button>`;
        html += `<span class="text-white/50 px-2">Page ${page + 1} of ${totalPages}</span>`;
        html += `<button onclick="window.goToQueryPage(${page + 1})" class="px-2 py-1 rounded ${page >= totalPages - 1 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/10'}" ${page >= totalPages - 1 ? 'disabled' : ''} aria-label="Next page">›</button>`;
        html += `<button onclick="window.goToQueryPage(${totalPages - 1})" class="px-2 py-1 rounded ${page >= totalPages - 1 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/10'}" ${page >= totalPages - 1 ? 'disabled' : ''} aria-label="Last page">»</button>`;
        html += '</div>';
    }

    html += '</div>';
    queryOutput.innerHTML = html;
}

/**
 * Navigate to a specific query page
 * @param {number} page
 */
window.goToQueryPage = function (page) {
    if (!currentQueryResult) return;
    const totalPages = Math.ceil(currentQueryResult.rows.length / QUERY_PAGE_SIZE);
    if (page < 0 || page >= totalPages) return;
    renderQueryPage(page);
};

/**
 * Execute a BQL query (async - runs in Web Worker)
 * @param {string} queryStr
 */
async function runQuery(queryStr) {
    if (!isWasmReady() || !editor) return;

    try {
        const start = performance.now();
        const result = await executeQuery(editor.getContent(), queryStr);
        const elapsed = (performance.now() - start).toFixed(1);

        const queryOutput = document.getElementById('query-output');
        if (!queryOutput || !result) return;

        if (result.error) {
            currentQueryResult = null;
            queryOutput.innerHTML = `<span class="text-red-400">${escapeHtml(result.error)}</span>`;
        } else if (result.rows && result.rows.length > 0) {
            const headers = result.columns || Object.keys(result.rows[0]);

            // Store result for pagination
            currentQueryResult = { rows: result.rows, headers, elapsed };

            // Render first page
            renderQueryPage(0);
        } else {
            currentQueryResult = null;
            queryOutput.innerHTML = `<span class="text-white/50">No results (${elapsed}ms)</span>`;
        }
    } catch (e) {
        currentQueryResult = null;
        const queryOutput = document.getElementById('query-output');
        if (queryOutput) {
            queryOutput.innerHTML = `<span class="text-red-400">${escapeHtml(String(e))}</span>`;
        }
    }
}

/**
 * Toggle a plugin
 * @param {string} pluginName
 */
window.togglePlugin = async function (pluginName) {
    if (!pluginName || !editor) return;

    const newContent = togglePluginInContent(pluginName, editor.getContent());
    editor.setContent(newContent);
    updatePluginButtons(newContent);

    if (isWasmReady()) {
        await liveValidate();
    }
};

/**
 * Copy output content
 */
window.copyOutput = function () {
    const activeOutput = document.querySelector('#output-panel > :not(.hidden)');
    if (activeOutput) {
        navigator.clipboard.writeText(activeOutput.textContent || '');
        showToast('Copied!');
    }
};

/**
 * Share URL with compressed state
 */
window.shareUrl = function () {
    if (!editor) return;
    const content = editor.getContent();
    const compressed = LZString.compressToEncodedURIComponent(content);
    const url = `${window.location.origin}${window.location.pathname}?code=${compressed}`;
    navigator.clipboard.writeText(url);
    showToast('URL copied to clipboard!');
};

/**
 * Download ledger file
 */
window.downloadLedger = function () {
    if (!editor) return;
    const content = editor.getContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledger.beancount';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/** Maximum file size for upload (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Upload ledger file
 * @param {Event} event
 */
window.uploadLedger = function (event) {
    const target = /** @type {HTMLInputElement} */ (event.target);
    const file = target.files?.[0];
    if (!file || !editor) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        showToast('File too large (max 10MB)');
        target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string' && editor) {
            editor.setContent(result);
            // Clear example tab selection and update aria-selected
            document.querySelectorAll('.example-tab').forEach((t) => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
        }
    };
    reader.onerror = () => {
        showToast('Failed to read file');
    };
    reader.readAsText(file);
    target.value = ''; // Reset input
};

/**
 * Load state from URL
 */
function loadFromUrl() {
    if (!editor) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
        try {
            // Try lz-string first (new format)
            let decoded = LZString.decompressFromEncodedURIComponent(code);

            // Fallback to legacy base64 format
            if (!decoded) {
                decoded = decodeURIComponent(atob(code));
            }

            if (decoded) {
                editor.setContent(decoded);
                // Clear all example tabs
                document.querySelectorAll('.example-tab').forEach((tab) => {
                    tab.classList.remove('active');
                });
            }
        } catch (e) {
            console.error('Failed to decode URL:', e);
        }
    }
}

/**
 * Render query preset buttons from config
 */
function renderQueryPresets() {
    const container = document.getElementById('query-options');
    if (!container) return;

    // Create buttons with proper event handling (avoid inline handlers with special chars)
    container.innerHTML = '';
    queryPresets.forEach((preset) => {
        const button = document.createElement('button');
        button.dataset.query = preset.query;
        button.className = 'query-btn px-3 py-1 text-xs rounded transition';
        button.setAttribute('aria-label', preset.ariaLabel);
        button.textContent = preset.label;
        container.appendChild(button);
    });

    // Use event delegation for query preset clicks
    container.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const button = /** @type {HTMLButtonElement | null} */ (
            target.closest('button[data-query]')
        );
        if (button && button.dataset.query) {
            window.runQueryPreset(button.dataset.query);
        }
    });
}

/**
 * Render plugin buttons from config
 */
function renderPluginButtons() {
    const container = document.getElementById('plugin-options');
    if (!container) return;

    container.innerHTML = plugins
        .map(
            (plugin) => `
            <button
                onclick="togglePlugin('${plugin}')"
                data-plugin="${plugin}"
                class="plugin-btn px-3 py-1 text-xs rounded transition"
                aria-pressed="false"
            >${plugin}</button>
        `
        )
        .join('');
}

// Expose shortcuts functions to window for inline handlers
window.showShortcutsModal = showShortcutsModal;
window.hideShortcutsModal = hideShortcutsModal;
window.copyInstallCommand = copyInstallCommand;

/**
 * Initialize the application
 */
async function init() {
    // Create CodeMirror editor
    const container = document.getElementById('editor-panel');
    if (!container) return;

    editor = createEditor(container, examples.simple, onEditorChange);

    // Hide loading skeleton
    const skeleton = document.getElementById('editor-skeleton');
    if (skeleton) {
        skeleton.remove();
    }

    // Render dynamic UI elements
    renderQueryPresets();
    renderPluginButtons();

    // Initialize UI components
    initResizer('resizer', 'editor-panel', 'output-panel');
    initQueryAutocomplete();

    // Add custom event listener for running queries
    document.addEventListener('runquery', () => {
        window.runQueryFromInput();
    });

    // Load WASM with proper error handling
    try {
        updateFooterStatus('loading');
        await initWasm();
        const version = getVersion();
        updateFooterStatus('ready', version);

        // Run initial validation
        await liveValidate();

        // Show query tab and run default query
        showTab('query');
        await window.runQueryPreset('BALANCES');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to load WASM module';
        updateFooterStatus('error', undefined, 'WASM failed');
        showErrorModal('Failed to Initialize', errorMessage);
        console.error('Failed to load WASM:', e);
    }

    // Load from URL
    loadFromUrl();

    // Fetch GitHub info and benchmark stats
    fetchGitHubInfo();
    fetchBenchmarkStats();

    // Initialize animations
    initStatsAnimation('stats-section');
    initScrollReveal();

    // Initialize install tabs with OS detection
    initInstallTabs();

    // Initialize keyboard shortcuts
    initKeyboardShortcuts({
        onFormat: () => window.runFormat(),
    });

    // Set initial active states
    document.querySelector('.example-tab[data-example="simple"]')?.classList.add('active');
    document.querySelector('.output-tab[data-tab="output"]')?.classList.add('active');
}

// Register service worker for WASM caching
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('Service worker registration failed:', err);
        });
    });
}

// Global error boundary
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    // Don't show modal for minor errors, only critical ones
    if (event.error?.message?.includes('WASM') || event.error?.message?.includes('module')) {
        showErrorModal(
            'Application Error',
            'An unexpected error occurred. Please try refreshing the page.'
        );
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Only show modal for critical promise rejections
    if (
        event.reason?.message?.includes('WASM') ||
        event.reason?.message?.includes('Failed to fetch')
    ) {
        showErrorModal(
            'Loading Error',
            'Failed to load required resources. Please check your connection and refresh.'
        );
    }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
