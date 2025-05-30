import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/hooks/**/*.ts'],
      exclude: ['src/hooks/index.ts', 'src/hooks/**/*.d.ts', 'src/hooks/__tests__/**/*'],
    },
    exclude: ['react-beautiful-dnd', 'node_modules'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
