// GitHub API integration - stars, releases, binary links, benchmarks

import { fetchWithRetry } from './utils.js';

/** Cache key for GitHub info */
const GITHUB_CACHE_KEY = 'rustledger_github_info';

/** Cache key for rustfava GitHub info */
const RUSTFAVA_CACHE_KEY = 'rustfava_github_info';

/** Cache key for benchmark stats */
const BENCHMARK_CACHE_KEY = 'rustledger_benchmark_stats';

/** Cache duration: 1 hour */
const GITHUB_CACHE_TTL = 60 * 60 * 1000;

/** Benchmark data URLs */
const BENCHMARK_BASE_URL =
    'https://raw.githubusercontent.com/rustledger/rustledger/benchmarks/.github/badges';
const VALIDATION_BENCHMARK_URL = `${BENCHMARK_BASE_URL}/validation-history.json`;
const BALANCE_BENCHMARK_URL = `${BENCHMARK_BASE_URL}/balance-history.json`;

/**
 * Get cached GitHub info from localStorage
 * @returns {{ stars: number, version: string, timestamp: number } | null}
 */
export function getCachedGitHubInfo() {
    try {
        const cached = localStorage.getItem(GITHUB_CACHE_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        // Return cached data if still valid
        if (age < GITHUB_CACHE_TTL) {
            return data;
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Save GitHub info to localStorage cache
 * @param {number} stars
 * @param {string} version
 */
export function cacheGitHubInfo(stars, version) {
    try {
        localStorage.setItem(
            GITHUB_CACHE_KEY,
            JSON.stringify({
                stars,
                version,
                timestamp: Date.now(),
            })
        );
    } catch {
        // Ignore storage errors (quota exceeded, etc.)
    }
}

/**
 * Format star count for display
 * @param {number} stars
 * @returns {string}
 */
export function formatStarCount(stars) {
    return stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars);
}

/**
 * Update binary download links with direct asset URLs
 * @param {Array<{ name: string, browser_download_url: string }>} assets
 */
export function updateBinaryLinks(assets) {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const binaryLinks = document.querySelectorAll('.binary-option[data-asset-pattern]');
    binaryLinks.forEach((link) => {
        const pattern = link.dataset.assetPattern;
        if (pattern) {
            const asset = assets.find((a) => a.name.includes(pattern));
            if (asset && asset.browser_download_url) {
                link.href = asset.browser_download_url;
            }
        }
    });
}

/**
 * Fetch GitHub stats with proper error handling and caching
 */
export async function fetchGitHubInfo() {
    const starsEl = document.getElementById('github-stars');
    const versionEl = document.getElementById('footer-version');

    // Use cached data for immediate display (but still fetch for binary links)
    const cached = getCachedGitHubInfo();
    if (cached) {
        if (starsEl) {
            starsEl.textContent = formatStarCount(cached.stars);
        }
        if (versionEl && cached.version) {
            versionEl.textContent = cached.version;
        }
        // Don't return - still need to fetch releases for binary download links
    }

    try {
        const [repoResponse, releasesResponse] = await Promise.all([
            fetchWithRetry('https://api.github.com/repos/rustledger/rustledger'),
            fetchWithRetry(
                'https://api.github.com/repos/rustledger/rustledger/releases?per_page=1'
            ),
        ]);

        // Handle rate limiting
        if (repoResponse.status === 403 || releasesResponse.status === 403) {
            console.warn('GitHub API rate limit reached');
            if (starsEl) starsEl.textContent = '-';
            if (versionEl) versionEl.textContent = '';
            return;
        }

        // Handle not found
        if (repoResponse.status === 404) {
            console.warn('GitHub repository not found');
            if (starsEl) starsEl.textContent = '-';
            if (versionEl) versionEl.textContent = '';
            return;
        }

        // Check for successful responses
        if (!repoResponse.ok || !releasesResponse.ok) {
            throw new Error(`HTTP error: ${repoResponse.status}`);
        }

        const repoData = await repoResponse.json();
        const releasesData = await releasesResponse.json();

        let stars = 0;
        let version = '';

        if (repoData.stargazers_count !== undefined) {
            stars = repoData.stargazers_count;
            if (starsEl) {
                starsEl.textContent = formatStarCount(stars);
            }
        }

        if (Array.isArray(releasesData) && releasesData.length > 0 && releasesData[0].tag_name) {
            version = releasesData[0].tag_name;
            if (versionEl) {
                versionEl.textContent = version;
            }

            // Update binary download links with direct asset URLs
            const assets = releasesData[0].assets || [];
            updateBinaryLinks(assets);
        }

        // Cache the results
        if (stars > 0 || version) {
            cacheGitHubInfo(stars, version);
        }
    } catch (e) {
        console.warn('Failed to fetch GitHub info:', e);
        if (starsEl) starsEl.textContent = '-';
        if (versionEl) versionEl.textContent = '';
    }
}

/**
 * @typedef {Object} BenchmarkEntry
 * @property {number} rustledgerMs
 * @property {number} beancountMs
 * @property {number} ledgerMs
 * @property {number} hledgerMs
 */

/**
 * @typedef {Object} BenchmarkStats
 * @property {BenchmarkEntry} validation
 * @property {BenchmarkEntry} balance
 * @property {number} speedup
 * @property {number} timestamp
 */

/**
 * Get cached benchmark stats from localStorage
 * @returns {BenchmarkStats | null}
 */
export function getCachedBenchmarkStats() {
    try {
        const cached = localStorage.getItem(BENCHMARK_CACHE_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age < GITHUB_CACHE_TTL) {
            return data;
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Save benchmark stats to localStorage cache
 * @param {BenchmarkStats} stats
 */
export function cacheBenchmarkStats(stats) {
    try {
        localStorage.setItem(BENCHMARK_CACHE_KEY, JSON.stringify(stats));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Update a benchmark row in the comparison table
 * @param {string} prefix - Element ID prefix ('bench-val' or 'bench-bal')
 * @param {BenchmarkEntry} data - Benchmark data for all tools
 */
function updateBenchmarkRow(prefix, data) {
    const rustledgerEl = document.getElementById(`${prefix}-rustledger`);
    if (rustledgerEl) {
        rustledgerEl.textContent = `~${Math.round(data.rustledgerMs)}ms`;
    }

    const beancountEl = document.getElementById(`${prefix}-beancount`);
    if (beancountEl) {
        beancountEl.textContent = `~${Math.round(data.beancountMs)}ms`;
    }

    const ledgerEl = document.getElementById(`${prefix}-ledger`);
    if (ledgerEl) {
        ledgerEl.textContent = `~${Math.round(data.ledgerMs)}ms`;
    }

    const hledgerEl = document.getElementById(`${prefix}-hledger`);
    if (hledgerEl) {
        hledgerEl.textContent = `~${Math.round(data.hledgerMs)}ms`;
    }
}

/**
 * Update all benchmark display elements
 * @param {BenchmarkStats} stats
 */
function updateBenchmarkDisplay(stats) {
    const roundedSpeedup = Math.round(stats.speedup);

    // Update the "Nx Faster" stat
    const speedupEl = document.getElementById('bench-speedup');
    if (speedupEl) {
        speedupEl.dataset.animateStat = String(roundedSpeedup);
        // Set immediately and again after animation completes (1000ms)
        speedupEl.textContent = `${roundedSpeedup}x`;
        setTimeout(() => {
            speedupEl.textContent = `${roundedSpeedup}x`;
        }, 1100);
    }

    // Update both benchmark rows
    updateBenchmarkRow('bench-val', stats.validation);
    updateBenchmarkRow('bench-bal', stats.balance);
}

/**
 * Parse benchmark JSON data into BenchmarkEntry
 * @param {Array<{rustledger_ms: number, beancount_ms: number, ledger_ms: number, hledger_ms: number}>} data
 * @returns {BenchmarkEntry | null}
 */
function parseBenchmarkData(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }
    const latest = data[data.length - 1];
    if (!latest.rustledger_ms || !latest.beancount_ms || !latest.ledger_ms || !latest.hledger_ms) {
        return null;
    }
    return {
        rustledgerMs: latest.rustledger_ms,
        beancountMs: latest.beancount_ms,
        ledgerMs: latest.ledger_ms,
        hledgerMs: latest.hledger_ms,
    };
}

/**
 * Fetch benchmark stats from GitHub benchmarks branch
 */
export async function fetchBenchmarkStats() {
    // Use cached data for immediate display
    const cached = getCachedBenchmarkStats();
    if (cached) {
        updateBenchmarkDisplay(cached);
    }

    try {
        // Fetch both benchmarks in parallel
        const [validationResponse, balanceResponse] = await Promise.all([
            fetchWithRetry(VALIDATION_BENCHMARK_URL),
            fetchWithRetry(BALANCE_BENCHMARK_URL),
        ]);

        if (!validationResponse.ok || !balanceResponse.ok) {
            console.warn('Failed to fetch benchmark stats');
            return;
        }

        const [validationData, balanceData] = await Promise.all([
            validationResponse.json(),
            balanceResponse.json(),
        ]);

        const validation = parseBenchmarkData(validationData);
        const balance = parseBenchmarkData(balanceData);

        if (validation && balance) {
            // Calculate speedup based on validation benchmark (beancount vs rustledger)
            const speedup = validation.beancountMs / validation.rustledgerMs;

            /** @type {BenchmarkStats} */
            const stats = {
                validation,
                balance,
                speedup,
                timestamp: Date.now(),
            };

            updateBenchmarkDisplay(stats);
            cacheBenchmarkStats(stats);
        }
    } catch (e) {
        console.warn('Failed to fetch benchmark stats:', e);
    }
}

/**
 * Get cached rustfava GitHub info from localStorage
 * @returns {{ stars: number, version: string, timestamp: number } | null}
 */
export function getCachedRustfavaInfo() {
    try {
        const cached = localStorage.getItem(RUSTFAVA_CACHE_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age < GITHUB_CACHE_TTL) {
            return data;
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Save rustfava GitHub info to localStorage cache
 * @param {number} stars
 * @param {string} version
 */
export function cacheRustfavaInfo(stars, version) {
    try {
        localStorage.setItem(
            RUSTFAVA_CACHE_KEY,
            JSON.stringify({
                stars,
                version,
                timestamp: Date.now(),
            })
        );
    } catch {
        // Ignore storage errors
    }
}

/**
 * Update rustfava binary download links with direct asset URLs
 * @param {Array<{ name: string, browser_download_url: string }>} assets
 */
export function updateRustfavaBinaryLinks(assets) {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const binaryLinks = document.querySelectorAll('[data-rustfava-asset-pattern]');
    binaryLinks.forEach((link) => {
        const pattern = link.dataset.rustfavaAssetPattern;
        if (pattern) {
            const asset = assets.find((a) => a.name.endsWith(pattern));
            if (asset && asset.browser_download_url) {
                link.href = asset.browser_download_url;
            }
        }
    });
}

/**
 * Fetch GitHub stats for rustfava repository
 */
export async function fetchRustfavaInfo() {
    const starsEl = document.getElementById('rustfava-github-stars');
    const versionEl = document.getElementById('rustfava-footer-version');

    // Use cached data for immediate display
    const cached = getCachedRustfavaInfo();
    if (cached) {
        if (starsEl) {
            starsEl.textContent = formatStarCount(cached.stars);
        }
        if (versionEl && cached.version) {
            versionEl.textContent = cached.version;
        }
    }

    try {
        const [repoResponse, releasesResponse] = await Promise.all([
            fetchWithRetry('https://api.github.com/repos/rustledger/rustfava'),
            fetchWithRetry('https://api.github.com/repos/rustledger/rustfava/releases?per_page=1'),
        ]);

        if (repoResponse.status === 403 || releasesResponse.status === 403) {
            console.warn('GitHub API rate limit reached for rustfava');
            if (starsEl) starsEl.textContent = '-';
            if (versionEl) versionEl.textContent = '';
            return;
        }

        if (repoResponse.status === 404) {
            console.warn('rustfava repository not found');
            if (starsEl) starsEl.textContent = '-';
            if (versionEl) versionEl.textContent = '';
            return;
        }

        if (!repoResponse.ok || !releasesResponse.ok) {
            throw new Error(`HTTP error: ${repoResponse.status}`);
        }

        const repoData = await repoResponse.json();
        const releasesData = await releasesResponse.json();

        let stars = 0;
        let version = '';

        if (repoData.stargazers_count !== undefined) {
            stars = repoData.stargazers_count;
            if (starsEl) {
                starsEl.textContent = formatStarCount(stars);
            }
        }

        if (Array.isArray(releasesData) && releasesData.length > 0 && releasesData[0].tag_name) {
            version = releasesData[0].tag_name;
            if (versionEl) {
                versionEl.textContent = version;
            }

            const assets = releasesData[0].assets || [];
            updateRustfavaBinaryLinks(assets);
        }

        if (stars > 0 || version) {
            cacheRustfavaInfo(stars, version);
        }
    } catch (e) {
        console.warn('Failed to fetch rustfava GitHub info:', e);
        if (starsEl) starsEl.textContent = '-';
        if (versionEl) versionEl.textContent = '';
    }
}
