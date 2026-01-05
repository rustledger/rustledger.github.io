import { createEditor } from './editor.js';
import './style.css';
import LZString from 'lz-string';

// Global state
let editor = null;
let wasmReady = false;
let liveValidationTimeout = null;
let errorLines = new Set();
let errorMessages = new Map(); // Map<lineNumber, errorMessage> for tooltips
let knownAccounts = new Set(); // For autocomplete

// WASM functions (will be set after loading)
let validate_source = null;
let format = null;
let query = null;
let get_version = null;
let bql_completions = null;

// Example files
const examples = {
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
    Assets:Checking`
};

// Initialize WASM
async function initWasm() {
    try {
        const wasm = await import('/pkg/rustledger_wasm.js');
        await wasm.default();

        validate_source = wasm.validate_source;
        format = wasm.format;
        query = wasm.query;
        get_version = wasm.version;
        bql_completions = wasm.bql_completions;

        wasmReady = true;

        const version = get_version();
        const footerStatus = document.getElementById('footer-status');
        footerStatus.innerHTML = `<span class="text-green-400">✓ Ready</span> <span class="text-orange-400">(rustledger ${version})</span>`;
        footerStatus.className = 'text-xs';

        // Run initial validation
        liveValidate();

        // Show query tab and run default query
        showTab('query');
        runQueryPreset('BALANCES');
    } catch (e) {
        console.error('Failed to load WASM:', e);
        document.getElementById('footer-status').textContent = 'WASM failed to load';
    }
}

// Live validation
function liveValidate() {
    if (!wasmReady || !editor) return;

    const source = editor.getContent();
    const statusTab = document.getElementById('status-tab');

    try {
        const start = performance.now();
        const result = validate_source(source);
        const elapsed = (performance.now() - start).toFixed(1);

        errorLines.clear();
        errorMessages.clear();

        // Extract accounts for autocomplete
        extractAccounts(source);

        if (result.valid) {
            statusTab.textContent = '✓ Valid';
            statusTab.className = 'output-tab text-green-400' + (statusTab.classList.contains('active') ? ' active' : '');
            showOutput(`<span class="text-green-400">✓ No errors found</span> <span class="text-white/30">(${elapsed}ms)</span>`);
            // Clear error highlights
            if (editor && editor.highlightErrorLines) {
                editor.highlightErrorLines(new Set(), new Map());
            }
        } else {
            result.errors.forEach(e => {
                if (e.line) {
                    errorLines.add(e.line);
                    errorMessages.set(e.line, e.message);
                }
            });
            const errorCount = result.errors.length;
            statusTab.textContent = `✗ ${errorCount} error${errorCount > 1 ? 's' : ''}`;
            statusTab.className = 'output-tab text-red-400' + (statusTab.classList.contains('active') ? ' active' : '');

            const errorHtml = result.errors.map(e =>
                `<span class="text-red-400">Line ${e.line || '?'}:</span> ${escapeHtml(e.message)}`
            ).join('\n');
            showOutput(errorHtml + `\n<span class="text-white/30">(${elapsed}ms)</span>`);

            // Highlight error lines in editor with tooltips
            if (editor && editor.highlightErrorLines) {
                editor.highlightErrorLines(errorLines, errorMessages);
            }
        }

        // Update plugin button states
        updatePluginButtons();
    } catch (e) {
        statusTab.textContent = 'Error';
        console.error('Validation error:', e);
    }
}

// Extract accounts from source for autocomplete
function extractAccounts(source) {
    knownAccounts.clear();
    const accountRegex = /[A-Z][A-Za-z0-9-]*(?::[A-Za-z0-9-]+)+/g;
    let match;
    while ((match = accountRegex.exec(source)) !== null) {
        knownAccounts.add(match[0]);
    }
    // Update editor's known accounts for autocomplete
    if (editor && editor.setKnownAccounts) {
        editor.setKnownAccounts(knownAccounts);
    }
}

// Show output in output tab
function showOutput(html) {
    document.getElementById('output').innerHTML = html;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Editor content changed
function onEditorChange(content) {
    clearTimeout(liveValidationTimeout);
    liveValidationTimeout = setTimeout(() => {
        if (wasmReady) {
            liveValidate();
        }
    }, 300);
}

// Load example
window.loadExample = function(name) {
    if (!examples[name]) return;

    // Update active tab
    document.querySelectorAll('.example-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.example === name);
    });

    // Set editor content
    editor.setContent(examples[name]);

    // Validate and show query results
    if (wasmReady) {
        liveValidate();
        showTab('query');
        runQueryPreset('BALANCES');
    }
};

// Tab switching
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.output-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Show/hide option bars
    document.getElementById('query-input').classList.add('hidden');
    document.getElementById('query-options').classList.add('hidden');
    document.getElementById('plugin-options').classList.add('hidden');

    if (tabName === 'query') {
        document.getElementById('query-input').classList.remove('hidden');
        document.getElementById('query-options').classList.remove('hidden');
        updateQueryButtons();
    } else if (tabName === 'plugin') {
        document.getElementById('plugin-options').classList.remove('hidden');
        updatePluginButtons();
    }

    // Show corresponding content (plugin tab shows validation output)
    document.getElementById('output').classList.add('hidden');
    document.getElementById('query-output').classList.add('hidden');

    if (tabName === 'query') {
        document.getElementById('query-output').classList.remove('hidden');
    } else {
        // Both 'output' and 'plugin' tabs show the validation output
        document.getElementById('output').classList.remove('hidden');
    }
}

window.switchTab = showTab;

// Format code
window.runFormat = function() {
    if (!wasmReady || !editor) return;

    try {
        const start = performance.now();
        const result = format(editor.getContent());
        const elapsed = (performance.now() - start).toFixed(1);

        if (result.formatted) {
            editor.setContent(result.formatted);
            liveValidate();
        } else {
            showTab('output');
            const errors = result.errors.map(e =>
                `<span class="text-red-400">Line ${e.line || '?'}:</span> ${escapeHtml(e.message)}`
            ).join('\n');
            showOutput(errors);
        }
    } catch (e) {
        console.error('Format error:', e);
    }
};

// Validate BQL query and update input styling
let queryValidationTimeout = null;
function validateQueryInput() {
    const queryContainer = document.getElementById('query-input');
    const queryInput = document.getElementById('query-text');
    const currentQuery = queryInput.value.trim();

    // Clear previous timeout
    clearTimeout(queryValidationTimeout);

    // Empty query - neutral background
    if (!currentQuery) {
        queryContainer.style.backgroundColor = '';
        return;
    }

    // Debounce validation
    queryValidationTimeout = setTimeout(() => {
        if (!wasmReady || !editor) return;

        try {
            const result = query(editor.getContent(), currentQuery);
            if (result && result.errors && result.errors.length > 0) {
                // Invalid query - red tint
                queryContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            } else {
                // Valid query - green tint
                queryContainer.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
            }
        } catch (e) {
            // Error - red tint
            queryContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        }
    }, 150);
}

// BQL Autocomplete functionality
let autocompleteDropdown = null;
let autocompleteSelectedIndex = -1;
let autocompleteItems = [];
let autocompleteContext = null; // Store cursor position when autocomplete is shown

function createAutocompleteDropdown() {
    if (autocompleteDropdown) return;

    autocompleteDropdown = document.createElement('div');
    autocompleteDropdown.id = 'bql-autocomplete';
    autocompleteDropdown.className = 'absolute z-50 bg-zinc-900 border border-white/20 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden';
    autocompleteDropdown.style.minWidth = '200px';

    // Position it below the query input
    const queryContainer = document.getElementById('query-input');
    if (queryContainer) {
        queryContainer.style.position = 'relative';
        queryContainer.appendChild(autocompleteDropdown);
    }
}

function showAutocomplete(completions, filter = '') {
    if (!autocompleteDropdown) createAutocompleteDropdown();

    // Filter completions based on current partial input
    const lowerFilter = filter.toLowerCase();
    autocompleteItems = completions.filter(c =>
        c.text.toLowerCase().startsWith(lowerFilter)
    );

    if (autocompleteItems.length === 0) {
        hideAutocomplete();
        return;
    }

    autocompleteSelectedIndex = -1;

    // Category colors
    const categoryColors = {
        keyword: 'text-purple-400',
        function: 'text-yellow-400',
        column: 'text-cyan-400',
        operator: 'text-orange-400',
        literal: 'text-green-400'
    };

    autocompleteDropdown.innerHTML = autocompleteItems.map((item, idx) => `
        <div class="autocomplete-item px-3 py-2 cursor-pointer hover:bg-white/10 flex items-center gap-2 ${idx === autocompleteSelectedIndex ? 'bg-white/10' : ''}"
             data-index="${idx}">
            <span class="${categoryColors[item.category] || 'text-white'} font-mono text-sm">${escapeHtml(item.text)}</span>
            ${item.description ? `<span class="text-white/40 text-xs">${escapeHtml(item.description)}</span>` : ''}
        </div>
    `).join('');

    // Add click handlers
    autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.index);
            selectAutocompleteItem(idx);
        });
    });

    autocompleteDropdown.classList.remove('hidden');
}

function hideAutocomplete() {
    if (autocompleteDropdown) {
        autocompleteDropdown.classList.add('hidden');
    }
    autocompleteSelectedIndex = -1;
    autocompleteItems = [];
    autocompleteContext = null;
}

function selectAutocompleteItem(index) {
    if (index < 0 || index >= autocompleteItems.length) return;
    if (!autocompleteContext) return;

    const item = autocompleteItems[index];
    const queryInput = document.getElementById('query-text');

    // Use stored context (cursor position may have changed due to click)
    const { tokenStart, tokenEnd, value } = autocompleteContext;

    // Replace current token with completion
    const before = value.substring(0, tokenStart);
    const after = value.substring(tokenEnd);
    const completion = item.text;

    queryInput.value = before + completion + after;

    // Position cursor after completion
    const newPos = tokenStart + completion.length;
    queryInput.setSelectionRange(newPos, newPos);

    hideAutocomplete();
    validateQueryInput();
    queryInput.focus();
}

function updateAutocompleteSelection(direction) {
    if (autocompleteItems.length === 0) return;

    autocompleteSelectedIndex += direction;
    if (autocompleteSelectedIndex < 0) autocompleteSelectedIndex = autocompleteItems.length - 1;
    if (autocompleteSelectedIndex >= autocompleteItems.length) autocompleteSelectedIndex = 0;

    // Update visual selection
    autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach((el, idx) => {
        if (idx === autocompleteSelectedIndex) {
            el.classList.add('bg-white/10');
            el.scrollIntoView({ block: 'nearest' });
        } else {
            el.classList.remove('bg-white/10');
        }
    });
}

function handleQueryInputKeydown(e) {
    const isVisible = autocompleteDropdown && !autocompleteDropdown.classList.contains('hidden');

    if (isVisible) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateAutocompleteSelection(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateAutocompleteSelection(-1);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (autocompleteSelectedIndex >= 0) {
                e.preventDefault();
                selectAutocompleteItem(autocompleteSelectedIndex);
            } else if (autocompleteItems.length > 0 && e.key === 'Tab') {
                e.preventDefault();
                selectAutocompleteItem(0);
            } else if (e.key === 'Enter') {
                hideAutocomplete();
                // Let Enter run the query
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideAutocomplete();
        }
    } else if (e.key === 'Enter') {
        // Run query on Enter when autocomplete not visible
        runQueryFromInput();
    }
}

function handleQueryInput(e) {
    if (!wasmReady || !bql_completions) return;

    const queryInput = e.target;
    const value = queryInput.value;
    const cursorPos = queryInput.selectionStart;

    // Get completions from WASM
    const result = bql_completions(value, cursorPos);

    if (result && result.completions && result.completions.length > 0) {
        // Find current partial token for filtering
        let tokenStart = cursorPos;
        while (tokenStart > 0 && !value[tokenStart - 1].match(/[\s(),]/)) {
            tokenStart--;
        }
        // Find end of current token
        let tokenEnd = cursorPos;
        while (tokenEnd < value.length && !value[tokenEnd].match(/[\s(),]/)) {
            tokenEnd++;
        }
        const currentToken = value.substring(tokenStart, cursorPos);

        // Store context for when user selects an item (cursor position may change on click)
        autocompleteContext = { tokenStart, tokenEnd, value };

        showAutocomplete(result.completions, currentToken);
    } else {
        hideAutocomplete();
    }

    // Also validate
    validateQueryInput();
}

function initQueryAutocomplete() {
    const queryInput = document.getElementById('query-text');
    if (!queryInput) return;

    queryInput.addEventListener('input', handleQueryInput);
    queryInput.addEventListener('keydown', handleQueryInputKeydown);
    queryInput.addEventListener('blur', () => {
        // Delay hiding so click events can fire
        setTimeout(hideAutocomplete, 150);
    });
    queryInput.addEventListener('focus', handleQueryInput);

    createAutocompleteDropdown();
}

// Update query button styling based on current query
function updateQueryButtons() {
    const currentQuery = document.getElementById('query-text').value.trim();

    document.querySelectorAll('.query-btn').forEach(btn => {
        const btnQuery = btn.dataset.query;
        if (currentQuery === btnQuery) {
            btn.className = 'query-btn px-3 py-1 text-xs rounded transition bg-white/20 text-white hover:bg-white/30';
        } else {
            btn.className = 'query-btn px-3 py-1 text-xs rounded transition bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80';
        }
    });

    // Also validate the query
    validateQueryInput();
}
window.updateQueryButtons = updateQueryButtons;

// Query presets
window.runQueryPreset = function(queryStr) {
    if (!queryStr || !wasmReady) return;
    document.getElementById('query-text').value = queryStr;
    updateQueryButtons();
    runQuery(queryStr);
};

window.runQueryFromInput = function() {
    const queryStr = document.getElementById('query-text').value;
    if (queryStr) runQuery(queryStr);
};

function runQuery(queryStr) {
    if (!wasmReady || !editor) return;

    try {
        const start = performance.now();
        const result = query(editor.getContent(), queryStr);
        const elapsed = (performance.now() - start).toFixed(1);

        const queryOutput = document.getElementById('query-output');

        if (result.error) {
            queryOutput.innerHTML = `<span class="text-red-400">${escapeHtml(result.error)}</span>`;
        } else if (result.rows && result.rows.length > 0) {
            const headers = result.columns || Object.keys(result.rows[0]);
            let html = '<table class="w-full text-left">';
            html += '<thead><tr>' + headers.map(h => `<th class="px-2 py-1 text-white/50 border-b border-white/10">${escapeHtml(String(h))}</th>`).join('') + '</tr></thead>';
            html += '<tbody>';
            result.rows.forEach(row => {
                html += '<tr class="hover:bg-white/5">';
                // Handle both array and object row formats
                if (Array.isArray(row)) {
                    row.forEach(val => {
                        html += `<td class="px-2 py-1 border-b border-white/5">${formatCell(val)}</td>`;
                    });
                } else {
                    headers.forEach((h, i) => {
                        // Try both header name and index
                        const val = row[h] !== undefined ? row[h] : row[i];
                        html += `<td class="px-2 py-1 border-b border-white/5">${formatCell(val)}</td>`;
                    });
                }
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += `<div class="mt-2 text-xs text-white/30">${result.rows.length} rows in ${elapsed}ms</div>`;
            queryOutput.innerHTML = html;
        } else {
            queryOutput.innerHTML = `<span class="text-white/50">No results (${elapsed}ms)</span>`;
        }
    } catch (e) {
        document.getElementById('query-output').innerHTML = `<span class="text-red-400">${escapeHtml(e.toString())}</span>`;
    }
}

// Colorize account hierarchy parts
function formatAccount(account) {
    const parts = account.split(':');
    const colors = [
        'text-cyan-400',      // Root (Assets, Expenses, etc.)
        'text-teal-300',      // Level 1
        'text-emerald-300',   // Level 2
        'text-amber-300',     // Level 3
        'text-orange-300'     // Level 4+
    ];

    return parts.map((part, i) => {
        const colorClass = colors[Math.min(i, colors.length - 1)];
        const separator = i < parts.length - 1 ? '<span class="text-white/50">:</span>' : '';
        return `<span class="${colorClass}">${escapeHtml(part)}</span>${separator}`;
    }).join('');
}

function formatCell(cell) {
    if (cell === null || cell === undefined) return '<span class="text-white/30">-</span>';
    if (typeof cell === 'object') {
        // Handle Amount: { number, currency }
        if (cell.number !== undefined && cell.currency) {
            return `<span class="text-yellow-300">${cell.number}</span> <span class="text-orange-300">${cell.currency}</span>`;
        }
        // Handle Inventory: { positions: [{ units: { number, currency } }, ...] }
        if (cell.positions && Array.isArray(cell.positions)) {
            if (cell.positions.length === 0) {
                return '<span class="text-white/30">-</span>';
            }
            return cell.positions.map(p => {
                if (p.units && p.units.number !== undefined && p.units.currency) {
                    return `<span class="text-yellow-300">${p.units.number}</span> <span class="text-orange-300">${p.units.currency}</span>`;
                }
                return escapeHtml(JSON.stringify(p));
            }).join('<br>');
        }
        // Handle Position: { units: { number, currency }, cost: ... }
        if (cell.units && cell.units.number !== undefined && cell.units.currency) {
            let result = `<span class="text-yellow-300">${cell.units.number}</span> <span class="text-orange-300">${cell.units.currency}</span>`;
            if (cell.cost) {
                result += ` <span class="text-white/40">{${cell.cost.number} ${cell.cost.currency}}</span>`;
            }
            return result;
        }
        // Fallback: stringify
        const json = JSON.stringify(cell);
        if (json === '{}') {
            return '<span class="text-white/30">-</span>';
        }
        return escapeHtml(json);
    }
    // Check if it's an account string (matches Account:Path:Pattern)
    const str = String(cell);
    if (/^[A-Z][A-Za-z0-9-]*:[A-Za-z0-9-:]+$/.test(str)) {
        return formatAccount(str);
    }
    return escapeHtml(str);
}

// Get enabled plugins from content
function getEnabledPlugins(content) {
    const plugins = new Set();
    const regex = /^plugin\s+"([^"]+)"/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
        plugins.add(match[1]);
    }
    return plugins;
}

// Update plugin button styling based on enabled state
function updatePluginButtons() {
    if (!editor) return;
    const content = editor.getContent();
    const enabled = getEnabledPlugins(content);

    document.querySelectorAll('.plugin-btn').forEach(btn => {
        const plugin = btn.dataset.plugin;
        if (enabled.has(plugin)) {
            btn.className = 'plugin-btn px-3 py-1 text-xs rounded transition bg-green-900/50 text-green-300 hover:bg-green-800/50';
        } else {
            btn.className = 'plugin-btn px-3 py-1 text-xs rounded transition bg-red-900/30 text-red-300/70 hover:bg-red-800/40';
        }
    });
}

// Toggle plugin on/off
window.togglePlugin = function(pluginName) {
    if (!pluginName || !editor) return;

    const content = editor.getContent();
    const pluginLine = `plugin "${pluginName}"`;
    const regex = new RegExp(`^plugin\\s+"${pluginName}".*$`, 'm');

    if (regex.test(content)) {
        // Remove the plugin line
        const newContent = content.replace(regex, '').replace(/\n\n\n+/g, '\n\n').trim();
        editor.setContent(newContent);
    } else {
        // Add plugin after options/at the start
        const lines = content.split('\n');
        let insertIndex = 0;

        // Find where to insert (after options and other plugins)
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('option ') || lines[i].startsWith('plugin ')) {
                insertIndex = i + 1;
            } else if (lines[i].trim() && !lines[i].startsWith(';')) {
                break;
            }
        }

        lines.splice(insertIndex, 0, pluginLine);
        editor.setContent(lines.join('\n'));
    }

    updatePluginButtons();
    if (wasmReady) {
        liveValidate();
    }
};

// Copy output
window.copyOutput = function() {
    const activeOutput = document.querySelector('#output-panel > :not(.hidden)');
    if (activeOutput) {
        navigator.clipboard.writeText(activeOutput.textContent);
        showToast('Copied!');
    }
};

// Share URL with lz-string compression
window.shareUrl = function() {
    if (!editor) return;
    const content = editor.getContent();
    // Use lz-string for efficient compression
    const compressed = LZString.compressToEncodedURIComponent(content);
    const url = `${window.location.origin}${window.location.pathname}?code=${compressed}`;
    navigator.clipboard.writeText(url);
    showToast('URL copied to clipboard!');
};

// Copy install commands
window.copyInstall = function(type) {
    const commands = {
        curl: 'curl -sSf https://rustledger.github.io/install.sh | sh',
        cargo: 'cargo install rustledger'
    };
    navigator.clipboard.writeText(commands[type] || '');
};

// Download ledger file
window.downloadLedger = function() {
    if (!editor) return;
    const content = editor.getContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledger.beancount';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Upload ledger file
window.uploadLedger = function(event) {
    const file = event.target.files[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        editor.setContent(e.target.result);
        // Clear example tab selection
        document.querySelectorAll('.example-tab').forEach(t => t.classList.remove('active'));
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
};

// Panel resizer
function initResizer() {
    const resizer = document.getElementById('resizer');
    const editorPanel = document.getElementById('editor-panel');
    const outputPanel = document.getElementById('output-panel');

    if (!resizer || !editorPanel || !outputPanel) return;

    let startY, startEditorHeight, startOutputHeight;

    resizer.addEventListener('mousedown', (e) => {
        startY = e.clientY;
        startEditorHeight = editorPanel.offsetHeight;
        startOutputHeight = outputPanel.offsetHeight;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });

    function onMouseMove(e) {
        const delta = e.clientY - startY;
        const newEditorHeight = Math.max(100, startEditorHeight + delta);
        const newOutputHeight = Math.max(80, startOutputHeight - delta);
        editorPanel.style.height = newEditorHeight + 'px';
        outputPanel.style.height = newOutputHeight + 'px';
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

// Load from URL (supports both lz-string and legacy base64 formats)
function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
        try {
            // Try lz-string first (new format)
            let decoded = LZString.decompressFromEncodedURIComponent(code);

            // Fallback to legacy base64 format
            if (!decoded) {
                decoded = decodeURIComponent(atob(code));
            }

            if (decoded) {
                editor.setContent(decoded);
                // Clear all example tabs
                document.querySelectorAll('.example-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
            }
        } catch (e) {
            console.error('Failed to decode URL:', e);
        }
    }
}

// Fetch GitHub stars
async function fetchGitHubStars() {
    const starsEl = document.getElementById('github-stars');
    if (!starsEl) return;

    try {
        const response = await fetch('https://api.github.com/repos/rustledger/rustledger');
        const data = await response.json();
        if (data.stargazers_count !== undefined) {
            const stars = data.stargazers_count;
            starsEl.textContent = stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars;
        }
    } catch (e) {
        starsEl.textContent = '-';
    }
}

// Animate stats on scroll
function initStatsAnimation() {
    const statsSection = document.getElementById('stats-section');
    if (!statsSection) return;

    const animateValue = (el, start, end, duration, suffix = '') => {
        const startTime = performance.now();
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeOut);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('[data-animate-stat]').forEach(el => {
                    const value = parseInt(el.dataset.animateStat);
                    const suffix = el.dataset.suffix || '';
                    animateValue(el, 0, value, 1000, suffix);
                });
                observer.disconnect();
            }
        });
    }, { threshold: 0.5 });

    observer.observe(statsSection);
}

// Scroll reveal animation
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Also trigger stagger-children if present
                const staggerContainer = entry.target.querySelector('.stagger-children');
                if (staggerContainer) {
                    staggerContainer.classList.add('visible');
                }
                // Check if the reveal element itself has stagger-children
                if (entry.target.querySelector('.stagger-children')) {
                    entry.target.querySelectorAll('.stagger-children').forEach(el => {
                        el.classList.add('visible');
                    });
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

// Toast notification
function showToast(message, duration = 2000) {
    // Remove existing toast
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg text-sm z-50 animate-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('animate-toast-out');
        setTimeout(() => toast.remove(), 200);
    }, duration);
}

// Make toast available globally for inline onclick handlers
window.showToast = showToast;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Create CodeMirror editor
    const container = document.getElementById('editor-panel');
    editor = createEditor(container, examples.simple, onEditorChange);

    // Initialize resizer
    initResizer();

    // Initialize query autocomplete
    initQueryAutocomplete();

    // Load WASM
    initWasm();

    // Check URL for shared code
    loadFromUrl();

    // Fetch GitHub stars
    fetchGitHubStars();

    // Initialize stats animation
    initStatsAnimation();

    // Initialize scroll reveal animations
    initScrollReveal();

    // Set initial active states
    document.querySelector('.example-tab[data-example="simple"]')?.classList.add('active');
    document.querySelector('.output-tab[data-tab="output"]')?.classList.add('active');
});
