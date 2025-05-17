import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import ConfigOption from './components/ConfigOption.vue'
import DemoContainer from './components/DemoContainer.vue'
import PlaygroundContainer from './components/PlaygroundContainer.vue'
import Layout from './Layout.vue'
import 'uno.css'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('DemoContainer', DemoContainer)
    app.component('ConfigOption', ConfigOption)
    app.component('PlaygroundContainer', PlaygroundContainer)
  },
} satisfies Theme
