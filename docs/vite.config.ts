import UnoCss from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  server: {
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    UnoCss(),
  ],
})
