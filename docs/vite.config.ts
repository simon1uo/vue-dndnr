import { resolve } from 'node:path'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      'vue-dndnr': resolve(__dirname, '../src/index.ts'),
    },
  },
  plugins: [
    UnoCSS(),
  ],
})
