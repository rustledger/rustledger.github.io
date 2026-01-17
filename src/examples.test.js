import { describe, it, expect } from 'vitest';
import { examples, exampleNames, isLazyExample } from './examples.js';

describe('examples', () => {
    it('has all expected example names', () => {
        expect(exampleNames).toContain('simple');
        expect(exampleNames).toContain('stocks');
        expect(exampleNames).toContain('crypto');
        expect(exampleNames).toContain('travel');
        expect(exampleNames).toContain('business');
        expect(exampleNames).toContain('errors');
        expect(exampleNames).toContain('beancount-example');
    });

    it('has corresponding example content for each inline name', () => {
        for (const name of exampleNames) {
            if (isLazyExample(name)) continue; // Skip lazy examples
            expect(examples[name]).toBeDefined();
            expect(typeof examples[name]).toBe('string');
            expect(examples[name].length).toBeGreaterThan(0);
        }
    });

    it('identifies lazy examples correctly', () => {
        expect(isLazyExample('beancount-example')).toBe(true);
        expect(isLazyExample('simple')).toBe(false);
    });

    describe('simple example', () => {
        it('contains account opening directives', () => {
            expect(examples.simple).toContain('open Assets:');
            expect(examples.simple).toContain('open Expenses:');
            expect(examples.simple).toContain('open Income:');
        });

        it('contains transactions', () => {
            expect(examples.simple).toMatch(/\d{4}-\d{2}-\d{2} \*/);
        });

        it('contains balance assertions', () => {
            expect(examples.simple).toContain('balance Assets:');
        });
    });

    describe('stocks example', () => {
        it('contains investment-related accounts', () => {
            expect(examples.stocks).toContain('Brokerage');
            expect(examples.stocks).toContain('Dividends');
            expect(examples.stocks).toContain('Capital-Gains');
        });

        it('uses implicit_prices plugin', () => {
            expect(examples.stocks).toContain('plugin "implicit_prices"');
        });
    });

    describe('crypto example', () => {
        it('contains crypto-related accounts', () => {
            expect(examples.crypto).toContain('Coinbase');
            expect(examples.crypto).toContain('Ledger');
            expect(examples.crypto).toContain('Crypto');
        });

        it('contains fee tracking', () => {
            expect(examples.crypto).toContain('Fees:Trading');
            expect(examples.crypto).toContain('Fees:Network');
        });
    });

    describe('travel example', () => {
        it('contains travel expense categories', () => {
            expect(examples.travel).toContain('Travel:Flights');
            expect(examples.travel).toContain('Travel:Hotels');
            expect(examples.travel).toContain('Travel:Food');
            expect(examples.travel).toContain('Travel:Transport');
        });
    });

    describe('business example', () => {
        it('contains business-related accounts', () => {
            expect(examples.business).toContain('Business:Checking');
            expect(examples.business).toContain('Consulting');
            expect(examples.business).toContain('Taxes:Federal');
        });

        it('contains software and equipment expenses', () => {
            expect(examples.business).toContain('Expenses:Software');
            expect(examples.business).toContain('Expenses:Equipment');
        });
    });

    describe('errors example', () => {
        it('is designed to have errors', () => {
            expect(examples.errors).toContain('Error');
            expect(examples.errors).toContain("doesn't balance");
        });

        it('contains an invalid date', () => {
            expect(examples.errors).toContain('2024-13-01');
        });

        it('contains unopened account usage', () => {
            expect(examples.errors).toContain('Expenses:Coffee');
            expect(examples.errors).not.toContain('open Expenses:Coffee');
        });
    });
});

describe('exampleNames', () => {
    it('contains exactly 7 examples', () => {
        expect(exampleNames.length).toBe(7);
    });

    it('has no duplicates', () => {
        const uniqueNames = new Set(exampleNames);
        expect(uniqueNames.size).toBe(exampleNames.length);
    });
});
