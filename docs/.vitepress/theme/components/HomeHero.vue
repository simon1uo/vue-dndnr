<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, ref, shallowRef } from 'vue'

import EditorDemo from './EditorDemo.vue'
import MacOSWindow from './MacOSWindow.vue'

const { frontmatter } = useData()
const demoContainerRef = shallowRef<HTMLElement | null>(null)

// Radial gradient overlay state
const mouse = ref({ x: 0, y: 0, active: false })

function handleMouseMove(e: MouseEvent) {
  const el = demoContainerRef.value
  if (!el)
    return
  const rect = el.getBoundingClientRect()
  mouse.value.x = e.clientX - rect.left
  mouse.value.y = e.clientY - rect.top
  mouse.value.active = true
}

function handleMouseLeave() {
  mouse.value.active = false
}

const radialGradientStyle = computed(() => {
  if (!mouse.value.active)
    return {}
  // Use theme color and a strong blur for the radial effect
  return {
    '--radial-gradient': `radial-gradient(ellipse 180px 120px at ${mouse.value.x}px ${mouse.value.y}px, rgba(64,179,140,0.55), rgba(46,135,186,0.58) 60%, transparent 100%)`,
  }
})
</script>

<template>
  <div class="HomeHero flex flex-col mx-auto  max-w-1152px">
    <div class="flex flex-col justify-start relative mb-5">
      <h1
        class="font-heading flex flex-col w-fit text-32px sm:text-48px md:text-56px font-extrabold max-w-576px lh-0.9em"
      >
        <span>
          {{ frontmatter.hero.name }}
        </span>
        <p class="font-light text-xl">
          <span>A </span>
          <span><span font-bold>Draggable</span>&<span font-bold>Resizable</span>&<span
            font-bold
          >Droppable</span></span>
          <span class="font-light"> library</span>
        </p>
        <p class="font-light text-lg">
          {{ frontmatter.hero.tagline }}
        </p>
      </h1>
    </div>

    <div
      id="home-hero-demo-container" ref="demoContainerRef" class="flex lg:justify-center justify-end w-full h-500px"
      :style="radialGradientStyle" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave"
    >
      <MacOSWindow title="Vue DNDNR Demo">
        <EditorDemo />
      </MacOSWindow>
    </div>
  </div>
</template>

<style scoped>
.HomeHero {
  margin-top: calc((var(--vp-nav-height) + var(--vp-layout-top-height, 0px)) * -1);
  padding: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 48px) 24px 48px;
}

@media (min-width: 640px) {
  .HomeHero {
    padding: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 80px) 48px 64px;
  }
}

@media (min-width: 960px) {
  .HomeHero {
    padding: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 80px) 64px 64px;
  }
}

#home-hero-demo-container {
  position: relative;
  border-radius: 16px;
  box-shadow: 0 4px 32px 0 rgba(64, 179, 140, 0.22);
  z-index: 1;
}

#home-hero-demo-container::after {
  z-index: -1;
  content: '';
  position: absolute;
  inset: -12px;
  background: var(--radial-gradient, none);
  background-size: 300% 300%;
  transition: box-shadow 0.3s;
  filter: blur(100px) brightness(2);
  opacity: 0.92;
}

#home-hero-demo-container::before {
  content: '';
  position: absolute;
  inset: -12px;
  z-index: -2;
  border-radius: 20px;
  pointer-events: none;
  background: linear-gradient(120deg,
      var(--color-primary) 0%,
      var(--color-secondary) 40%,
      var(--color-accent) 100%);
  background-size: 150% 150%;
  filter: blur(30px) brightness(1.12);
  opacity: 0.62;
  animation: flowing-gradient-shadow 4s linear infinite;
  transition: background 0.5s;
}

@keyframes flowing-gradient-shadow {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}
</style>
