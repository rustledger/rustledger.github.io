// Install tabs - OS detection and tab switching

import { showToast } from './ui.js';

/**
 * Create an SVG element with a checkmark icon
 * @param {string} className - CSS classes for the SVG
 * @returns {SVGSVGElement}
 */
function createCheckIcon(className) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M5 13l4 4L19 7');

    svg.appendChild(path);
    return svg;
}

/**
 * Detect user's operating system and recommend best install method
 * @returns {{ os: string, recommendedTab: string }}
 */
export function detectOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // macOS detection
    if (
        platform.includes('mac') ||
        userAgent.includes('macintosh') ||
        userAgent.includes('mac os')
    ) {
        return { os: 'macos', recommendedTab: 'homebrew' };
    }

    // Windows detection
    if (platform.includes('win') || userAgent.includes('windows')) {
        return { os: 'windows', recommendedTab: 'binary' };
    }

    // Linux detection with distro-specific recommendations
    if (platform.includes('linux') || userAgent.includes('linux')) {
        // Check for Arch Linux indicators
        if (
            userAgent.includes('arch') ||
            userAgent.includes('manjaro') ||
            userAgent.includes('endeavour')
        ) {
            return { os: 'linux-arch', recommendedTab: 'aur' };
        }
        // Check for NixOS indicators
        if (userAgent.includes('nixos')) {
            return { os: 'linux-nix', recommendedTab: 'nix' };
        }
        // Default Linux recommendation
        return { os: 'linux', recommendedTab: 'binary' };
    }

    // Default fallback - cargo works everywhere with Rust installed
    return { os: 'unknown', recommendedTab: 'cargo' };
}

/**
 * Switch to a specific install tab
 * @param {string} tabName - The tab to activate
 * @param {boolean} [addRecommendedBadge=false] - Whether to show recommended badge
 */
export function switchInstallTab(tabName, addRecommendedBadge = false) {
    const tabs = document.querySelectorAll('.install-tab');
    const panels = document.querySelectorAll('.install-panel');

    // Deactivate all tabs and panels
    tabs.forEach((tab) => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        // Remove any existing recommended badge
        const badge = tab.querySelector('.recommended-badge');
        if (badge) badge.remove();
    });
    panels.forEach((panel) => panel.classList.remove('active'));

    // Activate the selected tab and panel
    const selectedTab = document.querySelector(`.install-tab[data-tab="${tabName}"]`);
    const selectedPanel = document.getElementById(`panel-${tabName}`);

    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.setAttribute('aria-selected', 'true');

        // Add recommended badge if this is the OS-detected recommendation
        if (addRecommendedBadge) {
            const badge = document.createElement('span');
            badge.className = 'recommended-badge';
            badge.textContent = 'Best';
            selectedTab.appendChild(badge);
        }
    }
    if (selectedPanel) {
        selectedPanel.classList.add('active');
    }
}

/**
 * Initialize install tabs with OS detection
 */
export function initInstallTabs() {
    const installSection = document.getElementById('install-section');
    if (!installSection) return;

    // Detect OS and set recommended tab
    const { recommendedTab } = detectOS();
    switchInstallTab(recommendedTab, true);

    // Add click handlers to tabs
    const tabs = document.querySelectorAll('.install-tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            if (tabName) {
                // When user manually clicks, don't show recommended badge
                switchInstallTab(tabName, false);
            }
        });
    });

    // Add keyboard navigation
    tabs.forEach((tab, index) => {
        /** @type {HTMLElement} */ (tab).addEventListener('keydown', (e) => {
            const keyEvent = /** @type {KeyboardEvent} */ (e);
            const tabsArray = Array.from(tabs);
            let newIndex = index;

            if (keyEvent.key === 'ArrowRight' || keyEvent.key === 'ArrowDown') {
                keyEvent.preventDefault();
                newIndex = (index + 1) % tabsArray.length;
            } else if (keyEvent.key === 'ArrowLeft' || keyEvent.key === 'ArrowUp') {
                keyEvent.preventDefault();
                newIndex = (index - 1 + tabsArray.length) % tabsArray.length;
            } else if (keyEvent.key === 'Home') {
                keyEvent.preventDefault();
                newIndex = 0;
            } else if (keyEvent.key === 'End') {
                keyEvent.preventDefault();
                newIndex = tabsArray.length - 1;
            }

            if (newIndex !== index) {
                const newTab = /** @type {HTMLElement} */ (tabsArray[newIndex]);
                newTab.focus();
                const tabName = newTab.getAttribute('data-tab');
                if (tabName) switchInstallTab(tabName, false);
            }
        });
    });
}

/**
 * Copy install command to clipboard with visual feedback
 * @param {string} command - The command to copy
 * @param {HTMLElement} button - The button element that was clicked
 */
export function copyInstallCommand(command, button) {
    navigator.clipboard.writeText(command).then(() => {
        // Show success state
        button.classList.add('copied');

        // Store original children and replace with check icon
        const originalChildren = Array.from(button.childNodes).map((node) => node.cloneNode(true));
        button.replaceChildren(createCheckIcon('w-5 h-5'));

        showToast('Copied to clipboard!');

        // Revert after delay
        setTimeout(() => {
            button.classList.remove('copied');
            button.replaceChildren(...originalChildren);
        }, 2000);
    });
}
