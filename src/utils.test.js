import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { escapeHtml, extractAccounts, formatNumber, fetchWithRetry } from './utils.js';

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

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.useRealTimers();
    });

    it('returns response on successful fetch', async () => {
        const mockResponse = { ok: true, status: 200 };
        globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

        const result = await fetchWithRetry('https://example.com');
        expect(result).toBe(mockResponse);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on 5xx errors', async () => {
        const mockError = { ok: false, status: 500 };
        const mockSuccess = { ok: true, status: 200 };
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
        const mockRateLimit = { ok: false, status: 429 };
        const mockSuccess = { ok: true, status: 200 };
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
        const mockNotFound = { ok: false, status: 404 };
        globalThis.fetch = vi.fn().mockResolvedValue(mockNotFound);

        const result = await fetchWithRetry('https://example.com');
        expect(result).toBe(mockNotFound);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on network errors', async () => {
        const networkError = new Error('Network error');
        const mockSuccess = { ok: true, status: 200 };
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
        const mockError = { ok: false, status: 500 };
        const mockSuccess = { ok: true, status: 200 };
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
});
