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
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'Overview', link: '/examples/' },
          { text: 'Draggable Examples', link: '/examples/Draggable/' },
          { text: 'Resizable Examples', link: '/examples/Resizable/' },
          { text: 'DnR Examples', link: '/examples/DnR/' },
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
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
          ],
        },
        {
          text: 'Draggable Examples',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/examples/Draggable/' },
            { text: 'Basic Usage', link: '/examples/Draggable/basic' },
            { text: 'Constrained Dragging', link: '/examples/Draggable/constrained' },
            { text: 'Grid Alignment', link: '/examples/Draggable/grid' },
            { text: 'Custom Handle', link: '/examples/Draggable/handle' },
            { text: 'Axis Constraint', link: '/examples/Draggable/axis' },
            { text: 'Event Handling', link: '/examples/Draggable/events' },
            { text: 'Active State Modes', link: '/examples/Draggable/active-modes' },
          ],
        },
        {
          text: 'Resizable Examples',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/examples/Resizable/' },
            { text: 'Basic Usage', link: '/examples/Resizable/basic' },
            { text: 'Constrained Resizing', link: '/examples/Resizable/constrained' },
            { text: 'Custom Handles', link: '/examples/Resizable/handles' },
            { text: 'Handle Types', link: '/examples/Resizable/handle-types' },
            { text: 'Aspect Ratio Lock', link: '/examples/Resizable/aspect-ratio' },
            { text: 'Event Handling', link: '/examples/Resizable/events' },
            { text: 'Active State Modes', link: '/examples/Resizable/active-modes' },
          ],
        },
        {
          text: 'DnR Examples',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/examples/DnR/' },
            { text: 'Basic Usage', link: '/examples/DnR/basic' },
            { text: 'Constrained DnR', link: '/examples/DnR/constrained' },
            { text: 'Custom Handle', link: '/examples/DnR/handle' },
            { text: 'Handle Types', link: '/examples/DnR/handle-types' },
            { text: 'Window Style', link: '/examples/DnR/window' },
            { text: 'Event Handling', link: '/examples/DnR/events' },
            { text: 'Active State Modes', link: '/examples/DnR/active-modes' },
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
