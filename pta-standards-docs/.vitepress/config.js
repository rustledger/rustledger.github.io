import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'PTA Standards',
  description: 'Formal specifications for plain text accounting formats',
  base: '/pta-standards/',
  appearance: false,

  // Source content from pta-standards repo
  srcDir: '../../pta-standards',

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
          items: [
            { text: 'Home', link: '/' },
            { text: 'Roadmap', link: '/ROADMAP' },
            { text: 'Contributing', link: '/CONTRIBUTING' },
            { text: 'Governance', link: '/GOVERNANCE' },
          ],
        },
        {
          text: 'Specifications',
          collapsed: false,
          items: [
            { text: 'Core Model', link: '/core/' },
            { text: 'Beancount v3', link: '/formats/beancount/v3/' },
            { text: 'Ledger', link: '/formats/ledger/' },
            { text: 'hledger', link: '/formats/hledger/' },
          ],
        },
        {
          text: 'Resources',
          collapsed: false,
          items: [
            { text: 'Tooling', link: '/tooling/cli/spec' },
            { text: 'Security', link: '/security/' },
            { text: 'Tests', link: '/tests/' },
          ],
        },
      ],
      '/core/': [
        {
          text: 'Core',
          items: [
            { text: 'Overview', link: '/core/' },
            { text: 'Glossary', link: '/core/glossary' },
          ],
        },
        {
          text: 'Data Model',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/core/model/' },
            { text: 'Account', link: '/core/model/account' },
            { text: 'Amount', link: '/core/model/amount' },
            { text: 'Commodity', link: '/core/model/commodity' },
            { text: 'Transaction', link: '/core/model/transaction' },
            { text: 'Posting', link: '/core/model/posting' },
            { text: 'Price', link: '/core/model/price' },
            { text: 'Metadata', link: '/core/model/metadata' },
            { text: 'Lot', link: '/core/model/lot' },
          ],
        },
        {
          text: 'Types',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/core/types/' },
            { text: 'Decimal', link: '/core/types/decimal' },
            { text: 'Date', link: '/core/types/date' },
            { text: 'String', link: '/core/types/string' },
            { text: 'Unicode', link: '/core/types/unicode' },
          ],
        },
        {
          text: 'Numerics',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/core/numerics/' },
            { text: 'Precision', link: '/core/numerics/precision' },
            { text: 'Rounding', link: '/core/numerics/rounding' },
            { text: 'Tolerance', link: '/core/numerics/tolerance' },
          ],
        },
      ],
      '/formats/': [
        {
          text: 'Formats',
          items: [{ text: 'Overview', link: '/formats/' }],
        },
        {
          text: 'Beancount v3',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/formats/beancount/v3/' },
            { text: 'Introduction', link: '/formats/beancount/v3/spec/introduction' },
            { text: 'Tolerances', link: '/formats/beancount/v3/spec/tolerances' },
          ],
        },
        {
          text: 'Beancount Directives',
          collapsed: true,
          items: [
            { text: 'Balance', link: '/formats/beancount/v3/spec/directives/balance' },
            { text: 'Event', link: '/formats/beancount/v3/spec/directives/event' },
            { text: 'Note', link: '/formats/beancount/v3/spec/directives/note' },
            { text: 'Query', link: '/formats/beancount/v3/spec/directives/query' },
            { text: 'Custom', link: '/formats/beancount/v3/spec/directives/custom' },
          ],
        },
        {
          text: 'BQL',
          collapsed: true,
          items: [
            { text: 'Specification', link: '/formats/beancount/v3/bql/spec' },
            { text: 'Functions', link: '/formats/beancount/v3/bql/functions' },
          ],
        },
      ],
      '/tooling/': [
        {
          text: 'Tooling',
          items: [
            { text: 'CLI Spec', link: '/tooling/cli/spec' },
            { text: 'Exit Codes', link: '/tooling/cli/exit-codes' },
          ],
        },
        {
          text: 'Commands',
          collapsed: false,
          items: [
            { text: 'check', link: '/tooling/cli/commands/check' },
            { text: 'validate', link: '/tooling/cli/commands/validate' },
            { text: 'query', link: '/tooling/cli/commands/query' },
            { text: 'format', link: '/tooling/cli/commands/format' },
            { text: 'convert', link: '/tooling/cli/commands/convert' },
            { text: 'import', link: '/tooling/cli/commands/import' },
            { text: 'parse', link: '/tooling/cli/commands/parse' },
          ],
        },
      ],
      '/security/': [
        {
          text: 'Security',
          items: [
            { text: 'Overview', link: '/security/' },
            { text: 'Threat Model', link: '/security/threat-model' },
          ],
        },
        {
          text: 'Limits',
          collapsed: false,
          items: [
            { text: 'Spec', link: '/security/limits/spec' },
            { text: 'Input', link: '/security/limits/input' },
            { text: 'Memory', link: '/security/limits/memory' },
            { text: 'Nesting', link: '/security/limits/nesting' },
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
