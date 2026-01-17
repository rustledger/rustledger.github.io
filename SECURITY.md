# Security Policy

## Overview

rustledger.github.io is a static website with a WebAssembly-based playground for Beancount ledger files. This document describes the security measures in place.

## Content Security Policy

The site implements a strict CSP via meta tag:

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://api.github.com https://raw.githubusercontent.com;
font-src 'self'
```

### Rationale

- **script-src 'self' 'wasm-unsafe-eval'**: Only allows scripts from the same origin. `wasm-unsafe-eval` is required for WebAssembly execution.
- **style-src 'unsafe-inline'**: Required for Tailwind CSS and CodeMirror editor styling.
- **connect-src**: Limits API calls to GitHub for fetching release info and stars.
- **No 'unsafe-eval'**: JavaScript eval is not permitted.

## XSS Prevention

All user-controlled content is sanitized:

1. **DOM API over innerHTML**: Interactive elements use `createElement()` and `textContent` instead of `innerHTML` with user data.
2. **escapeHtml utility**: HTML special characters are escaped before rendering.
3. **CodeMirror sandboxing**: The editor handles input safely.

## Data Privacy

### Local Storage

The site uses localStorage for:
- GitHub API response caching (public data only)
- No personal or financial data is stored

### URL Sharing

When users share URLs with encoded ledger content:
- Data is compressed and base64-encoded in the URL fragment
- **Warning**: Shared URLs may contain financial data visible in browser history
- Consider this before sharing URLs containing sensitive information

## WASM Integrity

The service worker validates WASM files:
- Checks for WASM magic bytes (`\0asm`) before serving cached files
- Invalid cached files are automatically re-fetched

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it by:

1. Opening a private security advisory at https://github.com/rustledger/rustledger/security/advisories
2. Or emailing the maintainers directly

Please do not open public issues for security vulnerabilities.

## Dependencies

The site has minimal runtime dependencies:
- CodeMirror 6 (editor)
- pako (compression for URL sharing)
- rustledger WASM module

All dependencies are bundled and served from the same origin.

## Recommended HTTP Headers

When self-hosting or deploying to platforms other than GitHub Pages, configure these HTTP security headers:

```
# Strict Transport Security (force HTTPS)
Strict-Transport-Security: max-age=31536000; includeSubDomains

# Prevent MIME type sniffing
X-Content-Type-Options: nosniff

# Prevent clickjacking
X-Frame-Options: DENY

# XSS protection (legacy browsers)
X-XSS-Protection: 1; mode=block

# Referrer policy (limit data leakage)
Referrer-Policy: strict-origin-when-cross-origin

# Permissions policy (disable unused features)
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Note**: GitHub Pages automatically provides some of these headers.

## CSP Violation Reporting

To monitor CSP violations in production, consider adding a `report-uri` or `report-to` directive:

```html
<meta
    http-equiv="Content-Security-Policy"
    content="...; report-uri /csp-report"
/>
```

This allows you to detect and respond to potential security issues. Note that the reporting endpoint must be configured on your server.

## URL Content Size Limits

Shared URLs are limited to prevent denial-of-service via excessively large payloads:
- Maximum decoded content: 1MB
- Larger content is rejected with an error message
