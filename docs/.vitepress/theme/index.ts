import { MotionPlugin } from '@vueuse/motion'
import DefaultTheme from 'vitepress/theme'

import Layout from './Layout.vue'
import 'uno.css'
import './styles/custom.css'

export default {
  Layout,
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(MotionPlugin)
  },
}
