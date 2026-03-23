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
        nav: [
            { text: 'Core', link: '/core/' },
            { text: 'Formats', link: '/formats/' },
            { text: 'Tooling', link: '/tooling/' },
            { text: 'Roadmap', link: '/ROADMAP' },
        ],

        sidebar: {
            '/': [
                {
                    text: 'Overview',
                    items: [{ text: 'Home', link: '/' }],
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
