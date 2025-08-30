const { resolve } = require('path')
const themeConfig = require('@spiralbtc/vuepress-devkit-theme/config')

const title = 'Cashu Dev Kit Documentation'
const baseUrl = 'https://cashudevkit.org'
const githubUrl = 'https://github.com/cashubtc/cdk'
const matrixUrl = 'https://matrix.to/#/#cdk:matrix.cashu.space'
const themeColor = '#8324ab'

const docsSidebar = [
  {
    title: 'Documentation',
    collapsable: false,
    children: [
      {
        title: 'Introduction',
        path: '/introduction/',
        collapsable: true,
        children: [
          ['/introduction/use_cases', 'Use Cases'],
        ]
      },
      '/adoption',
      '/examples/',
      '/api-reference/',
    ]
  },
]

const examplesSidebar = [
  {
    title: 'Examples',
    collapsable: false,
    children: [
      '/examples/',
      {
        title: 'Getting Started',
        collapsable: true,
        children: [
          ['/examples/getting-started', 'Getting Started'],
          ['/examples/single-mint-wallet', 'Single Mint Wallet'],
          ['/examples/basic-wallet', 'Basic Wallet'],
          ['/examples/mint-token', 'Mint Token'],
        ]
      },
      {
        title: 'Payment Examples',
        collapsable: true,
        children: [
          ['/examples/melt-token', 'Melt Token'],
          ['/examples/p2pk', 'P2PK (Pay-to-Public-Key)'],
        ]
      },
      {
        title: 'BOLT12 Examples',
        collapsable: true,
        children: [
          ['/examples/mint-token-bolt12', 'BOLT12 Mint Token'],
          ['/examples/mint-token-bolt12-with-stream', 'BOLT12 with Streaming'],
          ['/examples/mint-token-bolt12-with-custom-http', 'BOLT12 with Custom HTTP'],
        ]
      },
      {
        title: 'Advanced Examples',
        collapsable: true,
        children: [
          ['/examples/proof-selection', 'Proof Selection'],
          ['/examples/auth-wallet', 'Authentication Wallet'],
          ['/examples/bip353', 'BIP-353 Human Readable Payments'],
        ]
      },
    ]
  },
  ['/api-reference/', 'API Reference'],
]

// Blog will be added later
const blogSidebar = []

module.exports = {
  title,
  description: 'CDK is a cashu mint and Wallet implementation.',
  theme: resolve(__dirname, '../../node_modules/@spiralbtc/vuepress-devkit-theme'),
  ...themeConfig({
    baseUrl,
    title,
    themeColor,
    tags: ['Bitcoin', 'ecash', 'cdk', 'Cashu Dev Kit', 'Documentation', 'cashu']
  }),
  // Blog plugin will be added later
  plugins: [],

  themeConfig: {
    domain: baseUrl,
    logo: '/img/logo.svg',
    displayAllHeaders: false,
    repo: 'thesimplekid/cashudevkit.org',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
    sidebarDepth: 0,
    algolia: {
      indexName: 'cashudevkit',
      appId: 'A9PZ06PJ60',
      apiKey: 'cc029a23a10c40cc248bb530493fbcbb',
      // See https://www.algolia.com/doc/api-reference/api-parameters/
      algoliaOptions: {
        typoTolerance: 'min'
      },
      // See https://community.algolia.com/docsearch/behavior.html#autocompleteoptions
      autocompleteOptions: {
        openOnFocus: true
      }
    },
    nav: [
      {
        text: 'Docs',
        link: '/introduction/'
      },
      {
        text: 'Adoption',
        link: '/adoption/'
      },
      {
        text: 'Examples',
        link: '/examples/'
      },
      // Blog will be added later

      {
        text: 'Matrix',
        link: matrixUrl,
        rel: 'noopener noreferrer'
      },
      {
        text: 'GitHub',
        link: githubUrl,
        rel: 'noopener noreferrer'
      }
    ],
    sidebar: {
      '/_blog/': blogSidebar,
      '/blog/': blogSidebar,
      '/examples/': examplesSidebar,
      '/': docsSidebar,
    },
    footer: {
      links: [
        {
          title: 'Docs',
          children: [
            {
              text: 'Introduction',
              link: '/introduction/'
            },
            {
              text: 'Adoption',
              link: '/adoption/'
            },

            {
              text: 'Examples',
              link: '/examples/'
            }
          ]
        },
        {
          title: 'Community',
          children: [
            {
              text: 'Matrix',
              link: matrixUrl,
              rel: 'noopener noreferrer'
            },
            {
              text: 'GitHub',
              link: githubUrl,
              rel: 'noopener noreferrer'
            },
          ]
        },
        {
          title: 'More',
          children: [
            {
              text: 'cashu.space',
              link: 'https://cashu.space'
            },
          ]
        }
      ],
      copyright: `Copyright © ${(new Date()).getUTCFullYear()} CDK Developers`,
    }
  }
}
