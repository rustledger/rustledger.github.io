// Charts for accounting data visualization
import * as d3 from 'd3';
import { executeQuery, isWasmReady } from './wasm.js';

/** @type {boolean} */
let initialized = false;

/** @type {ReturnType<typeof setTimeout> | null} */
let updateTimeout = null;

/** @type {number} */
let chartVersion = 0;

/** @type {string} */
let currentView = 'summary';

/** @type {string} */
let currentSource = '';

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
 * @returns {Promise<{expenses: Array<{name: string, value: number}>, income: number, expenseTotal: number, accounts: Array<{name: string, value: number, type: string}>}>}
 */
async function queryChartData(source) {
    if (!isWasmReady()) return { expenses: [], income: 0, expenseTotal: 0, accounts: [] };

    try {
        const result = await executeQuery(source, 'BALANCES');
        if (!result || result.error || !result.rows || result.rows.length === 0) {
            return { expenses: [], income: 0, expenseTotal: 0, accounts: [] };
        }

        const columns = result.columns || [];
        const accountIdx = columns.indexOf('account');
        const balanceIdx = columns.indexOf('balance');

        /** @type {Map<string, number>} */
        const expensesByCategory = new Map();
        let income = 0;
        let expenseTotal = 0;
        /** @type {Array<{name: string, value: number, type: string}>} */
        const accounts = [];

        for (const row of result.rows) {
            if (!Array.isArray(row)) continue;

            const account = String(row[accountIdx !== -1 ? accountIdx : 0] || '');
            const balance = parseAmount(row[balanceIdx !== -1 ? balanceIdx : 1]);

            // Determine account type
            const type = account.split(':')[0];

            // Track all accounts for the accounts view
            if (type && balance !== 0) {
                accounts.push({ name: account, value: balance, type });
            }

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

        return { expenses, income, expenseTotal, accounts };
    } catch (err) {
        console.error('Chart query error:', err);
        return { expenses: [], income: 0, expenseTotal: 0, accounts: [] };
    }
}

/**
 * Query transaction data for trends
 * @param {string} source
 * @returns {Promise<Array<{date: string, income: number, expenses: number}>>}
 */
async function queryTrendData(source) {
    if (!isWasmReady()) return [];

    try {
        // Query all postings
        const query = `SELECT date, account, number WHERE account ~ "^(Income|Expenses):" ORDER BY date`;
        const result = await executeQuery(source, query);

        if (!result || result.error || !result.rows || result.rows.length === 0) {
            return [];
        }

        const columns = result.columns || [];
        const dateIdx = columns.indexOf('date');
        const accountIdx = columns.indexOf('account');
        const numberIdx = columns.indexOf('number');

        /** @type {Map<string, {income: number, expenses: number}>} */
        const monthlyData = new Map();

        for (const row of result.rows) {
            if (!Array.isArray(row)) continue;

            const dateStr = String(row[dateIdx !== -1 ? dateIdx : 0] || '');
            const account = String(row[accountIdx !== -1 ? accountIdx : 1] || '');
            const amount = parseAmount(row[numberIdx !== -1 ? numberIdx : 2]);

            // Extract month (YYYY-MM)
            const month = dateStr.substring(0, 7);
            if (!month || month.length < 7) continue;

            if (!monthlyData.has(month)) {
                monthlyData.set(month, { income: 0, expenses: 0 });
            }

            const data = monthlyData.get(month);
            if (data) {
                if (account.startsWith('Income:')) {
                    data.income += Math.abs(amount);
                } else if (account.startsWith('Expenses:')) {
                    data.expenses += Math.abs(amount);
                }
            }
        }

        // Convert to sorted array
        return Array.from(monthlyData.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
        console.error('Trend query error:', err);
        return [];
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
        Math.abs(value).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
    );
}

/**
 * Render donut chart for expenses
 * @param {HTMLElement} container
 * @param {Array<{name: string, value: number}>} data
 * @param {boolean} [fullSize=false]
 */
function renderDonutChart(container, data, fullSize = false) {
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="chart-empty">No expense data</div>';
        return;
    }

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;
    const radius = Math.min(width, height) / 2 - (fullSize ? 60 : 40);

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
        .attr('font-size', fullSize ? '13px' : '11px')
        .text('Total');

    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .attr('fill', 'rgba(255, 255, 255, 0.9)')
        .attr('font-size', fullSize ? '20px' : '16px')
        .attr('font-weight', 'bold')
        .text(formatCurrency(total));

    // Add legend below
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');

    const maxItems = fullSize ? 10 : 5;
    data.slice(0, maxItems).forEach((d, i) => {
        const item = legend.append('div').attr('class', 'chart-legend-item');
        item.append('div')
            .attr('class', 'chart-legend-color')
            .style('background-color', expenseColors[i % expenseColors.length]);
        item.append('span').text(`${d.name} (${formatCurrency(d.value)})`);
    });

    if (data.length > maxItems) {
        const othersTotal = data.slice(maxItems).reduce((sum, d) => sum + d.value, 0);
        const item = legend.append('div').attr('class', 'chart-legend-item');
        item.append('div')
            .attr('class', 'chart-legend-color')
            .style('background-color', 'rgba(255,255,255,0.3)');
        item.append('span').text(`Others (${formatCurrency(othersTotal)})`);
    }

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
 * Render horizontal bar chart for account balances
 * @param {HTMLElement} container
 * @param {Array<{name: string, value: number, type: string}>} accounts
 */
function renderAccountsChart(container, accounts) {
    container.innerHTML = '';

    if (accounts.length === 0) {
        container.innerHTML = '<div class="chart-empty">No account data</div>';
        return;
    }

    // Group by account type and sort
    const grouped = {
        Assets: accounts.filter((a) => a.type === 'Assets').sort((a, b) => b.value - a.value),
        Liabilities: accounts
            .filter((a) => a.type === 'Liabilities')
            .sort((a, b) => a.value - b.value),
        Income: accounts.filter((a) => a.type === 'Income').sort((a, b) => a.value - b.value),
        Expenses: accounts.filter((a) => a.type === 'Expenses').sort((a, b) => b.value - a.value),
        Equity: accounts.filter((a) => a.type === 'Equity').sort((a, b) => a.value - b.value),
    };

    // Take top accounts from each category
    const maxPerCategory = 5;
    /** @type {Array<{name: string, value: number, type: string, shortName: string}>} */
    const displayData = [];

    for (const accts of Object.values(grouped)) {
        accts.slice(0, maxPerCategory).forEach((a) => {
            // Shorten name: "Assets:Bank:Chase:Checking" -> "Chase:Checking"
            const parts = a.name.split(':');
            const shortName =
                parts.length > 2 ? parts.slice(-2).join(':') : parts.slice(1).join(':') || a.name;
            displayData.push({ ...a, shortName });
        });
    }

    const width = container.clientWidth || 400;
    const height = Math.max(300, displayData.length * 28 + 60);
    const margin = { top: 20, right: 100, bottom: 20, left: 150 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
        .select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Find max absolute value for scale
    const maxValue = Math.max(...displayData.map((d) => Math.abs(d.value)));

    // Scales
    const y = d3
        .scaleBand()
        .domain(displayData.map((d) => d.shortName))
        .range([0, chartHeight])
        .padding(0.2);

    const x = d3.scaleLinear().domain([-maxValue, maxValue]).range([0, chartWidth]);

    // Center line
    svg.append('line')
        .attr('x1', x(0))
        .attr('x2', x(0))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', 1);

    // Bars
    svg.selectAll('rect')
        .data(displayData)
        .enter()
        .append('rect')
        .attr('x', (d) => (d.value >= 0 ? x(0) : x(d.value)))
        .attr('y', (d) => y(d.shortName) || 0)
        .attr('width', (d) => Math.abs(x(d.value) - x(0)))
        .attr('height', y.bandwidth())
        .attr('fill', (d) => colors[/** @type {keyof typeof colors} */ (d.type)] || '#888')
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
            d3.select(this).attr('opacity', 0.8);
            const tooltip = d3.select(container).select('.chart-tooltip');
            tooltip
                .style('opacity', 1)
                .html(`<strong>${d.name}</strong><br>${formatCurrency(d.value)}`);
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

    // Y axis (account names)
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '10px');

    svg.selectAll('.domain, .tick line').attr('stroke', 'rgba(255, 255, 255, 0.2)');

    // Value labels
    svg.selectAll('.value-label')
        .data(displayData)
        .enter()
        .append('text')
        .attr('class', 'value-label')
        .attr('x', (d) => (d.value >= 0 ? x(d.value) + 5 : x(d.value) - 5))
        .attr('y', (d) => (y(d.shortName) || 0) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', (d) => (d.value >= 0 ? 'start' : 'end'))
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '10px')
        .text((d) => formatCurrency(d.value));

    // Add tooltip element
    d3.select(container).append('div').attr('class', 'chart-tooltip').style('opacity', 0);
}

/**
 * Render line chart for trends
 * @param {HTMLElement} container
 * @param {Array<{date: string, income: number, expenses: number}>} data
 */
function renderTrendsChart(container, data) {
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="chart-empty">No trend data available</div>';
        return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

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
        .domain(data.map((d) => d.date))
        .range([0, chartWidth])
        .padding(0.1);

    const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expenses]));
    const y = d3
        .scaleLinear()
        .domain([0, maxValue * 1.1])
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

    // Bar width for grouped bars
    const barWidth = x.bandwidth() / 2.5;

    // Income bars
    svg.selectAll('.income-bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'income-bar')
        .attr('x', (d) => (x(d.date) || 0) + x.bandwidth() / 2 - barWidth - 2)
        .attr('y', (d) => y(d.income))
        .attr('width', barWidth)
        .attr('height', (d) => chartHeight - y(d.income))
        .attr('fill', colors.Income)
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
            d3.select(this).attr('opacity', 0.8);
            const tooltip = d3.select(container).select('.chart-tooltip');
            tooltip
                .style('opacity', 1)
                .html(`<strong>${d.date}</strong><br>Income: ${formatCurrency(d.income)}`);
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

    // Expense bars
    svg.selectAll('.expense-bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'expense-bar')
        .attr('x', (d) => (x(d.date) || 0) + x.bandwidth() / 2 + 2)
        .attr('y', (d) => y(d.expenses))
        .attr('width', barWidth)
        .attr('height', (d) => chartHeight - y(d.expenses))
        .attr('fill', colors.Expenses)
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
            d3.select(this).attr('opacity', 0.8);
            const tooltip = d3.select(container).select('.chart-tooltip');
            tooltip
                .style('opacity', 1)
                .html(`<strong>${d.date}</strong><br>Expenses: ${formatCurrency(d.expenses)}`);
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

    // X axis
    svg.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '10px')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end');

    svg.selectAll('.domain, .tick line').attr('stroke', 'rgba(255, 255, 255, 0.2)');

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${chartWidth - 100}, -15)`);

    legend
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colors.Income)
        .attr('rx', 2);
    legend
        .append('text')
        .attr('x', 16)
        .attr('y', 10)
        .attr('fill', 'rgba(255,255,255,0.7)')
        .attr('font-size', '11px')
        .text('Income');

    legend
        .append('rect')
        .attr('x', 70)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colors.Expenses)
        .attr('rx', 2);
    legend
        .append('text')
        .attr('x', 86)
        .attr('y', 10)
        .attr('fill', 'rgba(255,255,255,0.7)')
        .attr('font-size', '11px')
        .text('Expenses');

    // Add tooltip element
    d3.select(container).append('div').attr('class', 'chart-tooltip').style('opacity', 0);
}

/**
 * Render the summary view (original dual chart)
 * @param {HTMLElement} container
 * @param {{expenses: Array<{name: string, value: number}>, income: number, expenseTotal: number, accounts: Array<{name: string, value: number, type: string}>}} data
 */
function renderSummaryView(container, data) {
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

    const donutContainer = document.getElementById('donut-chart');
    const barContainer = document.getElementById('bar-chart');

    if (donutContainer) renderDonutChart(donutContainer, data.expenses);
    if (barContainer) renderBarChart(barContainer, data.income, data.expenseTotal);
}

/**
 * Render the expenses view (full-size donut)
 * @param {HTMLElement} container
 * @param {{expenses: Array<{name: string, value: number}>, income: number, expenseTotal: number, accounts: Array<{name: string, value: number, type: string}>}} data
 */
function renderExpensesView(container, data) {
    container.innerHTML = `
        <div class="chart-single">
            <div class="chart-title">Expense Breakdown</div>
            <div id="expense-chart" class="chart-area-full"></div>
        </div>
    `;

    const chartContainer = document.getElementById('expense-chart');
    if (chartContainer) renderDonutChart(chartContainer, data.expenses, true);
}

/**
 * Render the accounts view
 * @param {HTMLElement} container
 * @param {{expenses: Array<{name: string, value: number}>, income: number, expenseTotal: number, accounts: Array<{name: string, value: number, type: string}>}} data
 */
function renderAccountsView(container, data) {
    container.innerHTML = `
        <div class="chart-single">
            <div class="chart-title">Account Balances</div>
            <div id="accounts-chart" class="chart-area-full"></div>
        </div>
    `;

    const chartContainer = document.getElementById('accounts-chart');
    if (chartContainer) renderAccountsChart(chartContainer, data.accounts);
}

/**
 * Render the trends view
 * @param {HTMLElement} container
 * @param {Array<{date: string, income: number, expenses: number}>} trendData
 */
function renderTrendsView(container, trendData) {
    container.innerHTML = `
        <div class="chart-single">
            <div class="chart-title">Monthly Trends</div>
            <div id="trends-chart" class="chart-area-full"></div>
        </div>
    `;

    const chartContainer = document.getElementById('trends-chart');
    if (chartContainer) renderTrendsChart(chartContainer, trendData);
}

/**
 * Initialize charts
 * @param {HTMLElement} _container - Unused, kept for API compatibility
 */
export function initChart(_container) {
    if (initialized) return;
    initialized = true;
}

/**
 * Set the current chart view
 * @param {string} view - 'summary' | 'expenses' | 'accounts' | 'trends'
 */
export function setChartView(view) {
    currentView = view;
    if (currentSource) {
        updateChart(currentSource);
    }
}

/**
 * Update charts with new data
 * @param {string} source
 * @param {string} [_filter] - Unused, kept for API compatibility
 */
export async function updateChart(source, _filter) {
    currentSource = source;

    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    const currentVersion = ++chartVersion;

    updateTimeout = setTimeout(async () => {
        const container = document.getElementById('chart-container');
        if (!container) return;

        if (currentView === 'trends') {
            const trendData = await queryTrendData(source);
            if (currentVersion !== chartVersion) return;
            renderTrendsView(container, trendData);
        } else {
            const data = await queryChartData(source);
            if (currentVersion !== chartVersion) return;

            switch (currentView) {
                case 'expenses':
                    renderExpensesView(container, data);
                    break;
                case 'accounts':
                    renderAccountsView(container, data);
                    break;
                case 'summary':
                default:
                    renderSummaryView(container, data);
                    break;
            }
        }
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
    currentView = 'summary';
    currentSource = '';
}

/**
 * Check if charts are initialized
 * @returns {boolean}
 */
export function isChartInitialized() {
    return initialized;
}
