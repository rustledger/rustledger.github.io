// Example ledger files for the playground

/** @typedef {'budget' | 'stocks' | 'forex' | 'errors' | 'large-example'} ExampleName */

/** @type {Record<string, string>} */
const lazyExampleUrls = {
    'large-example': '/examples/beancount-example.beancount',
};

/** @type {Map<string, string>} */
const lazyExampleCache = new Map();

/** @type {Map<string, Promise<string>>} */
const pendingFetches = new Map();

/**
 * Check if an example needs to be lazy loaded
 * @param {ExampleName} name
 * @returns {boolean}
 */
export function isLazyExample(name) {
    return name in lazyExampleUrls;
}

/**
 * Get an example (sync for inline, returns null for unloaded lazy examples)
 * @param {ExampleName} name
 * @returns {string | null}
 */
export function getExample(name) {
    if (name in examples) {
        return examples[name];
    }
    return lazyExampleCache.get(name) ?? null;
}

/**
 * Load a lazy example
 * @param {ExampleName} name
 * @returns {Promise<string>}
 */
export async function loadLazyExample(name) {
    // Return cached if available
    const cached = lazyExampleCache.get(name);
    if (cached) return cached;

    // Return pending fetch if in progress
    const pending = pendingFetches.get(name);
    if (pending) return pending;

    const url = lazyExampleUrls[name];
    if (!url) {
        throw new Error(`Unknown lazy example: ${name}`);
    }

    const fetchPromise = fetch(url)
        .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch ${name}`);
            return res.text();
        })
        .then((text) => {
            lazyExampleCache.set(name, text);
            pendingFetches.delete(name);
            return text;
        })
        .catch((err) => {
            pendingFetches.delete(name);
            throw err;
        });

    pendingFetches.set(name, fetchPromise);
    return fetchPromise;
}

/**
 * Preload all lazy examples in the background
 */
export function preloadLazyExamples() {
    for (const name of Object.keys(lazyExampleUrls)) {
        loadLazyExample(/** @type {ExampleName} */ (name)).catch(() => {
            // Silently ignore preload failures
        });
    }
}

/** @type {Record<string, string>} */
export const examples = {
    budget: `; ══════════════════════════════════════════════════════════════════
; PERSONAL FINANCE - Full Year Budget Tracking
; ══════════════════════════════════════════════════════════════════
; A comprehensive personal budget with multiple accounts, credit cards,
; detailed expense categorization, and income from multiple sources.

option "title" "Personal Finance 2024"
option "operating_currency" "USD"
plugin "noduplicates"

; ─────────────────────────────────────────────────────────────────
; ACCOUNT HIERARCHY
; ─────────────────────────────────────────────────────────────────

; Banking
2024-01-01 open Assets:Bank:Chase:Checking            USD
2024-01-01 open Assets:Bank:Chase:Savings             USD
2024-01-01 open Assets:Bank:Ally:HYSA                 USD
2024-01-01 open Assets:Venmo                          USD
2024-01-01 open Assets:Cash                           USD

; Retirement & Investment
2024-01-01 open Assets:Vanguard:401k                  USD
2024-01-01 open Assets:Vanguard:Roth-IRA              USD

; Credit Cards
2024-01-01 open Liabilities:CC:Chase-Sapphire         USD
2024-01-01 open Liabilities:CC:Amex-Gold              USD
2024-01-01 open Liabilities:CC:Apple-Card             USD

; Income Sources
2024-01-01 open Income:Salary:Gross                   USD
2024-01-01 open Income:Side-Hustle                    USD
2024-01-01 open Income:Interest                       USD
2024-01-01 open Income:Cashback                       USD

; Housing
2024-01-01 open Expenses:Housing:Rent                 USD
2024-01-01 open Expenses:Housing:Utilities:Electric   USD
2024-01-01 open Expenses:Housing:Utilities:Gas        USD
2024-01-01 open Expenses:Housing:Utilities:Water      USD
2024-01-01 open Expenses:Housing:Internet             USD

; Transportation
2024-01-01 open Expenses:Transport:Gas                USD
2024-01-01 open Expenses:Transport:Rideshare          USD

; Food & Dining
2024-01-01 open Expenses:Food:Groceries               USD
2024-01-01 open Expenses:Food:Restaurants             USD
2024-01-01 open Expenses:Food:Coffee                  USD
2024-01-01 open Expenses:Food:Delivery                USD

; Subscriptions & Services
2024-01-01 open Expenses:Subscriptions:Streaming      USD
2024-01-01 open Expenses:Subscriptions:Software       USD
2024-01-01 open Expenses:Subscriptions:News           USD
2024-01-01 open Expenses:Subscriptions:Gym            USD
2024-01-01 open Expenses:Phone                        USD

; Taxes
2024-01-01 open Expenses:Taxes:Federal                USD
2024-01-01 open Expenses:Taxes:State                  USD
2024-01-01 open Expenses:Taxes:FICA                   USD

2024-01-01 open Equity:Opening-Balances               USD

; ─────────────────────────────────────────────────────────────────
; OPENING BALANCES
; ─────────────────────────────────────────────────────────────────

2024-01-01 * "Opening Balances"
    Assets:Bank:Chase:Checking             8542.30 USD
    Assets:Bank:Chase:Savings             15000.00 USD
    Assets:Bank:Ally:HYSA                 25000.00 USD
    Assets:Venmo                            340.00 USD
    Assets:Cash                             180.00 USD
    Assets:Vanguard:401k                  87500.00 USD
    Assets:Vanguard:Roth-IRA              32000.00 USD
    Liabilities:CC:Chase-Sapphire         -1847.23 USD
    Liabilities:CC:Amex-Gold               -523.10 USD
    Equity:Opening-Balances

; ─────────────────────────────────────────────────────────────────
; JANUARY 2024 - RECURRING & DAILY TRANSACTIONS
; ─────────────────────────────────────────────────────────────────

; Rent payment
2024-01-01 * "Property Management" "January rent" #recurring
    Expenses:Housing:Rent                  2100.00 USD
    Assets:Bank:Chase:Checking

; Subscriptions (auto-pay)
2024-01-01 * "Netflix" #subscription
    Expenses:Subscriptions:Streaming         15.99 USD
    Liabilities:CC:Apple-Card

2024-01-01 * "Spotify" #subscription
    Expenses:Subscriptions:Streaming         10.99 USD
    Liabilities:CC:Apple-Card

2024-01-01 * "NYTimes" #subscription
    Expenses:Subscriptions:News              17.00 USD
    Liabilities:CC:Chase-Sapphire

; Gas fillup
2024-01-03 * "Shell" "Gas fillup"
    Expenses:Transport:Gas                   58.42 USD
    Liabilities:CC:Chase-Sapphire

; Utilities
2024-01-05 * "PG&E" "Electric bill" #utilities
    Expenses:Housing:Utilities:Electric      87.43 USD
    Liabilities:CC:Chase-Sapphire

2024-01-05 * "PG&E" "Gas bill" #utilities
    Expenses:Housing:Utilities:Gas           42.18 USD
    Liabilities:CC:Chase-Sapphire

2024-01-05 * "Equinox" "Gym membership" #subscription
    Expenses:Subscriptions:Gym              185.00 USD
    Liabilities:CC:Amex-Gold

; Groceries
2024-01-06 * "Whole Foods" "Weekly groceries"
    Expenses:Food:Groceries                 127.43 USD
    Liabilities:CC:Amex-Gold

2024-01-07 * "1Password" "Annual subscription" #subscription
    Expenses:Subscriptions:Software          35.88 USD
    Liabilities:CC:Apple-Card

; Water bill
2024-01-08 * "EBMUD" "Water bill" #utilities
    Expenses:Housing:Utilities:Water         38.50 USD
    Assets:Bank:Chase:Checking

2024-01-08 * "Blue Bottle Coffee"
    Expenses:Food:Coffee                      6.50 USD
    Liabilities:CC:Apple-Card

; Uber ride
2024-01-09 * "Uber" "Airport ride"
    Expenses:Transport:Rideshare             47.80 USD
    Liabilities:CC:Chase-Sapphire

; Internet
2024-01-10 * "Comcast" "Internet" #recurring
    Expenses:Housing:Internet                79.99 USD
    Liabilities:CC:Chase-Sapphire

; Lunch
2024-01-11 * "Chipotle" "Lunch"
    Expenses:Food:Restaurants                14.75 USD
    Liabilities:CC:Chase-Sapphire

; Phone bill
2024-01-12 * "T-Mobile" "Phone bill" #recurring
    Expenses:Phone                           85.00 USD
    Liabilities:CC:Chase-Sapphire

; Groceries
2024-01-13 * "Trader Joe's" "Weekly groceries"
    Expenses:Food:Groceries                  89.67 USD
    Liabilities:CC:Amex-Gold

; Dinner
2024-01-14 * "Nobu" "Dinner with friends" #social
    Expenses:Food:Restaurants                87.00 USD
    Liabilities:CC:Amex-Gold

; First paycheck of January (net after deductions)
2024-01-15 * "Employer" "Bi-weekly paycheck" #payroll
    Assets:Bank:Chase:Checking             4127.84 USD
    Expenses:Taxes:Federal                 1245.00 USD
    Expenses:Taxes:State                    412.50 USD
    Expenses:Taxes:FICA                     589.66 USD
    Assets:Vanguard:401k                    625.00 USD
    Income:Salary:Gross                   -7000.00 USD

; Food delivery
2024-01-17 * "DoorDash" "Late night delivery"
    Expenses:Food:Delivery                   32.47 USD
    Liabilities:CC:Chase-Sapphire

; Pay credit cards (pay off old balance)
2024-01-20 * "Chase" "Pay Sapphire balance"
    Liabilities:CC:Chase-Sapphire          1847.23 USD
    Assets:Bank:Chase:Checking

; Groceries
2024-01-20 * "Safeway" "Weekly groceries"
    Expenses:Food:Groceries                 104.22 USD
    Liabilities:CC:Amex-Gold

; Pay Amex
2024-01-22 * "Amex" "Pay Gold card balance"
    Liabilities:CC:Amex-Gold                523.10 USD
    Assets:Bank:Chase:Checking

; Side income
2024-01-25 * "Freelance Client" "Website project"
    Assets:Venmo                            850.00 USD
    Income:Side-Hustle

; Second paycheck
2024-01-31 * "Employer" "Bi-weekly paycheck" #payroll
    Assets:Bank:Chase:Checking             4127.84 USD
    Expenses:Taxes:Federal                 1245.00 USD
    Expenses:Taxes:State                    412.50 USD
    Expenses:Taxes:FICA                     589.66 USD
    Assets:Vanguard:401k                    625.00 USD
    Income:Salary:Gross                   -7000.00 USD

; Interest earned
2024-01-31 * "Ally Bank" "HYSA Interest"
    Assets:Bank:Ally:HYSA                    89.17 USD
    Income:Interest

; Credit card cashback
2024-01-31 * "Chase" "Sapphire rewards redemption"
    Assets:Bank:Chase:Checking               47.50 USD
    Income:Cashback

; Transfer to savings
2024-01-31 * "Transfer to HYSA"
    Assets:Bank:Ally:HYSA                  1000.00 USD
    Assets:Bank:Chase:Checking

; ─────────────────────────────────────────────────────────────────
; JANUARY BALANCE CHECKS (checked at start of Feb 1)
; ─────────────────────────────────────────────────────────────────

2024-02-01 balance Assets:Bank:Chase:Checking    11336.65 USD
2024-02-01 balance Assets:Bank:Ally:HYSA         26089.17 USD
2024-02-01 balance Assets:Vanguard:401k          88750.00 USD
2024-02-01 balance Assets:Venmo                   1190.00 USD`,

    stocks: `; ══════════════════════════════════════════════════════════════════
; INVESTMENT PORTFOLIO - Stocks & Options Trading
; ══════════════════════════════════════════════════════════════════
; Track stock purchases, sales, dividends, and options trading
; with proper cost basis and capital gains tracking.

option "title" "Trading Portfolio 2024"
option "operating_currency" "USD"
plugin "implicit_prices"
plugin "noduplicates"

; ─────────────────────────────────────────────────────────────────
; COMMODITIES (Securities)
; ─────────────────────────────────────────────────────────────────

2024-01-01 commodity AAPL
    name: "Apple Inc."

2024-01-01 commodity NVDA
    name: "NVIDIA Corporation"

2024-01-01 commodity SPY
    name: "SPDR S&P 500 ETF"

2024-01-01 commodity MSFT
    name: "Microsoft Corporation"

2024-01-01 commodity TSLA
    name: "Tesla Inc."

; ─────────────────────────────────────────────────────────────────
; ACCOUNTS
; ─────────────────────────────────────────────────────────────────

2024-01-01 open Assets:Schwab:Cash                    USD
2024-01-01 open Assets:Schwab:AAPL                    AAPL
2024-01-01 open Assets:Schwab:NVDA                    NVDA
2024-01-01 open Assets:Schwab:SPY                     SPY
2024-01-01 open Assets:Schwab:MSFT                    MSFT

2024-01-01 open Assets:IBKR:Cash                      USD
2024-01-01 open Assets:IBKR:TSLA                      TSLA

2024-01-01 open Income:Dividends                      USD
2024-01-01 open Income:Capital-Gains:Short-Term       USD
2024-01-01 open Income:Capital-Gains:Long-Term        USD

2024-01-01 open Expenses:Fees:Commission              USD

2024-01-01 open Equity:Opening                        USD

; ─────────────────────────────────────────────────────────────────
; OPENING POSITIONS
; ─────────────────────────────────────────────────────────────────

2024-01-02 * "Opening balances"
    Assets:Schwab:Cash                    50000.00 USD
    Assets:IBKR:Cash                      25000.00 USD
    Equity:Opening

; Existing AAPL position (100 shares @ $142.50, purchased last year)
2024-01-02 * "Transfer in AAPL" "Long-term holding"
    Assets:Schwab:AAPL                         100 AAPL {142.50 USD, 2023-03-15}
    Equity:Opening                        -14250.00 USD

; Existing SPY position (50 shares @ $423.00)
2024-01-02 * "Transfer in SPY" "Index fund holding"
    Assets:Schwab:SPY                           50 SPY {423.00 USD, 2023-06-01}
    Equity:Opening                        -21150.00 USD

; ─────────────────────────────────────────────────────────────────
; JANUARY - STOCK TRADES
; ─────────────────────────────────────────────────────────────────

; Buy NVDA before earnings (50 shares @ $547.20)
2024-01-18 * "Buy NVDA" "50 shares"
    Assets:Schwab:NVDA                          50 NVDA {547.20 USD}
    Assets:Schwab:Cash                     -27360.00 USD

; Buy MSFT on dip (30 shares @ $397.50)
2024-01-22 * "Buy MSFT" "30 shares"
    Assets:Schwab:MSFT                          30 MSFT {397.50 USD}
    Assets:Schwab:Cash                     -11925.00 USD

; Sell 25 AAPL at profit (long-term gain)
2024-01-25 * "Sell AAPL" "25 shares @ $194.50"
    Assets:Schwab:AAPL                         -25 AAPL {142.50 USD, 2023-03-15}
    Assets:Schwab:Cash                       4862.50 USD
    Income:Capital-Gains:Long-Term          -1300.00 USD

; ─────────────────────────────────────────────────────────────────
; DIVIDENDS
; ─────────────────────────────────────────────────────────────────

; AAPL quarterly dividend (75 remaining shares @ $0.24)
2024-01-25 * "AAPL Dividend" "Q1 2024"
    Assets:Schwab:Cash                         18.00 USD
    Income:Dividends                          -18.00 USD

; SPY monthly dividend (50 shares @ $0.52)
2024-01-31 * "SPY Dividend" "January 2024"
    Assets:Schwab:Cash                         26.00 USD
    Income:Dividends                          -26.00 USD

; ─────────────────────────────────────────────────────────────────
; IBKR - Buy TSLA
; ─────────────────────────────────────────────────────────────────

; Buy TSLA (100 shares @ $182.50)
2024-01-26 * "Buy TSLA" "100 shares"
    Assets:IBKR:TSLA                          100 TSLA {182.50 USD}
    Assets:IBKR:Cash                      -18250.00 USD

; ─────────────────────────────────────────────────────────────────
; PRICES (End of January)
; ─────────────────────────────────────────────────────────────────

2024-01-31 price AAPL                          188.50 USD
2024-01-31 price NVDA                          615.27 USD
2024-01-31 price SPY                           483.05 USD
2024-01-31 price MSFT                          408.00 USD
2024-01-31 price TSLA                          187.29 USD

; ─────────────────────────────────────────────────────────────────
; BALANCE ASSERTIONS (checked at start of Feb 1)
; ─────────────────────────────────────────────────────────────────

2024-02-01 balance Assets:Schwab:Cash        15621.50 USD
2024-02-01 balance Assets:Schwab:AAPL              75 AAPL
2024-02-01 balance Assets:Schwab:NVDA              50 NVDA
2024-02-01 balance Assets:Schwab:SPY               50 SPY
2024-02-01 balance Assets:Schwab:MSFT              30 MSFT
2024-02-01 balance Assets:IBKR:TSLA              100 TSLA
2024-02-01 balance Assets:IBKR:Cash            6750.00 USD`,

    forex: `; ══════════════════════════════════════════════════════════════════
; FOREX TRADING - Multi-Currency Portfolio
; ══════════════════════════════════════════════════════════════════
; Track forex positions, currency conversions, and trading P&L
; across multiple currency pairs.

option "title" "Forex Trading Account 2024"
option "operating_currency" "USD"
plugin "implicit_prices"
plugin "noduplicates"

; ─────────────────────────────────────────────────────────────────
; CURRENCIES
; ─────────────────────────────────────────────────────────────────

2024-01-01 commodity USD
    name: "US Dollar"

2024-01-01 commodity EUR
    name: "Euro"

2024-01-01 commodity GBP
    name: "British Pound"

2024-01-01 commodity JPY
    name: "Japanese Yen"

2024-01-01 commodity CHF
    name: "Swiss Franc"

; ─────────────────────────────────────────────────────────────────
; ACCOUNTS
; ─────────────────────────────────────────────────────────────────

; Multi-currency cash accounts
2024-01-01 open Assets:OANDA:USD                      USD
2024-01-01 open Assets:OANDA:EUR                      EUR
2024-01-01 open Assets:OANDA:GBP                      GBP
2024-01-01 open Assets:OANDA:JPY                      JPY

; Income & Expenses
2024-01-01 open Income:Forex:Gains                    USD
2024-01-01 open Expenses:Forex:Losses                 USD
2024-01-01 open Expenses:Forex:Fees                   USD

; Bank account for deposits
2024-01-01 open Assets:Bank:USD                       USD
2024-01-01 open Equity:Opening                        USD

; ─────────────────────────────────────────────────────────────────
; OPENING PRICES
; ─────────────────────────────────────────────────────────────────

2024-01-02 price EUR    1.0950 USD
2024-01-02 price GBP    1.2720 USD
2024-01-02 price JPY    0.00685 USD
2024-01-02 price CHF    1.1850 USD

; ─────────────────────────────────────────────────────────────────
; ACCOUNT FUNDING
; ─────────────────────────────────────────────────────────────────

2024-01-02 * "Fund trading account"
    Assets:OANDA:USD                       50000.00 USD
    Assets:Bank:USD                       -50000.00 USD

; ─────────────────────────────────────────────────────────────────
; CURRENCY CONVERSIONS
; ─────────────────────────────────────────────────────────────────

; Convert USD to EUR (buy 10,000 EUR)
2024-01-03 * "Buy EUR/USD" "10000 EUR at 1.0950"
    Assets:OANDA:EUR                       10000.00 EUR {1.0950 USD}
    Assets:OANDA:USD                      -10950.00 USD

; Convert USD to GBP (buy 5,000 GBP)
2024-01-03 * "Buy GBP/USD" "5000 GBP at 1.2720"
    Assets:OANDA:GBP                        5000.00 GBP {1.2720 USD}
    Assets:OANDA:USD                       -6360.00 USD

; Convert USD to JPY (buy 1,000,000 JPY)
2024-01-05 * "Buy USD/JPY" "1000000 JPY at 0.00685"
    Assets:OANDA:JPY                     1000000.00 JPY {0.00685 USD}
    Assets:OANDA:USD                       -6850.00 USD

; ─────────────────────────────────────────────────────────────────
; FOREX TRADES
; ─────────────────────────────────────────────────────────────────

; Sell half EUR position at profit (EUR strengthened)
2024-01-15 * "Sell EUR/USD" "5000 EUR at 1.1025"
    Assets:OANDA:EUR                       -5000.00 EUR {1.0950 USD}
    Assets:OANDA:USD                        5512.50 USD
    Income:Forex:Gains                       -37.50 USD

; Sell GBP at slight loss (GBP weakened)
2024-01-20 * "Sell GBP/USD" "2500 GBP at 1.2650"
    Assets:OANDA:GBP                       -2500.00 GBP {1.2720 USD}
    Assets:OANDA:USD                        3162.50 USD
    Expenses:Forex:Losses                     17.50 USD

; Sell some JPY at profit
2024-01-25 * "Sell USD/JPY" "500000 JPY at 0.00700"
    Assets:OANDA:JPY                     -500000.00 JPY {0.00685 USD}
    Assets:OANDA:USD                        3500.00 USD
    Income:Forex:Gains                       -75.00 USD

; Trading fee
2024-01-31 * "OANDA" "Monthly platform fee"
    Expenses:Forex:Fees                       25.00 USD
    Assets:OANDA:USD

; ─────────────────────────────────────────────────────────────────
; END OF MONTH PRICES
; ─────────────────────────────────────────────────────────────────

2024-01-31 price EUR    1.0815 USD
2024-01-31 price GBP    1.2695 USD
2024-01-31 price JPY    0.006803 USD
2024-01-31 price CHF    1.1720 USD

; ─────────────────────────────────────────────────────────────────
; BALANCE ASSERTIONS
; ─────────────────────────────────────────────────────────────────

2024-02-01 balance Assets:OANDA:USD        37990.00 USD
2024-02-01 balance Assets:OANDA:EUR         5000.00 EUR
2024-02-01 balance Assets:OANDA:GBP         2500.00 GBP
2024-02-01 balance Assets:OANDA:JPY       500000.00 JPY`,

    errors: `; ══════════════════════════════════════════════════════════════════
; ERROR EXAMPLES - Demonstrating Validation
; ══════════════════════════════════════════════════════════════════
; This file contains intentional errors to demonstrate the parser's
; error detection capabilities. Each error is labeled.

option "title" "Error Examples"

2024-01-01 open Assets:Checking USD
2024-01-01 open Expenses:Food USD

; ─────────────────────────────────────────────────────────────────
; ERROR 1: Transaction doesn't balance
; The debits and credits don't sum to zero
; ─────────────────────────────────────────────────────────────────
2024-01-15 * "Grocery Store"
    Expenses:Food        50.00 USD
    Assets:Checking     -45.00 USD

; ─────────────────────────────────────────────────────────────────
; ERROR 2: Account not opened
; Using an account that was never declared with 'open'
; ─────────────────────────────────────────────────────────────────
2024-01-20 * "Coffee Shop"
    Expenses:Coffee      5.00 USD
    Assets:Checking

; ─────────────────────────────────────────────────────────────────
; ERROR 3: Balance assertion fails
; The expected balance doesn't match the calculated balance
; ─────────────────────────────────────────────────────────────────
2024-01-31 balance Assets:Checking 1000.00 USD

; ─────────────────────────────────────────────────────────────────
; ERROR 4: Invalid date
; Month 13 doesn't exist
; ─────────────────────────────────────────────────────────────────
2024-13-01 * "Invalid month"
    Expenses:Food       10.00 USD
    Assets:Checking`,
};

/** @type {ExampleName[]} */
export const exampleNames = ['budget', 'stocks', 'forex', 'errors', 'large-example'];
