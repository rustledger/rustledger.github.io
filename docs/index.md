---
layout: home
title: rustledger - Modern Plain Text Accounting
---

<div class="landing-hero">
  <p class="hero-subtitle">Beancount, rewritten in Rust</p>
  <h1 class="hero-title">Modern <span class="text-accent">Plain Text</span> Accounting</h1>
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
  padding: 2rem 0;
  max-width: 100%;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: clamp(2.5rem, 8vw, 3.75rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 1.5rem 0;
  color: white;
}

.text-accent {
  color: #f97316;
}

.hero-tagline {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 2rem 0;
  max-width: 600px;
}

.hero-actions {
  margin-bottom: 2.5rem;
}

.install-wrapper {
  width: 100%;
  max-width: 600px;
}
</style>
