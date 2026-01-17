import { describe, it, expect } from 'vitest';
import { formatCell, formatAccount } from './query.js';

describe('formatCell', () => {
    it('formats null as dash', () => {
        expect(formatCell(null)).toBe('<span class="text-white/30">-</span>');
    });

    it('formats undefined as dash', () => {
        expect(formatCell(undefined)).toBe('<span class="text-white/30">-</span>');
    });

    it('formats string values', () => {
        expect(formatCell('hello')).toBe('hello');
    });

    it('escapes HTML in string values', () => {
        expect(formatCell('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
    });

    it('formats Amount objects', () => {
        const amount = { number: 100.5, currency: 'USD' };
        const result = formatCell(amount);
        expect(result).toContain('100.5');
        expect(result).toContain('USD');
        expect(result).toContain('text-yellow-300');
        expect(result).toContain('text-orange-300');
    });

    it('formats Inventory with positions', () => {
        const inventory = {
            positions: [
                { units: { number: 50, currency: 'USD' } },
                { units: { number: 100, currency: 'EUR' } },
            ],
        };
        const result = formatCell(inventory);
        expect(result).toContain('50');
        expect(result).toContain('USD');
        expect(result).toContain('100');
        expect(result).toContain('EUR');
    });

    it('formats empty Inventory as dash', () => {
        const inventory = { positions: [] };
        expect(formatCell(inventory)).toBe('<span class="text-white/30">-</span>');
    });

    it('formats Position with cost', () => {
        const position = {
            units: { number: 100, currency: 'AAPL' },
            cost: { number: 150.5, currency: 'USD' },
        };
        const result = formatCell(position);
        expect(result).toContain('100');
        expect(result).toContain('AAPL');
        expect(result).toContain('150.5');
        expect(result).toContain('USD');
    });

    it('formats account strings with colors', () => {
        const result = formatCell('Assets:Bank:Checking');
        expect(result).toContain('text-cyan-400');
        expect(result).toContain('Assets');
        expect(result).toContain('Bank');
        expect(result).toContain('Checking');
    });

    it('formats empty object as dash', () => {
        expect(formatCell({})).toBe('<span class="text-white/30">-</span>');
    });

    it('formats numbers as strings', () => {
        expect(formatCell(123)).toBe('123');
    });
});

describe('formatAccount', () => {
    it('formats single level account', () => {
        // Single level accounts don't match the pattern, but let's test the function
        const result = formatAccount('Assets:Bank');
        expect(result).toContain('Assets');
        expect(result).toContain('Bank');
        expect(result).toContain(':'); // separator
    });

    it('applies different colors to each level', () => {
        const result = formatAccount('Assets:Bank:Checking:Savings');
        expect(result).toContain('text-cyan-400'); // Level 0
        expect(result).toContain('text-teal-300'); // Level 1
        expect(result).toContain('text-emerald-300'); // Level 2
        expect(result).toContain('text-amber-300'); // Level 3
    });

    it('formats colons with muted color', () => {
        const result = formatAccount('Assets:Bank');
        expect(result).toContain('text-white/50');
    });

    it('handles deep account hierarchies', () => {
        const result = formatAccount('Assets:Bank:Checking:Primary:Joint');
        expect(result).toContain('Assets');
        expect(result).toContain('Bank');
        expect(result).toContain('Checking');
        expect(result).toContain('Primary');
        expect(result).toContain('Joint');
    });

    it('escapes HTML in account names', () => {
        const result = formatAccount('Assets:<script>:Test');
        expect(result).toContain('&lt;script&gt;');
        expect(result).not.toContain('<script>');
    });
});
