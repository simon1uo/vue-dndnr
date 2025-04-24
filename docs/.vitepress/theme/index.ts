import DefaultTheme from 'vitepress/theme'
import HomeHeroImage from './components/HomeHeroImage.vue'
import Layout from './Layout.vue'
import 'uno.css'
import './styles/custom.css'

export default {
  Layout,
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register custom components
    app.component('HomeHeroImage', HomeHeroImage)
  },
}
