import { describe, it, expect } from 'vitest';
import { escapeHtml, extractAccounts, formatNumber } from './utils.js';

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
