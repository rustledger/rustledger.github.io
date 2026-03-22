---
layout: home
title: rustledger - Modern Plain Text Accounting

hero:
    name: rustledger
    text: Modern Plain Text Accounting
    tagline: Beancount, rewritten in Rust. Accounting in plain text, under your control, forever.
    actions:
        - theme: brand
          text: ⭐ Star on GitHub
          link: https://github.com/rustledger/rustledger

features:
    - icon: 🚀
      title: 10-30x Faster
      details: Pure Rust implementation with zero runtime overhead. Validates 10K transactions in 35ms vs 750ms for Python beancount.
    - icon: 🔄
      title: Drop-in Replacement
      details: Your existing beancount files work unchanged. 100% syntax compatibility with Python beancount.
    - icon: 📊
      title: Full BQL Support
      details: Complete Beancount Query Language implementation. Run the same queries you are used to.
    - icon: 💻
      title: LSP Integration
      details: First-class IDE support for VS Code, Neovim, Helix, Emacs, and more. Get completions, diagnostics, and hover info.
    - icon: 📦
      title: Single Binary
      details: No Python, no dependencies. Download one binary and you are ready to go.
    - icon: 🌐
      title: WASM Ready
      details: Run in the browser with full functionality. Try it in the playground right now.
---

## Installation

::: code-group

```sh [Cargo]
# Build from source
cargo install rustledger

# Or use cargo-binstall for prebuilt binaries
cargo binstall rustledger
```

```sh [Homebrew]
# macOS and Linux
brew install rustledger
```

```sh [Nix]
# Try without installing
nix run github:rustledger/rustledger

# Install to profile
nix profile install github:rustledger/rustledger

# Or use nixpkgs
nix-env -iA nixpkgs.rustledger
```

```sh [AUR]
# Arch Linux (using yay)
yay -S rustledger

# Or with paru
paru -S rustledger
```

```sh [COPR]
# Fedora / RHEL / CentOS
sudo dnf copr enable atim/rustledger
sudo dnf install rustledger
```

```sh [Scoop]
# Windows
scoop bucket add rustledger https://github.com/rustledger/scoop-bucket
scoop install rustledger
```

```sh [Docker]
# Run with Docker
docker run --rm -v $(pwd):/data ghcr.io/rustledger/rustledger check /data/ledger.beancount
```

```sh [npm]
# WASM package for Node.js / browser
npm install @rustledger/wasm
```

```sh [Binary]
# Download prebuilt binaries from GitHub releases
# https://github.com/rustledger/rustledger/releases/latest
#
# Available for:
# - Linux (x86_64, aarch64)
# - macOS (x86_64, aarch64)
# - Windows (x86_64)
```

:::
