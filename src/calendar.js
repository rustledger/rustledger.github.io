// Transaction Calendar Heatmap with Transaction List
import { executeQuery, isWasmReady } from './wasm.js';

/**
 * @typedef {Object} DayData
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {number} count - Transaction count
 * @property {number} amount - Total absolute amount
 */

/**
 * @typedef {Object} Transaction
 * @property {string} date - ISO date string
 * @property {string} payee - Payee/narration
 * @property {string} account - Account name
 * @property {string} amount - Formatted amount with currency
 * @property {number} line - Line number in source
 */

/** @type {ReturnType<typeof setTimeout> | null} */
let updateTimeout = null;

/** @type {number} */
let calendarVersion = 0;

/** @type {Transaction[]} */
let allTransactions = [];

/** @type {string | null} */
let selectedDate = null;

/** @type {HTMLElement | null} */
let currentContainer = null;

/** @type {((line: number) => void) | null} */
let goToLineCallback = null;

// Intensity colors (dark theme friendly)
const intensityColors = [
    'rgba(255, 255, 255, 0.05)', // 0 transactions
    'rgba(34, 211, 238, 0.3)', // low
    'rgba(34, 211, 238, 0.5)', // medium-low
    'rgba(34, 211, 238, 0.7)', // medium
    'rgba(34, 211, 238, 0.9)', // high
];

/**
 * Get color for transaction count
 * @param {number} count
 * @param {number} maxCount
 * @returns {string}
 */
function getIntensityColor(count, maxCount) {
    if (count === 0) return intensityColors[0];
    if (maxCount === 0) return intensityColors[0];

    const ratio = count / maxCount;
    if (ratio <= 0.25) return intensityColors[1];
    if (ratio <= 0.5) return intensityColors[2];
    if (ratio <= 0.75) return intensityColors[3];
    return intensityColors[4];
}

/**
 * Parse date from various formats
 * @param {unknown} value
 * @returns {string | null}
 */
function parseDate(value) {
    if (!value) return null;

    // Handle object format { year, month, day }
    if (typeof value === 'object' && value !== null) {
        const obj = /** @type {Record<string, unknown>} */ (value);
        if (obj.year && obj.month && obj.day) {
            const year = Number(obj.year);
            const month = String(obj.month).padStart(2, '0');
            const day = String(obj.day).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }

    // Handle string format
    if (typeof value === 'string') {
        const match = value.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) return match[0];
    }

    return null;
}

/**
 * Parse amount/position to extract displayable value
 * @param {unknown} value
 * @returns {{amount: string, numeric: number}}
 */
function parseAmount(value) {
    if (!value) return { amount: '', numeric: 0 };

    // Handle position object format: { number: "123.45", currency: "USD" }
    // or { units: { number: "123.45", currency: "USD" }, cost: ... }
    if (typeof value === 'object' && value !== null) {
        const obj = /** @type {Record<string, unknown>} */ (value);

        // Direct number/currency format
        if (obj.number !== undefined && obj.currency) {
            const num = parseFloat(String(obj.number)) || 0;
            const formatted = num.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            return {
                amount: `${formatted} ${obj.currency}`,
                numeric: num,
            };
        }

        // Units wrapper format
        if (obj.units && typeof obj.units === 'object') {
            const units = /** @type {Record<string, unknown>} */ (obj.units);
            if (units.number !== undefined && units.currency) {
                const num = parseFloat(String(units.number)) || 0;
                const formatted = num.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                return {
                    amount: `${formatted} ${units.currency}`,
                    numeric: num,
                };
            }
        }
    }

    // Fallback: try to parse as string
    const str = String(value);
    if (str === '[object Object]') return { amount: '', numeric: 0 };

    const match = str.match(/-?[\d,]+\.?\d*/);
    const numeric = match ? parseFloat(match[0].replace(/,/g, '')) : 0;

    return { amount: str, numeric };
}

/**
 * Parse source to build a map of (date, payee/narration) → line number
 * @param {string} source
 * @returns {Map<string, number>}
 */
function buildTransactionLineMap(source) {
    const lineMap = new Map();
    const lines = source.split('\n');

    // Match transaction headers: YYYY-MM-DD txn "Payee" "Narration" or YYYY-MM-DD * "Narration"
    const txnRegex = /^(\d{4}-\d{2}-\d{2})\s+(?:txn|\*|!)\s+(?:"([^"]*)"\s+)?"([^"]*)"/;

    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(txnRegex);
        if (match) {
            const [, date, payee, narration] = match;
            // Build multiple keys to increase matching chances
            const lineNum = i + 1; // 1-based line numbers

            // Key with full payee + narration
            if (payee && narration) {
                lineMap.set(`${date}|${payee}|${narration}`, lineNum);
                lineMap.set(`${date}|${payee} - ${narration}`, lineNum);
            } else if (narration) {
                lineMap.set(`${date}||${narration}`, lineNum);
                lineMap.set(`${date}|${narration}`, lineNum);
            }

            // Also key by date only for simple lookup
            if (!lineMap.has(`first|${date}`)) {
                lineMap.set(`first|${date}`, lineNum);
            }
        }
    }

    return lineMap;
}

/**
 * Query full transaction data from ledger
 * @param {string} source
 * @returns {Promise<{dateCounts: Map<string, number>, transactions: Transaction[], byDate: Map<string, Transaction[]>}>}
 */
async function queryTransactionData(source) {
    if (!isWasmReady()) {
        return { dateCounts: new Map(), transactions: [], byDate: new Map() };
    }

    try {
        // Build line number lookup from source
        const lineMap = buildTransactionLineMap(source);

        // Query journal for full transaction details
        const result = await executeQuery(source, 'JOURNAL');
        if (!result || result.error || !result.rows || result.rows.length === 0) {
            return { dateCounts: new Map(), transactions: [], byDate: new Map() };
        }

        /** @type {Map<string, number>} */
        const dateCounts = new Map();
        /** @type {Transaction[]} */
        const transactions = [];
        /** @type {Map<string, Transaction[]>} */
        const byDate = new Map();

        const columns = result.columns || [];
        const dateIdx = columns.indexOf('date');
        const payeeIdx = columns.indexOf('payee');
        const narrationIdx = columns.indexOf('narration');
        const accountIdx = columns.indexOf('account');
        const positionIdx = columns.indexOf('position');

        for (const row of result.rows) {
            if (!Array.isArray(row)) continue;

            const dateVal = row[dateIdx !== -1 ? dateIdx : 0];
            const date = parseDate(dateVal);
            if (!date) continue;

            // Get payee or narration
            let payee = '';
            let rawPayee = '';
            let rawNarration = '';
            if (payeeIdx !== -1 && row[payeeIdx]) {
                rawPayee = String(row[payeeIdx]);
                payee = rawPayee;
            }
            if (narrationIdx !== -1 && row[narrationIdx]) {
                rawNarration = String(row[narrationIdx]);
                payee = payee ? `${payee} - ${rawNarration}` : rawNarration;
            }

            const account = accountIdx !== -1 ? String(row[accountIdx] || '') : '';
            const { amount } = parseAmount(positionIdx !== -1 ? row[positionIdx] : '');

            // Look up line number from source
            let line = 0;
            if (rawPayee && rawNarration) {
                line =
                    lineMap.get(`${date}|${rawPayee}|${rawNarration}`) ||
                    lineMap.get(`${date}|${rawPayee} - ${rawNarration}`) ||
                    lineMap.get(`first|${date}`) ||
                    0;
            } else if (rawNarration) {
                line =
                    lineMap.get(`${date}||${rawNarration}`) ||
                    lineMap.get(`${date}|${rawNarration}`) ||
                    lineMap.get(`first|${date}`) ||
                    0;
            } else {
                line = lineMap.get(`first|${date}`) || 0;
            }

            const tx = { date, payee, account, amount, line };
            transactions.push(tx);

            // Group by date
            if (!byDate.has(date)) {
                byDate.set(date, []);
            }
            byDate.get(date)?.push(tx);

            // Count per date
            dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
        }

        // Sort transactions by date descending (most recent first)
        transactions.sort((a, b) => b.date.localeCompare(a.date) || b.line - a.line);

        return { dateCounts, transactions, byDate };
    } catch (err) {
        console.error('Calendar query error:', err);
        return { dateCounts: new Map(), transactions: [], byDate: new Map() };
    }
}

/**
 * Generate calendar grid data based on transaction date range
 * @param {Map<string, number>} dateCounts
 * @returns {{weeks: Array<Array<DayData | null>>, months: Array<{name: string, startWeek: number}>}}
 */
function generateCalendarData(dateCounts) {
    const dates = Array.from(dateCounts.keys()).sort();
    const today = new Date();

    let endDate;
    let startDate;

    if (dates.length > 0) {
        const firstTxDate = new Date(dates[0] + 'T00:00:00');
        const lastTxDate = new Date(dates[dates.length - 1] + 'T00:00:00');

        startDate = new Date(firstTxDate);
        startDate.setDate(startDate.getDate() - 7);

        endDate = new Date(lastTxDate);
        endDate.setDate(endDate.getDate() + 7);

        const maxDays = 365;
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > maxDays) {
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - maxDays);
        }
    } else {
        endDate = today;
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
    }

    startDate.setDate(startDate.getDate() - startDate.getDay());

    /** @type {Array<Array<DayData | null>>} */
    const weeks = [];
    /** @type {Array<{name: string, startWeek: number}>} */
    const months = [];

    const currentDate = new Date(startDate);
    let currentWeek = [];
    let lastMonth = -1;
    let weekIndex = 0;

    const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    while (currentDate <= endDate) {
        const month = currentDate.getMonth();

        if (month !== lastMonth) {
            months.push({ name: monthNames[month], startWeek: weekIndex });
            lastMonth = month;
        }

        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dateCounts.get(dateStr) || 0;

        currentWeek.push({
            date: dateStr,
            count,
            amount: 0,
        });

        currentDate.setDate(currentDate.getDate() + 1);

        if (currentDate.getDay() === 0 || currentDate > endDate) {
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                    currentWeek.push(null);
                }
                weeks.push(currentWeek);
                weekIndex++;
            }
            currentWeek = [];
        }
    }

    return { weeks, months };
}

/**
 * Format date for display
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Format date for list header
 * @param {string} dateStr
 * @returns {string}
 */
function formatDateHeader(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Render transaction list
 * @param {Transaction[]} transactions
 * @param {string | null} dateFilter
 * @returns {string}
 */
function renderTransactionList(transactions, dateFilter) {
    const filtered = dateFilter
        ? transactions.filter((tx) => tx.date === dateFilter)
        : transactions.slice(0, 20); // Show recent 20 by default

    if (filtered.length === 0) {
        if (dateFilter) {
            return `<div class="tx-list-empty">No transactions on ${formatDateHeader(dateFilter)}</div>`;
        }
        return '<div class="tx-list-empty">No transactions found</div>';
    }

    const header = dateFilter
        ? `<div class="tx-list-header">${formatDateHeader(dateFilter)} <button class="tx-clear-filter" title="Show all">×</button></div>`
        : '<div class="tx-list-header">Recent Transactions</div>';

    const rows = filtered
        .map((tx) => {
            const accountType = tx.account.split(':')[0];
            const accountClass = accountType.toLowerCase();
            const isNegative = tx.amount.startsWith('-');
            const amountClass = isNegative ? 'negative' : 'positive';

            return `
            <div class="tx-row" data-line="${tx.line}" title="Click to jump to line ${tx.line}">
                <div class="tx-date">${tx.date}</div>
                <div class="tx-payee">${escapeHtml(tx.payee) || '—'}</div>
                <div class="tx-account ${accountClass}">${escapeHtml(tx.account)}</div>
                <div class="tx-amount ${amountClass}">${escapeHtml(tx.amount)}</div>
            </div>
        `;
        })
        .join('');

    const countText = dateFilter
        ? `${filtered.length} posting${filtered.length !== 1 ? 's' : ''}`
        : `Showing ${filtered.length} of ${transactions.length}`;

    return `
        ${header}
        <div class="tx-list-content">
            ${rows}
        </div>
        <div class="tx-list-footer">${countText}</div>
    `;
}

/**
 * Escape HTML entities
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Update the transaction list display
 */
function updateTransactionListDisplay() {
    if (!currentContainer) return;

    const listContainer = currentContainer.querySelector('.tx-list');
    if (listContainer) {
        listContainer.innerHTML = renderTransactionList(allTransactions, selectedDate);
        attachTransactionListHandlers(listContainer);
    }

    // Update selected state on calendar
    currentContainer.querySelectorAll('.calendar-day').forEach((el) => {
        const date = el.getAttribute('data-date');
        if (date === selectedDate) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
}

/**
 * Attach click handlers to transaction list
 * @param {Element} listContainer
 */
function attachTransactionListHandlers(listContainer) {
    // Click on transaction row to jump to line
    listContainer.querySelectorAll('.tx-row').forEach((el) => {
        el.addEventListener('click', () => {
            const line = parseInt(el.getAttribute('data-line') || '0', 10);
            if (line > 0 && goToLineCallback) {
                goToLineCallback(line);
            }
        });
    });

    // Clear filter button
    const clearBtn = listContainer.querySelector('.tx-clear-filter');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedDate = null;
            updateTransactionListDisplay();
        });
    }
}

/**
 * Render calendar heatmap with transaction list
 * @param {HTMLElement} container
 * @param {Map<string, number>} dateCounts
 */
function renderCalendar(container, dateCounts) {
    currentContainer = container;

    if (dateCounts.size === 0) {
        container.innerHTML =
            '<div class="calendar-empty">No transactions found. Add some transactions to see activity.</div>';
        return;
    }

    const { weeks, months } = generateCalendarData(dateCounts);
    const maxCount = Math.max(...Array.from(dateCounts.values()), 1);
    const totalTransactions = Array.from(dateCounts.values()).reduce((a, b) => a + b, 0);
    const daysWithActivity = dateCounts.size;

    let html = `
        <div class="activity-panel">
            <div class="calendar-wrapper">
                <div class="calendar-stats">
                    <span class="calendar-stat">${totalTransactions.toLocaleString()} postings</span>
                    <span class="calendar-stat">${daysWithActivity} active days</span>
                </div>
                <div class="calendar-grid-container">
                    <div class="calendar-months">
                        ${months
                            .map((m, i) => {
                                const nextMonth = months[i + 1];
                                const width = nextMonth
                                    ? (nextMonth.startWeek - m.startWeek) * 13
                                    : (weeks.length - m.startWeek) * 13;
                                return `<span style="min-width: ${Math.max(width, 26)}px">${m.name}</span>`;
                            })
                            .join('')}
                    </div>
                    <div class="calendar-grid-wrapper">
                        <div class="calendar-days">
                            <span></span>
                            <span>Mon</span>
                            <span></span>
                            <span>Wed</span>
                            <span></span>
                            <span>Fri</span>
                            <span></span>
                        </div>
                        <div class="calendar-grid">
    `;

    for (const week of weeks) {
        html += '<div class="calendar-week">';
        for (const day of week) {
            if (day) {
                const color = getIntensityColor(day.count, maxCount);
                const tooltip = `${formatDate(day.date)}: ${day.count} posting${day.count !== 1 ? 's' : ''}`;
                const selectedClass = day.date === selectedDate ? ' selected' : '';
                html += `<div class="calendar-day${selectedClass}" style="background-color: ${color}" title="${tooltip}" data-date="${day.date}" data-count="${day.count}"></div>`;
            } else {
                html += '<div class="calendar-day empty"></div>';
            }
        }
        html += '</div>';
    }

    html += `
                        </div>
                    </div>
                </div>
                <div class="calendar-legend">
                    <span>Less</span>
                    ${intensityColors.map((c) => `<div class="calendar-legend-item" style="background-color: ${c}"></div>`).join('')}
                    <span>More</span>
                </div>
            </div>
            <div class="tx-list">
                ${renderTransactionList(allTransactions, selectedDate)}
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Add click handlers for calendar days
    container.querySelectorAll('.calendar-day[data-date]').forEach((el) => {
        el.addEventListener('click', () => {
            const date = el.getAttribute('data-date');
            const count = parseInt(el.getAttribute('data-count') || '0', 10);

            if (count > 0) {
                // Toggle selection
                selectedDate = selectedDate === date ? null : date;
                updateTransactionListDisplay();
            }
        });
    });

    // Attach handlers to initial transaction list
    const listContainer = container.querySelector('.tx-list');
    if (listContainer) {
        attachTransactionListHandlers(listContainer);
    }
}

/**
 * Update calendar (debounced)
 * @param {string} source
 * @param {HTMLElement} container
 */
export async function updateCalendar(source, container) {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    const currentVersion = ++calendarVersion;

    updateTimeout = setTimeout(async () => {
        container.innerHTML = '<div class="calendar-loading">Building activity calendar...</div>';

        const { dateCounts, transactions } = await queryTransactionData(source);

        if (currentVersion !== calendarVersion) return;

        // Store data for filtering
        allTransactions = transactions;
        selectedDate = null; // Reset selection on new data

        renderCalendar(container, dateCounts);
    }, 300);
}

/**
 * Initialize calendar panel
 * @param {HTMLElement} container
 * @param {() => string} getSource
 * @param {(line: number) => void} [onGoToLine]
 */
export function initCalendar(container, getSource, onGoToLine) {
    goToLineCallback = onGoToLine || null;
    updateCalendar(getSource(), container);
}

/**
 * Clear calendar state
 */
export function clearCalendar() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
    }
    calendarVersion = 0;
    allTransactions = [];
    selectedDate = null;
    currentContainer = null;
}
