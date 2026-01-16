// GitHub API integration - stars, releases, binary links

import { fetchWithRetry } from './utils.js';

/** Cache key for GitHub info */
const GITHUB_CACHE_KEY = 'rustledger_github_info';

/** Cache duration: 1 hour */
const GITHUB_CACHE_TTL = 60 * 60 * 1000;

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
