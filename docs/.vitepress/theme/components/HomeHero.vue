<script setup lang="ts">
import { useData } from 'vitepress'
import { ref, computed, onMounted, onUnmounted } from 'vue'

import EditorDemo from './EditorDemo.vue'
import MacOSWindow from './MacOSWindow.vue'

const { frontmatter } = useData()

// Mouse tracking for cursor chase effect
const demoContainerRef = ref<HTMLElement | null>(null)
const mousePosition = ref({ x: 0, y: 0 })
const containerRect = ref({ top: 0, left: 0, width: 0, height: 0 })
const isHovering = ref(false)

// Calculate distance from mouse to container center
const distanceFromCenter = computed(() => {
  if (!containerRect.value) return { x: 0, y: 0 }

  const centerX = containerRect.value.left + containerRect.value.width / 2
  const centerY = containerRect.value.top + containerRect.value.height / 2

  return {
    x: mousePosition.value.x - centerX,
    y: mousePosition.value.y - centerY
  }
})

// Calculate shadow offset based on mouse position
const shadowOffset = computed(() => {
  const maxOffset = 20
  const xOffset = Math.min(Math.max(distanceFromCenter.value.x / 10, -maxOffset), maxOffset)
  const yOffset = Math.min(Math.max(distanceFromCenter.value.y / 10, -maxOffset), maxOffset)

  return { x: xOffset, y: yOffset }
})

// Calculate shadow size based on mouse proximity
const shadowSizeMultiplier = computed(() => {
  if (!isHovering.value) return 1

  // Calculate distance from mouse to container center
  const distance = Math.sqrt(
    Math.pow(distanceFromCenter.value.x, 2) +
    Math.pow(distanceFromCenter.value.y, 2)
  )

  // Scale based on proximity (closer = larger)
  const maxDistance = Math.sqrt(
    Math.pow(containerRect.value.width / 2, 2) +
    Math.pow(containerRect.value.height / 2, 2)
  )

  // Calculate normalized distance (0 = center, 1 = edge)
  const normalizedDistance = Math.min(1, distance / maxDistance)

  // Create a non-linear scaling effect that's more pronounced near the cursor
  // Scale between 1.5 and 3 with more growth closer to the cursor
  // The base multiplier is 1.5 (even at the edge) and increases to 3 at the center
  return 1.5 + (1 - Math.pow(normalizedDistance, 2)) * 1.5
})

// Computed style for the container with dynamic shadow only (no scaling)
const containerStyle = computed(() => {
  // Create gradient shadow based on theme colors
  const shadowX = isHovering.value ? shadowOffset.value.x : 0
  const shadowY = isHovering.value ? shadowOffset.value.y : 0

  // Base shadow sizes - smaller when not hovering
  const baseShadowSize = isHovering.value ? 20 : 10
  const baseShadowBlur = isHovering.value ? 40 : 20

  // Apply the multiplier only when hovering
  const multiplier = isHovering.value ? shadowSizeMultiplier.value : 1

  // Calculate final shadow sizes
  const shadowSize = Math.round(baseShadowSize * multiplier)
  const shadowBlur = Math.round(baseShadowBlur * multiplier)

  // Define style object with proper type
  const styles: Record<string, string> = {
    // Use a faster transition when entering hover state, slower when leaving
    transition: isHovering.value
      ? 'box-shadow 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'box-shadow 0.5s cubic-bezier(0.34, 0.96, 0.64, 1)',
  }

  // Adjust shadow opacity based on hover state
  const primaryOpacity = isHovering.value ? 0.35 : 0.15
  const secondaryOpacity = isHovering.value ? 0.25 : 0.1

  // Always show shadow, but with different characteristics based on hover state
  styles.boxShadow = `
    ${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSize}px rgba(var(--color-primary-rgb, 66, 153, 225), ${primaryOpacity}),
    ${-shadowX/2}px ${-shadowY/2}px ${shadowBlur}px ${Math.round(shadowSize/2)}px rgba(var(--color-secondary-rgb, 159, 122, 234), ${secondaryOpacity})
  `

  // Add animation only when not hovering
  if (!isHovering.value) {
    styles.animation = 'shadowPulse 3s infinite ease-in-out'
  }

  return styles
})

// Track mouse position
const handleMouseMove = (event: MouseEvent) => {
  mousePosition.value = { x: event.clientX, y: event.clientY }

  // Update container rect in case of page scroll/resize
  if (demoContainerRef.value) {
    containerRect.value = demoContainerRef.value.getBoundingClientRect()
  }
}

const handleMouseEnter = () => {
  isHovering.value = true
}

const handleMouseLeave = () => {
  isHovering.value = false
}

// Set up and clean up event listeners
onMounted(() => {
  if (demoContainerRef.value) {
    containerRect.value = demoContainerRef.value.getBoundingClientRect()
  }

  window.addEventListener('mousemove', handleMouseMove)

  // Add CSS variables for RGB values of theme colors
  const root = document.documentElement
  const primaryColor = getComputedStyle(root).getPropertyValue('--color-primary').trim()
  const secondaryColor = getComputedStyle(root).getPropertyValue('--color-secondary').trim()

  // Convert hex to RGB and set as CSS variables
  root.style.setProperty('--color-primary-rgb', hexToRgb(primaryColor || '#4299e1'))
  root.style.setProperty('--color-secondary-rgb', hexToRgb(secondaryColor || '#9f7aea'))
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): string {
  // Default fallback
  if (!hex || !hex.startsWith('#')) return '66, 153, 225'

  // Remove # if present
  hex = hex.replace('#', '')

  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `${r}, ${g}, ${b}`
}
</script>

<template>
  <div class="HomeHero flex flex-col mx-auto  max-w-1152px">
    <div class="flex flex-col justify-start relative mb-5">
      <h1
        class="font-heading flex flex-col w-fit text-32px sm:text-48px md:text-56px font-extrabold max-w-576px lh-0.9em">
        <span>
          {{ frontmatter.hero.name }}
        </span>
        <p class="font-light text-xl">
          <span>A </span>
          <span><span font-bold>Draggable</span>&<span font-bold>Resizable</span>&<span
              font-bold>Droppable</span></span>
          <span class="font-light"> library</span>
        </p>
        <p class="font-light text-lg">
          {{ frontmatter.hero.tagline }}
        </p>
      </h1>
    </div>

    <div
      ref="demoContainerRef"
      class="flex lg:justify-center justify-end w-full h-500px"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      :style="containerStyle"
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

/* Demo container with gradient shadow effect */
.HomeHero > div:nth-child(2) {
  position: relative;
  border-radius: 16px;
  will-change: box-shadow;
  background: linear-gradient(
    135deg,
    rgba(var(--color-primary-rgb, 66, 153, 225), 0.05) 0%,
    rgba(var(--color-secondary-rgb, 159, 122, 234), 0.05) 100%
  );
  transition: all 0.3s ease;
}

/* Add a subtle glow effect on hover */
.HomeHero > div:nth-child(2):hover {
  background: linear-gradient(
    135deg,
    rgba(var(--color-primary-rgb, 66, 153, 225), 0.1) 0%,
    rgba(var(--color-secondary-rgb, 159, 122, 234), 0.1) 100%
  );
}

/* Add a subtle animation to make the shadow "breathe" */
@keyframes shadowPulse {
  0% {
    box-shadow: 0 5px 15px rgba(var(--color-primary-rgb, 66, 153, 225), 0.1);
  }
  50% {
    box-shadow: 0 8px 20px rgba(var(--color-secondary-rgb, 159, 122, 234), 0.15);
  }
  100% {
    box-shadow: 0 5px 15px rgba(var(--color-primary-rgb, 66, 153, 225), 0.1);
  }
}
</style>
