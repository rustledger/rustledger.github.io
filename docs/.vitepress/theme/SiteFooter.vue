<template>
    <footer class="site-footer">
        <div class="footer-content">
            <div class="footer-left">
                <div class="footer-brand"><span class="text-accent">rust</span>ledger</div>
                <div class="footer-license">Released under the GPL-3.0 License.</div>
            </div>
            <div class="footer-links">
                <a href="https://github.com/rustledger/rustledger">GitHub</a>
                <a href="https://crates.io/crates/rustledger">Crates.io</a>
                <a href="/about/why-rustledger.html">Docs</a>
                <a href="/contact.html">Contact</a>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.site-footer {
    margin-top: 4rem;
    padding: 3rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
}

.footer-content {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
}

@media (min-width: 640px) {
    .footer-content {
        flex-direction: row;
        justify-content: space-between;
        text-align: left;
    }
}

.footer-left {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.footer-brand {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.4);
}

.text-accent {
    color: #f97316;
}

.footer-license {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
}

.footer-links {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
}

.footer-links a {
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
}

.footer-links a:hover {
    color: white;
}
</style>
