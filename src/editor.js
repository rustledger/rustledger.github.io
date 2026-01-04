import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration, ViewPlugin } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, StreamLanguage } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Beancount syntax definition using StreamLanguage
const beancountLanguage = StreamLanguage.define({
    token(stream, state) {
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
        if (stream.match(/\b(open|close|commodity|pad|event|query|note|document|custom|balance|price|txn|pushtag|poptag|include|option|plugin)\b/)) {
            return 'keyword';
        }

        // Transaction flags
        if (stream.match(/[*!&#?%PSTCURM]/)) {
            return 'operator';
        }

        // Accounts (Assets:Something:Else) - skip tokenization, let decorations handle coloring
        if (stream.match(/[A-Z][A-Za-z0-9-]*:[A-Za-z0-9-:]+/)) {
            return null;  // No syntax highlight, decorations will colorize
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
    }
});

// Dark theme matching the site's aesthetic
const darkTheme = EditorView.theme({
    '&': {
        backgroundColor: 'transparent',
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: '14px',
        height: '100%'
    },
    '.cm-content': {
        caretColor: 'white',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
        padding: '16px 0'
    },
    '.cm-cursor': {
        borderLeftColor: 'white'
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgba(255, 255, 255, 0.15)'
    },
    '.cm-gutters': {
        backgroundColor: 'transparent',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.25)',
        minWidth: '3rem'
    },
    '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 8px',
        minWidth: '2.5rem',
        textAlign: 'right'
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'rgba(255, 255, 255, 0.5)'
    },
    '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.03)'
    },
    '.cm-line': {
        padding: '0 16px'
    },
    '&.cm-focused': {
        outline: 'none'
    },
    '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
        lineHeight: '1.5'
    }
}, { dark: true });

// Syntax highlighting colors
const highlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic' },
    { tag: tags.string, color: '#fca5a5' },
    { tag: tags.number, color: '#fcd34d' },
    { tag: tags.atom, color: '#fdba74' },        // Currency
    { tag: tags.keyword, color: '#c4b5fd' },     // Directives
    { tag: tags.operator, color: '#fbbf24' },    // Flags
    { tag: tags.variableName, color: '#86efac' }, // Accounts (fallback, overridden by decorations)
    { tag: tags.labelName, color: '#67e8f9' },   // Tags
    { tag: tags.link, color: '#f0abfc' }         // Links
]);

// Account hierarchy colors (matching main.js)
const accountColors = [
    '#22d3ee',  // cyan-400 - Root (Assets, Expenses, etc.)
    '#5eead4',  // teal-300 - Level 1
    '#6ee7b7',  // emerald-300 - Level 2
    '#fcd34d',  // amber-300 - Level 3
    '#fdba74'   // orange-300 - Level 4+
];

// Create decoration marks for each account level with !important to override syntax highlighting
const accountDecorations = accountColors.map((color) =>
    Decoration.mark({ attributes: { style: `color: ${color} !important` } })
);
const colonDecoration = Decoration.mark({ attributes: { style: 'color: rgba(255, 255, 255, 0.5) !important' } });

// Account colorization theme (fallback, inline styles take precedence)
const accountTheme = EditorView.baseTheme({});

// ViewPlugin to colorize account hierarchy
const accountColorizer = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view) {
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
}, {
    decorations: v => v.decorations
});

// Error line decoration
const errorLineDecoration = EditorView.baseTheme({
    '.cm-error-line': {
        backgroundColor: 'rgba(239, 68, 68, 0.15)'
    }
});

// Create editor instance
export function createEditor(container, initialContent, onChange) {
    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
        }
    });

    const state = EditorState.create({
        doc: initialContent,
        extensions: [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
            beancountLanguage,
            syntaxHighlighting(highlightStyle),
            darkTheme,
            accountTheme,
            accountColorizer,
            errorLineDecoration,
            updateListener,
            EditorView.lineWrapping
        ]
    });

    const view = new EditorView({
        state,
        parent: container
    });

    return {
        view,
        getContent() {
            return view.state.doc.toString();
        },
        setContent(content) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: content
                }
            });
        },
        highlightErrorLines(lineNumbers) {
            // For now, we'll just use CSS classes
            // A more sophisticated approach would use decorations
            const scroller = container.querySelector('.cm-scroller');
            if (scroller) {
                scroller.querySelectorAll('.cm-line').forEach((line, idx) => {
                    if (lineNumbers.has(idx + 1)) {
                        line.classList.add('cm-error-line');
                    } else {
                        line.classList.remove('cm-error-line');
                    }
                });
            }
        }
    };
}
