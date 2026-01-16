import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatStarCount, getCachedGitHubInfo, cacheGitHubInfo } from './github.js';

describe('formatStarCount', () => {
    it('formats numbers below 1000 as-is', () => {
        expect(formatStarCount(0)).toBe('0');
        expect(formatStarCount(1)).toBe('1');
        expect(formatStarCount(999)).toBe('999');
    });

    it('formats 1000 as 1.0k', () => {
        expect(formatStarCount(1000)).toBe('1.0k');
    });

    it('formats thousands with one decimal place', () => {
        expect(formatStarCount(1500)).toBe('1.5k');
        expect(formatStarCount(2345)).toBe('2.3k');
        expect(formatStarCount(10000)).toBe('10.0k');
        expect(formatStarCount(99999)).toBe('100.0k');
    });
});

describe('getCachedGitHubInfo', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('returns null when no cache exists', () => {
        expect(getCachedGitHubInfo()).toBeNull();
    });

    it('returns cached data when valid', () => {
        const data = {
            stars: 100,
            version: 'v1.0.0',
            timestamp: Date.now(),
        };
        localStorage.setItem('rustledger_github_info', JSON.stringify(data));

        const result = getCachedGitHubInfo();
        expect(result).not.toBeNull();
        expect(result?.stars).toBe(100);
        expect(result?.version).toBe('v1.0.0');
    });

    it('returns null when cache is expired', () => {
        const data = {
            stars: 100,
            version: 'v1.0.0',
            timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        };
        localStorage.setItem('rustledger_github_info', JSON.stringify(data));

        expect(getCachedGitHubInfo()).toBeNull();
    });

    it('returns null on invalid JSON', () => {
        localStorage.setItem('rustledger_github_info', 'invalid json');
        expect(getCachedGitHubInfo()).toBeNull();
    });
});

describe('cacheGitHubInfo', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('stores data in localStorage', () => {
        cacheGitHubInfo(500, 'v2.0.0');

        const stored = localStorage.getItem('rustledger_github_info');
        expect(stored).not.toBeNull();

        const data = JSON.parse(stored || '');
        expect(data.stars).toBe(500);
        expect(data.version).toBe('v2.0.0');
        expect(data.timestamp).toBeDefined();
    });

    it('handles localStorage errors gracefully', () => {
        // Mock localStorage to throw
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = vi.fn().mockImplementation(() => {
            throw new Error('QuotaExceeded');
        });

        // Should not throw
        expect(() => cacheGitHubInfo(100, 'v1.0.0')).not.toThrow();

        localStorage.setItem = originalSetItem;
    });
});
