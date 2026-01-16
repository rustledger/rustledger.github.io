import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { showToast, showErrorModal, updateFooterStatus } from './ui.js';

describe('showToast', () => {
    beforeEach(() => {
        // Clean up any existing toasts
        const existing = document.getElementById('toast');
        if (existing) existing.remove();
    });

    afterEach(() => {
        // Clean up after each test
        const existing = document.getElementById('toast');
        if (existing) existing.remove();
    });

    it('creates a toast element', () => {
        showToast('Test message');
        const toast = document.getElementById('toast');
        expect(toast).not.toBeNull();
        expect(toast?.textContent).toBe('Test message');
    });

    it('removes existing toast before creating new one', () => {
        showToast('First message');
        showToast('Second message');
        const toasts = document.querySelectorAll('#toast');
        expect(toasts.length).toBe(1);
        expect(toasts[0].textContent).toBe('Second message');
    });

    it('has correct accessibility attributes', () => {
        showToast('Accessible message');
        const toast = document.getElementById('toast');
        expect(toast?.getAttribute('role')).toBe('status');
        expect(toast?.getAttribute('aria-live')).toBe('polite');
    });

    it('has correct styling classes', () => {
        showToast('Styled message');
        const toast = document.getElementById('toast');
        expect(toast?.className).toContain('fixed');
        expect(toast?.className).toContain('animate-toast');
    });
});

describe('showErrorModal', () => {
    beforeEach(() => {
        const existing = document.getElementById('error-modal');
        if (existing) existing.remove();
    });

    afterEach(() => {
        const existing = document.getElementById('error-modal');
        if (existing) existing.remove();
    });

    it('creates an error modal', () => {
        showErrorModal('Test Error', 'Something went wrong');
        const modal = document.getElementById('error-modal');
        expect(modal).not.toBeNull();
    });

    it('displays the title and message', () => {
        showErrorModal('My Title', 'My detailed message');
        const modal = document.getElementById('error-modal');
        expect(modal?.textContent).toContain('My Title');
        expect(modal?.textContent).toContain('My detailed message');
    });

    it('has correct accessibility attributes', () => {
        showErrorModal('Error', 'Message');
        const modal = document.getElementById('error-modal');
        expect(modal?.getAttribute('role')).toBe('alertdialog');
        expect(modal?.getAttribute('aria-modal')).toBe('true');
        expect(modal?.getAttribute('aria-labelledby')).toBe('error-modal-title');
        expect(modal?.getAttribute('aria-describedby')).toBe('error-modal-desc');
    });

    it('removes existing modal before creating new one', () => {
        showErrorModal('First', 'First message');
        showErrorModal('Second', 'Second message');
        const modals = document.querySelectorAll('#error-modal');
        expect(modals.length).toBe(1);
    });

    it('escapes HTML in title and message', () => {
        showErrorModal('<script>alert("xss")</script>', '<img onerror="alert(1)">');
        const modal = document.getElementById('error-modal');
        expect(modal?.innerHTML).not.toContain('<script>');
        expect(modal?.innerHTML).not.toContain('<img');
        expect(modal?.innerHTML).toContain('&lt;script&gt;');
    });

    it('has refresh and dismiss buttons', () => {
        showErrorModal('Error', 'Message');
        const modal = document.getElementById('error-modal');
        const buttons = modal?.querySelectorAll('button');
        expect(buttons?.length).toBe(2);
    });
});

describe('updateFooterStatus', () => {
    let footerStatus;

    beforeEach(() => {
        footerStatus = document.createElement('span');
        footerStatus.id = 'footer-status';
        document.body.appendChild(footerStatus);
    });

    afterEach(() => {
        footerStatus?.remove();
    });

    it('shows loading state', () => {
        updateFooterStatus('loading');
        expect(footerStatus.innerHTML).toContain('Loading');
    });

    it('shows ready state with version', () => {
        updateFooterStatus('ready', '0.1.0');
        expect(footerStatus.innerHTML).toContain('Ready');
        expect(footerStatus.innerHTML).toContain('0.1.0');
        expect(footerStatus.innerHTML).toContain('text-green-400');
    });

    it('shows error state with message', () => {
        updateFooterStatus('error', undefined, 'Failed to load');
        expect(footerStatus.innerHTML).toContain('Failed to load');
        expect(footerStatus.innerHTML).toContain('text-red-400');
    });

    it('handles missing footer element gracefully', () => {
        footerStatus.remove();
        // Should not throw
        expect(() => updateFooterStatus('ready', '0.1.0')).not.toThrow();
    });
});
