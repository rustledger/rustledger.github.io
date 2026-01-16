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
import { updatePluginButtons, togglePlugin as togglePluginInContent } from './plugins.js';
import {
    showToast,
    initResizer,
    initStatsAnimation,
    initScrollReveal,
    updateFooterStatus,
    showErrorModal,
} from './ui.js';
import { escapeHtml, extractAccounts } from './utils.js';
import { queryPresets, plugins } from './presets.js';
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
 * Live validation of editor content
 */
function liveValidate() {
    if (!isWasmReady() || !editor) return;

    const source = editor.getContent();
    const statusTab = document.getElementById('status-tab');

    try {
        const start = performance.now();
        const result = validateSource(source);
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
            showOutput(
                `<span class="text-green-400">✓ No errors found</span> <span class="text-white/30">(${elapsed}ms)</span>`
            );
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
window.loadExample = function (name) {
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
        liveValidate();
        showTab('query');
        window.runQueryPreset('BALANCES');
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
 * Format the editor content
 */
window.runFormat = function () {
    if (!isWasmReady() || !editor) return;

    try {
        const result = formatSource(editor.getContent());
        if (!result) return;

        if (result.formatted) {
            editor.setContent(result.formatted);
            liveValidate();
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
window.runQueryPreset = function (queryStr) {
    if (!queryStr || !isWasmReady()) return;
    const queryInput = /** @type {HTMLInputElement | null} */ (
        document.getElementById('query-text')
    );
    if (queryInput) {
        queryInput.value = queryStr;
    }
    updateQueryButtons();
    runQuery(queryStr);
};

/**
 * Run query from input field
 */
window.runQueryFromInput = function () {
    const queryInput = /** @type {HTMLInputElement | null} */ (
        document.getElementById('query-text')
    );
    if (queryInput && queryInput.value) {
        runQuery(queryInput.value);
    }
};

/**
 * Execute a BQL query
 * @param {string} queryStr
 */
function runQuery(queryStr) {
    if (!isWasmReady() || !editor) return;

    try {
        const start = performance.now();
        const result = executeQuery(editor.getContent(), queryStr);
        const elapsed = (performance.now() - start).toFixed(1);

        const queryOutput = document.getElementById('query-output');
        if (!queryOutput || !result) return;

        if (result.error) {
            queryOutput.innerHTML = `<span class="text-red-400">${escapeHtml(result.error)}</span>`;
        } else if (result.rows && result.rows.length > 0) {
            const headers = result.columns || Object.keys(result.rows[0]);
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
            result.rows.forEach((row) => {
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
            html += `<div class="mt-2 text-xs text-white/30">${result.rows.length} rows in ${elapsed}ms</div>`;
            queryOutput.innerHTML = html;
        } else {
            queryOutput.innerHTML = `<span class="text-white/50">No results (${elapsed}ms)</span>`;
        }
    } catch (e) {
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
window.togglePlugin = function (pluginName) {
    if (!pluginName || !editor) return;

    const newContent = togglePluginInContent(pluginName, editor.getContent());
    editor.setContent(newContent);
    updatePluginButtons(newContent);

    if (isWasmReady()) {
        liveValidate();
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

/** Cache key for GitHub info */
const GITHUB_CACHE_KEY = 'rustledger_github_info';
/** Cache duration: 1 hour */
const GITHUB_CACHE_TTL = 60 * 60 * 1000;

/**
 * Get cached GitHub info from localStorage
 * @returns {{ stars: number, version: string, timestamp: number } | null}
 */
function getCachedGitHubInfo() {
    try {
        const cached = localStorage.getItem(GITHUB_CACHE_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        // Return cached data if still valid
        if (age < GITHUB_CACHE_TTL) {
            return data;
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Save GitHub info to localStorage cache
 * @param {number} stars
 * @param {string} version
 */
function cacheGitHubInfo(stars, version) {
    try {
        localStorage.setItem(
            GITHUB_CACHE_KEY,
            JSON.stringify({
                stars,
                version,
                timestamp: Date.now(),
            })
        );
    } catch {
        // Ignore storage errors (quota exceeded, etc.)
    }
}

/**
 * Fetch GitHub stats with proper error handling and caching
 */
async function fetchGitHubInfo() {
    const starsEl = document.getElementById('github-stars');
    const versionEl = document.getElementById('footer-version');

    // Use cached data for immediate display (but still fetch for binary links)
    const cached = getCachedGitHubInfo();
    if (cached) {
        if (starsEl) {
            starsEl.textContent =
                cached.stars >= 1000
                    ? `${(cached.stars / 1000).toFixed(1)}k`
                    : String(cached.stars);
        }
        if (versionEl && cached.version) {
            versionEl.textContent = cached.version;
        }
        // Don't return - still need to fetch releases for binary download links
    }

    try {
        const [repoResponse, releasesResponse] = await Promise.all([
            fetch('https://api.github.com/repos/rustledger/rustledger'),
            fetch('https://api.github.com/repos/rustledger/rustledger/releases?per_page=1'),
        ]);

        // Handle rate limiting
        if (repoResponse.status === 403 || releasesResponse.status === 403) {
            console.warn('GitHub API rate limit reached');
            if (starsEl) starsEl.textContent = '-';
            if (versionEl) versionEl.textContent = '';
            return;
        }

        // Handle not found
        if (repoResponse.status === 404) {
            console.warn('GitHub repository not found');
            if (starsEl) starsEl.textContent = '-';
            if (versionEl) versionEl.textContent = '';
            return;
        }

        // Check for successful responses
        if (!repoResponse.ok || !releasesResponse.ok) {
            throw new Error(`HTTP error: ${repoResponse.status}`);
        }

        const repoData = await repoResponse.json();
        const releasesData = await releasesResponse.json();

        let stars = 0;
        let version = '';

        if (repoData.stargazers_count !== undefined) {
            stars = repoData.stargazers_count;
            if (starsEl) {
                starsEl.textContent =
                    stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars);
            }
        }

        if (Array.isArray(releasesData) && releasesData.length > 0 && releasesData[0].tag_name) {
            version = releasesData[0].tag_name;
            if (versionEl) {
                versionEl.textContent = version;
            }

            // Update binary download links with direct asset URLs
            const assets = releasesData[0].assets || [];
            /** @type {NodeListOf<HTMLAnchorElement>} */
            const binaryLinks = document.querySelectorAll('.binary-option[data-asset-pattern]');
            binaryLinks.forEach((link) => {
                const pattern = link.dataset.assetPattern;
                if (pattern) {
                    const asset = assets.find(
                        (/** @type {{ name: string; browser_download_url: string }} */ a) =>
                            a.name.includes(pattern)
                    );
                    if (asset && asset.browser_download_url) {
                        link.href = asset.browser_download_url;
                    }
                }
            });
        }

        // Cache the results
        if (stars > 0 || version) {
            cacheGitHubInfo(stars, version);
        }
    } catch (e) {
        console.warn('Failed to fetch GitHub info:', e);
        if (starsEl) starsEl.textContent = '-';
        if (versionEl) versionEl.textContent = '';
    }
}

/**
 * Render query preset buttons from config
 */
function renderQueryPresets() {
    const container = document.getElementById('query-options');
    if (!container) return;

    container.innerHTML = queryPresets
        .map(
            (preset) => `
            <button
                onclick="runQueryPreset('${escapeHtml(preset.query.replace(/'/g, "\\'"))}')"
                data-query="${escapeHtml(preset.query)}"
                class="query-btn px-3 py-1 text-xs rounded transition"
                aria-label="${escapeHtml(preset.ariaLabel)}"
            >${escapeHtml(preset.label)}</button>
        `
        )
        .join('');
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

/**
 * Show keyboard shortcuts modal
 */
window.showShortcutsModal = function () {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // Focus first focusable element
        const closeBtn = modal.querySelector('button');
        closeBtn?.focus();
    }
};

/**
 * Hide keyboard shortcuts modal
 */
window.hideShortcutsModal = function () {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('shortcuts-modal');
        const isModalOpen = modal && !modal.classList.contains('hidden');

        // Don't trigger shortcuts when typing in inputs (except for Escape)
        const isTyping =
            document.activeElement?.tagName === 'INPUT' ||
            document.activeElement?.tagName === 'TEXTAREA' ||
            document.activeElement?.closest('.cm-editor');

        // Close modal on Escape
        if (e.key === 'Escape' && isModalOpen) {
            e.preventDefault();
            window.hideShortcutsModal();
            return;
        }

        // Close modal on click outside
        if (isModalOpen) return;

        // Show help on ?
        if (e.key === '?' && !isTyping) {
            e.preventDefault();
            window.showShortcutsModal();
            return;
        }

        // Format on Ctrl+Shift+F
        if (e.key === 'F' && e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            window.runFormat();
            return;
        }
    });

    // Close modal on backdrop click
    const modal = document.getElementById('shortcuts-modal');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.hideShortcutsModal();
        }
    });
}

// ========================================
// INSTALL TABS - OS Detection & Tab Switching
// ========================================

/**
 * Detect user's operating system and recommend best install method
 * @returns {{ os: string, recommendedTab: string }}
 */
function detectOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // macOS detection
    if (
        platform.includes('mac') ||
        userAgent.includes('macintosh') ||
        userAgent.includes('mac os')
    ) {
        return { os: 'macos', recommendedTab: 'homebrew' };
    }

    // Windows detection
    if (platform.includes('win') || userAgent.includes('windows')) {
        return { os: 'windows', recommendedTab: 'binary' };
    }

    // Linux detection with distro-specific recommendations
    if (platform.includes('linux') || userAgent.includes('linux')) {
        // Check for Arch Linux indicators
        if (
            userAgent.includes('arch') ||
            userAgent.includes('manjaro') ||
            userAgent.includes('endeavour')
        ) {
            return { os: 'linux-arch', recommendedTab: 'aur' };
        }
        // Check for NixOS indicators
        if (userAgent.includes('nixos')) {
            return { os: 'linux-nix', recommendedTab: 'nix' };
        }
        // Default Linux recommendation
        return { os: 'linux', recommendedTab: 'binary' };
    }

    // Default fallback - cargo works everywhere with Rust installed
    return { os: 'unknown', recommendedTab: 'cargo' };
}

/**
 * Switch to a specific install tab
 * @param {string} tabName - The tab to activate
 * @param {boolean} [addRecommendedBadge=false] - Whether to show recommended badge
 */
function switchInstallTab(tabName, addRecommendedBadge = false) {
    const tabs = document.querySelectorAll('.install-tab');
    const panels = document.querySelectorAll('.install-panel');

    // Deactivate all tabs and panels
    tabs.forEach((tab) => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        // Remove any existing recommended badge
        const badge = tab.querySelector('.recommended-badge');
        if (badge) badge.remove();
    });
    panels.forEach((panel) => panel.classList.remove('active'));

    // Activate the selected tab and panel
    const selectedTab = document.querySelector(`.install-tab[data-tab="${tabName}"]`);
    const selectedPanel = document.getElementById(`panel-${tabName}`);

    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.setAttribute('aria-selected', 'true');

        // Add recommended badge if this is the OS-detected recommendation
        if (addRecommendedBadge) {
            const badge = document.createElement('span');
            badge.className = 'recommended-badge';
            badge.textContent = 'Best';
            selectedTab.appendChild(badge);
        }
    }
    if (selectedPanel) {
        selectedPanel.classList.add('active');
    }
}

/**
 * Initialize install tabs with OS detection
 */
function initInstallTabs() {
    const installSection = document.getElementById('install-section');
    if (!installSection) return;

    // Detect OS and set recommended tab
    const { recommendedTab } = detectOS();
    switchInstallTab(recommendedTab, true);

    // Add click handlers to tabs
    const tabs = document.querySelectorAll('.install-tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            if (tabName) {
                // When user manually clicks, don't show recommended badge
                switchInstallTab(tabName, false);
            }
        });
    });

    // Add keyboard navigation
    tabs.forEach((tab, index) => {
        /** @type {HTMLElement} */ (tab).addEventListener('keydown', (e) => {
            const keyEvent = /** @type {KeyboardEvent} */ (e);
            const tabsArray = Array.from(tabs);
            let newIndex = index;

            if (keyEvent.key === 'ArrowRight' || keyEvent.key === 'ArrowDown') {
                keyEvent.preventDefault();
                newIndex = (index + 1) % tabsArray.length;
            } else if (keyEvent.key === 'ArrowLeft' || keyEvent.key === 'ArrowUp') {
                keyEvent.preventDefault();
                newIndex = (index - 1 + tabsArray.length) % tabsArray.length;
            } else if (keyEvent.key === 'Home') {
                keyEvent.preventDefault();
                newIndex = 0;
            } else if (keyEvent.key === 'End') {
                keyEvent.preventDefault();
                newIndex = tabsArray.length - 1;
            }

            if (newIndex !== index) {
                const newTab = /** @type {HTMLElement} */ (tabsArray[newIndex]);
                newTab.focus();
                const tabName = newTab.getAttribute('data-tab');
                if (tabName) switchInstallTab(tabName, false);
            }
        });
    });
}

/**
 * Copy install command to clipboard with visual feedback
 * @param {string} command - The command to copy
 * @param {HTMLElement} button - The button element that was clicked
 */
window.copyInstallCommand = function (command, button) {
    navigator.clipboard.writeText(command).then(() => {
        // Show success state
        button.classList.add('copied');
        const originalHTML = button.innerHTML;
        button.innerHTML =
            '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';

        showToast('Copied to clipboard!');

        // Revert after delay
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalHTML;
        }, 2000);
    });
};

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
        liveValidate();

        // Show query tab and run default query
        showTab('query');
        window.runQueryPreset('BALANCES');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to load WASM module';
        updateFooterStatus('error', undefined, 'WASM failed');
        showErrorModal('Failed to Initialize', errorMessage);
        console.error('Failed to load WASM:', e);
    }

    // Load from URL
    loadFromUrl();

    // Fetch GitHub info
    fetchGitHubInfo();

    // Initialize animations
    initStatsAnimation('stats-section');
    initScrollReveal();

    // Initialize install tabs with OS detection
    initInstallTabs();

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

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
