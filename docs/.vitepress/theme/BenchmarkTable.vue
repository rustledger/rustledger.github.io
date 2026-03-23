<script setup>
import { ref, onMounted } from 'vue';

const VALIDATION_URL =
    'https://raw.githubusercontent.com/rustledger/rustledger/benchmarks/.github/badges/validation-history.json';
const BALANCE_URL =
    'https://raw.githubusercontent.com/rustledger/rustledger/benchmarks/.github/badges/balance-history.json';

const validation = ref({
    rustledger: '~43ms',
    beancount: '~789ms',
    ledger: '~108ms',
    hledger: '~498ms',
});
const balance = ref({
    rustledger: '~34ms',
    beancount: '~1046ms',
    ledger: '~63ms',
    hledger: '~538ms',
});
const loading = ref(true);

async function fetchBenchmarks() {
    try {
        const [valRes, balRes] = await Promise.all([fetch(VALIDATION_URL), fetch(BALANCE_URL)]);

        if (valRes.ok && balRes.ok) {
            const valData = await valRes.json();
            const balData = await balRes.json();

            if (valData.length > 0) {
                const latest = valData[valData.length - 1];
                validation.value = {
                    rustledger: `~${Math.round(latest.rustledger_ms)}ms`,
                    beancount: `~${Math.round(latest.beancount_ms)}ms`,
                    ledger: `~${Math.round(latest.ledger_ms)}ms`,
                    hledger: `~${Math.round(latest.hledger_ms)}ms`,
                };
            }

            if (balData.length > 0) {
                const latest = balData[balData.length - 1];
                balance.value = {
                    rustledger: `~${Math.round(latest.rustledger_ms)}ms`,
                    beancount: `~${Math.round(latest.beancount_ms)}ms`,
                    ledger: `~${Math.round(latest.ledger_ms)}ms`,
                    hledger: `~${Math.round(latest.hledger_ms)}ms`,
                };
            }
        }
    } catch (e) {
        console.warn('Failed to fetch benchmark data:', e);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchBenchmarks();
});
</script>

<template>
    <div class="benchmark-table-wrapper">
        <table class="benchmark-table">
            <thead>
                <tr>
                    <th></th>
                    <th>
                        <span class="rustledger-name"><span class="rust">rust</span>ledger</span>
                    </th>
                    <th>Beancount</th>
                    <th>Ledger</th>
                    <th>hledger</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="feature">Language</td>
                    <td>Rust</td>
                    <td>Python</td>
                    <td>C++</td>
                    <td>Haskell</td>
                </tr>
                <tr>
                    <td class="feature">Syntax</td>
                    <td>Beancount</td>
                    <td>Beancount</td>
                    <td>Ledger</td>
                    <td>Ledger</td>
                </tr>
                <tr>
                    <td class="feature">Validation</td>
                    <td>Strict</td>
                    <td>Strict</td>
                    <td>Optional</td>
                    <td>Optional</td>
                </tr>
                <tr>
                    <td class="feature">Validation (10k txns)</td>
                    <td class="highlight">{{ validation.rustledger }}</td>
                    <td>{{ validation.beancount }}</td>
                    <td>{{ validation.ledger }}</td>
                    <td>{{ validation.hledger }}</td>
                </tr>
                <tr>
                    <td class="feature">Balance Report</td>
                    <td class="highlight">{{ balance.rustledger }}</td>
                    <td>{{ balance.beancount }}</td>
                    <td>{{ balance.ledger }}</td>
                    <td>{{ balance.hledger }}</td>
                </tr>
                <tr>
                    <td class="feature">Dependencies</td>
                    <td>None</td>
                    <td>Python + pip</td>
                    <td>None</td>
                    <td>GHC runtime</td>
                </tr>
                <tr>
                    <td class="feature">Booking methods</td>
                    <td>7</td>
                    <td>7</td>
                    <td>Manual</td>
                    <td>Manual</td>
                </tr>
                <tr>
                    <td class="feature">Plugins</td>
                    <td>20 + Python</td>
                    <td>Python</td>
                    <td>No</td>
                    <td>No</td>
                </tr>
                <tr>
                    <td class="feature">WebAssembly</td>
                    <td>Yes</td>
                    <td>No</td>
                    <td>No</td>
                    <td>No</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.benchmark-table-wrapper {
    overflow-x: auto;
    margin: 2rem 0;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.benchmark-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
    font-size: 0.95rem;
}

.benchmark-table th {
    padding: 1.25rem 1.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.benchmark-table td {
    padding: 1rem 1.5rem;
    color: rgba(255, 255, 255, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.benchmark-table tbody tr:last-child td {
    border-bottom: none;
}

.benchmark-table td.feature {
    text-align: left;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
}

.benchmark-table td.highlight {
    color: white;
    font-weight: 500;
}

.rustledger-name {
    color: white;
    font-weight: 600;
}

.rustledger-name .rust {
    color: #f97316;
}
</style>
