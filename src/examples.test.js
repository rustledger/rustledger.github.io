import { describe, it, expect } from 'vitest';
import { examples, exampleNames, isLazyExample } from './examples.js';

describe('examples', () => {
    it('has all expected example names', () => {
        expect(exampleNames).toContain('budget');
        expect(exampleNames).toContain('stocks');
        expect(exampleNames).toContain('forex');
        expect(exampleNames).toContain('errors');
        expect(exampleNames).toContain('large-example');
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
        expect(isLazyExample('large-example')).toBe(true);
        expect(isLazyExample('budget')).toBe(false);
    });

    describe('budget example', () => {
        it('contains account opening directives', () => {
            expect(examples.budget).toContain('open Assets:');
            expect(examples.budget).toContain('open Expenses:');
            expect(examples.budget).toContain('open Income:');
        });

        it('contains multiple bank accounts', () => {
            expect(examples.budget).toContain('Assets:Bank:Chase');
            expect(examples.budget).toContain('Assets:Bank:Ally');
        });

        it('contains credit cards', () => {
            expect(examples.budget).toContain('Liabilities:CC:');
        });

        it('contains detailed expense categories', () => {
            expect(examples.budget).toContain('Expenses:Housing:');
            expect(examples.budget).toContain('Expenses:Food:');
            expect(examples.budget).toContain('Expenses:Subscriptions:');
        });

        it('contains transactions', () => {
            expect(examples.budget).toMatch(/\d{4}-\d{2}-\d{2} \*/);
        });

        it('contains balance assertions', () => {
            expect(examples.budget).toContain('balance Assets:');
        });
    });

    describe('stocks example', () => {
        it('contains brokerage accounts', () => {
            expect(examples.stocks).toContain('Assets:Schwab');
            expect(examples.stocks).toContain('Assets:IBKR');
        });

        it('contains investment-related income accounts', () => {
            expect(examples.stocks).toContain('Income:Dividends');
            expect(examples.stocks).toContain('Income:Capital-Gains');
        });

        it('uses implicit_prices plugin', () => {
            expect(examples.stocks).toContain('plugin "implicit_prices"');
        });

        it('contains commodity definitions', () => {
            expect(examples.stocks).toContain('commodity AAPL');
            expect(examples.stocks).toContain('commodity NVDA');
        });

        it('contains cost basis tracking', () => {
            expect(examples.stocks).toMatch(/\{[\d.]+ USD/);
        });

        it('contains dividend income', () => {
            expect(examples.stocks).toContain('Dividend');
        });

        it('contains capital gains tracking', () => {
            expect(examples.stocks).toContain('Capital-Gains');
        });
    });

    describe('forex example', () => {
        it('contains multiple currencies', () => {
            expect(examples.forex).toContain('commodity EUR');
            expect(examples.forex).toContain('commodity GBP');
            expect(examples.forex).toContain('commodity JPY');
        });

        it('contains forex-specific accounts', () => {
            expect(examples.forex).toContain('Assets:OANDA');
            expect(examples.forex).toContain('Income:Forex');
            expect(examples.forex).toContain('Expenses:Forex');
        });

        it('contains currency conversions with cost basis', () => {
            expect(examples.forex).toMatch(/\{[\d.]+ USD\}/);
        });

        it('contains forex gains/losses tracking', () => {
            expect(examples.forex).toContain('Income:Forex:Gains');
            expect(examples.forex).toContain('Expenses:Forex:Losses');
        });

        it('contains price directives', () => {
            expect(examples.forex).toMatch(/price EUR\s+[\d.]+ USD/);
        });
    });

    describe('errors example', () => {
        it('is designed to have errors', () => {
            expect(examples.errors).toContain('ERROR');
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
    it('contains exactly 5 examples', () => {
        expect(exampleNames.length).toBe(5);
    });

    it('has no duplicates', () => {
        const uniqueNames = new Set(exampleNames);
        expect(uniqueNames.size).toBe(exampleNames.length);
    });
});
