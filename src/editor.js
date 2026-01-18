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
    hoverTooltip,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, StreamLanguage } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { getCompletions, getHoverInfo, getDefinition } from './wasm.js';

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

// Map WASM completion kinds to CodeMirror types
/** @type {Record<string, string>} */
const completionKindMap = {
    keyword: 'keyword',
    account: 'variable',
    accountsegment: 'variable',
    currency: 'constant',
    payee: 'text',
    date: 'text',
    text: 'text',
};

/**
 * Create WASM-powered autocompletion extension
 * @param {() => string} getSource
 */
function beancountCompletions(getSource) {
    return autocompletion({
        override: [
            async (context) => {
                const pos = context.pos;
                const line = context.state.doc.lineAt(pos);
                const lineNum = line.number - 1; // 0-indexed for WASM
                const character = pos - line.from;

                const result = await getCompletions(getSource(), lineNum, character);
                if (!result?.completions?.length) return null;

                const word = context.matchBefore(/[\w:"-]*/);

                return {
                    from: word?.from ?? pos,
                    options: result.completions.map((c) => ({
                        label: c.label,
                        type: completionKindMap[c.kind] || 'text',
                        detail: c.detail,
                        apply: c.insertText || c.label,
                    })),
                    validFor: /[\w:"-]*/,
                };
            },
        ],
        activateOnTyping: true,
    });
}

/**
 * Create WASM-powered hover tooltip extension
 * @param {() => string} getSource
 */
function beancountHover(getSource) {
    return hoverTooltip(
        async (view, pos) => {
            const line = view.state.doc.lineAt(pos);
            const lineNum = line.number - 1;
            const character = pos - line.from;

            const info = await getHoverInfo(getSource(), lineNum, character);
            if (!info) return null;

            // Calculate positions from range if provided
            let startPos = pos,
                endPos = pos;
            if (info.range) {
                const startLine = view.state.doc.line(info.range.start.line + 1);
                startPos = startLine.from + info.range.start.character;
                const endLine = view.state.doc.line(info.range.end.line + 1);
                endPos = endLine.from + info.range.end.character;
            }

            return {
                pos: startPos,
                end: endPos,
                above: true,
                create: () => {
                    const dom = document.createElement('div');
                    dom.className = 'cm-hover-tooltip';
                    dom.textContent = info.contents;
                    return { dom };
                },
            };
        },
        { hoverTime: 300 }
    );
}

/**
 * Create WASM-powered go-to-definition extension (Ctrl/Cmd+Click)
 * @param {() => string} getSource
 */
function beancountGoToDefinition(getSource) {
    return EditorView.domEventHandlers({
        mousedown: (event, view) => {
            if (!event.ctrlKey && !event.metaKey) return false;

            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos === null) return false;

            const line = view.state.doc.lineAt(pos);
            const lineNum = line.number - 1;
            const character = pos - line.from;

            // Fire and forget - async navigation
            getDefinition(getSource(), lineNum, character).then((def) => {
                if (!def) return;

                // Navigate to definition
                const targetLine = view.state.doc.line(def.line + 1);
                const targetPos = targetLine.from + def.character;

                view.dispatch({
                    selection: { anchor: targetPos },
                    effects: EditorView.scrollIntoView(targetPos, { y: 'center' }),
                });
            });

            // Prevent default but don't block - navigation happens async
            event.preventDefault();
            return true;
        },
    });
}

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

    // Helper to get current source (used by WASM extensions)
    const getSource = () => view.state.doc.toString();

    const state = EditorState.create({
        doc: initialContent,
        extensions: [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap]),
            beancountLanguage,
            syntaxHighlighting(highlightStyle),
            darkTheme,
            accountTheme,
            accountColorizer,
            errorLineDecoration,
            updateListener,
            // WASM-powered LSP-like features
            beancountCompletions(getSource),
            beancountHover(getSource),
            beancountGoToDefinition(getSource),
            EditorView.lineWrapping,
        ],
    });

    const view = new EditorView({
        state,
        parent: container,
    });

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
        /**
         * Clean up editor resources and event listeners
         */
        destroy() {
            view.destroy();
        },
    };
}
