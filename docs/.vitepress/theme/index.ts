import { MotionPlugin } from '@vueuse/motion'
import DefaultTheme from 'vitepress/theme'
// Import consolidated demo components
import DemoBox from './components/demos/DemoBox.vue'
import DemoControl from './components/demos/DemoControl.vue'
import DnRDemo from './components/demos/DnRDemo.vue'

// Import demo components
import DraggableDemo from './components/demos/DraggableDemo.vue'
import ResizableDemo from './components/demos/ResizableDemo.vue'
import UseDnRDemo from './components/demos/UseDnRDemo.vue'
import UseDraggableDemo from './components/demos/UseDraggableDemo.vue'
import UseResizableDemo from './components/demos/UseResizableDemo.vue'
import HomeHeroImage from './components/HomeHeroImage.vue'

import Layout from './Layout.vue'
import 'uno.css'
import './styles/custom.css'

export default {
  Layout,
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(MotionPlugin)

    // Register custom components
    app.component('HomeHeroImage', HomeHeroImage)

    // Register demo components
    app.component('DraggableDemo', DraggableDemo)
    app.component('ResizableDemo', ResizableDemo)
    app.component('DnRDemo', DnRDemo)
    app.component('UseDraggableDemo', UseDraggableDemo)
    app.component('UseResizableDemo', UseResizableDemo)
    app.component('UseDnRDemo', UseDnRDemo)

    // Register consolidated demo components
    app.component('DemoBox', DemoBox)
    app.component('DemoControl', DemoControl)
  },
}
