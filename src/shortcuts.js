// Keyboard shortcuts management

/**
 * Show keyboard shortcuts modal
 */
export function showShortcutsModal() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // Focus first focusable element
        const closeBtn = modal.querySelector('button');
        closeBtn?.focus();
    }
}

/**
 * Hide keyboard shortcuts modal
 */
export function hideShortcutsModal() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Check if user is currently typing in an input field
 * @returns {boolean}
 */
export function isUserTyping() {
    return (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        !!document.activeElement?.closest('.cm-editor')
    );
}

/**
 * Initialize keyboard shortcuts
 * @param {{ onFormat: () => void }} handlers - Callback handlers for shortcuts
 */
export function initKeyboardShortcuts(handlers) {
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('shortcuts-modal');
        const isModalOpen = modal && !modal.classList.contains('hidden');

        // Close modal on Escape
        if (e.key === 'Escape' && isModalOpen) {
            e.preventDefault();
            hideShortcutsModal();
            return;
        }

        // Don't trigger shortcuts when typing in inputs (except for Escape)
        if (isModalOpen) return;

        // Show help on ?
        if (e.key === '?' && !isUserTyping()) {
            e.preventDefault();
            showShortcutsModal();
            return;
        }

        // Format on Ctrl+Shift+F
        if (e.key === 'F' && e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            handlers.onFormat();
            return;
        }
    });

    // Close modal on backdrop click
    const modal = document.getElementById('shortcuts-modal');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideShortcutsModal();
        }
    });
}
