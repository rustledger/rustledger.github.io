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
      details: Complete Beancount Query Language implementation. Run the same queries you're used to.
    - icon: 💻
      title: LSP Integration
      details: First-class IDE support for VS Code, Neovim, Helix, Emacs, and more. Get completions, diagnostics, and hover info.
    - icon: 📦
      title: Single Binary
      details: No Python, no dependencies. Download one binary and you're ready to go.
    - icon: 🌐
      title: WASM Ready
      details: Run in the browser with full functionality. Try it in the playground right now.
---

<style>
.install-section {
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.install-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.install-tab {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.install-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.install-tab.active {
  background: rgba(249, 115, 22, 0.2);
  border-color: #f97316;
  color: #f97316;
}

.install-panel {
  display: none;
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
}

.install-panel.active {
  display: block;
}

.install-panel code {
  display: block;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.install-panel .comment {
  color: rgba(255, 255, 255, 0.4);
}

.section-title {
  text-align: center;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 1rem;
}
</style>

<div class="install-section">
  <p class="section-title">Installation</p>

  <div class="install-tabs">
    <button class="install-tab active" onclick="showTab('cargo')">Cargo</button>
    <button class="install-tab" onclick="showTab('homebrew')">Homebrew</button>
    <button class="install-tab" onclick="showTab('nix')">Nix</button>
    <button class="install-tab" onclick="showTab('binary')">Binary</button>
  </div>

  <div id="panel-cargo" class="install-panel active">
    <code>cargo install rustledger</code>
  </div>

  <div id="panel-homebrew" class="install-panel">
    <code>brew install rustledger/tap/rustledger</code>
  </div>

  <div id="panel-nix" class="install-panel">
    <code><span class="comment"># Try it</span>
nix run github:rustledger/rustledger

<span class="comment"># Install</span>
nix profile install github:rustledger/rustledger</code>
  </div>

  <div id="panel-binary" class="install-panel">
    <code><span class="comment"># Download from GitHub releases</span>
https://github.com/rustledger/rustledger/releases</code>
  </div>
</div>

<script>
function showTab(name) {
  // Update tabs
  document.querySelectorAll('.install-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update panels
  document.querySelectorAll('.install-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.getElementById('panel-' + name).classList.add('active');
}
</script>
