// @ts-check
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import {
    EditorView,
    keymap,
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter,
    Decoration,
    ViewPlugin,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, StreamLanguage } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * @typedef {import('@codemirror/view').ViewUpdate} ViewUpdate
 * @typedef {import('@codemirror/view').DecorationSet} DecorationSet
 */

// Beancount syntax definition using StreamLanguage
const beancountLanguage = StreamLanguage.define({
    token(stream, _state) {
        // Comments
        if (stream.match(/;.*/)) {
            return 'comment';
        }

        // Strings
        if (stream.match(/"[^"]*"/)) {
            return 'string';
        }

        // Dates (YYYY-MM-DD)
        if (stream.match(/\d{4}-\d{2}-\d{2}/)) {
            return 'number';
        }

        // Amounts with currency
        if (stream.match(/-?[\d,]+\.?\d*\s+[A-Z][A-Z0-9_'-]*/)) {
            return 'number';
        }

        // Numbers
        if (stream.match(/-?[\d,]+\.?\d*/)) {
            return 'number';
        }

        // Currency (standalone)
        if (stream.match(/[A-Z][A-Z0-9_'-]{0,23}(?=\s|$)/)) {
            return 'atom';
        }

        // Directives
        if (
            stream.match(
                /\b(open|close|commodity|pad|event|query|note|document|custom|balance|price|txn|pushtag|poptag|include|option|plugin)\b/
            )
        ) {
            return 'keyword';
        }

        // Transaction flags
        if (stream.match(/[*!&#?%PSTCURM]/)) {
            return 'operator';
        }

        // Accounts (Assets:Something:Else) - skip tokenization, let decorations handle coloring
        if (stream.match(/[A-Z][A-Za-z0-9-]*:[A-Za-z0-9-:]+/)) {
            return null; // No syntax highlight, decorations will colorize
        }

        // Tags
        if (stream.match(/#[A-Za-z0-9_-]+/)) {
            return 'labelName';
        }

        // Links
        if (stream.match(/\^[A-Za-z0-9_-]+/)) {
            return 'link';
        }

        // Skip whitespace
        if (stream.eatSpace()) {
            return null;
        }

        // Default: advance one character
        stream.next();
        return null;
    },
    startState() {
        return {};
    },
});

// Dark theme matching the site's aesthetic
const darkTheme = EditorView.theme(
    {
        '&': {
            backgroundColor: 'transparent',
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '14px',
            height: '100%',
        },
        '.cm-content': {
            caretColor: 'white',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            padding: '16px 0',
        },
        '.cm-cursor': {
            borderLeftColor: 'white',
        },
        '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
        },
        '.cm-gutters': {
            backgroundColor: 'transparent',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.25)',
            minWidth: '3rem',
        },
        '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 8px 0 8px',
            minWidth: '2.5rem',
            textAlign: 'right',
        },
        '.cm-activeLineGutter': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'rgba(255, 255, 255, 0.5)',
        },
        '.cm-activeLine': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
        },
        '.cm-line': {
            padding: '0 16px',
        },
        '&.cm-focused': {
            outline: 'none',
        },
        '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            lineHeight: '1.5',
        },
    },
    { dark: true }
);

// Syntax highlighting colors
const highlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic' },
    { tag: tags.string, color: '#fca5a5' },
    { tag: tags.number, color: '#fcd34d' },
    { tag: tags.atom, color: '#fdba74' }, // Currency
    { tag: tags.keyword, color: '#c4b5fd' }, // Directives
    { tag: tags.operator, color: '#fbbf24' }, // Flags
    { tag: tags.variableName, color: '#86efac' }, // Accounts (fallback, overridden by decorations)
    { tag: tags.labelName, color: '#67e8f9' }, // Tags
    { tag: tags.link, color: '#f0abfc' }, // Links
]);

// Account hierarchy colors (matching main.js)
const accountColors = [
    '#22d3ee', // cyan-400 - Root (Assets, Expenses, etc.)
    '#5eead4', // teal-300 - Level 1
    '#6ee7b7', // emerald-300 - Level 2
    '#fcd34d', // amber-300 - Level 3
    '#fdba74', // orange-300 - Level 4+
];

// Create decoration marks for each account level with !important to override syntax highlighting
const accountDecorations = accountColors.map((color) =>
    Decoration.mark({ attributes: { style: `color: ${color} !important` } })
);
const colonDecoration = Decoration.mark({
    attributes: { style: 'color: rgba(255, 255, 255, 0.5) !important' },
});

// Account colorization theme (fallback, inline styles take precedence)
const accountTheme = EditorView.baseTheme({});

// ViewPlugin to colorize account hierarchy
const accountColorizer = ViewPlugin.fromClass(
    class {
        /** @type {DecorationSet} */
        decorations;

        /** @param {EditorView} view */
        constructor(view) {
            this.decorations = this.buildDecorations(view);
        }

        /** @param {ViewUpdate} update */
        update(update) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        /**
         * @param {EditorView} view
         * @returns {DecorationSet}
         */
        buildDecorations(view) {
            /** @type {RangeSetBuilder<Decoration>} */
            const builder = new RangeSetBuilder();
            const accountRegex = /[A-Z][A-Za-z0-9-]*(?::[A-Za-z0-9-]+)+/g;

            for (const { from, to } of view.visibleRanges) {
                const text = view.state.sliceDoc(from, to);
                let match;

                while ((match = accountRegex.exec(text)) !== null) {
                    const accountStart = from + match.index;
                    const parts = match[0].split(':');
                    let pos = accountStart;

                    for (let i = 0; i < parts.length; i++) {
                        const part = parts[i];
                        const partEnd = pos + part.length;
                        const colorIndex = Math.min(i, accountDecorations.length - 1);

                        builder.add(pos, partEnd, accountDecorations[colorIndex]);

                        if (i < parts.length - 1) {
                            // Add colon decoration
                            builder.add(partEnd, partEnd + 1, colonDecoration);
                            pos = partEnd + 1;
                        } else {
                            pos = partEnd;
                        }
                    }
                }
            }

            return builder.finish();
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);

// Error line decoration
const errorLineDecoration = EditorView.baseTheme({
    '.cm-error-line': {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
});

/**
 * @typedef {{
 *   dropdown: HTMLDivElement | null,
 *   items: string[],
 *   selectedIndex: number,
 *   startPos: number,
 *   active: boolean
 * }} AutocompleteState
 */

/** @type {AutocompleteState} */
const accountAutocomplete = {
    dropdown: null,
    items: [],
    selectedIndex: -1,
    startPos: 0,
    active: false,
};

/** Create account autocomplete dropdown */
function createAccountAutocompleteDropdown() {
    if (accountAutocomplete.dropdown) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'editor-autocomplete hidden';
    document.body.appendChild(dropdown);
    accountAutocomplete.dropdown = dropdown;
}

/**
 * Show account autocomplete
 * @param {EditorView} view
 * @param {string[]} accounts
 * @param {string} filter
 * @param {number} startPos
 */
function showAccountAutocomplete(view, accounts, filter, startPos) {
    if (!accountAutocomplete.dropdown) createAccountAutocompleteDropdown();

    const dropdown = /** @type {HTMLDivElement} */ (accountAutocomplete.dropdown);
    const lowerFilter = filter.toLowerCase();

    // Filter accounts
    accountAutocomplete.items = accounts
        .filter((a) => a.toLowerCase().includes(lowerFilter))
        .slice(0, 10);

    if (accountAutocomplete.items.length === 0) {
        hideAccountAutocomplete();
        return;
    }

    accountAutocomplete.selectedIndex = 0;
    accountAutocomplete.startPos = startPos;
    accountAutocomplete.active = true;

    // Render items
    dropdown.innerHTML = accountAutocomplete.items
        .map((item, idx) => {
            const parts = item.split(':');
            const coloredParts = parts
                .map((part, i) => {
                    const colors = ['#22d3ee', '#5eead4', '#6ee7b7', '#fcd34d', '#fdba74'];
                    const color = colors[Math.min(i, colors.length - 1)];
                    return `<span style="color: ${color}">${part}</span>`;
                })
                .join('<span style="color: rgba(255,255,255,0.5)">:</span>');

            return `<div class="editor-autocomplete-item ${idx === 0 ? 'selected' : ''}" data-index="${idx}">${coloredParts}</div>`;
        })
        .join('');

    // Position dropdown
    const cursorCoords = view.coordsAtPos(view.state.selection.main.head);
    if (cursorCoords) {
        dropdown.style.left = `${cursorCoords.left}px`;
        dropdown.style.top = `${cursorCoords.bottom + 4}px`;
    }

    dropdown.classList.remove('hidden');

    // Add click handlers
    dropdown.querySelectorAll('.editor-autocomplete-item').forEach((el) => {
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const idx = parseInt(/** @type {HTMLElement} */ (el).dataset.index || '0');
            selectAccountAutocompleteItem(view, idx);
        });
    });
}

/** Hide account autocomplete */
function hideAccountAutocomplete() {
    if (accountAutocomplete.dropdown) {
        accountAutocomplete.dropdown.classList.add('hidden');
    }
    accountAutocomplete.active = false;
    accountAutocomplete.items = [];
    accountAutocomplete.selectedIndex = -1;
}

/**
 * Select account autocomplete item
 * @param {EditorView} view
 * @param {number} index
 */
function selectAccountAutocompleteItem(view, index) {
    if (index < 0 || index >= accountAutocomplete.items.length) return;

    const item = accountAutocomplete.items[index];
    const from = accountAutocomplete.startPos;
    const to = view.state.selection.main.head;

    view.dispatch({
        changes: { from, to, insert: item },
        selection: { anchor: from + item.length },
    });

    hideAccountAutocomplete();
}

/**
 * Update autocomplete selection
 * @param {number} direction
 */
function updateAccountAutocompleteSelection(direction) {
    if (accountAutocomplete.items.length === 0) return;

    accountAutocomplete.selectedIndex += direction;
    if (accountAutocomplete.selectedIndex < 0) {
        accountAutocomplete.selectedIndex = accountAutocomplete.items.length - 1;
    }
    if (accountAutocomplete.selectedIndex >= accountAutocomplete.items.length) {
        accountAutocomplete.selectedIndex = 0;
    }

    // Update visual selection
    const dropdown = accountAutocomplete.dropdown;
    if (!dropdown) return;
    dropdown.querySelectorAll('.editor-autocomplete-item').forEach((el, idx) => {
        if (idx === accountAutocomplete.selectedIndex) {
            el.classList.add('selected');
            el.scrollIntoView({ block: 'nearest' });
        } else {
            el.classList.remove('selected');
        }
    });
}

/** @type {Set<string>} Stored accounts for autocomplete (will be set from main.js) */
let knownAccountsRef = new Set();

/**
 * Create editor instance
 * @param {HTMLElement} container
 * @param {string} initialContent
 * @param {((content: string) => void) | null} onChange
 */
export function createEditor(container, initialContent, onChange) {
    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
        }
    });

    // Custom keymap for autocomplete
    const autocompleteKeymap = keymap.of([
        {
            key: 'ArrowDown',
            run: (_view) => {
                if (accountAutocomplete.active) {
                    updateAccountAutocompleteSelection(1);
                    return true;
                }
                return false;
            },
        },
        {
            key: 'ArrowUp',
            run: (_view) => {
                if (accountAutocomplete.active) {
                    updateAccountAutocompleteSelection(-1);
                    return true;
                }
                return false;
            },
        },
        {
            key: 'Enter',
            run: (view) => {
                if (accountAutocomplete.active && accountAutocomplete.selectedIndex >= 0) {
                    selectAccountAutocompleteItem(view, accountAutocomplete.selectedIndex);
                    return true;
                }
                return false;
            },
        },
        {
            key: 'Tab',
            run: (view) => {
                if (accountAutocomplete.active && accountAutocomplete.items.length > 0) {
                    selectAccountAutocompleteItem(
                        view,
                        Math.max(0, accountAutocomplete.selectedIndex)
                    );
                    return true;
                }
                return false;
            },
        },
        {
            key: 'Escape',
            run: (_view) => {
                if (accountAutocomplete.active) {
                    hideAccountAutocomplete();
                    return true;
                }
                return false;
            },
        },
    ]);

    // Account autocomplete trigger on typing
    const autocompleteUpdateListener = EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;

        const view = update.view;
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const lineText = line.text;
        const colInLine = pos - line.from;

        // Find start of current word (looking for account pattern)
        let wordStart = colInLine;
        while (wordStart > 0 && !lineText[wordStart - 1].match(/[\s]/)) {
            wordStart--;
        }

        const currentWord = lineText.slice(wordStart, colInLine);

        // Check if we're typing an account (starts with capital letter and has colon)
        if (currentWord.length >= 2 && /^[A-Z][A-Za-z0-9-]*:?/.test(currentWord)) {
            const accounts = Array.from(knownAccountsRef);
            if (accounts.length > 0) {
                showAccountAutocomplete(view, accounts, currentWord, line.from + wordStart);
            }
        } else {
            hideAccountAutocomplete();
        }
    });

    const state = EditorState.create({
        doc: initialContent,
        extensions: [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            history(),
            autocompleteKeymap,
            keymap.of([...defaultKeymap, ...historyKeymap]),
            beancountLanguage,
            syntaxHighlighting(highlightStyle),
            darkTheme,
            accountTheme,
            accountColorizer,
            errorLineDecoration,
            updateListener,
            autocompleteUpdateListener,
            EditorView.lineWrapping,
        ],
    });

    const view = new EditorView({
        state,
        parent: container,
    });

    // Hide autocomplete when clicking outside - store reference for cleanup
    /** @param {MouseEvent} e */
    const handleClickOutside = (e) => {
        const target = /** @type {Node | null} */ (e.target);
        if (
            accountAutocomplete.dropdown &&
            target &&
            !accountAutocomplete.dropdown.contains(target)
        ) {
            hideAccountAutocomplete();
        }
    };
    document.addEventListener('click', handleClickOutside);

    return {
        view,
        /** @returns {string} */
        getContent() {
            return view.state.doc.toString();
        },
        /** @param {string} content */
        setContent(content) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: content,
                },
            });
        },
        /**
         * @param {Set<number>} lineNumbers
         * @param {Map<number, string>} errorMessages
         */
        highlightErrorLines(lineNumbers, errorMessages = new Map()) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                const scroller = /** @type {HTMLElement | null} */ (
                    container.querySelector('.cm-scroller')
                );
                if (!scroller) return;

                scroller.querySelectorAll('.cm-line').forEach((line, idx) => {
                    const lineEl = /** @type {HTMLElement} */ (line);
                    const lineNum = idx + 1;
                    if (lineNumbers.has(lineNum)) {
                        lineEl.classList.add('cm-error-line');
                        // Store error message as data attribute
                        if (errorMessages.has(lineNum)) {
                            lineEl.dataset.errorMessage = errorMessages.get(lineNum);
                        }
                    } else {
                        lineEl.classList.remove('cm-error-line');
                        delete lineEl.dataset.errorMessage;
                    }
                });

                // Set up tooltip listeners if not already set
                if (!scroller.dataset.tooltipInit) {
                    scroller.dataset.tooltipInit = 'true';
                    /** @type {HTMLElement | null} */
                    let tooltip = null;

                    scroller.addEventListener('mouseover', (e) => {
                        const target = /** @type {HTMLElement | null} */ (e.target);
                        const errorLine = /** @type {HTMLElement | null} */ (
                            target?.closest('.cm-error-line')
                        );
                        if (errorLine && errorLine.dataset.errorMessage) {
                            // Remove existing tooltip
                            if (tooltip) tooltip.remove();

                            tooltip = document.createElement('div');
                            tooltip.className = 'error-tooltip';
                            tooltip.textContent = errorLine.dataset.errorMessage;

                            // Position offscreen first to measure height without layout thrashing
                            tooltip.style.visibility = 'hidden';
                            tooltip.style.top = '-9999px';
                            document.body.appendChild(tooltip);

                            // Batch all DOM reads together
                            const rect = errorLine.getBoundingClientRect();
                            const tooltipHeight = tooltip.offsetHeight;

                            // Now do all DOM writes
                            const topPosition = rect.top - tooltipHeight - 8;
                            tooltip.style.left = `${rect.left + 20}px`;
                            tooltip.style.top =
                                topPosition < 0 ? `${rect.bottom + 8}px` : `${topPosition}px`;
                            tooltip.style.visibility = 'visible';
                        }
                    });

                    scroller.addEventListener('mouseout', (e) => {
                        const target = /** @type {HTMLElement | null} */ (e.target);
                        const errorLine = target?.closest('.cm-error-line');
                        if (errorLine && tooltip) {
                            tooltip.remove();
                            tooltip = null;
                        }
                    });
                }
            });
        },
        /** @param {Set<string>} accounts */
        setKnownAccounts(accounts) {
            knownAccountsRef = accounts;
        },
        /**
         * Clean up editor resources and event listeners
         */
        destroy() {
            document.removeEventListener('click', handleClickOutside);
            if (accountAutocomplete.dropdown) {
                accountAutocomplete.dropdown.remove();
                accountAutocomplete.dropdown = null;
            }
            view.destroy();
        },
    };
}
