<script setup>
defineProps({
    features: {
        type: Array,
        required: true
    }
});
</script>

<template>
    <div class="feature-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon" v-if="feature.icon">{{ feature.icon }}</div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
        </div>
    </div>
</template>

<style scoped>
.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.feature-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
    padding: 1.5rem;
    transition: border-color 0.2s, background 0.2s;
}

.feature-card:hover {
    border-color: rgba(249, 115, 22, 0.3);
    background: rgba(255, 255, 255, 0.05);
}

.feature-icon {
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
}

.feature-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    margin: 0 0 0.5rem 0;
}

.feature-description {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    line-height: 1.6;
}
</style>
