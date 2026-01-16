import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createEditor } from './editor.js';

describe('createEditor', () => {
    let container;
    let editor;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'editor-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (editor && editor.destroy) {
            editor.destroy();
        }
        container?.remove();
    });

    it('creates an editor with initial content', () => {
        const initialContent = '2024-01-01 open Assets:Bank USD';
        editor = createEditor(container, initialContent, () => {});

        expect(editor).toBeDefined();
        expect(editor.getContent()).toBe(initialContent);
    });

    it('returns editor interface with required methods', () => {
        editor = createEditor(container, '', () => {});

        expect(typeof editor.getContent).toBe('function');
        expect(typeof editor.setContent).toBe('function');
        expect(typeof editor.highlightErrorLines).toBe('function');
        expect(typeof editor.setKnownAccounts).toBe('function');
        expect(typeof editor.destroy).toBe('function');
    });

    it('can set and get content', () => {
        editor = createEditor(container, 'initial', () => {});

        editor.setContent('new content');
        expect(editor.getContent()).toBe('new content');
    });

    it('calls onChange callback when content changes', async () => {
        let changedContent = '';
        editor = createEditor(container, 'initial', (content) => {
            changedContent = content;
        });

        editor.setContent('changed');

        // Wait for callback to be triggered
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(changedContent).toBe('changed');
    });

    it('can highlight error lines', () => {
        editor = createEditor(container, 'line 1\nline 2\nline 3', () => {});

        // Should not throw
        const errorLines = new Set([2]);
        const errorMessages = new Map([[2, 'Test error']]);
        expect(() => editor.highlightErrorLines(errorLines, errorMessages)).not.toThrow();
    });

    it('can set known accounts for autocomplete', () => {
        editor = createEditor(container, '', () => {});

        const accounts = new Set(['Assets:Bank', 'Expenses:Food']);
        expect(() => editor.setKnownAccounts(accounts)).not.toThrow();
    });

    it('cleans up on destroy', () => {
        editor = createEditor(container, '', () => {});
        const view = editor.view;

        editor.destroy();

        // View should be destroyed
        expect(view.dom.isConnected).toBe(false);
    });

    it('creates CodeMirror DOM structure', () => {
        editor = createEditor(container, '', () => {});

        expect(container.querySelector('.cm-editor')).not.toBeNull();
        expect(container.querySelector('.cm-content')).not.toBeNull();
    });
});
