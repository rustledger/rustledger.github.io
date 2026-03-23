# Why rustledger?

rustledger is a modern, high-performance implementation of [Beancount](https://beancount.github.io/) written in Rust. It's designed as a drop-in replacement that's dramatically faster while maintaining full compatibility.

<FeatureGrid :features="[
    { icon: '⚡', title: '10-30x Faster', description: 'Pure Rust implementation with zero runtime overhead. Validate large ledger files in milliseconds instead of seconds.' },
    { icon: '🔄', title: 'Drop-in Replacement', description: 'Your existing Beancount files work unchanged. 100% syntax compatibility means you can switch instantly.' },
    { icon: '🔍', title: 'Full BQL Support', description: 'Complete Beancount Query Language implementation. Run the same queries you\'re used to with identical results.' },
    { icon: '📦', title: 'Single Binary', description: 'No Python, no dependencies, no virtual environments. Download one binary and you\'re ready to go.' },
    { icon: '💻', title: 'First-class IDE Support', description: 'Built-in LSP support for VS Code, Neovim, Helix, Emacs, and more. Real-time diagnostics and completions.' },
    { icon: '🌐', title: 'WASM Ready', description: 'Run rustledger in the browser with full functionality. Perfect for building web-based accounting tools.' }
]" />

## Who is it for?

<div class="audience-grid">

**Beancount users** who want faster validation and better tooling

**Developers** who want to embed accounting in their applications

**Teams** who need reliable, reproducible builds without Python dependencies

**Anyone** interested in plain-text accounting with modern tooling

</div>

<style>
.audience-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
}

.audience-grid p {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 0;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.7);
}

.audience-grid p strong {
    color: #f97316;
}
</style>
