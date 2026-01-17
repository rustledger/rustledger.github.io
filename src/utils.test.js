import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    escapeHtml,
    extractAccounts,
    formatNumber,
    fetchWithRetry,
    countTransactions,
    extractLedgerStats,
    formatLedgerStats,
} from './utils.js';

// Note: getEnabledPlugins tests are in plugins.test.js

describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert("xss")&lt;/script&gt;'
        );
    });

    it('escapes ampersands', () => {
        expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('returns empty string for empty input', () => {
        expect(escapeHtml('')).toBe('');
    });

    it('handles normal text without escaping', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
    });
});

describe('extractAccounts', () => {
    it('extracts simple account names', () => {
        const source = `
            2024-01-01 open Assets:Bank:Checking USD
            2024-01-01 open Expenses:Food USD
        `;
        const accounts = extractAccounts(source);
        expect(accounts.has('Assets:Bank:Checking')).toBe(true);
        expect(accounts.has('Expenses:Food')).toBe(true);
    });

    it('handles accounts with numbers', () => {
        const source = '2024-01-01 open Assets:Bank123:Checking USD';
        const accounts = extractAccounts(source);
        expect(accounts.has('Assets:Bank123:Checking')).toBe(true);
    });

    it('handles accounts with hyphens', () => {
        const source = '2024-01-01 open Assets:My-Bank:Checking USD';
        const accounts = extractAccounts(source);
        expect(accounts.has('Assets:My-Bank:Checking')).toBe(true);
    });

    it('returns empty set for no accounts', () => {
        const accounts = extractAccounts('option "title" "Test"');
        expect(accounts.size).toBe(0);
    });
});

describe('formatNumber', () => {
    it('formats thousands with k suffix', () => {
        expect(formatNumber(1000)).toBe('1.0k');
        expect(formatNumber(1500)).toBe('1.5k');
        expect(formatNumber(10000)).toBe('10.0k');
    });

    it('returns number as string below 1000', () => {
        expect(formatNumber(999)).toBe('999');
        expect(formatNumber(0)).toBe('0');
        expect(formatNumber(500)).toBe('500');
    });
});

describe('fetchWithRetry', () => {
    const originalFetch = globalThis.fetch;

    /**
     * Create a mock response with headers
     * @param {number} status
     * @param {boolean} ok
     * @param {Record<string, string>} [headerValues]
     */
    const createMockResponse = (status, ok, headerValues = {}) => ({
        ok,
        status,
        headers: {
            get: (name) => headerValues[name] ?? null,
        },
    });

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.useRealTimers();
    });

    it('returns response on successful fetch', async () => {
        const mockResponse = createMockResponse(200, true);
        globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

        const result = await fetchWithRetry('https://example.com');
        expect(result).toBe(mockResponse);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on 5xx errors', async () => {
        const mockError = createMockResponse(500, false);
        const mockSuccess = createMockResponse(200, true);
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(mockError)
            .mockResolvedValueOnce(mockSuccess);

        const promise = fetchWithRetry('https://example.com', { baseDelay: 100 });
        await vi.advanceTimersByTimeAsync(100);
        const result = await promise;

        expect(result).toBe(mockSuccess);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('retries on 429 rate limit', async () => {
        const mockRateLimit = createMockResponse(429, false);
        const mockSuccess = createMockResponse(200, true);
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(mockRateLimit)
            .mockResolvedValueOnce(mockSuccess);

        const promise = fetchWithRetry('https://example.com', { baseDelay: 100 });
        await vi.advanceTimersByTimeAsync(100);
        const result = await promise;

        expect(result).toBe(mockSuccess);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry on 4xx client errors (except 429)', async () => {
        const mockNotFound = createMockResponse(404, false);
        globalThis.fetch = vi.fn().mockResolvedValue(mockNotFound);

        const result = await fetchWithRetry('https://example.com');
        expect(result).toBe(mockNotFound);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on network errors', async () => {
        const networkError = new Error('Network error');
        const mockSuccess = createMockResponse(200, true);
        globalThis.fetch = vi
            .fn()
            .mockRejectedValueOnce(networkError)
            .mockResolvedValueOnce(mockSuccess);

        const promise = fetchWithRetry('https://example.com', { baseDelay: 100 });
        await vi.advanceTimersByTimeAsync(100);
        const result = await promise;

        expect(result).toBe(mockSuccess);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('throws after max retries exceeded', async () => {
        vi.useRealTimers(); // Use real timers for this test to avoid async issues

        const networkError = new Error('Network error');
        globalThis.fetch = vi.fn().mockRejectedValue(networkError);

        await expect(
            fetchWithRetry('https://example.com', {
                maxRetries: 1,
                baseDelay: 1, // Very short delay for fast test
            })
        ).rejects.toThrow('Network error');

        expect(globalThis.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('uses exponential backoff for delays', async () => {
        const mockError = createMockResponse(500, false);
        const mockSuccess = createMockResponse(200, true);
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(mockError)
            .mockResolvedValueOnce(mockError)
            .mockResolvedValueOnce(mockSuccess);

        const promise = fetchWithRetry('https://example.com', {
            maxRetries: 3,
            baseDelay: 100,
        });

        // First retry after 100ms (100 * 2^0)
        await vi.advanceTimersByTimeAsync(100);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);

        // Second retry after 200ms (100 * 2^1)
        await vi.advanceTimersByTimeAsync(200);
        const result = await promise;

        expect(result).toBe(mockSuccess);
        expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    it('respects Retry-After header', async () => {
        const mockRateLimit = createMockResponse(429, false, { 'Retry-After': '2' });
        const mockSuccess = createMockResponse(200, true);
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(mockRateLimit)
            .mockResolvedValueOnce(mockSuccess);

        const promise = fetchWithRetry('https://example.com', { baseDelay: 100 });
        // Should wait 2 seconds (2000ms) as per Retry-After header
        await vi.advanceTimersByTimeAsync(2000);
        const result = await promise;

        expect(result).toBe(mockSuccess);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('handles GitHub 403 rate limit response', async () => {
        const mockRateLimit = createMockResponse(403, false, { 'X-RateLimit-Remaining': '0' });
        const mockSuccess = createMockResponse(200, true);
        globalThis.fetch = vi
            .fn()
            .mockResolvedValueOnce(mockRateLimit)
            .mockResolvedValueOnce(mockSuccess);

        const promise = fetchWithRetry('https://example.com', { baseDelay: 100 });
        await vi.advanceTimersByTimeAsync(100);
        const result = await promise;

        expect(result).toBe(mockSuccess);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
});

describe('countTransactions', () => {
    it('counts transactions with * marker', () => {
        const source = `
2024-01-01 * "Payee" "Description"
  Assets:Bank  -100 USD
  Expenses:Food  100 USD

2024-01-02 * "Another"
  Assets:Bank  -50 USD
  Expenses:Coffee  50 USD
        `;
        expect(countTransactions(source)).toBe(2);
    });

    it('counts transactions with ! marker', () => {
        const source = `
2024-01-01 ! "Pending transaction"
  Assets:Bank  -100 USD
  Expenses:Food  100 USD
        `;
        expect(countTransactions(source)).toBe(1);
    });

    it('counts transactions with txn keyword', () => {
        const source = `
2024-01-01 txn "Payee" "Description"
  Assets:Bank  -100 USD
  Expenses:Food  100 USD
        `;
        expect(countTransactions(source)).toBe(1);
    });

    it('does not count non-transaction entries', () => {
        const source = `
2024-01-01 open Assets:Bank USD
2024-01-01 balance Assets:Bank 1000 USD
2024-01-01 note Assets:Bank "A note"
2024-01-01 pad Assets:Bank Equity:Opening
        `;
        expect(countTransactions(source)).toBe(0);
    });

    it('returns 0 for empty source', () => {
        expect(countTransactions('')).toBe(0);
    });

    it('handles mixed content', () => {
        const source = `
option "title" "Test"
2024-01-01 open Assets:Bank USD
2024-01-01 * "Grocery Store"
  Assets:Bank  -50 USD
  Expenses:Food  50 USD
2024-01-02 balance Assets:Bank 950 USD
2024-01-03 ! "Pending"
  Assets:Bank  -25 USD
  Expenses:Coffee  25 USD
        `;
        expect(countTransactions(source)).toBe(2);
    });
});

describe('extractLedgerStats', () => {
    it('returns counts from provided sets', () => {
        const accounts = new Set(['Assets:Bank', 'Expenses:Food', 'Expenses:Coffee']);
        const plugins = new Set(['noduplicates']);
        const source = `
2024-01-01 * "Test"
  Assets:Bank  -100 USD
  Expenses:Food  100 USD
        `;

        const stats = extractLedgerStats(source, accounts, plugins);

        expect(stats.accounts).toBe(3);
        expect(stats.transactions).toBe(1);
        expect(stats.plugins).toBe(1);
    });

    it('handles empty source', () => {
        const stats = extractLedgerStats('', new Set(), new Set());

        expect(stats.accounts).toBe(0);
        expect(stats.transactions).toBe(0);
        expect(stats.plugins).toBe(0);
    });
});

describe('formatLedgerStats', () => {
    it('formats all stats', () => {
        const result = formatLedgerStats({ accounts: 5, transactions: 10, plugins: 2 });
        expect(result).toBe('5 accounts · 10 transactions · 2 plugins');
    });

    it('uses singular form for 1', () => {
        const result = formatLedgerStats({ accounts: 1, transactions: 1, plugins: 1 });
        expect(result).toBe('1 account · 1 transaction · 1 plugin');
    });

    it('omits zero values', () => {
        const result = formatLedgerStats({ accounts: 3, transactions: 0, plugins: 0 });
        expect(result).toBe('3 accounts');
    });

    it('returns empty string for all zeros', () => {
        const result = formatLedgerStats({ accounts: 0, transactions: 0, plugins: 0 });
        expect(result).toBe('');
    });

    it('handles accounts and transactions only', () => {
        const result = formatLedgerStats({ accounts: 2, transactions: 5, plugins: 0 });
        expect(result).toBe('2 accounts · 5 transactions');
    });
});
