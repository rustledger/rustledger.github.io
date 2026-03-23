<script setup>
import DefaultTheme from 'vitepress/theme';
import SecondaryNav from './SecondaryNav.vue';

const { Layout } = DefaultTheme;
</script>

<template>
    <SecondaryNav />
    <Layout>
        <template #nav-bar-title-after>
            <span class="custom-title"> <span class="accent">rust</span>ledger </span>
        </template>
    </Layout>
</template>

<style scoped>
.custom-title {
    font-weight: 600;
    font-size: 1rem;
}

.accent {
    color: #f97316;
}

/* Hide the default title text */
:deep(.VPNavBarTitle .title) {
    visibility: hidden;
    width: 0;
    overflow: hidden;
}
</style>
