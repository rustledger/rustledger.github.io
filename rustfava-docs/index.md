---
layout: home
title: rustfava - Desktop App for Plain Text Accounting
---

<div class="landing-hero">
  <p class="hero-subtitle">Desktop App for rustledger</p>
  <h1 class="hero-title"><span class="text-accent">rust</span>fava</h1>
  <p class="hero-tagline">Accounting in plain text, under your control, forever.</p>

  <div class="hero-actions">
    <GitHubStars />
  </div>

  <div class="install-wrapper">
    <InstallTabs />
  </div>
</div>

<!-- App Screenshot -->
<div class="screenshot-hero">
  <img src="https://rustledger.github.io/screenshots/rustfava-dashboard.png" alt="rustfava Dashboard view" class="app-screenshot" />
</div>

<!-- Features Section -->
<section class="features-section">
  <h2 class="section-title">Everything you need</h2>
  <p class="section-subtitle">A beautiful desktop app for managing your finances with the power of plain text accounting.</p>

  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
      <h3>Native Performance</h3>
      <p>Built with Tauri for small bundle size and instant startup. No Electron bloat.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div>
      <h3>Fava Interface</h3>
      <p>The familiar Fava web UI you know and love, now as a native desktop app.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
      <h3>rustledger Backend</h3>
      <p>Powered by rustledger for blazing fast parsing and validation of your ledger files.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
      <h3>Cross-Platform</h3>
      <p>Available for Linux, macOS, and Windows. One app, everywhere.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg></div>
      <h3>Offline First</h3>
      <p>Works without internet. Your financial data stays on your machine, always.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
      <h3>Multiple Files</h3>
      <p>Open multiple ledger files in tabs. Switch between projects effortlessly.</p>
    </div>
  </div>
</section>

<!-- Screenshots Section -->
<section class="screenshots-section">
  <h2 class="section-title">Screenshots</h2>
  <p class="section-subtitle">See rustfava in action</p>

  <div class="screenshots-grid">
    <img src="https://rustledger.github.io/screenshots/rustfava-launcher.png" alt="rustfava Launcher" class="screenshot" />
    <img src="https://rustledger.github.io/screenshots/rustfava-dashboard.png" alt="rustfava Dashboard" class="screenshot" />
  </div>
</section>

<style>
/* Hero Section */
.landing-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 1.5rem 2rem;
  max-width: 100%;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
  font-weight: 500;
}

.hero-title {
  font-size: clamp(3rem, 12vw, 5rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  margin: 0 0 1.25rem 0;
  color: rgba(255, 255, 255, 0.9);
}

.text-accent {
  color: #f97316;
}

.hero-tagline {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 2.5rem 0;
  max-width: 500px;
  line-height: 1.5;
}

.hero-actions {
  margin-bottom: 2.5rem;
}

.install-wrapper {
  width: 100%;
  max-width: 600px;
  margin-bottom: 2rem;
}

/* Screenshot Hero */
.screenshot-hero {
  max-width: 900px;
  margin: 0 auto 4rem;
  padding: 0 1.5rem;
}

.app-screenshot {
  width: 100%;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Features Section */
.features-section {
  padding: 4rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: white;
}

.section-subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 3rem 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: border-color 0.2s;
}

.feature-card:hover {
  border-color: rgba(249, 115, 22, 0.3);
}

.feature-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 1rem;
  color: #f97316;
}

.feature-icon svg {
  width: 100%;
  height: 100%;
}

.feature-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.5rem 0;
}

.feature-card p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.6;
}

/* Screenshots Section */
.screenshots-section {
  padding: 4rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.screenshot {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s;
}

.screenshot:hover {
  transform: scale(1.02);
}

/* Hide default VitePress page styling */
.VPDoc.has-aside .content-container,
.VPDoc .content-container {
  max-width: 100% !important;
}

.VPDoc.has-aside .content,
.VPDoc .content {
  padding: 0 !important;
  max-width: 100% !important;
}

.VPDoc .aside {
  display: none !important;
}
</style>
