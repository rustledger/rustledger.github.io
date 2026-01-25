// Entry point for rustfava page
import { fetchRustfavaInfo } from './github.js';
import { initInstallTabs, initCopyButtons } from './install.js';
import { initScrollReveal } from './ui.js';
import './style.css';

/**
 * Initialize lightbox for screenshot previews
 */
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    /** @type {HTMLImageElement | null} */
    const lightboxImg = /** @type {HTMLImageElement | null} */ (
        document.getElementById('lightbox-img')
    );
    if (!lightbox || !lightboxImg) return;

    // Open lightbox when clicking on screenshot
    /** @type {NodeListOf<HTMLElement>} */
    const buttons = document.querySelectorAll('[data-lightbox]');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const src = btn.dataset.lightbox || '';
            /** @type {HTMLImageElement | null} */
            const img = btn.querySelector('img');
            const alt = img?.alt || '';
            lightboxImg.src = src;
            lightboxImg.alt = alt;
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
        });
    });

    // Close lightbox when clicking anywhere
    lightbox.addEventListener('click', () => {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
        lightboxImg.src = '';
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            lightboxImg.src = '';
        }
    });
}

/**
 * Initialize rustfava page
 */
function init() {
    // Fetch GitHub info for rustfava
    fetchRustfavaInfo();

    // Initialize scroll reveal animations
    initScrollReveal();

    // Initialize install tabs and copy buttons
    initInstallTabs();
    initCopyButtons();

    // Initialize lightbox
    initLightbox();
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
