import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'PTA Standards',
    description: 'Formal specifications for plain text accounting formats',
    base: '/pta-standards/',
    appearance: false,
    ignoreDeadLinks: true,

    // Use local content (pta-standards repo has Vue syntax that breaks VitePress)

    head: [['link', { rel: 'icon', href: '/pta-standards/favicon.svg' }]],

    themeConfig: {
        logo: {
            light: '/logo.svg',
            dark: '/logo.svg',
        },
        siteTitle: 'PTA Standards',
        nav: [
            { text: 'Core', link: 'https://github.com/rustledger/pta-standards/tree/main/core' },
            {
                text: 'Formats',
                link: 'https://github.com/rustledger/pta-standards/tree/main/formats',
            },
            {
                text: 'Tooling',
                link: 'https://github.com/rustledger/pta-standards/tree/main/tooling',
            },
            { text: 'GitHub', link: 'https://github.com/rustledger/pta-standards' },
        ],

        sidebar: {
            '/': [
                {
                    text: 'Overview',
                    items: [{ text: 'Home', link: '/' }],
                },
                {
                    text: 'Specifications',
                    items: [
                        {
                            text: 'Core Model',
                            link: 'https://github.com/rustledger/pta-standards/tree/main/core',
                        },
                        {
                            text: 'Beancount v3',
                            link: 'https://github.com/rustledger/pta-standards/tree/main/formats/beancount/v3',
                        },
                        {
                            text: 'Ledger',
                            link: 'https://github.com/rustledger/pta-standards/tree/main/formats/ledger',
                        },
                        {
                            text: 'hledger',
                            link: 'https://github.com/rustledger/pta-standards/tree/main/formats/hledger',
                        },
                    ],
                },
                {
                    text: 'Resources',
                    items: [
                        {
                            text: 'Tooling',
                            link: 'https://github.com/rustledger/pta-standards/tree/main/tooling',
                        },
                        {
                            text: 'Tests',
                            link: 'https://github.com/rustledger/pta-standards/tree/main/tests',
                        },
                        {
                            text: 'Security',
                            link: 'https://github.com/rustledger/pta-standards/tree/main/security',
                        },
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
