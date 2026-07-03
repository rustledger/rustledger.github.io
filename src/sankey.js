// Sankey diagram for money flow visualization
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { executeQuery, isWasmReady } from './wasm.js';

/**
 * @typedef {Object} SankeyNode
 * @property {string} name - Account name
 * @property {string} fullPath - Full account path
 * @property {string} category - Account category (Assets, Expenses, etc.)
 * @property {number} [x0] - Left position
 * @property {number} [x1] - Right position
 * @property {number} [y0] - Top position
 * @property {number} [y1] - Bottom position
 * @property {number} [value] - Total value
 * @property {number} [index] - Node index
 */

/**
 * @typedef {Object} SankeyLink
 * @property {SankeyNode | number | string} source - Source node, index, or fullPath
 * @property {SankeyNode | number | string} target - Target node, index, or fullPath
 * @property {number} value - Flow value (may be scaled for visibility)
 * @property {number} [originalValue] - Original unscaled value for tooltips
 * @property {number} [width] - Link width
 * @property {number} [y0] - Source y position
 * @property {number} [y1] - Target y position
 */

/** @type {ReturnType<typeof setTimeout> | null} */
let updateTimeout = null;

/** @type {number} */
let sankeyVersion = 0;

// Category colors
/** @type {Record<string, string>} */
const categoryColors = {
    Income: '#4ade80', // green
    Assets: '#22d3ee', // cyan
    Expenses: '#fbbf24', // amber
    Liabilities: '#f87171', // red
    Equity: '#a78bfa', // purple
};

/**
 * Get color for an account category
 * @param {string} category
 * @returns {string}
 */
function getCategoryColor(category) {
    return categoryColors[category] || '#94a3b8';
}

/**
 * Get category from account path
 * @param {string} account
 * @returns {string}
 */
function getCategory(account) {
    const firstPart = account.split(':')[0];
    return firstPart || 'Other';
}

/**
 * Parse amount from WASM format (preserves sign for flow direction)
 * @param {unknown} value
 * @returns {number}
 */
export function parseAmount(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'object' && value !== null) {
        const obj = /** @type {Record<string, unknown>} */ (value);
        if (obj.number !== undefined) {
            return Number(obj.number) || 0;
        }
        // Position: { units: { number, currency }, cost? } — the shape the
        // JOURNAL `position` column carries (numbers are exact-decimal
        // STRINGS on the wire, hence Number()). Without this branch every
        // posting parsed to 0 and the flows/Sankey view rendered empty.
        if (obj.units && typeof obj.units === 'object') {
            const units = /** @type {Record<string, unknown>} */ (obj.units);
            if (units.number !== undefined) {
                return Number(units.number) || 0;
            }
        }
        if (obj.positions && Array.isArray(obj.positions)) {
            let total = 0;
            for (const pos of obj.positions) {
                const posObj = /** @type {Record<string, unknown>} */ (pos);
                const units = /** @type {Record<string, unknown> | undefined} */ (posObj.units);
                if (units && units.number !== undefined) {
                    total += Number(units.number) || 0;
                }
            }
            return total;
        }
    }
    if (typeof value === 'string') {
        const match = value.match(/(-?[\d,]+\.?\d*)/);
        if (match) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
    }
    return 0;
}

/**
 * Query transaction flows from ledger
 * @param {string} source - Ledger source
 * @param {number} depth - Account hierarchy depth (1-3)
 * @returns {Promise<{nodes: SankeyNode[], links: SankeyLink[]}>}
 */
async function queryFlows(source, depth = 2) {
    if (!isWasmReady()) return { nodes: [], links: [] };

    try {
        // Query all postings to get account flows
        // Use PRINT to get all transactions with their postings
        const result = await executeQuery(source, 'JOURNAL');
        if (!result || result.error || !result.rows || result.rows.length === 0) {
            return { nodes: [], links: [] };
        }

        // JOURNAL returns: date, flag, payee, narration, account, position, balance
        // Group by transaction (same date+payee+narration) to find flows
        /** @type {Map<string, Array<{account: string, amount: number}>>} */
        const transactions = new Map();

        const columns = result.columns || [];
        const dateIdx = columns.indexOf('date');
        const payeeIdx = columns.indexOf('payee');
        const narrationIdx = columns.indexOf('narration');
        const accountIdx = columns.indexOf('account');
        const positionIdx = columns.indexOf('position');

        for (const row of result.rows) {
            if (!Array.isArray(row)) continue;

            const date = String(row[dateIdx !== -1 ? dateIdx : 0] || '');
            const payee = String(row[payeeIdx !== -1 ? payeeIdx : 2] || '');
            const narration = String(row[narrationIdx !== -1 ? narrationIdx : 3] || '');
            const account = String(row[accountIdx !== -1 ? accountIdx : 4] || '');
            const position = row[positionIdx !== -1 ? positionIdx : 5];

            if (!account || !date) continue;

            const txKey = `${date}|${payee}|${narration}`;
            const amount = parseAmount(position);

            if (amount === 0) continue;

            if (!transactions.has(txKey)) {
                transactions.set(txKey, []);
            }
            transactions.get(txKey)?.push({ account, amount });
        }

        // Build flow links: from source accounts (negative postings) to target accounts (positive postings)
        // In double-entry: money flows FROM accounts with negative postings TO accounts with positive postings
        /** @type {Map<string, number>} */
        const flowMap = new Map();

        /** @type {Set<string>} */
        const nodeSet = new Set();

        for (const postings of transactions.values()) {
            // Skip transactions involving Equity (opening balances, retained earnings)
            // These are bookkeeping entries, not real money flows
            const hasEquity = postings.some((p) => getCategory(p.account) === 'Equity');
            if (hasEquity) continue;

            // Use posting SIGNS to determine flow direction (not account categories)
            // Negative posting = money leaving that account (source)
            // Positive posting = money entering that account (target)
            //
            // Examples:
            // - Salary: Income:-5000, Assets:+5000 → Income → Assets
            // - Groceries: Assets:-50, Expenses:+50 → Assets → Expenses
            // - Credit card purchase: Liabilities:-50, Expenses:+50 → Liabilities → Expenses
            // - Pay off credit card: Assets:-500, Liabilities:+500 → Assets → Liabilities
            // - Transfer: Assets:A:-1000, Assets:B:+1000 → Assets:A → Assets:B

            const sources = postings.filter((p) => p.amount < 0); // Money leaving
            const targets = postings.filter((p) => p.amount > 0); // Money arriving

            for (const src of sources) {
                for (const tgt of targets) {
                    // Skip Liabilities as sources (credit card purchases)
                    // This keeps Liabilities on the RIGHT as payment destinations only
                    if (getCategory(src.account) === 'Liabilities') continue;

                    // Skip same-category flows (e.g., Asset transfers between banks)
                    // These create diagonal lines within the same column and don't show meaningful flow
                    const srcCat = getCategory(src.account);
                    const tgtCat = getCategory(tgt.account);
                    if (srcCat === tgtCat) continue;

                    const srcAccount = truncateAccount(src.account, depth);
                    const tgtAccount = truncateAccount(tgt.account, depth);

                    if (srcAccount === tgtAccount) continue;

                    nodeSet.add(srcAccount);
                    nodeSet.add(tgtAccount);

                    // Use minimum of the two amounts as flow value
                    const flowValue = Math.min(Math.abs(src.amount), Math.abs(tgt.amount));
                    if (flowValue > 0) {
                        const linkKey = `${srcAccount}→${tgtAccount}`;
                        flowMap.set(linkKey, (flowMap.get(linkKey) || 0) + flowValue);
                    }
                }
            }
        }

        // Net out bidirectional flows to prevent cycles
        // If A→B has 5000 and B→A has 100, keep only A→B with 4900
        /** @type {Map<string, number>} */
        const nettedFlows = new Map();
        const processedPairs = new Set();

        for (const key of flowMap.keys()) {
            const [src, tgt] = key.split('→');
            const pairKey = [src, tgt].sort().join('|');

            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);

            const forwardKey = `${src}→${tgt}`;
            const reverseKey = `${tgt}→${src}`;
            const forwardValue = flowMap.get(forwardKey) || 0;
            const reverseValue = flowMap.get(reverseKey) || 0;

            const netValue = forwardValue - reverseValue;
            if (netValue > 0) {
                nettedFlows.set(forwardKey, netValue);
            } else if (netValue < 0) {
                nettedFlows.set(reverseKey, -netValue);
            }
            // If netValue === 0, flows cancel out completely
        }

        // Build links first, then filter nodes to only those with links
        // (netting can remove flows, leaving orphan nodes that crash d3-sankey)
        /** @type {SankeyLink[]} */
        const links = [];
        for (const [key, value] of nettedFlows) {
            const [src, tgt] = key.split('→');
            if (nodeSet.has(src) && nodeSet.has(tgt) && src !== tgt) {
                links.push({
                    source: src,
                    target: tgt,
                    value,
                    originalValue: value, // Preserve for tooltips
                });
            }
        }

        // Only include nodes that have at least one link
        const linkedNodes = new Set();
        for (const link of links) {
            linkedNodes.add(link.source);
            linkedNodes.add(link.target);
        }

        /** @type {SankeyNode[]} */
        const nodes = Array.from(linkedNodes).map((name) => ({
            name: String(name).split(':').slice(-1)[0], // Short name for display
            fullPath: String(name),
            category: getCategory(String(name)),
        }));

        // Apply minimum value floor so small flows remain visible
        // Use 3% of max value as floor - ensures thin flows are at least readable
        // See: https://talk.observablehq.com/t/scaling-sankey-nodes-and-links-to-balance-small-nodes/2969
        if (links.length > 0) {
            const maxValue = Math.max(...links.map((l) => l.value));
            const minValue = maxValue * 0.03; // 3% floor
            for (const link of links) {
                link.value = Math.max(minValue, link.value);
            }
        }

        return { nodes, links };
    } catch (err) {
        console.error('Sankey query error:', err);
        return { nodes: [], links: [] };
    }
}

/**
 * Truncate account path to specified depth
 * @param {string} account
 * @param {number} depth - 0 means use full path (leafs)
 * @returns {string}
 */
function truncateAccount(account, depth) {
    if (depth === 0) {
        return account; // Leafs: use full account path
    }
    const parts = account.split(':');
    return parts.slice(0, depth).join(':');
}

/**
 * Format currency value
 * @param {number} value
 * @returns {string}
 */
function formatValue(value) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

/**
 * Custom node alignment for accounting Sankey
 * Places nodes in columns by category, scaled to the graph's depth range:
 * - Column 0 (LEFT): Income
 * - Column middle (CENTER): Assets
 * - Column max (RIGHT): Expenses, Liabilities
 *
 * The second parameter `x` is the number of columns (maxDepth + 1).
 * We must return values in [0, x-1] to avoid gaps in the columns array.
 *
 * @param {any} node
 * @param {number} x - Number of columns (maxDepth + 1)
 * @returns {number}
 */
function accountingAlign(node, x) {
    const category = node.category;
    if (category === 'Income') return 0;
    if (category === 'Assets') return Math.floor((x - 1) / 2);
    return x - 1; // Expenses, Liabilities at rightmost column
}

/**
 * Render Sankey diagram
 * @param {HTMLElement} container
 * @param {{nodes: SankeyNode[], links: SankeyLink[]}} data
 * @param {number} depth - Account hierarchy depth (0 = Leafs, use natural graph alignment)
 */
function renderSankey(container, data, depth = 3) {
    const { nodes, links } = data;

    if (nodes.length === 0 || links.length === 0) {
        container.innerHTML =
            '<div class="sankey-empty">No money flows to display. Add some transactions with income and expenses.</div>';
        return;
    }

    // Clear container
    container.innerHTML = '';

    // Calculate dimensions based on node density
    // Minimum 18px per node to ensure labels don't overlap (font is 10px + padding)
    const minHeightPerNode = 18;
    const margin = { top: 12, right: 95, bottom: 12, left: 80 };

    const width = container.clientWidth || 600;
    const containerHeight = container.clientHeight || 400;

    // Calculate required height based on worst-case column density
    // In accounting Sankey, Expenses column often has most nodes (taxes, insurance, etc.)
    // Count nodes by category to find actual max column
    /** @type {Record<string, number>} */
    const categoryCounts = { Income: 0, Assets: 0, Expenses: 0, Liabilities: 0 };
    for (const node of nodes) {
        const cat = node.category;
        if (cat in categoryCounts) {
            categoryCounts[cat]++;
        }
    }
    const maxColumnNodes = Math.max(...Object.values(categoryCounts), 1);
    const requiredHeight = maxColumnNodes * minHeightPerNode + margin.top + margin.bottom;

    // Use larger of container height (85%) or required height for readability
    const baseHeight = Math.max(Math.floor(containerHeight * 0.85), 260);
    const height = Math.max(baseHeight, requiredHeight);

    // Enable scrolling if content exceeds container
    const needsScroll = height > containerHeight;
    container.style.overflowY = needsScroll ? 'auto' : 'hidden';

    // Create SVG
    const svg = d3
        .select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('class', 'sankey-svg');

    // Create sankey generator
    // linkSort by target Y position reduces link crossings (slope heuristic from d3-sankey PR #74)
    // iterations: scale with node count, min 6 (default), max 12 for performance
    // nodePadding: increase when scrolling to ensure labels don't overlap
    const nodePadding = needsScroll ? Math.max(10, minHeightPerNode - 8) : 10;
    // @ts-ignore - d3-sankey types are complex with generics
    const sankeyGenerator = sankey()
        .nodeId((/** @type {any} */ d) => d.fullPath)
        .nodeWidth(8)
        .nodePadding(nodePadding)
        .iterations(Math.min(12, 6 + Math.floor(nodes.length / 5)))
        .linkSort((/** @type {any} */ a, /** @type {any} */ b) => {
            // Sort links by target Y position to minimize crossings
            return (a.target.y0 || 0) - (b.target.y0 || 0);
        })
        .extent([
            [margin.left, margin.top],
            [width - margin.right, height - margin.bottom],
        ]);

    // Use custom accounting alignment for depth > 0 (categories/accounts/sub-accounts)
    // For Leafs (depth=0), use default justify alignment which handles complex graphs better
    if (depth > 0) {
        sankeyGenerator.nodeAlign(accountingAlign);
    }

    // Generate sankey layout
    // @ts-ignore - d3-sankey types are complex with generics
    let layoutNodes, layoutLinks;
    try {
        const result = sankeyGenerator({
            nodes: nodes.map((d) => ({ ...d })),
            links: links.map((d) => ({ ...d })),
        });
        layoutNodes = result.nodes;
        layoutLinks = result.links;
    } catch (err) {
        console.error('Sankey layout error:', err, { nodes, links });
        container.innerHTML =
            '<div class="sankey-empty">Error generating flow diagram. Try a different depth level.</div>';
        return;
    }

    // Draw links
    // @ts-ignore - d3 selection types are complex with generics
    const link = svg
        .append('g')
        .attr('class', 'sankey-links')
        .attr('fill', 'none')
        .attr('stroke-opacity', 0.4)
        .selectAll('path')
        .data(layoutLinks)
        .join('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke', (/** @type {any} */ d) => {
            return getCategoryColor(d.source.category);
        })
        .attr('stroke-width', (/** @type {any} */ d) => Math.max(1, d.width || 1));

    // Add link titles (use originalValue for accurate display)
    // @ts-ignore - d3 selection types are complex with generics
    link.append('title').text((/** @type {any} */ d) => {
        return `${d.source.fullPath} → ${d.target.fullPath}\n${formatValue(d.originalValue || d.value)}`;
    });

    // Draw nodes
    // @ts-ignore - d3 selection types are complex with generics
    const node = svg
        .append('g')
        .attr('class', 'sankey-nodes')
        .selectAll('g')
        .data(layoutNodes)
        .join('g')
        .attr('class', 'sankey-node');

    // Node rectangles
    // @ts-ignore - d3 selection types are complex with generics
    node.append('rect')
        .attr('x', (/** @type {any} */ d) => d.x0 || 0)
        .attr('y', (/** @type {any} */ d) => d.y0 || 0)
        .attr('height', (/** @type {any} */ d) => (d.y1 || 0) - (d.y0 || 0))
        .attr('width', (/** @type {any} */ d) => (d.x1 || 0) - (d.x0 || 0))
        .attr('fill', (/** @type {any} */ d) => getCategoryColor(d.category))
        .attr('opacity', 0.9);

    // Node titles (on hover)
    // @ts-ignore - d3 selection types are complex with generics
    node.append('title').text(
        (/** @type {any} */ d) => `${d.fullPath}\n${formatValue(d.value || 0)}`
    );

    // Node labels - position OUTSIDE the diagram:
    // - Income (left column): labels on LEFT
    // - Assets (middle column): labels on RIGHT (between middle and right columns)
    // - Expenses/Liabilities (right column): labels on RIGHT
    // @ts-ignore - d3 selection types are complex with generics
    node.append('text')
        .attr('x', (/** @type {any} */ d) => {
            // Income goes on the left side of its nodes
            if (d.category === 'Income') {
                return (d.x0 || 0) - 6;
            }
            // Everything else (Assets, Expenses, Liabilities) goes on the right
            return (d.x1 || 0) + 6;
        })
        .attr('y', (/** @type {any} */ d) => ((d.y1 || 0) + (d.y0 || 0)) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', (/** @type {any} */ d) => (d.category === 'Income' ? 'end' : 'start'))
        .attr('fill', 'rgba(255, 255, 255, 0.8)')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, monospace')
        .text((/** @type {any} */ d) => d.name);
}

/**
 * Update Sankey diagram
 * @param {string} source - Ledger source
 * @param {HTMLElement} container
 * @param {number} depth - Account hierarchy depth
 */
export async function updateSankey(source, container, depth = 2) {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    const currentVersion = ++sankeyVersion;

    updateTimeout = setTimeout(async () => {
        container.innerHTML = '<div class="sankey-loading">Building flow diagram...</div>';

        const data = await queryFlows(source, depth);

        if (currentVersion !== sankeyVersion) return;

        renderSankey(container, data, depth);
    }, 300);
}

/**
 * Initialize Sankey panel
 * @param {HTMLElement} container
 * @param {() => string} getSource
 * @param {number} depth
 */
export function initSankey(container, getSource, depth = 2) {
    updateSankey(getSource(), container, depth);
}

/**
 * Clear Sankey state
 */
export function clearSankey() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
    }
    sankeyVersion = 0;
}
