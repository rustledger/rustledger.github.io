// Account Tree visualization - hierarchical account view with balances
import { executeQuery, isWasmReady } from './wasm.js';
import { escapeHtml } from './utils.js';

/**
 * @typedef {Object} AccountNode
 * @property {string} name - Short name (last segment)
 * @property {string} fullPath - Full account path
 * @property {number} balance - Direct balance for this account
 * @property {number} totalBalance - Rollup balance including children
 * @property {string} currency - Primary currency
 * @property {Map<string, AccountNode>} children - Child accounts
 * @property {boolean} expanded - Whether node is expanded
 */

/** @type {ReturnType<typeof setTimeout> | null} */
let updateTimeout = null;

/** @type {number} */
let treeVersion = 0;

/** @type {Map<string, boolean>} Track expanded state across updates */
const expandedState = new Map();

// Account type colors matching charts.js
const accountColors = {
    Assets: '#22d3ee', // cyan
    Liabilities: '#f87171', // red
    Income: '#4ade80', // green
    Expenses: '#fbbf24', // amber
    Equity: '#a78bfa', // purple
};

/**
 * Get color for an account based on its type
 * @param {string} account
 * @returns {string}
 */
function getAccountColor(account) {
    for (const [type, color] of Object.entries(accountColors)) {
        if (account.startsWith(type)) {
            return color;
        }
    }
    return '#94a3b8'; // gray fallback
}

/**
 * Parse balance value from various formats
 * The WASM returns balance as an object: { number, currency } or { positions: [...] }
 * @param {unknown} value
 * @returns {{ amount: number, currency: string }}
 */
function parseBalance(value) {
    if (typeof value === 'number') {
        return { amount: value, currency: '' };
    }
    if (typeof value === 'object' && value !== null) {
        const obj = /** @type {Record<string, unknown>} */ (value);

        // Amount format: { number: 123.45, currency: "USD" }
        if (obj.number !== undefined && obj.currency) {
            return {
                amount: Number(obj.number) || 0,
                currency: String(obj.currency),
            };
        }

        // Inventory format: { positions: [{ units: { number, currency }, cost? }, ...] }
        if (obj.positions && Array.isArray(obj.positions)) {
            // Sum up all positions (simplified - just takes first currency)
            let total = 0;
            let currency = '';
            for (const pos of obj.positions) {
                const posObj = /** @type {Record<string, unknown>} */ (pos);
                const units = /** @type {Record<string, unknown> | undefined} */ (posObj.units);
                if (units && units.number !== undefined) {
                    total += Number(units.number) || 0;
                    if (!currency && units.currency) {
                        currency = String(units.currency);
                    }
                }
            }
            return { amount: total, currency };
        }
    }
    if (typeof value === 'string') {
        // Extract number and currency from string like "1234.56 USD" or "-500 EUR"
        const match = value.match(/^(-?[\d,]+\.?\d*)\s*(\w*)$/);
        if (match) {
            return {
                amount: parseFloat(match[1].replace(/,/g, '')),
                currency: match[2] || '',
            };
        }
    }
    return { amount: 0, currency: '' };
}

/**
 * Format balance for display
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
function formatBalance(amount, currency) {
    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return currency ? `${formatted} ${currency}` : formatted;
}

/**
 * Build tree structure from account balances
 * @param {Array<{account: string, balance: {amount: number, currency: string}}>} accounts
 * @returns {Map<string, AccountNode>}
 */
function buildAccountTree(accounts) {
    /** @type {Map<string, AccountNode>} */
    const rootNodes = new Map();

    for (const { account, balance } of accounts) {
        const parts = account.split(':');
        let currentMap = rootNodes;
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            currentPath = currentPath ? `${currentPath}:${part}` : part;
            const isLeaf = i === parts.length - 1;

            if (!currentMap.has(part)) {
                // Check if this path was previously expanded
                const wasExpanded = expandedState.get(currentPath);

                currentMap.set(part, {
                    name: part,
                    fullPath: currentPath,
                    balance: 0,
                    totalBalance: 0,
                    currency: balance.currency,
                    children: new Map(),
                    // Default: start all collapsed (unless user previously expanded)
                    expanded: wasExpanded !== undefined ? wasExpanded : false,
                });
            }

            const node = currentMap.get(part);
            if (!node) continue;

            if (isLeaf) {
                node.balance = balance.amount;
                node.currency = balance.currency;
            }

            currentMap = node.children;
        }
    }

    // Calculate rollup totals (sum of self + children)
    calculateRollups(rootNodes);

    return rootNodes;
}

/**
 * Calculate rollup totals for tree nodes
 * @param {Map<string, AccountNode>} nodes
 * @returns {number}
 */
function calculateRollups(nodes) {
    let total = 0;

    for (const node of nodes.values()) {
        const childrenTotal = calculateRollups(node.children);
        node.totalBalance = node.balance + childrenTotal;
        total += node.totalBalance;
    }

    return total;
}

/**
 * Render account tree node
 * @param {AccountNode} node
 * @param {number} depth
 * @returns {string}
 */
function renderNode(node, depth) {
    const hasChildren = node.children.size > 0;
    const indent = depth * 20;
    const color = getAccountColor(node.fullPath);
    const displayBalance = hasChildren && node.children.size > 0 ? node.totalBalance : node.balance;
    const isPositive = displayBalance >= 0;

    // For rollup display, show both if different
    let balanceDisplay = formatBalance(displayBalance, node.currency);
    if (hasChildren && node.balance !== 0 && node.balance !== node.totalBalance) {
        balanceDisplay = `${formatBalance(node.totalBalance, node.currency)}`;
    }

    const expandIcon = hasChildren
        ? node.expanded
            ? '<span class="tree-expand">▼</span>'
            : '<span class="tree-expand">▶</span>'
        : '<span class="tree-expand-placeholder"></span>';

    let html = `
        <div class="account-tree-item ${hasChildren ? 'has-children' : ''} ${node.expanded ? 'expanded' : ''}"
             style="padding-left: ${indent + 8}px"
             data-path="${escapeHtml(node.fullPath)}"
             role="treeitem"
             aria-expanded="${node.expanded}"
             tabindex="0">
            ${expandIcon}
            <span class="account-tree-icon" style="color: ${color}">●</span>
            <span class="account-tree-name">${escapeHtml(node.name)}</span>
            <span class="account-tree-balance ${isPositive ? 'positive' : 'negative'}">
                ${balanceDisplay}
            </span>
        </div>
    `;

    // Render children if expanded
    if (hasChildren && node.expanded) {
        html += '<div class="account-tree-children">';
        for (const child of node.children.values()) {
            html += renderNode(child, depth + 1);
        }
        html += '</div>';
    }

    return html;
}

/**
 * Render account tree
 * @param {Map<string, AccountNode>} tree
 * @param {HTMLElement} container
 */
function renderTree(tree, container) {
    if (tree.size === 0) {
        container.innerHTML = '<div class="account-tree-empty">No accounts found</div>';
        return;
    }

    // Sort root nodes: Assets, Liabilities, Equity, Income, Expenses, then others
    const order = ['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'];
    const sorted = [...tree.entries()].sort((a, b) => {
        const aIdx = order.indexOf(a[0]);
        const bIdx = order.indexOf(b[0]);
        if (aIdx === -1 && bIdx === -1) return a[0].localeCompare(b[0]);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
    });

    let html = '<div class="account-tree-wrapper">';
    for (const [, node] of sorted) {
        html += renderNode(node, 0);
    }
    html += '</div>';

    container.innerHTML = html;

    // Add event handlers for expand/collapse
    container.querySelectorAll('.account-tree-item.has-children').forEach((el) => {
        const item = /** @type {HTMLElement} */ (el);
        const path = item.dataset.path || '';

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNode(path, container);
        });

        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleNode(path, container);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                expandNode(path, container);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                collapseNode(path, container);
            }
        });
    });
}

/**
 * Toggle node expansion
 * @param {string} path
 * @param {HTMLElement} container
 */
function toggleNode(path, container) {
    const isExpanded = expandedState.get(path);
    expandedState.set(path, !isExpanded);

    // Re-render (in real app would update DOM surgically)
    const item = container.querySelector(`[data-path="${path}"]`);
    if (item) {
        // Toggle classes
        item.classList.toggle('expanded');
        item.setAttribute('aria-expanded', String(!isExpanded));

        // Update icon
        const icon = item.querySelector('.tree-expand');
        if (icon) {
            icon.textContent = !isExpanded ? '▼' : '▶';
        }

        // Toggle children container visibility
        const children = item.nextElementSibling;
        if (children && children.classList.contains('account-tree-children')) {
            children.classList.toggle('hidden', isExpanded);
        } else if (!isExpanded) {
            // Need to re-render to show children
            triggerRerender(container);
        }
    }
}

/**
 * Expand a node
 * @param {string} path
 * @param {HTMLElement} container
 */
function expandNode(path, container) {
    if (!expandedState.get(path)) {
        expandedState.set(path, true);
        triggerRerender(container);
    }
}

/**
 * Collapse a node
 * @param {string} path
 * @param {HTMLElement} container
 */
function collapseNode(path, container) {
    if (expandedState.get(path)) {
        expandedState.set(path, false);
        triggerRerender(container);
    }
}

/** @type {(() => string) | null} */
let currentGetSource = null;

/**
 * Trigger a re-render with current data
 * @param {HTMLElement} container
 */
function triggerRerender(container) {
    if (currentGetSource) {
        updateAccountTree(currentGetSource(), container);
    }
}

/**
 * Query account balances from ledger
 * @param {string} source
 * @returns {Promise<Array<{account: string, balance: {amount: number, currency: string}}>>}
 */
async function queryAccountBalances(source) {
    if (!isWasmReady()) return [];

    try {
        const result = await executeQuery(source, 'BALANCES');
        if (!result || result.error || !result.rows || result.rows.length === 0) {
            return [];
        }

        // BALANCES returns: account, balance (or similar columns)
        // Handle both array and object row formats
        const accounts = [];
        const columns = result.columns || [];

        for (const row of result.rows) {
            let account = '';
            /** @type {unknown} */
            let balanceVal = 0;

            if (Array.isArray(row)) {
                // Find account and balance columns by index or name
                const accIdx = columns.indexOf('account');
                const balIdx =
                    columns.indexOf('balance') !== -1
                        ? columns.indexOf('balance')
                        : columns.indexOf('sum_position');

                account = String(row[accIdx !== -1 ? accIdx : 0] || '');
                balanceVal = row[balIdx !== -1 ? balIdx : 1];
            } else {
                // Object format - cast to record type for property access
                const rowObj = /** @type {Record<string, unknown>} */ (row);
                account = String(rowObj.account || rowObj[0] || '');
                balanceVal = rowObj.balance || rowObj.sum_position || rowObj[1] || 0;
            }

            if (account) {
                accounts.push({
                    account,
                    balance: parseBalance(balanceVal),
                });
            }
        }

        return accounts;
    } catch (err) {
        console.error('Account tree query error:', err);
        return [];
    }
}

/**
 * Update account tree (debounced)
 * @param {string} source
 * @param {HTMLElement} container
 */
export async function updateAccountTree(source, container) {
    // Debounce updates
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    const currentVersion = ++treeVersion;

    updateTimeout = setTimeout(async () => {
        // Show loading state
        container.innerHTML = '<div class="account-tree-loading">Loading accounts...</div>';

        const accounts = await queryAccountBalances(source);

        // Check if this is still the latest request
        if (currentVersion !== treeVersion) return;

        if (accounts.length > 0) {
            const tree = buildAccountTree(accounts);
            renderTree(tree, container);
        } else {
            container.innerHTML = '<div class="account-tree-empty">No accounts found</div>';
        }
    }, 300);
}

/**
 * Initialize account tree panel
 * @param {HTMLElement} container
 * @param {() => string} getSource
 */
export function initAccountTree(container, getSource) {
    currentGetSource = getSource;

    // Always update when tab is shown (content may have changed)
    updateAccountTree(getSource(), container);
}

/**
 * Clear account tree state (for cleanup)
 */
export function clearAccountTree() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
    }
    treeVersion = 0;
    currentGetSource = null;
    // Don't clear expandedState to preserve user preferences across sessions
}

/**
 * Expand all nodes
 * @param {HTMLElement} container
 */
export function expandAll(container) {
    container.querySelectorAll('.account-tree-item.has-children').forEach((el) => {
        const item = /** @type {HTMLElement} */ (el);
        const path = item.dataset.path || '';
        expandedState.set(path, true);
    });
    triggerRerender(container);
}

/**
 * Collapse all nodes
 * @param {HTMLElement} container
 */
export function collapseAll(container) {
    expandedState.clear();
    triggerRerender(container);
}
