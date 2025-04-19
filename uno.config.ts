import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss'

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
    'btn': 'px-4 py-2 rounded-md transition-colors duration-300 cursor-pointer',
    'btn-primary': 'btn bg-primary text-white hover:bg-primary-dark',
    'btn-secondary': 'btn bg-secondary text-white hover:bg-secondary-dark',
    'card': 'bg-background-soft rounded-lg p-4 shadow-md',
    'card-hover': 'hover:shadow-lg transition-shadow duration-300',
    'input': 'border border-border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary',
    'draggable-box': 'rounded shadow-lg',
  },
})
