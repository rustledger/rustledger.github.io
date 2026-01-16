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

/**
 * Fetch with retry and exponential backoff
 * @param {string} url - URL to fetch
 * @param {object} [options] - Fetch options
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @param {number} [options.baseDelay=1000] - Base delay in ms (doubles each retry)
 * @param {RequestInit} [options.fetchOptions] - Options to pass to fetch
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}) {
    const { maxRetries = 3, baseDelay = 1000, fetchOptions = {} } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, fetchOptions);

            // Don't retry on client errors (4xx) except 429 (rate limit)
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                return response;
            }

            // Retry on server errors (5xx) or rate limiting (429)
            if (response.status >= 500 || response.status === 429) {
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }

            return response;
        } catch (err) {
            lastError = err;

            // Retry on network errors
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }
        }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}
