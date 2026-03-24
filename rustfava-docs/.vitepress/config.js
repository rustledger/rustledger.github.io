import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'rustfava',
    description: 'Documentation for rustfava - Desktop application for rustledger/Beancount',

    base: '/rustfava/',
    appearance: false,
    ignoreDeadLinks: true,

    head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/rustfava/favicon.svg' }]],

    themeConfig: {
        logo: { src: '/favicon.svg', alt: 'rustfava' },
        siteTitle: false,

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Documentation', link: '/about/why-rustfava' },
        ],

        sidebar: {
            '/': [
                {
                    text: 'About',
                    collapsed: false,
                    items: [
                        { text: 'Why rustfava?', link: '/about/why-rustfava' },
                        { text: 'Features', link: '/about/features' },
                    ],
                },
                {
                    text: 'Getting Started',
                    collapsed: false,
                    items: [
                        { text: 'Overview', link: '/getting-started/' },
                        { text: 'Installation', link: '/getting-started/installation' },
                        { text: 'Quick Start', link: '/getting-started/quick-start' },
                    ],
                },
                {
                    text: 'Reference',
                    collapsed: true,
                    items: [
                        { text: 'Configuration', link: '/reference/configuration' },
                        { text: 'Keyboard Shortcuts', link: '/reference/shortcuts' },
                    ],
                },
            ],
        },

        socialLinks: [{ icon: 'github', link: 'https://github.com/rustledger/rustfava' }],

        search: {
            provider: 'local',
        },

        editLink: {
            pattern: 'https://github.com/rustledger/rustfava/edit/main/docs/:path',
            text: 'Edit this page on GitHub',
        },

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024-present rustledger contributors',
        },
    },
});
