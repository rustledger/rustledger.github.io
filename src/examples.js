// Example ledger files for the playground

/** @typedef {'simple' | 'stocks' | 'crypto' | 'travel' | 'business' | 'errors' | 'beancount-example'} ExampleName */

/** @type {Record<string, string>} */
const lazyExampleUrls = {
    'beancount-example': '/examples/beancount-example.beancount',
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
    simple: `; === Your First Month with Beancount ===
; Track where your money actually goes.
; Edit this file - changes validate instantly!

option "title" "January 2024"
plugin "noduplicates"

; Step 1: Open your accounts
2024-01-01 open Assets:BofA:Checking        USD
2024-01-01 open Assets:Venmo                USD
2024-01-01 open Liabilities:Amex            USD
2024-01-01 open Expenses:Rent               USD
2024-01-01 open Expenses:Food:Groceries     USD
2024-01-01 open Expenses:Food:Restaurants   USD
2024-01-01 open Expenses:Subscriptions      USD
2024-01-01 open Income:Salary               USD
2024-01-01 open Equity:Opening              USD

; Step 2: Starting balances (from your statements)
2024-01-01 * "Starting balance"
    Assets:BofA:Checking            4250.00 USD
    Assets:Venmo                     340.00 USD
    Liabilities:Amex               -1200.00 USD  ; you owe this
    Equity:Opening

; Step 3: Record transactions as they happen
2024-01-02 * "Landlord" "January rent"
    Expenses:Rent                   1800.00 USD
    Assets:BofA:Checking

2024-01-05 * "Spotify"
    Expenses:Subscriptions            10.99 USD
    Liabilities:Amex

2024-01-05 * "Netflix"
    Expenses:Subscriptions            15.99 USD
    Liabilities:Amex

2024-01-08 * "Trader Joe's"
    Expenses:Food:Groceries           67.34 USD
    Liabilities:Amex

2024-01-12 * "Chipotle" "Lunch with coworkers"
    Expenses:Food:Restaurants         14.50 USD
    Assets:Venmo

2024-01-15 * "Employer" "Paycheck - take home"
    Assets:BofA:Checking            3450.00 USD
    Income:Salary

2024-01-18 * "Pay Amex bill"
    Liabilities:Amex                1294.32 USD
    Assets:BofA:Checking

; Step 4: Reconcile with your statements
2024-01-31 balance Assets:BofA:Checking     4605.68 USD
2024-01-31 balance Liabilities:Amex            0.00 USD`,

    stocks: `; === Stock Portfolio Tracking ===
; Track investments, dividends, and gains

option "title" "Investment Portfolio"
option "operating_currency" "USD"
plugin "implicit_prices"
plugin "noduplicates"

2024-01-01 open Assets:Brokerage:Cash        USD
2024-01-01 open Assets:Brokerage:Stocks      USD
2024-01-01 open Income:Dividends             USD
2024-01-01 open Income:Capital-Gains         USD
2024-01-01 open Expenses:Fees                USD
2024-01-01 open Equity:Opening               USD

; Initial deposit
2024-01-02 * "Transfer" "Fund brokerage"
    Assets:Brokerage:Cash            10000.00 USD
    Equity:Opening

; Buy Apple shares (25 shares @ $185.50)
2024-01-15 * "Buy AAPL" "25 shares"
    Assets:Brokerage:Stocks           4637.50 USD
    Expenses:Fees                        4.95 USD
    Assets:Brokerage:Cash

; Buy VTI index fund (20 shares @ $240)
2024-01-15 * "Buy VTI" "20 shares"
    Assets:Brokerage:Stocks           4800.00 USD
    Assets:Brokerage:Cash

; Dividend received
2024-02-15 * "AAPL Dividend"
    Assets:Brokerage:Cash                6.00 USD
    Income:Dividends

; Sell Apple shares at a gain
2024-03-01 * "Sell AAPL" "10 shares @ $196"
    Assets:Brokerage:Cash             1960.00 USD
    Assets:Brokerage:Stocks          -1855.00 USD
    Income:Capital-Gains              -105.00 USD

2024-03-31 balance Assets:Brokerage:Cash    2523.55 USD
2024-03-31 balance Assets:Brokerage:Stocks  7582.50 USD`,

    crypto: `; === Cryptocurrency Portfolio ===
; Track crypto investments in USD value

option "title" "Crypto Holdings"
option "operating_currency" "USD"
plugin "implicit_prices"
plugin "noduplicates"

2024-01-01 open Assets:Coinbase:Cash        USD
2024-01-01 open Assets:Coinbase:Crypto      USD
2024-01-01 open Assets:Ledger:Crypto        USD
2024-01-01 open Expenses:Fees:Trading       USD
2024-01-01 open Expenses:Fees:Network       USD
2024-01-01 open Income:Capital-Gains        USD
2024-01-01 open Equity:Opening              USD

; Deposit USD
2024-01-05 * "ACH Transfer"
    Assets:Coinbase:Cash             5000.00 USD
    Equity:Opening

; Buy Bitcoin (0.05 BTC @ $42,500)
2024-01-10 * "Buy BTC" "0.05 BTC"
    Assets:Coinbase:Crypto           2125.00 USD
    Expenses:Fees:Trading              10.00 USD
    Assets:Coinbase:Cash

; Buy Ethereum (1 ETH @ $2,200)
2024-01-10 * "Buy ETH" "1 ETH"
    Assets:Coinbase:Crypto           2200.00 USD
    Expenses:Fees:Trading               5.50 USD
    Assets:Coinbase:Cash

; Transfer to hardware wallet
2024-01-20 * "Transfer to Ledger" "0.049 BTC"
    Assets:Ledger:Crypto             2082.75 USD
    Expenses:Fees:Network              42.50 USD
    Assets:Coinbase:Crypto

; Sell some ETH at profit
2024-03-01 * "Sell ETH" "0.5 ETH @ $3,200"
    Assets:Coinbase:Cash             1600.00 USD
    Assets:Coinbase:Crypto          -1100.00 USD
    Income:Capital-Gains             -500.00 USD

2024-03-31 balance Assets:Coinbase:Cash     2259.50 USD
2024-03-31 balance Assets:Coinbase:Crypto   1099.75 USD
2024-03-31 balance Assets:Ledger:Crypto     2082.75 USD`,

    travel: `; === Travel Expense Tracking ===
; Track trip expenses in USD

option "title" "Japan Trip 2024"
option "operating_currency" "USD"
plugin "noduplicates"
plugin "leafonly"

2024-01-01 open Assets:Checking             USD
2024-01-01 open Assets:Cash                 USD
2024-01-01 open Liabilities:CreditCard      USD
2024-01-01 open Expenses:Travel:Flights     USD
2024-01-01 open Expenses:Travel:Hotels      USD
2024-01-01 open Expenses:Travel:Food        USD
2024-01-01 open Expenses:Travel:Transport   USD
2024-01-01 open Expenses:Travel:Activities  USD
2024-01-01 open Equity:Opening              USD

; Book flights (2 months before)
2024-01-15 * "United Airlines" "SFO-NRT roundtrip"
    Expenses:Travel:Flights         1200.00 USD
    Liabilities:CreditCard

; Book hotel
2024-02-01 * "Shinjuku Hotel" "7 nights"
    Expenses:Travel:Hotels           980.00 USD
    Liabilities:CreditCard

; Withdraw cash for trip
2024-03-10 * "ATM Withdrawal" "Travel cash"
    Assets:Cash                     1000.00 USD
    Assets:Checking

; Daily expenses in Japan (converted to USD)
2024-03-15 * "Ramen shop" "Dinner in Shibuya"
    Expenses:Travel:Food               8.40 USD
    Assets:Cash

2024-03-15 * "JR Pass" "7-day rail pass"
    Expenses:Travel:Transport        207.55 USD
    Assets:Cash

2024-03-16 * "TeamLab" "Digital art museum"
    Expenses:Travel:Activities        22.40 USD
    Assets:Cash

2024-03-16 * "Sushi restaurant"
    Expenses:Travel:Food              31.50 USD
    Assets:Cash

2024-03-31 balance Assets:Cash              730.15 USD
2024-03-31 balance Liabilities:CreditCard -2180.00 USD`,

    business: `; === Freelance Business ===
; Track income, expenses, and quarterly taxes

option "title" "Freelance Consulting 2024"
option "operating_currency" "USD"
plugin "noduplicates"
plugin "leafonly"

2024-01-01 open Assets:Business:Checking    USD
2024-01-01 open Assets:Business:Savings     USD
2024-01-01 open Income:Consulting           USD
2024-01-01 open Income:Consulting:Acme      USD
2024-01-01 open Income:Consulting:TechCorp  USD
2024-01-01 open Expenses:Software           USD
2024-01-01 open Expenses:Equipment          USD
2024-01-01 open Expenses:Office             USD
2024-01-01 open Expenses:Taxes:Federal      USD
2024-01-01 open Expenses:Taxes:State        USD
2024-01-01 open Liabilities:Taxes:Federal   USD
2024-01-01 open Liabilities:Taxes:State     USD
2024-01-01 open Equity:Opening              USD

; Starting balance
2024-01-01 * "Opening balance"
    Assets:Business:Checking        5000.00 USD
    Equity:Opening

; January income
2024-01-15 * "Acme Corp" "January consulting"
    Assets:Business:Checking        8500.00 USD
    Income:Consulting:Acme

2024-01-30 * "TechCorp" "API integration project"
    Assets:Business:Checking        4200.00 USD
    Income:Consulting:TechCorp

; Business expenses
2024-01-05 * "GitHub" "Team subscription"
    Expenses:Software                 44.00 USD
    Assets:Business:Checking

2024-01-10 * "AWS" "Cloud hosting"
    Expenses:Software                156.00 USD
    Assets:Business:Checking

2024-01-20 * "Apple" "MacBook Pro"
    Expenses:Equipment             2499.00 USD
    Assets:Business:Checking

; Set aside for quarterly taxes (30%)
2024-01-31 * "Tax reserve Q1"
    Assets:Business:Savings         3810.00 USD
    Assets:Business:Checking

; Q1 estimated tax payment
2024-04-15 * "IRS" "Q1 estimated tax"
    Expenses:Taxes:Federal          2800.00 USD
    Assets:Business:Savings

2024-04-15 * "State FTB" "Q1 estimated tax"
    Expenses:Taxes:State             700.00 USD
    Assets:Business:Savings`,

    errors: `; === Example with Errors ===
; This file demonstrates error detection

option "title" "Error Examples"

2024-01-01 open Assets:Checking USD
2024-01-01 open Expenses:Food USD

; Error 1: Transaction doesn't balance
2024-01-15 * "Grocery Store"
    Expenses:Food        50.00 USD
    Assets:Checking     -45.00 USD

; Error 2: Account not opened
2024-01-20 * "Coffee Shop"
    Expenses:Coffee      5.00 USD
    Assets:Checking

; Error 3: Balance assertion fails
2024-01-31 balance Assets:Checking 1000.00 USD

; Error 4: Invalid date
2024-13-01 * "Invalid month"
    Expenses:Food       10.00 USD
    Assets:Checking`,
};

/** @type {ExampleName[]} */
export const exampleNames = [
    'simple',
    'stocks',
    'crypto',
    'travel',
    'business',
    'errors',
    'beancount-example',
];
