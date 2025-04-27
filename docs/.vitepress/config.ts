import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue DNDNR',
  description: 'Vue 3 Draggable and Resizable Component Library',
  // When deploying to GitHub Pages, set the base path to '/vue-dndnr/'
  // When deploying to Vercel or other platforms that serve from the root, remove the base path
  // base: '/vue-dndnr/',
  themeConfig: {
    logo: '/logo.svg',
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Search',
                buttonAriaLabel: 'Search',
              },
              modal: {
                displayDetails: 'Display detailed list',
                resetButtonTitle: 'Reset search',
                backButtonTitle: 'Close search',
                noResultsText: 'No results found',
                footer: {
                  selectText: 'Select',
                  selectKeyAriaLabel: 'Enter',
                  navigateText: 'Navigate',
                  navigateUpKeyAriaLabel: 'Arrow up',
                  navigateDownKeyAriaLabel: 'Arrow down',
                  closeText: 'Close',
                  closeKeyAriaLabel: 'Escape',
                },
              },
            },
          },
        },
      },
    },
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Basic Usage', link: '/guide/basic-usage' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'Overview', link: '/components/' },
          { text: 'Draggable', link: '/components/draggable' },
          { text: 'Resizable', link: '/components/resizable' },
          { text: 'DnR', link: '/components/dnr' },
        ],
      },
      {
        text: 'Hooks',
        items: [
          { text: 'Overview', link: '/hooks/' },
          { text: 'useDraggable', link: '/hooks/use-draggable' },
          { text: 'useResizable', link: '/hooks/use-resizable' },
          { text: 'useDnR', link: '/hooks/use-dnr' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic Examples', link: '/examples/' },
          { text: 'Advanced Examples', link: '/examples/advanced' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Basic Usage', link: '/guide/basic-usage' },
          ],
        },
      ],
      '/components/': [
        {
          text: 'Components',
          items: [
            { text: 'Overview', link: '/components/' },
            { text: 'Draggable', link: '/components/draggable' },
            { text: 'Resizable', link: '/components/resizable' },
            { text: 'DnR', link: '/components/dnr' },
          ],
        },
      ],
      '/hooks/': [
        {
          text: 'Hooks',
          items: [
            { text: 'Overview', link: '/hooks/' },
            { text: 'useDraggable', link: '/hooks/use-draggable' },
            { text: 'useResizable', link: '/hooks/use-resizable' },
            { text: 'useDnR', link: '/hooks/use-dnr' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Examples', link: '/examples/' },
            { text: 'Advanced Examples', link: '/examples/advanced' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/simon1uo/vue-dndnr' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Simon Luo',
    },
  },
  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPHomeHero\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/HomeHero.vue', import.meta.url),
          ),
        },
      ],
    },
  },
})
