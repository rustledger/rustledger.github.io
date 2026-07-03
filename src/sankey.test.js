import { describe, expect, it } from 'vitest';
import { parseAmount } from './sankey.js';

// Wire numbers are exact-decimal STRINGS ("12.00"); the JOURNAL position
// column is a Position ({ units }), which pre-fix parsed to 0 and left the
// flows/Sankey view empty (the budget-tab regression).
describe('parseAmount wire shapes', () => {
    it('Amount object', () => {
        expect(parseAmount({ number: '12.50', currency: 'USD' })).toBe(12.5);
    });
    it('Position object (JOURNAL position column)', () => {
        expect(parseAmount({ units: { number: '-42.00', currency: 'USD' } })).toBe(-42);
    });
    it('Inventory object sums positions', () => {
        expect(
            parseAmount({
                positions: [
                    { units: { number: '10.00', currency: 'USD' } },
                    { units: { number: '5.50', currency: 'USD' } },
                ],
            })
        ).toBe(15.5);
    });
    it('null and unknown shapes are 0', () => {
        expect(parseAmount(null)).toBe(0);
        expect(parseAmount({ weird: true })).toBe(0);
    });
});
