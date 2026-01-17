// UI utilities - toast, resizer, scroll effects

import { TOAST_DURATION } from './config.js';
import { fetchWithRetry } from './utils.js';

/**
 * Create an SVG element with the refresh icon path
 * @param {string} className - CSS classes for the SVG
 * @param {boolean} [animate=false] - Whether to add spin animation
 * @returns {SVGSVGElement}
 */
function createRefreshIcon(className, animate = false) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `${className}${animate ? ' animate-spin' : ''}`);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute(
        'd',
        'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    );

    svg.appendChild(path);
    return svg;
}

/**
 * Create an SVG element with the warning icon path
 * @param {string} className - CSS classes for the SVG
 * @returns {SVGSVGElement}
 */
function createWarningIcon(className) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute(
        'd',
        'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    );

    svg.appendChild(path);
    return svg;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {number} [duration] - Duration in milliseconds
 */
export function showToast(message, duration = TOAST_DURATION) {
    // Remove existing toast
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className =
        'fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg text-sm z-50 animate-toast';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('animate-toast-out');
        setTimeout(() => toast.remove(), 200);
    }, duration);
}

/**
 * Initialize the panel resizer
 * @param {string} resizerId - ID of the resizer element
 * @param {string} topPanelId - ID of the top panel
 * @param {string} bottomPanelId - ID of the bottom panel
 */
export function initResizer(resizerId, topPanelId, bottomPanelId) {
    const resizer = document.getElementById(resizerId);
    const topPanel = document.getElementById(topPanelId);
    const bottomPanel = document.getElementById(bottomPanelId);

    if (!resizer || !topPanel || !bottomPanel) return;

    let startY = 0;
    let startTopHeight = 0;
    let startBottomHeight = 0;

    /** @param {MouseEvent} e */
    const onMouseMove = (e) => {
        const delta = e.clientY - startY;
        const newTopHeight = Math.max(100, startTopHeight + delta);
        const newBottomHeight = Math.max(80, startBottomHeight - delta);
        topPanel.style.height = newTopHeight + 'px';
        bottomPanel.style.height = newBottomHeight + 'px';
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    resizer.addEventListener('mousedown', (e) => {
        startY = e.clientY;
        startTopHeight = topPanel.offsetHeight;
        startBottomHeight = bottomPanel.offsetHeight;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
}

/**
 * Initialize stats counter animation on scroll
 * @param {string} sectionId - ID of the stats section
 */
export function initStatsAnimation(sectionId) {
    const statsSection = document.getElementById(sectionId);
    if (!statsSection) return;

    /**
     * @param {HTMLElement} el
     * @param {number} start
     * @param {number} end
     * @param {number} duration
     * @param {string} suffix
     */
    const animateValue = (el, start, end, duration, suffix = '') => {
        const startTime = performance.now();
        /** @param {number} currentTime */
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeOut);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('[data-animate-stat]').forEach((el) => {
                        const htmlEl = /** @type {HTMLElement} */ (el);
                        const value = parseInt(htmlEl.dataset.animateStat || '0');
                        const suffix = htmlEl.dataset.suffix || '';
                        animateValue(htmlEl, 0, value, 1000, suffix);
                    });
                    observer.disconnect();
                }
            });
        },
        { threshold: 0.5 }
    );

    observer.observe(statsSection);
}

/**
 * Initialize scroll reveal animations
 */
export function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Also trigger stagger-children if present
                    entry.target.querySelectorAll('.stagger-children').forEach((el) => {
                        el.classList.add('visible');
                    });
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
        }
    );

    revealElements.forEach((el) => observer.observe(el));
}

/** @type {string | null} */
let currentWasmVersion = null;

/**
 * Update footer status element
 * @param {'loading' | 'ready' | 'error' | 'checking' | 'update-available'} status
 * @param {string} [version]
 * @param {string} [errorMessage]
 */
export function updateFooterStatus(status, version, errorMessage) {
    const footerStatus = document.getElementById('footer-status');
    if (!footerStatus) return;

    if (version) {
        currentWasmVersion = version;
    }

    /**
     * Create a refresh button with icon
     * @returns {HTMLButtonElement}
     */
    const createRefreshButton = () => {
        const btn = document.createElement('button');
        btn.id = 'check-update-btn';
        btn.className = 'ml-2 text-white/40 hover:text-white/70 transition';
        btn.title = 'Check for updates';
        btn.setAttribute('aria-label', 'Check for updates');
        btn.appendChild(createRefreshIcon('w-3.5 h-3.5 inline-block'));
        return btn;
    };

    // Helper to create a span with class and text
    const createSpan = (/** @type {string} */ className, /** @type {string} */ text) => {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        return span;
    };

    // Clear and rebuild footer content safely (avoid innerHTML with user data)
    footerStatus.innerHTML = '';
    footerStatus.className = 'text-xs';

    switch (status) {
        case 'loading':
            footerStatus.appendChild(createSpan('text-white/30', 'Loading...'));
            break;
        case 'ready': {
            footerStatus.appendChild(createSpan('text-green-400', '✓ Ready'));
            footerStatus.appendChild(document.createTextNode(' '));
            footerStatus.appendChild(
                createSpan('text-orange-400', `(rustledger ${currentWasmVersion || 'unknown'})`)
            );
            // Add refresh button
            footerStatus.appendChild(createRefreshButton());
            attachUpdateCheckHandler();
            break;
        }
        case 'checking': {
            footerStatus.appendChild(createSpan('text-green-400', '✓ Ready'));
            footerStatus.appendChild(document.createTextNode(' '));
            footerStatus.appendChild(
                createSpan('text-orange-400', `(rustledger ${currentWasmVersion || 'unknown'})`)
            );
            const spinnerSpan = document.createElement('span');
            spinnerSpan.className = 'ml-2 text-white/40';
            spinnerSpan.appendChild(createRefreshIcon('w-3.5 h-3.5 inline-block', true));
            footerStatus.appendChild(spinnerSpan);
            break;
        }
        case 'update-available': {
            footerStatus.appendChild(createSpan('text-green-400', '✓ Ready'));
            footerStatus.appendChild(document.createTextNode(' '));
            footerStatus.appendChild(
                createSpan('text-orange-400', `(rustledger ${currentWasmVersion || 'unknown'})`)
            );
            const updateBtn = document.createElement('button');
            updateBtn.id = 'reload-btn';
            updateBtn.className =
                'ml-2 text-yellow-400 hover:text-yellow-300 transition text-xs underline';
            updateBtn.textContent = `Update to ${errorMessage || 'latest'}`;
            footerStatus.appendChild(updateBtn);
            attachReloadHandler();
            break;
        }
        case 'error':
            footerStatus.appendChild(
                createSpan('text-red-400', `✗ ${errorMessage || 'Failed to load'}`)
            );
            break;
    }
}

/**
 * Attach click handler for the update check button
 */
function attachUpdateCheckHandler() {
    const btn = document.getElementById('check-update-btn');
    if (btn) {
        btn.addEventListener('click', checkForWasmUpdate);
    }
}

/**
 * Attach click handler for the reload button
 */
function attachReloadHandler() {
    const btn = document.getElementById('reload-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

/**
 * Check GitHub for a newer WASM version
 */
export async function checkForWasmUpdate() {
    updateFooterStatus('checking');

    try {
        const response = await fetchWithRetry(
            'https://api.github.com/repos/rustledger/rustledger/releases'
        );
        if (!response.ok) {
            throw new Error('Failed to fetch releases');
        }

        const releases = await response.json();
        // Find the latest release with WASM assets
        const wasmRelease = releases.find((/** @type {{ assets: Array<{ name: string }> }} */ r) =>
            r.assets?.some((/** @type {{ name: string }} */ a) => a.name.includes('wasm'))
        );

        if (!wasmRelease) {
            updateFooterStatus('ready');
            return;
        }

        const latestVersion = wasmRelease.tag_name?.replace(/^v/, '') || '';
        const currentVersion = currentWasmVersion?.replace(/^v/, '') || '';

        if (latestVersion && latestVersion !== currentVersion) {
            updateFooterStatus('update-available', undefined, wasmRelease.tag_name);
        } else {
            updateFooterStatus('ready');
            // Show brief "up to date" feedback
            const footerStatus = document.getElementById('footer-status');
            if (footerStatus) {
                const btn = document.getElementById('check-update-btn');
                if (btn) {
                    btn.classList.add('text-green-400');
                    setTimeout(() => btn.classList.remove('text-green-400'), 1500);
                }
            }
        }
    } catch {
        // Silently fail and restore ready state
        updateFooterStatus('ready');
    }
}

/**
 * Show an error modal for critical failures
 * @param {string} title
 * @param {string} message
 */
export function showErrorModal(title, message) {
    // Remove existing modal
    const existing = document.getElementById('error-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'error-modal';
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'error-modal-title');
    modal.setAttribute('aria-describedby', 'error-modal-desc');

    // Build modal content using DOM API
    const content = document.createElement('div');
    content.className =
        'bg-zinc-900 border border-red-500/30 rounded-lg max-w-md w-full p-6 shadow-2xl';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-3 mb-4';
    header.appendChild(createWarningIcon('w-6 h-6 text-red-400 flex-shrink-0'));

    const titleEl = document.createElement('h2');
    titleEl.id = 'error-modal-title';
    titleEl.className = 'text-lg font-semibold text-white';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const desc = document.createElement('p');
    desc.id = 'error-modal-desc';
    desc.className = 'text-white/70 text-sm mb-6';
    desc.textContent = message;

    const buttons = document.createElement('div');
    buttons.className = 'flex gap-3';

    const refreshBtn = document.createElement('button');
    refreshBtn.className =
        'flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition text-sm';
    refreshBtn.textContent = 'Refresh Page';
    refreshBtn.addEventListener('click', () => location.reload());

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'px-4 py-2 text-white/60 hover:text-white transition text-sm';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.addEventListener('click', () => modal.remove());

    buttons.appendChild(refreshBtn);
    buttons.appendChild(dismissBtn);

    content.appendChild(header);
    content.appendChild(desc);
    content.appendChild(buttons);
    modal.appendChild(content);

    document.body.appendChild(modal);

    // Focus the refresh button
    refreshBtn.focus();
}

// Make showToast available globally for inline handlers
if (typeof window !== 'undefined') {
    window.showToast = showToast;
}
