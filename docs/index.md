---
layout: home
title: rustledger - Modern Plain Text Accounting

hero:
    name: Modern
    text: <span class="plain-text">Plain Text</span> Accounting
    tagline: Accounting under your control, forever.
---

<div class="github-star-container">
  <GitHubStars />
</div>

## Installation

<InstallTabs />

<div class="features-section">
  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon">🚀</div>
      <h3>10-30x Faster</h3>
      <p>Pure Rust implementation with zero runtime overhead. Validates 10K transactions in 35ms vs 750ms for Python beancount.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🔄</div>
      <h3>Drop-in Replacement</h3>
      <p>Your existing beancount files work unchanged. 100% syntax compatibility with Python beancount.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">📊</div>
      <h3>Full BQL Support</h3>
      <p>Complete Beancount Query Language implementation. Run the same queries you are used to.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">💻</div>
      <h3>LSP Integration</h3>
      <p>First-class IDE support for VS Code, Neovim, Helix, Emacs, and more. Get completions, diagnostics, and hover info.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">📦</div>
      <h3>Single Binary</h3>
      <p>No Python, no dependencies. Download one binary and you are ready to go.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🌐</div>
      <h3>WASM Ready</h3>
      <p>Run in the browser with full functionality. Try it in the playground right now.</p>
    </div>
  </div>
</div>

<style>
.plain-text {
  color: #f97316;
  font-style: italic;
}

.VPHero {
  text-align: center !important;
}

.VPHero .main {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.VPHero .name,
.VPHero .text,
.VPHero .tagline {
  text-align: center;
  max-width: 100%;
}

.github-star-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  margin-bottom: 2rem;
}

.vp-doc h2 {
  text-align: center;
  border-top: none;
  padding-top: 0;
  margin-top: 2rem;
}

.features-section {
  margin-top: 3rem;
  padding: 0 1.5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: white;
}

.feature-card p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.5;
}
</style>
