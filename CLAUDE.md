# CLAUDE.md

Project-specific instructions for Claude Code.

## Project Overview

rustledger.github.io is the website and WASM playground for rustledger. It uses:
- Vite for building
- Tailwind CSS for styling
- CodeMirror for the editor
- `@rustledger/wasm` npm package for the WASM runtime

## Build & Deploy

- **bun is the only package manager.** `bun.lock` is the single source of truth for
  dependency versions, locally and in CI. Install with `bun install`.
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

### There is one lockfile, and it is `bun.lock`
`package-lock.json` used to be committed alongside it "for local npm usage".
Keeping two lockfiles cost more than it was worth:

- they drifted. `bun.lock` pinned `js-yaml` 4.1.1 while `package-lock.json`
  said 4.3.0
- Dependabot picked `package-lock.json`, so its PRs bumped a file CI never
  installs from. Merging one would have closed a security alert while the
  deployed site kept shipping the vulnerable version
- updating with npm locally left `bun.lock` untouched, so CI silently used
  the old versions

Update dependencies with `bun update <package>` or `bun install`, and commit
`bun.lock`.

### Dependency overrides must be FLAT
Bun does not support npm's nested `overrides` form, nor path scoped
`resolutions` like `"vitepress/vite"`. It warns and ignores them, so the pins
do nothing and the lockfile drifts on every install. Write them flat:

```json
"overrides": { "vite": "^7.3.5", "esbuild": "^0.28.1" }
```

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
