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
| `bun run lint` | Lint code with ESLint |
| `bun run typecheck` | Type check with TypeScript |
| `bun run test` | Run tests with Vitest |

## Project Structure

```
├── public/           # Static assets (copied to dist/)
│   ├── 404.html
│   ├── i             # Install script
│   └── *.png, *.svg
├── src/
│   ├── main.js       # Main application logic
│   ├── editor.js     # CodeMirror editor setup
│   ├── style.css     # Tailwind styles
│   └── utils.js      # Utility functions
├── index.html        # Main HTML entry
└── vite.config.js    # Vite configuration
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

## Code Style

- We use Prettier for formatting (run `bun run format`)
- We use ESLint for linting
- TypeScript checking is enabled via JSDoc comments

## WASM Package

The WASM package (`pkg/`) is not committed to this repo. It's fetched from [rustledger releases](https://github.com/rustledger/rustledger/releases) during the build process.

For local development, you can either:
1. Let the CI fetch it (for production builds)
2. Build it locally from the [rustledger repo](https://github.com/rustledger/rustledger)

## Questions?

Open an issue or check the [main rustledger repo](https://github.com/rustledger/rustledger).
