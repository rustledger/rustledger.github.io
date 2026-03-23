import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'PTA Standards',
    description: 'Formal specifications for plain text accounting formats',
    base: '/pta-standards/',
    appearance: false,
    ignoreDeadLinks: true,

    // Source content from pta-standards repo (cloned in CI)
    srcDir: '../pta-standards',

    // Exclude problematic directories with missing assets
    srcExclude: ['**/reference/sources/**', '**/node_modules/**'],

    // Map README.md to index pages
    rewrites: {
        'README.md': 'index.md',
        ':dir/README.md': ':dir/index.md',
        ':dir/:subdir/README.md': ':dir/:subdir/index.md',
        ':dir/:subdir/:subsubdir/README.md': ':dir/:subdir/:subsubdir/index.md',
    },

    head: [['link', { rel: 'icon', href: '/pta-standards/favicon.svg' }]],

    themeConfig: {
        logo: {
            light: '/logo.svg',
            dark: '/logo.svg',
        },
        siteTitle: 'PTA Standards',
        nav: [
            { text: 'Core', link: '/core/' },
            { text: 'Formats', link: '/formats/' },
            { text: 'Tooling', link: '/tooling/' },
            { text: 'GitHub', link: 'https://github.com/rustledger/pta-standards' },
        ],

        sidebar: {
            '/': [
                {
                    text: 'Overview',
                    items: [
                        { text: 'Home', link: '/' },
                        { text: 'Roadmap', link: '/ROADMAP' },
                        { text: 'Contributing', link: '/CONTRIBUTING' },
                    ],
                },
                {
                    text: 'Core',
                    collapsed: false,
                    items: [
                        { text: 'Overview', link: '/core/' },
                        { text: 'Glossary', link: '/core/glossary' },
                    ],
                },
                {
                    text: 'Beancount v3',
                    collapsed: false,
                    items: [
                        { text: 'Overview', link: '/formats/beancount/v3/' },
                        { text: 'Syntax', link: '/formats/beancount/v3/spec/syntax' },
                        { text: 'Lexical', link: '/formats/beancount/v3/spec/lexical' },
                        { text: 'Posting', link: '/formats/beancount/v3/spec/posting' },
                        { text: 'Costs', link: '/formats/beancount/v3/spec/costs' },
                    ],
                },
                {
                    text: 'Resources',
                    collapsed: true,
                    items: [
                        { text: 'Tooling', link: '/tooling/' },
                        { text: 'Security', link: '/security/' },
                        { text: 'Tests', link: '/tests/' },
                    ],
                },
            ],
        },

        socialLinks: [{ icon: 'github', link: 'https://github.com/rustledger/pta-standards' }],

        search: {
            provider: 'local',
        },

        editLink: {
            pattern: 'https://github.com/rustledger/pta-standards/edit/main/:path',
            text: 'Edit this page on GitHub',
        },

        footer: {
            message: 'Documentation licensed under CC-BY-4.0. Code licensed under MIT.',
            copyright: 'Copyright © 2024-present PTA Standards contributors',
        },
    },
});
