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
      '/examples',
    ]
  },
  {
    title: 'API Reference',
    collapsable: false,
    children: [
      ['https://docs.rs/cdk', 'Rust']
    ],
  }
]

const tutorialSidebar = [
  {
    title: 'Tutorials',
    collapsable: false,
    children: [
      '/tutorials/getting-started',
    ],
  }
]

const blogSidebar = [
  {
    title: 'Blog',
    collapsable: false,
    children: [
      ['/blog/', 'Articles'],
      ['/blog/tags/', 'Tags'],
      ['/blog/author/', 'Authors']
    ]
  }
]

module.exports = {
  title,
  description: 'CDK is a cashu mint and wallet implementation.',
  theme: resolve(__dirname, '../../node_modules/@spiralbtc/vuepress-devkit-theme'),
  ...themeConfig({
    baseUrl,
    title,
    themeColor,
    tags: ['Bitcoin', 'ecash', 'cdk', 'Cashu Dev Kit', 'Documentation', 'cashu']
  }),
  plugins: [
    [
      '@vuepress/blog',
      {
        directories: [
          {
            id: 'blog',
            dirname: '_blog',
            path: '/blog/',
          },
        ],
        frontmatters: [
          {
            id: 'tag',
            keys: ['tag', 'tags'],
            path: '/blog/tags/',
          },
          {
            id: 'author',
            keys: ['author', 'authors'],
            path: '/blog/author/',
          }
        ]
      },
    ],
  ],
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
        text: 'Tutorials',
        link: '/tutorials/getting-started'
      },
      {
        text: 'Blog',
        link: '/blog/'
      },
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
      '/tutorials/': tutorialSidebar,
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
