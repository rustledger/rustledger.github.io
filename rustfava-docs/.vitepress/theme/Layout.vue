<script setup>
import DefaultTheme from 'vitepress/theme';
import SecondaryNav from './SecondaryNav.vue';

const { Layout } = DefaultTheme;
</script>

<template>
    <SecondaryNav />
    <Layout>
        <template #nav-bar-title-after>
            <span class="custom-title">
                <svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <rect width="100" height="100" rx="20" fill="#0a0a0a" />
                    <text
                        x="50"
                        y="68"
                        font-size="50"
                        font-family="system-ui"
                        font-weight="bold"
                        text-anchor="middle"
                    >
                        <tspan fill="#f97316">r</tspan>
                        <tspan fill="white">f</tspan>
                    </text>
                </svg>
                <span><span class="accent">rust</span>fava</span>
            </span>
        </template>
    </Layout>
</template>

<style scoped>
.custom-title {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 1rem;
}

.logo {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    margin-right: 8px;
    flex-shrink: 0;
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
