---
layout: page
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
/* Hero Section - matches original site */
.landing-hero {
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1.5rem;
  max-width: 800px;
  margin: 0 auto;
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

/* Hide default VitePress page styling on home */
.VPDoc.has-aside .content-container,
.VPDoc .content-container {
  max-width: 100% !important;
}

.VPDoc.has-aside .content,
.VPDoc .content {
  padding: 0 !important;
  max-width: 100% !important;
}

/* Hide the sidebar on home page */
.VPDoc .aside {
  display: none !important;
}
</style>
