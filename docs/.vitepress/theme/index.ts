import type { Theme } from 'vitepress'
import { MotionPlugin } from '@vueuse/motion'
import DefaultTheme from 'vitepress/theme'

import DemoContainer from './components/DemoContainer.vue'
import Layout from './Layout.vue'
import 'uno.css'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.use(MotionPlugin)
    app.component('DemoContainer', DemoContainer)
  },
} satisfies Theme
