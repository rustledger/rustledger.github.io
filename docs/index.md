---
layout: home
title: rustledger - Modern Plain Text Accounting

hero:
    name: rustledger
    text: Modern Plain Text Accounting
    tagline: Beancount, rewritten in Rust. Accounting in plain text, under your control, forever.
    actions:
        - theme: brand
          text: Get Started
          link: /getting-started/
        - theme: alt
          text: Try the Playground
          link: https://rustledger.github.io/
        - theme: alt
          text: GitHub
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
cargo install rustledger
```

```sh [Homebrew]
brew install rustledger/tap/rustledger
```

```sh [Nix]
# Try it
nix run github:rustledger/rustledger

# Install
nix profile install github:rustledger/rustledger
```

```sh [Binary]
# Download from GitHub releases
# https://github.com/rustledger/rustledger/releases
```

:::
