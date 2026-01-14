# Contributing to rustledger.github.io

Thanks for your interest in contributing to the rustledger website!

## Development Setup

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm

### Getting Started

```bash
# Clone the repo
git clone https://github.com/rustledger/rustledger.github.io.git
cd rustledger.github.io

# Install dependencies
npm install

# Start dev server
npm run dev
```

The site will be available at http://localhost:8080

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint code with ESLint |
| `npm run typecheck` | Type check with TypeScript |
| `npm run test` | Run tests with Vitest |

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
   npm run format:check
   npm run lint
   npm run typecheck
   npm run test
   ```
4. Submit a pull request

## Code Style

- We use Prettier for formatting (run `npm run format`)
- We use ESLint for linting
- TypeScript checking is enabled via JSDoc comments

## WASM Package

The WASM package (`pkg/`) is not committed to this repo. It's fetched from [rustledger releases](https://github.com/rustledger/rustledger/releases) during the build process.

For local development, you can either:
1. Let the CI fetch it (for production builds)
2. Build it locally from the [rustledger repo](https://github.com/rustledger/rustledger)

## Questions?

Open an issue or check the [main rustledger repo](https://github.com/rustledger/rustledger).
