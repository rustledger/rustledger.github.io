// Query presets configuration

/**
 * @typedef {Object} QueryPreset
 * @property {string} label - Display label for the button
 * @property {string} query - BQL query string
 * @property {string} ariaLabel - Accessibility label
 */

/** @type {QueryPreset[]} */
export const queryPresets = [
    // Basic queries
    {
        label: 'Balances',
        query: 'BALANCES',
        ariaLabel: 'Show account balances',
    },
    {
        label: 'Journal',
        query: 'JOURNAL "Assets"',
        ariaLabel: 'Show asset journal entries',
    },
    {
        label: 'Print',
        query: 'PRINT',
        ariaLabel: 'Print all transactions',
    },
    // Account type filters
    {
        label: 'Expenses',
        query: 'SELECT account, SUM(position) WHERE account ~ "Expenses" GROUP BY account ORDER BY SUM(position) DESC',
        ariaLabel: 'Show expenses grouped by account',
    },
    {
        label: 'Income',
        query: 'SELECT account, SUM(position) WHERE account ~ "Income" GROUP BY account',
        ariaLabel: 'Show income grouped by account',
    },
    {
        label: 'Assets',
        query: 'SELECT account, SUM(position) WHERE account ~ "Assets" GROUP BY account',
        ariaLabel: 'Show assets grouped by account',
    },
    // Aggregations
    {
        label: 'By Account',
        query: 'SELECT account, SUM(position) GROUP BY account ORDER BY account',
        ariaLabel: 'Totals grouped by account',
    },
    {
        label: 'Top Expenses',
        query: 'SELECT narration, SUM(position) WHERE account ~ "Expenses" GROUP BY narration ORDER BY SUM(position) DESC LIMIT 10',
        ariaLabel: 'Top 10 expense categories',
    },
    {
        label: 'By Payee',
        query: 'SELECT payee, SUM(position) WHERE account ~ "Expenses" GROUP BY payee ORDER BY SUM(position) DESC',
        ariaLabel: 'Expenses grouped by payee',
    },
    {
        label: 'Monthly',
        query: 'SELECT YEAR(date), MONTH(date), account, SUM(position) WHERE account ~ "Expenses" GROUP BY YEAR(date), MONTH(date), account ORDER BY YEAR(date), MONTH(date)',
        ariaLabel: 'Monthly expense breakdown',
    },
    // Detail views
    {
        label: 'Recent',
        query: 'SELECT date, payee, narration, account, position ORDER BY date DESC LIMIT 20',
        ariaLabel: 'Recent 20 transactions',
    },
    {
        label: 'Ledger',
        query: 'SELECT date, account, position, balance ORDER BY date, account',
        ariaLabel: 'Full ledger with running balances',
    },
    // Analysis
    {
        label: 'Large',
        query: 'SELECT date, narration, account, position WHERE number(position) > 500 ORDER BY date DESC',
        ariaLabel: 'Transactions over 500',
    },
    {
        label: 'Liabilities',
        query: 'SELECT * WHERE account ~ "Liabilities"',
        ariaLabel: 'Show liability transactions',
    },
    {
        label: 'Payees',
        query: 'SELECT DISTINCT payee ORDER BY payee',
        ariaLabel: 'List all unique payees',
    },
];

/** @type {string[]} */
export const plugins = [
    'implicit_prices',
    'auto_accounts',
    'check_commodity',
    'auto_tag',
    'leafonly',
    'noduplicates',
    'onecommodity',
    'unique_prices',
    'check_closing',
    'close_tree',
    'coherent_cost',
    'sellgains',
    'pedantic',
    'unrealized',
];
