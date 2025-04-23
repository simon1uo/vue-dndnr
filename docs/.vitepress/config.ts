import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue DNDNR',
  description: 'Vue 3 Draggable and Resizable Component Library',
  // When deploying to GitHub Pages, set the base path to '/vue-dndnr/'
  // When deploying to Vercel or other platforms that serve from the root, remove the base path
  // base: '/vue-dndnr/',
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Components', link: '/components/' },
      { text: 'Hooks', link: '/hooks/' },
      { text: 'Examples', link: '/examples/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Basic Usage', link: '/guide/basic-usage' },
          ]
        }
      ],
      '/components/': [
        {
          text: 'Components',
          items: [
            { text: 'Overview', link: '/components/' },
            { text: 'Draggable', link: '/components/draggable' },
            { text: 'Resizable', link: '/components/resizable' },
            { text: 'DnR', link: '/components/dnr' },
            { text: 'TabContainer', link: '/components/tab-container' },
          ]
        }
      ],
      '/hooks/': [
        {
          text: 'Hooks',
          items: [
            { text: 'Overview', link: '/hooks/' },
            { text: 'useDraggable', link: '/hooks/use-draggable' },
            { text: 'useResizable', link: '/hooks/use-resizable' },
            { text: 'useDnR', link: '/hooks/use-dnr' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Examples', link: '/examples/' },
            { text: 'Advanced Examples', link: '/examples/advanced' },
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/simon1uo/vue-dndnr' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Simon Luo'
    }
  }
})
