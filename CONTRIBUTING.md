# Contributing to rustledger.github.io

Thanks for your interest in contributing to the rustledger website!

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) (fast JavaScript runtime and package manager)

### Getting Started

```bash
# Clone the repo
git clone https://github.com/rustledger/rustledger.github.io.git
cd rustledger.github.io

# Install dependencies
bun install

# Start dev server
bun run dev
```

The site will be available at http://localhost:8080

### Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run format` | Format code with Prettier |
| `bun run format:check` | Check formatting |
| `bun run lint` | Lint code with ESLint |
| `bun run typecheck` | Type check with TypeScript |
| `bun run test` | Run unit tests with Vitest |
| `bun run test:e2e` | Run E2E tests with Playwright |

## Project Structure

```
├── public/              # Static assets (copied to dist/)
│   ├── 404.html
│   ├── i                # Install script
│   └── *.png, *.svg
├── src/
│   ├── main.js          # Application entry point & orchestration
│   ├── editor.js        # CodeMirror editor setup & Beancount syntax
│   ├── wasm.js          # WASM loading & API wrapper
│   ├── query.js         # BQL query execution & autocomplete
│   ├── plugins.js       # Plugin toggle management
│   ├── ui.js            # UI utilities (toast, resizer, animations)
│   ├── examples.js      # Example ledger files
│   ├── utils.js         # Shared utility functions
│   ├── style.css        # Tailwind styles
│   ├── global.d.ts      # TypeScript declarations
│   └── *.test.js        # Unit tests
├── e2e/                 # Playwright E2E tests
├── index.html           # Main HTML entry
├── vite.config.js       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## Architecture

### Module Overview

- **main.js** - Application initialization, event handling, coordinates other modules
- **editor.js** - CodeMirror 6 setup with custom Beancount syntax highlighting and account autocomplete
- **wasm.js** - Loads and wraps the rustledger WASM module with user-friendly error handling
- **query.js** - BQL query input with autocomplete, result formatting
- **plugins.js** - Manages Beancount plugin directives in the editor
- **ui.js** - Reusable UI components (toast notifications, panel resizer, scroll animations)
- **examples.js** - Pre-built example ledger files for the playground

### Data Flow

```
User Input → Editor → WASM Validation → Output Panel
                ↓
         Query Input → WASM Query → Results Table
```

## Making Changes

1. Create a branch for your changes
2. Make your changes
3. Ensure all checks pass:
   ```bash
   bun run format:check
   bun run lint
   bun run typecheck
   bun run test
   ```
4. Submit a pull request

### Pre-commit Hooks

This project uses Husky and lint-staged to run checks before commits:
- Prettier formatting
- ESLint fixes
- Type checking

## Code Style

- **Formatting**: Prettier (run `bun run format`)
- **Linting**: ESLint with recommended rules
- **Types**: TypeScript strict mode via JSDoc comments
- **Naming**: camelCase for functions/variables, PascalCase for types
- **Unused params**: Prefix with underscore (e.g., `_event`)

## Testing

### Unit Tests (Vitest)

```bash
bun run test        # Run once
bun run test:watch  # Watch mode
```

Tests are co-located with source files (`*.test.js`).

### E2E Tests (Playwright)

```bash
bun run test:e2e    # Run E2E tests
```

E2E tests are in the `e2e/` directory.

## WASM Package

The WASM package (`pkg/`) is not committed to this repo. It's fetched from [rustledger releases](https://github.com/rustledger/rustledger/releases) during the build process.

For local development, you can either:
1. Let the CI fetch it (for production builds)
2. Build it locally from the [rustledger repo](https://github.com/rustledger/rustledger):
   ```bash
   cd ../rustledger
   wasm-pack build --target web
   cp -r pkg ../rustledger.github.io/
   ```

## Accessibility

We aim for WCAG AA compliance:
- All interactive elements have ARIA labels
- Keyboard navigation works throughout
- Color contrast meets 4.5:1 minimum
- Skip links for screen readers

## Questions?

Open an issue or check the [main rustledger repo](https://github.com/rustledger/rustledger).
