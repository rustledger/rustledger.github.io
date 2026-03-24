<script setup>
const downloadUrl = 'https://github.com/rustledger/rustledger/releases/latest';
const getStartedUrl = '/getting-started/';
</script>

<template>
    <div class="hero-buttons">
        <a :href="downloadUrl" class="btn btn-primary" target="_blank" rel="noopener"> Download </a>
        <a :href="getStartedUrl" class="btn btn-secondary"> Get Started </a>
    </div>
</template>

<style scoped>
.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s ease;
    min-width: 140px;
}

.btn-primary {
    background-color: #f97316;
    color: white;
    border: 2px solid #f97316;
}

.btn-primary:hover {
    background-color: #ea580c;
    border-color: #ea580c;
}

.btn-secondary {
    background-color: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
    border-color: rgba(255, 255, 255, 0.6);
    background-color: rgba(255, 255, 255, 0.05);
}
</style>
