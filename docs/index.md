---
layout: home
title: rustledger - Modern Plain Text Accounting
---

<div class="landing-hero">
  <p class="hero-subtitle">Beancount, rewritten in Rust</p>
  <h1 class="hero-title"><span class="text-accent">rust</span>ledger</h1>
  <p class="hero-tagline">Accounting in plain text, under your control, forever.</p>

  <div class="hero-actions">
    <GitHubStars />
  </div>

  <div class="install-wrapper">
    <InstallTabs />
  </div>
</div>

<style>
.landing-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
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
}
</style>
