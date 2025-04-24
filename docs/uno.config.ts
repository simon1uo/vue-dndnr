import { defineConfig, presetAttributify, presetIcons, presetWebFonts, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1,
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then(i => i.default),
      },
    }),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        heading: ['Mori'],
        "heading-serif": ['Arbutus Slab']
      },
    }),
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: 'var(--color-primary)',
        light: 'var(--color-primary-light)',
        dark: 'var(--color-primary-dark)',
      },
      secondary: {
        DEFAULT: 'var(--color-secondary)',
        light: 'var(--color-secondary-light)',
        dark: 'var(--color-secondary-dark)',
      },
      background: {
        DEFAULT: 'var(--color-background)',
        soft: 'var(--color-background-soft)',
        mute: 'var(--color-background-mute)',
      },
      border: 'var(--color-border)',
      text: {
        DEFAULT: 'var(--color-text)',
        light: 'var(--color-text-light)',
      },
      heading: 'var(--color-heading)',
    },
  },
  shortcuts: {
    // General UI components
    'btn': 'px-4 py-2 rounded-md transition-colors duration-300 cursor-pointer',
    'btn-primary': 'btn bg-primary text-white hover:bg-primary-dark',
    'btn-secondary': 'btn bg-secondary text-white hover:bg-secondary-dark',
    'card': 'bg-background-soft rounded-lg p-4 shadow-md',
    'card-hover': 'hover:shadow-lg transition-shadow duration-300',
    'input': 'border border-border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary',

    // Demo components
    'demo-box': 'p-4 rounded-lg text-white flex flex-col items-center gap-2 transition-colors duration-200',
    'demo-control': 'flex items-center gap-2',

    // Element styles
    'draggable-box': 'p-4 rounded-lg bg-primary text-white cursor-move select-none flex flex-col items-center gap-2 transition-colors duration-200',
    'resizable-box': 'p-4 rounded-lg bg-primary-light text-white flex flex-col items-center justify-center gap-2 transition-colors duration-200',
    'dnr-box': 'p-4 rounded-lg bg-primary-dark text-white cursor-move select-none flex flex-col items-center justify-center gap-2 transition-colors duration-200',
  },
})
