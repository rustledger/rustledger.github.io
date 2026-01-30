// Transaction templates for quick insertion

/**
 * @typedef {Object} TransactionTemplate
 * @property {string} name - Display name
 * @property {string} description - Brief description
 * @property {string} template - Template text with ${placeholders}
 * @property {string[]} placeholders - Placeholder names in order
 */

/** @type {TransactionTemplate[]} */
export const templates = [
    {
        name: 'Basic Expense',
        description: 'Simple expense transaction',
        template: `\${date} * "\${payee}" "\${narration}"
  Expenses:\${category}  \${amount} \${currency}
  Assets:\${source}`,
        placeholders: ['date', 'payee', 'narration', 'category', 'amount', 'currency', 'source'],
    },
    {
        name: 'Income',
        description: 'Salary or income deposit',
        template: `\${date} * "\${employer}" "Salary"
  Assets:Bank:Checking  \${amount} \${currency}
  Income:Salary`,
        placeholders: ['date', 'employer', 'amount', 'currency'],
    },
    {
        name: 'Transfer',
        description: 'Transfer between accounts',
        template: `\${date} * "Transfer" "\${narration}"
  Assets:\${to_account}  \${amount} \${currency}
  Assets:\${from_account}`,
        placeholders: ['date', 'narration', 'to_account', 'amount', 'currency', 'from_account'],
    },
    {
        name: 'Credit Card Payment',
        description: 'Pay off credit card',
        template: `\${date} * "Credit Card" "Payment"
  Liabilities:CreditCard  \${amount} \${currency}
  Assets:Bank:Checking`,
        placeholders: ['date', 'amount', 'currency'],
    },
    {
        name: 'Opening Balance',
        description: 'Initial account balance',
        template: `\${date} * "Opening Balance"
  Assets:\${account}  \${amount} \${currency}
  Equity:OpeningBalances`,
        placeholders: ['date', 'account', 'amount', 'currency'],
    },
    {
        name: 'Balance Assertion',
        description: 'Assert account balance',
        template: `\${date} balance Assets:\${account}  \${amount} \${currency}`,
        placeholders: ['date', 'account', 'amount', 'currency'],
    },
    {
        name: 'Account Open',
        description: 'Open a new account',
        template: `\${date} open \${account}  \${currency}`,
        placeholders: ['date', 'account', 'currency'],
    },
    {
        name: 'Price Update',
        description: 'Update commodity price',
        template: `\${date} price \${commodity}  \${price} \${currency}`,
        placeholders: ['date', 'commodity', 'price', 'currency'],
    },
];

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get default values for placeholders
 * @returns {Record<string, string>}
 */
function getDefaultValues() {
    return {
        date: getTodayDate(),
        payee: 'Merchant',
        narration: '',
        category: 'Food',
        amount: '0.00',
        currency: 'USD',
        source: 'Bank:Checking',
        employer: 'Employer',
        to_account: 'Bank:Savings',
        from_account: 'Bank:Checking',
        account: 'Bank:Account',
        commodity: 'STOCK',
        price: '0.00',
    };
}

/**
 * Fill template with default values
 * @param {string} template
 * @returns {string}
 */
export function fillTemplateWithDefaults(template) {
    const defaults = getDefaultValues();
    return template.replace(/\$\{(\w+)\}/g, (_, key) => defaults[key] || key);
}

/**
 * Get the position of the first placeholder to select
 * @param {string} filledTemplate
 * @returns {{ start: number, end: number } | null}
 */
export function getFirstEditableRange(filledTemplate) {
    // Find the first default value that should be edited (payee, category, etc.)
    const editableDefaults = [
        'Merchant',
        'Employer',
        'Food',
        'Bank:Savings',
        'Bank:Checking',
        'Bank:Account',
        'STOCK',
        '0.00',
    ];

    for (const value of editableDefaults) {
        const idx = filledTemplate.indexOf(value);
        if (idx !== -1) {
            return { start: idx, end: idx + value.length };
        }
    }
    return null;
}

/**
 * @typedef {Object} TemplateState
 * @property {boolean} isOpen
 * @property {HTMLElement | null} dropdown
 */

/** @type {TemplateState} */
const state = {
    isOpen: false,
    dropdown: null,
};

/**
 * Create and show templates dropdown
 * @param {HTMLElement} anchor - Button element to anchor to
 * @param {(templateText: string, selectRange: { start: number, end: number } | null) => void} onSelect
 */
export function showTemplatesDropdown(anchor, onSelect) {
    // Remove existing dropdown
    hideTemplatesDropdown();

    const dropdown = document.createElement('div');
    dropdown.className = 'templates-dropdown';
    dropdown.setAttribute('role', 'menu');

    templates.forEach((template, index) => {
        const item = document.createElement('button');
        item.className = 'templates-dropdown-item';
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', index === 0 ? '0' : '-1');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'template-name';
        nameSpan.textContent = template.name;

        const descSpan = document.createElement('span');
        descSpan.className = 'template-desc';
        descSpan.textContent = template.description;

        item.appendChild(nameSpan);
        item.appendChild(descSpan);

        item.addEventListener('click', () => {
            const filled = fillTemplateWithDefaults(template.template);
            const selectRange = getFirstEditableRange(filled);
            onSelect(filled, selectRange);
            hideTemplatesDropdown();
        });

        dropdown.appendChild(item);
    });

    // Position dropdown below anchor
    const rect = anchor.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;

    document.body.appendChild(dropdown);
    state.dropdown = dropdown;
    state.isOpen = true;

    // Focus first item
    const firstItem = dropdown.querySelector('button');
    firstItem?.focus();

    // Close on click outside
    /** @param {MouseEvent} e */
    const closeHandler = (e) => {
        if (!dropdown.contains(/** @type {Node} */ (e.target)) && e.target !== anchor) {
            hideTemplatesDropdown();
            document.removeEventListener('click', closeHandler);
        }
    };
    // Delay to avoid immediate close
    setTimeout(() => document.addEventListener('click', closeHandler), 0);

    // Keyboard navigation
    dropdown.addEventListener('keydown', (e) => {
        const items = Array.from(dropdown.querySelectorAll('button'));
        const current = /** @type {HTMLButtonElement} */ (document.activeElement);
        const currentIndex = items.indexOf(current);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = items[(currentIndex + 1) % items.length];
            next?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = items[(currentIndex - 1 + items.length) % items.length];
            prev?.focus();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideTemplatesDropdown();
            anchor.focus();
        }
    });
}

/**
 * Hide templates dropdown
 */
export function hideTemplatesDropdown() {
    if (state.dropdown) {
        state.dropdown.remove();
        state.dropdown = null;
        state.isOpen = false;
    }
}

/**
 * Toggle templates dropdown
 * @param {HTMLElement} anchor
 * @param {(templateText: string, selectRange: { start: number, end: number } | null) => void} onSelect
 */
export function toggleTemplatesDropdown(anchor, onSelect) {
    if (state.isOpen) {
        hideTemplatesDropdown();
    } else {
        showTemplatesDropdown(anchor, onSelect);
    }
}
