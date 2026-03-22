# CLAUDE.md

Project-specific instructions for Claude Code.

## Project Overview

rustledger.github.io is the website and WASM playground for rustledger. It uses:
- Vite for building
- Tailwind CSS for styling
- CodeMirror for the editor
- `@rustledger/wasm` npm package for the WASM runtime

## Build & Deploy

- **CI uses bun**, not npm. The `bun.lock` file controls dependency versions.
- `package-lock.json` is for local npm usage but CI ignores it.
- Workflow: `.github/workflows/deploy.yml`
- Deploy triggers: push to main, `wasm-release` dispatch, `docs-update` dispatch, manual

## Documentation

The `/docs/` path is served by VitePress. **Docs content comes from the main rustledger repo.**

- **Source of truth**: `rustledger/rustledger/docs/`
- **VitePress config**: `docs/.vitepress/config.js` (maintained here)
- **Auto-rebuild**: When `docs/**` changes in rustledger repo, it triggers a `docs-update` dispatch

### How it works
1. Push to `rustledger/docs/**` triggers `.github/workflows/docs-update.yml`
2. That workflow dispatches `docs-update` event to this repo
3. This repo's deploy workflow fetches latest docs and rebuilds

### Local docs development
```bash
npm run docs:dev     # VitePress dev server
npm run docs:build   # Build docs
npm run docs:preview # Preview built docs
```

## Lessons Learned

### bun.lock vs package-lock.json
When updating dependencies, remember that CI uses `bun.lock`. If you update with npm locally, the `bun.lock` won't change and CI will use old versions. Either:
1. Use `bun update <package>` to update
2. Delete `bun.lock` to force regeneration in CI

### WASM Version
The `@rustledger/wasm` package version in `bun.lock` determines what the website uses. The status bar shows the version from `wasm.version()`. If it's stale, check `bun.lock`.

### Account Tree Caching
The account tree caches results to handle validation errors gracefully. When the ledger has errors, the tree shows the last successful data instead of "No accounts found".

## Commands

```bash
npm run dev          # Local dev server on port 8080
npm run build        # Production build
npm run test         # Run tests
npm run format       # Format with prettier
npm run lint         # ESLint
```

## Key Files

- `index.html` - Main landing page
- `src/main.js` - Playground initialization
- `src/account-tree.js` - Account tree sidebar
- `src/wasm.js` - WASM loading and API
- `pkg/` - WASM files copied from node_modules at build time
