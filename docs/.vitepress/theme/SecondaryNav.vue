<script setup>
const isDev = import.meta.env.DEV;

const urls = {
    rustledger: isDev ? 'http://localhost:5173/' : 'https://rustledger.github.io/',
    rustfava: isDev ? 'http://localhost:5174/rustfava/' : 'https://rustledger.github.io/rustfava/',
    ptaStandards: isDev
        ? 'http://localhost:5175/pta-standards/'
        : 'https://rustledger.github.io/pta-standards/',
};

const navigate = (url) => {
    window.location.href = url;
};
</script>

<template>
    <div class="secondary-nav">
        <div class="secondary-nav-content">
            <div class="secondary-nav-links">
                <a
                    :href="urls.rustledger"
                    class="secondary-link active"
                    @click.prevent="navigate(urls.rustledger)"
                >
                    <span class="accent">rust</span>ledger
                </a>
                <a
                    :href="urls.rustfava"
                    class="secondary-link"
                    @click.prevent="navigate(urls.rustfava)"
                >
                    <span class="accent">rust</span>fava
                </a>
                <a
                    :href="urls.ptaStandards"
                    class="secondary-link"
                    @click.prevent="navigate(urls.ptaStandards)"
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
    padding: 0.5rem 1.5rem 0.75rem;
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

.secondary-link.active {
    border-bottom: 2px solid #f97316;
    padding-bottom: 2px;
}

.accent {
    color: #f97316;
}
</style>
