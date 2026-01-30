// Charts for accounting data visualization
import * as d3 from 'd3';
import { executeQuery, isWasmReady } from './wasm.js';

/** @type {boolean} */
let initialized = false;

/** @type {ReturnType<typeof setTimeout> | null} */
let updateTimeout = null;

/** @type {number} */
let chartVersion = 0;

// Category colors
const colors = {
    Income: '#4ade80', // green
    Expenses: '#f87171', // red
    Assets: '#22d3ee', // cyan
    Liabilities: '#fb923c', // orange
    Equity: '#a78bfa', // purple
};

// Expense sub-category colors (for pie chart)
const expenseColors = [
    '#f87171', // red
    '#fb923c', // orange
    '#fbbf24', // amber
    '#facc15', // yellow
    '#a3e635', // lime
    '#4ade80', // green
    '#22d3ee', // cyan
    '#60a5fa', // blue
    '#a78bfa', // purple
    '#f472b6', // pink
];

/**
 * Parse amount from WASM balance format
 * @param {unknown} value
 * @returns {number}
 */
function parseAmount(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const match = value.match(/-?[\d,]+\.?\d*/);
        return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
    }
    if (typeof value === 'object' && value !== null) {
        const obj = /** @type {Record<string, unknown>} */ (value);
        // Handle positions array format
        if (Array.isArray(obj.positions) && obj.positions.length > 0) {
            const pos = /** @type {Record<string, unknown>} */ (obj.positions[0]);
            const units = /** @type {Record<string, unknown> | undefined} */ (pos?.units);
            if (units?.number !== undefined) {
                return parseFloat(String(units.number));
            }
        }
        if (obj.number !== undefined) {
            return typeof obj.number === 'number' ? obj.number : parseFloat(String(obj.number));
        }
    }
    return 0;
}

/**
 * Query account balances grouped by category
 * @param {string} source
 * @returns {Promise<{expenses: Array<{name: string, value: number}>, income: number, expenseTotal: number}>}
 */
async function queryChartData(source) {
    if (!isWasmReady()) return { expenses: [], income: 0, expenseTotal: 0 };

    try {
        const result = await executeQuery(source, 'BALANCES');
        if (!result || result.error || !result.rows || result.rows.length === 0) {
            return { expenses: [], income: 0, expenseTotal: 0 };
        }

        const columns = result.columns || [];
        const accountIdx = columns.indexOf('account');
        const balanceIdx = columns.indexOf('balance');

        /** @type {Map<string, number>} */
        const expensesByCategory = new Map();
        let income = 0;
        let expenseTotal = 0;

        for (const row of result.rows) {
            if (!Array.isArray(row)) continue;

            const account = String(row[accountIdx !== -1 ? accountIdx : 0] || '');
            const balance = parseAmount(row[balanceIdx !== -1 ? balanceIdx : 1]);

            if (account.startsWith('Expenses:')) {
                // Get second level category (e.g., "Food" from "Expenses:Food:Groceries")
                const parts = account.split(':');
                const category = parts.length > 1 ? parts[1] : 'Other';
                expensesByCategory.set(category, (expensesByCategory.get(category) || 0) + balance);
                expenseTotal += balance;
            } else if (account.startsWith('Income:')) {
                // Income is typically negative in beancount
                income += Math.abs(balance);
            }
        }

        // Convert to array and sort by value
        const expenses = Array.from(expensesByCategory.entries())
            .map(([name, value]) => ({ name, value }))
            .filter((d) => d.value > 0)
            .sort((a, b) => b.value - a.value);

        return { expenses, income, expenseTotal };
    } catch (err) {
        console.error('Chart query error:', err);
        return { expenses: [], income: 0, expenseTotal: 0 };
    }
}

/**
 * Format currency value
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
    return (
        '$' +
        value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
    );
}

/**
 * Render donut chart for expenses
 * @param {HTMLElement} container
 * @param {Array<{name: string, value: number}>} data
 */
function renderDonutChart(container, data) {
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="chart-empty">No expense data</div>';
        return;
    }

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3
        .select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create pie layout
    const pie = d3
        .pie()
        .value((/** @type {any} */ d) => d.value)
        .sort(null);

    // Create arc generators
    const arc = d3
        .arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);

    const hoverArc = d3
        .arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius + 8);

    // Draw slices
    svg.selectAll('path')
        .data(pie(/** @type {any} */ (data)))
        .enter()
        .append('path')
        .attr('d', /** @type {any} */ (arc))
        .attr('fill', (_, i) => expenseColors[i % expenseColors.length])
        .attr('stroke', 'rgba(0, 0, 0, 0.3)')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, /** @type {any} */ d) {
            d3.select(this)
                .transition()
                .duration(100)
                .attr('d', /** @type {any} */ (hoverArc));

            // Show tooltip
            const tooltip = d3.select(container).select('.chart-tooltip');
            tooltip
                .style('opacity', 1)
                .html(`<strong>${d.data.name}</strong><br>${formatCurrency(d.data.value)}`);
        })
        .on('mousemove', function (event) {
            const tooltip = d3.select(container).select('.chart-tooltip');
            const rect = container.getBoundingClientRect();
            tooltip
                .style('left', event.clientX - rect.left + 10 + 'px')
                .style('top', event.clientY - rect.top - 10 + 'px');
        })
        .on('mouseleave', function () {
            d3.select(this)
                .transition()
                .duration(100)
                .attr('d', /** @type {any} */ (arc));
            d3.select(container).select('.chart-tooltip').style('opacity', 0);
        });

    // Add center text
    const total = data.reduce((sum, d) => sum + d.value, 0);
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('fill', 'rgba(255, 255, 255, 0.5)')
        .attr('font-size', '11px')
        .text('Total');

    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .attr('fill', 'rgba(255, 255, 255, 0.9)')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text(formatCurrency(total));

    // Add legend below
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');

    data.slice(0, 5).forEach((d, i) => {
        const item = legend.append('div').attr('class', 'chart-legend-item');
        item.append('div')
            .attr('class', 'chart-legend-color')
            .style('background-color', expenseColors[i % expenseColors.length]);
        item.append('span').text(d.name);
    });

    // Add tooltip element
    d3.select(container).append('div').attr('class', 'chart-tooltip').style('opacity', 0);
}

/**
 * Render bar chart for income vs expenses
 * @param {HTMLElement} container
 * @param {number} income
 * @param {number} expenses
 */
function renderBarChart(container, income, expenses) {
    container.innerHTML = '';

    if (income === 0 && expenses === 0) {
        container.innerHTML = '<div class="chart-empty">No data</div>';
        return;
    }

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const data = [
        { label: 'Income', value: income, color: colors.Income },
        { label: 'Expenses', value: expenses, color: colors.Expenses },
    ];

    const svg = d3
        .select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const x = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([0, chartWidth])
        .padding(0.4);

    const y = d3
        .scaleLinear()
        .domain([0, Math.max(income, expenses) * 1.1])
        .range([chartHeight, 0]);

    // Grid lines
    svg.append('g')
        .attr('class', 'grid')
        .call(
            d3
                .axisLeft(y)
                .ticks(5)
                .tickSize(-chartWidth)
                .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', 'rgba(255, 255, 255, 0.05)');

    svg.selectAll('.grid .domain').remove();

    // Bars
    svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.label) || 0)
        .attr('y', (d) => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', (d) => chartHeight - y(d.value))
        .attr('fill', (d) => d.color)
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
            d3.select(this).attr('opacity', 0.8);
            const tooltip = d3.select(container).select('.chart-tooltip');
            tooltip
                .style('opacity', 1)
                .html(`<strong>${d.label}</strong><br>${formatCurrency(d.value)}`);
        })
        .on('mousemove', function (event) {
            const tooltip = d3.select(container).select('.chart-tooltip');
            const rect = container.getBoundingClientRect();
            tooltip
                .style('left', event.clientX - rect.left + 10 + 'px')
                .style('top', event.clientY - rect.top - 10 + 'px');
        })
        .on('mouseleave', function () {
            d3.select(this).attr('opacity', 1);
            d3.select(container).select('.chart-tooltip').style('opacity', 0);
        });

    // Value labels on bars
    svg.selectAll('.bar-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', (d) => (x(d.label) || 0) + x.bandwidth() / 2)
        .attr('y', (d) => y(d.value) - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255, 255, 255, 0.8)')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text((d) => formatCurrency(d.value));

    // X axis
    svg.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '12px');

    svg.selectAll('.domain, .tick line').attr('stroke', 'rgba(255, 255, 255, 0.2)');

    // Net indicator
    const net = income - expenses;
    const netColor = net >= 0 ? colors.Income : colors.Expenses;
    const netText = net >= 0 ? '+' + formatCurrency(net) : '-' + formatCurrency(Math.abs(net));

    svg.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight + 40)
        .attr('text-anchor', 'middle')
        .attr('fill', netColor)
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .text(`Net: ${netText}`);

    // Add tooltip element
    d3.select(container).append('div').attr('class', 'chart-tooltip').style('opacity', 0);
}

/**
 * Initialize charts
 * @param {HTMLElement} container
 */
export function initChart(container) {
    if (initialized) return;

    container.innerHTML = `
        <div class="charts-grid">
            <div class="chart-panel">
                <div class="chart-title">Expenses by Category</div>
                <div id="donut-chart" class="chart-area"></div>
            </div>
            <div class="chart-panel">
                <div class="chart-title">Income vs Expenses</div>
                <div id="bar-chart" class="chart-area"></div>
            </div>
        </div>
    `;

    initialized = true;
}

/**
 * Update charts with new data
 * @param {string} source
 * @param {string} [_filter] - Unused, kept for API compatibility
 */
export async function updateChart(source, _filter) {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    const currentVersion = ++chartVersion;

    updateTimeout = setTimeout(async () => {
        const donutContainer = document.getElementById('donut-chart');
        const barContainer = document.getElementById('bar-chart');

        if (!donutContainer || !barContainer) return;

        const data = await queryChartData(source);

        if (currentVersion !== chartVersion) return;

        renderDonutChart(donutContainer, data.expenses);
        renderBarChart(barContainer, data.income, data.expenseTotal);
    }, 300);
}

/**
 * Destroy charts
 */
export function destroyChart() {
    initialized = false;
    if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
    }
    chartVersion = 0;
}

/**
 * Check if charts are initialized
 * @returns {boolean}
 */
export function isChartInitialized() {
    return initialized;
}
