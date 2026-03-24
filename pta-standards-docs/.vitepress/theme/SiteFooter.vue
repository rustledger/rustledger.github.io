<template>
    <footer class="site-footer">
        <div class="footer-content">
            <div class="footer-left">
                <div class="footer-brand"><span class="text-accent">PTA</span> Standards</div>
                <div class="footer-license">Docs: CC-BY-4.0 | Code: MIT</div>
            </div>
            <div class="footer-links">
                <a href="https://github.com/rustledger/pta-standards">GitHub</a>
                <a href="/pta-standards/core/">Docs</a>
                <a href="https://github.com/rustledger/pta-standards/discussions">Contact</a>
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
