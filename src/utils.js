// Utility functions extracted for testability

/**
 * Escape HTML special characters using regex (no DOM required)
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
 * Count transactions in beancount source
 * Matches date-prefixed entries with transaction indicators (*, !, txn, or payee)
 * @param {string} source
 * @returns {number}
 */
export function countTransactions(source) {
    // Match lines starting with date followed by transaction marker or payee
    // Examples: 2024-01-01 * "Payee", 2024-01-01 txn "Payee", 2024-01-01 ! "Payee"
    const txnRegex = /^\d{4}-\d{2}-\d{2}\s+(?:\*|!|txn)\s/gm;
    const matches = source.match(txnRegex);
    return matches ? matches.length : 0;
}

/**
 * Extract ledger statistics from beancount source
 * @param {string} source
 * @param {Set<string>} accounts - Pre-extracted accounts (for efficiency)
 * @param {Set<string>} plugins - Pre-extracted plugins (for efficiency)
 * @returns {{ accounts: number, transactions: number, plugins: number }}
 */
export function extractLedgerStats(source, accounts, plugins) {
    return {
        accounts: accounts.size,
        transactions: countTransactions(source),
        plugins: plugins.size,
    };
}

/**
 * Format ledger stats for display
 * @param {{ accounts: number, transactions: number, plugins: number }} stats
 * @returns {string}
 */
export function formatLedgerStats(stats) {
    const parts = [];
    if (stats.accounts > 0) {
        parts.push(`${stats.accounts} account${stats.accounts !== 1 ? 's' : ''}`);
    }
    if (stats.transactions > 0) {
        parts.push(`${stats.transactions} transaction${stats.transactions !== 1 ? 's' : ''}`);
    }
    if (stats.plugins > 0) {
        parts.push(`${stats.plugins} plugin${stats.plugins !== 1 ? 's' : ''}`);
    }
    return parts.join(' · ');
}

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
 * Get the retry delay from response headers or calculate exponential backoff
 * @param {Response} response - The response object
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in ms
 * @returns {number} - Delay in ms
 */
function getRetryDelay(response, attempt, baseDelay) {
    // Check for Retry-After header (in seconds)
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
            return seconds * 1000;
        }
    }

    // Check for GitHub's X-RateLimit-Reset header (Unix timestamp)
    const resetTime = response.headers.get('X-RateLimit-Reset');
    if (resetTime) {
        const resetTimestamp = parseInt(resetTime, 10) * 1000;
        const now = Date.now();
        if (resetTimestamp > now) {
            // Wait until reset time plus a small buffer
            return Math.min(resetTimestamp - now + 1000, 60000);
        }
    }

    // Default exponential backoff
    return baseDelay * Math.pow(2, attempt);
}

/**
 * Fetch with retry and exponential backoff
 * Respects Retry-After and GitHub X-RateLimit headers
 * @param {string} url - URL to fetch
 * @param {object} [options] - Fetch options
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @param {number} [options.baseDelay=1000] - Base delay in ms (doubles each retry)
 * @param {number} [options.timeout=10000] - Request timeout in ms
 * @param {RequestInit} [options.fetchOptions] - Options to pass to fetch
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}) {
    const { maxRetries = 3, baseDelay = 1000, timeout = 10000, fetchOptions = {} } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            // Check if we're approaching GitHub rate limit
            const remaining = response.headers.get('X-RateLimit-Remaining');
            if (remaining && parseInt(remaining, 10) === 0 && response.status === 403) {
                // Rate limited - treat like 429
                if (attempt < maxRetries) {
                    const delay = getRetryDelay(response, attempt, baseDelay);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }

            // Don't retry on client errors (4xx) except 429 (rate limit)
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                return response;
            }

            // Retry on server errors (5xx) or rate limiting (429)
            if (response.status >= 500 || response.status === 429) {
                if (attempt < maxRetries) {
                    const delay = getRetryDelay(response, attempt, baseDelay);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }

            return response;
        } catch (err) {
            clearTimeout(timeoutId);
            lastError = err;

            // Convert abort error to timeout error for clarity
            if (err instanceof Error && err.name === 'AbortError') {
                lastError = new Error(`Request timed out after ${timeout}ms`);
            }

            // Retry on network errors and timeouts
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }
        }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}
