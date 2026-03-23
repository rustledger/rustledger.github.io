<script setup>
const navigate = (url) => {
    window.location.href = url;
};
</script>

<template>
    <div class="secondary-nav">
        <div class="secondary-nav-content">
            <div class="secondary-nav-links">
                <a
                    href="https://rustledger.github.io/"
                    class="secondary-link"
                    @click.prevent="navigate('https://rustledger.github.io/')"
                >
                    <span class="accent">rust</span>ledger
                </a>
                <a
                    href="https://rustledger.github.io/rustfava/"
                    class="secondary-link"
                    @click.prevent="navigate('https://rustledger.github.io/rustfava/')"
                >
                    <span class="accent">rust</span>fava
                </a>
                <a
                    href="https://rustledger.github.io/pta-standards/"
                    class="secondary-link"
                    @click.prevent="navigate('https://rustledger.github.io/pta-standards/')"
                >
                    <span class="accent">PTA</span> Standards
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped>
.secondary-nav {
    background-color: #000;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
}

.secondary-nav-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0.5rem 1.5rem;
    display: flex;
    justify-content: flex-end;
}

.secondary-nav-links {
    display: flex;
    gap: 2rem;
}

.secondary-link {
    color: white;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 600;
    transition: opacity 0.2s;
}

.secondary-link:hover {
    opacity: 0.7;
}

.accent {
    color: #f97316;
}
</style>
