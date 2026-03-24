<script setup>
import DefaultTheme from 'vitepress/theme';
import SecondaryNav from './SecondaryNav.vue';
import SiteFooter from './SiteFooter.vue';

const { Layout } = DefaultTheme;
</script>

<template>
    <SecondaryNav />
    <Layout>
        <template #nav-bar-title-after>
            <span class="custom-title"><span class="accent">rust</span>fava</span>
        </template>
        <template #layout-bottom>
            <SiteFooter />
        </template>
    </Layout>
</template>

<style scoped>
.custom-title {
    font-weight: 600;
    font-size: 1.1rem;
    margin-left: 0.5rem;
}

.accent {
    color: #f97316;
}
</style>
