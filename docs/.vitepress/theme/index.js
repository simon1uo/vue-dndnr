import DefaultTheme from 'vitepress/theme'
import { DnR } from 'vue-dndnr'
import HomeHeroImage from './components/HomeHeroImage.vue'
import Layout from './Layout.vue'

// Import UnoCSS styles
import 'uno.css'
import './styles/custom.css'

export default {
  Layout,
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register custom components
    app.component('HomeHeroImage', HomeHeroImage)

    // Register Vue DNDNR components
    app.component('DnR', DnR)
  },
}
