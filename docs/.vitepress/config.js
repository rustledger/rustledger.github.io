import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'rustledger',
    description: 'Documentation for rustledger - a blazing-fast Rust implementation of Beancount',

    base: '/',
    appearance: false,

    head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],

    themeConfig: {
        logo: { src: '/favicon.svg', alt: 'rustledger' },
        siteTitle: false,

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Documentation', link: '/about/why-rustledger' },
            { text: 'Playground', link: '/playground.html', target: '_blank' },
        ],

        sidebar: {
            '/': [
                {
                    text: 'About',
                    collapsed: false,
                    items: [
                        { text: 'Why rustledger?', link: '/about/why-rustledger' },
                        { text: 'Comparison', link: '/about/comparison' },
                        { text: 'Playground', link: '/playground.html', target: '_blank' },
                    ],
                },
                {
                    text: 'Getting Started',
                    collapsed: false,
                    items: [
                        { text: 'Overview', link: '/getting-started/' },
                        { text: 'Installation', link: '/getting-started/installation' },
                        { text: 'Quick Start', link: '/getting-started/quick-start' },
                        { text: 'Configuration', link: '/getting-started/configuration' },
                    ],
                },
                {
                    text: 'Guides',
                    collapsed: false,
                    items: [
                        { text: 'Overview', link: '/guides/' },
                        { text: 'Accounting Concepts', link: '/guides/accounting-concepts' },
                        { text: 'Cookbook', link: '/guides/cookbook' },
                        { text: 'Common Queries', link: '/guides/common-queries' },
                        { text: 'Budgeting', link: '/guides/budgeting' },
                        { text: 'Importing Data', link: '/guides/importing' },
                        { text: 'Shell Aliases', link: '/guides/shell-aliases' },
                        { text: 'Editor Integration', link: '/guides/editor-integration' },
                        { text: 'Multi-file Ledgers', link: '/guides/multi-file' },
                    ],
                },
                {
                    text: 'Migration',
                    collapsed: true,
                    items: [
                        { text: 'Overview', link: '/migration/' },
                        { text: 'From Beancount', link: '/migration/from-beancount' },
                        { text: 'From Ledger', link: '/migration/from-ledger' },
                        { text: 'From hledger', link: '/migration/from-hledger' },
                    ],
                },
                {
                    text: 'Commands',
                    collapsed: true,
                    items: [
                        { text: 'Overview', link: '/commands/' },
                        { text: 'check', link: '/commands/check' },
                        { text: 'query', link: '/commands/query' },
                        { text: 'report', link: '/commands/report' },
                        { text: 'format', link: '/commands/format' },
                        { text: 'extract', link: '/commands/extract' },
                        { text: 'price', link: '/commands/price' },
                        { text: 'doctor', link: '/commands/doctor' },
                    ],
                },
                {
                    text: 'Reference',
                    collapsed: true,
                    items: [
                        { text: 'Overview', link: '/reference/' },
                        { text: 'Syntax', link: '/reference/syntax' },
                        { text: 'BQL', link: '/reference/bql' },
                        { text: 'Plugins', link: '/reference/plugins' },
                        { text: 'Error Codes', link: '/reference/errors' },
                        { text: 'Options', link: '/reference/options' },
                        { text: 'Architecture', link: '/reference/architecture' },
                        { text: 'Compatibility', link: '/reference/compatibility' },
                    ],
                },
                {
                    text: 'Development',
                    collapsed: true,
                    items: [
                        { text: 'Overview', link: '/development/' },
                        { text: 'Testing', link: '/development/testing' },
                        { text: 'Benchmarking', link: '/development/benchmarking' },
                    ],
                },
            ],
        },

        socialLinks: [{ icon: 'github', link: 'https://github.com/rustledger/rustledger' }],

        search: {
            provider: 'local',
        },

        editLink: {
            pattern: 'https://github.com/rustledger/rustledger/edit/main/docs/:path',
            text: 'Edit this page on GitHub',
        },
    },
});
