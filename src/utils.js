// Utility functions extracted for testability

/**
 * Escape HTML special characters
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Extract account names from beancount source
 * @param {string} source
 * @returns {Set<string>}
 */
export function extractAccounts(source) {
    const accounts = new Set();
    const accountRegex = /[A-Z][A-Za-z0-9-]*(?::[A-Za-z0-9-]+)+/g;
    let match;
    while ((match = accountRegex.exec(source)) !== null) {
        accounts.add(match[0]);
    }
    return accounts;
}

// Note: getEnabledPlugins is in plugins.js to avoid duplication

/**
 * Format a number with thousands separators
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
    }
    return String(num);
}
