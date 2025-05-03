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
        'heading': ['Mori'],
        'heading-serif': ['Arbutus Slab'],
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
      accent: {
        DEFAULT: 'var(--color-accent)',
        light: 'var(--color-accent-light)',
        dark: 'var(--color-accent-dark)',
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
    'btn-accent': 'btn bg-accent text-white hover:bg-accent-dark',
    'card': 'bg-background-soft rounded-lg p-4 shadow-md',
    'card-hover': 'hover:shadow-lg transition-shadow duration-300',
    'card-accent': 'card border-l-4 border-l-accent',
    'input': 'border border-border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary',
    'input-accent': 'border border-border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-accent',

    'box': 'rounded-xl shadow-xl p-3',
    'draggable-box': 'box w-50 h-20 dark:bg-primary-dark bg-primary-light cursor-move',
    'resizable-box': 'box relative w-full h-full dark:bg-secondary-dark bg-secondary-light',
    'dnr-box': 'draggable-box resizable-box dark:bg-accent-dark bg-accent-light cursor-move',
  },
})
