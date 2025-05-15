import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue DNDNR',
  description: 'Vue 3 Draggable and Resizable Components and Hooks Library with TypeScript Support',
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
          { text: 'Guidelines', link: '/guide/guidelines' },
          { text: 'Project Progress', link: '/guide/progress' },
        ],
      },
      {
        text: 'API',
        items: [
          { text: 'Overview', link: '/api/' },
          { text: 'useDnR', link: '/api/use-dnr' },
          { text: 'useDrag', link: '/api/use-drag' },
          { text: 'useDrop', link: '/api/use-drop' },
        ],
      },
      {
        text: 'Playground',
        items: [
          { text: 'Overview', link: '/playground/' },
          { text: 'useDnR', link: '/playground/use-dnr' },
          { text: 'useDrag & useDrop', link: '/playground/use-drag-drop' },
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
            { text: 'Guidelines', link: '/guide/guidelines' },
            { text: 'Project Progress', link: '/guide/progress' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'useDnR', link: '/api/use-dnr' },
            { text: 'useDrag', link: '/api/use-drag' },
            { text: 'useDrop', link: '/api/use-drop' },
          ],
        },
      ],
      '/playground/': [
        {
          text: 'Playground',
          items: [
            { text: 'Overview', link: '/playground/' },
            { text: 'useDnR', link: '/playground/use-dnr' },
            { text: 'useDrag & useDrop', link: '/playground/use-drag-drop' },
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
