<script setup lang="ts">
import { computed } from 'vue'

type ShapeType = 'rectangle' | 'circle' | 'triangle'

interface Props {
  type: ShapeType
  color?: string
  selected?: boolean
  isNew?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: '#4299e1',
  selected: false,
  isNew: false,
})

// Generate a unique ID for the gradient based on color
const gradientId = computed(() => `triangleGradient-${props.color.replace('#', '')}`)

// Generate gradient background based on color
function generateGradient(baseColor: string, type: ShapeType): string {
  if (type === 'triangle')
    return 'transparent'

  const lighterColor = adjustColor(baseColor, 20)
  const darkerColor = adjustColor(baseColor, -20)
  const accentColor = generateAccentColor(baseColor)

  // Different gradient patterns based on shape type
  if (type === 'rectangle') {
    return `linear-gradient(135deg,
      ${lighterColor} 0%,
      ${baseColor} 45%,
      ${baseColor} 55%,
      ${darkerColor} 100%)`
  }
  else if (type === 'circle') {
    return `radial-gradient(circle at 30% 30%,
      ${lighterColor} 0%,
      ${baseColor} 50%,
      ${darkerColor} 90%,
      ${accentColor} 100%)`
  }

  return baseColor
}

// Generate a complementary accent color
function generateAccentColor(baseColor: string): string {
  if (!baseColor.startsWith('#'))
    return baseColor

  // Simple complementary color (not perfect but works for demo)
  const r = Number.parseInt(baseColor.slice(1, 3), 16)
  const g = Number.parseInt(baseColor.slice(3, 5), 16)
  const b = Number.parseInt(baseColor.slice(5, 7), 16)

  // Shift hue by adjusting RGB values
  const newR = Math.max(0, Math.min(255, 255 - r + 50))
  const newG = Math.max(0, Math.min(255, 255 - g + 50))
  const newB = Math.max(0, Math.min(255, 255 - b + 50))

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

// Compute the shape style based on type and color
const shapeStyle = computed(() => {
  // Create a slightly darker shade for 3D effect
  const darkerColor = props.type !== 'triangle'
    ? adjustColor(props.color, -20)
    : 'transparent'

  // Generate gradient background
  const gradientBg = generateGradient(props.color, props.type)

  // Base transform - will be overridden by CSS for selected state
  const baseTransform = props.selected
    ? 'translateY(-4px) scale(1.02)'
    : 'translateY(-2px)'

  // Base shadow - will be enhanced by CSS for selected state
  const baseShadow = props.selected
    ? `0 12px 24px rgba(0, 0, 0, 0.25),
       inset 0 -6px 0 ${darkerColor},
       0 0 0 2px var(--color-primary, #4299e1)`
    : `0 8px 16px rgba(0, 0, 0, 0.2),
       inset 0 -4px 0 ${darkerColor}`

  const style = {
    background: gradientBg,
    borderColor: 'transparent', // We'll use box-shadow for the border effect
    borderWidth: '0',
    borderStyle: 'solid',
    boxShadow: baseShadow,
    transform: baseTransform,
    transition: 'all 0.3s ease',
  }

  return style
})

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    return adjustHexColor(color, amount)
  }
  // For non-hex colors, return a semi-transparent black for shadow
  return 'rgba(0, 0, 0, 0.3)'
}

// Adjust hex color brightness
function adjustHexColor(hex: string, amount: number): string {
  let r = Number.parseInt(hex.slice(1, 3), 16)
  let g = Number.parseInt(hex.slice(3, 5), 16)
  let b = Number.parseInt(hex.slice(5, 7), 16)

  r = Math.max(0, Math.min(255, r + amount))
  g = Math.max(0, Math.min(255, g + amount))
  b = Math.max(0, Math.min(255, b + amount))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Compute classes based on shape type
const shapeClass = computed(() => {
  return {
    'shape': true,
    'shape-rectangle': props.type === 'rectangle',
    'shape-circle': props.type === 'circle',
    'shape-selected': props.selected,
    'shape-new': props.isNew,
  }
})

// SVG properties for triangle
const triangleProps = computed(() => {
  return {
    fill: `url(#${gradientId.value})`,
    stroke: props.selected ? 'var(--color-primary)' : 'none',
    strokeWidth: props.selected ? 2 : 0,
    filter: 'url(#shadow)',
  }
})
</script>

<template>
  <div class="shape-container">
    <div v-if="type !== 'triangle'" :class="shapeClass" :style="shapeStyle" />
    <svg
      v-else class="shape-svg" :class="[{ 'shape-selected': props.selected, 'shape-new': props.isNew }]"
      viewBox="0 0 100 100" preserveAspectRatio="none"
    >
      <!-- SVG Definitions for filters and gradients -->
      <defs>
        <!-- Shadow filter for 3D effect -->
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" flood-opacity="0.3" />
        </filter>

        <!-- Enhanced gradient for triangle -->
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="adjustColor(props.color, 30)" />
          <stop offset="30%" :stop-color="props.color" />
          <stop offset="70%" :stop-color="adjustColor(props.color, -15)" />
          <stop offset="100%" :stop-color="adjustColor(props.color, -30)" />
        </linearGradient>
      </defs>

      <polygon points="50,0 0,100 100,100" v-bind="triangleProps" />
    </svg>
  </div>
</template>

<style scoped>
.shape-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 800px;
  /* Add perspective for 3D effect */
}

.shape {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
  position: relative;
  transform-style: preserve-3d;
}

.shape:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25), inset 0 -6px 0 rgba(0, 0, 0, 0.2);
  filter: brightness(1.1) contrast(1.05);
}

.shape-rectangle {
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

/* Add a pseudo-element for a glossy effect on rectangles */
.shape-rectangle::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

.shape-circle {
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

/* Add a pseudo-element for a glossy effect on circles */
.shape-circle::after {
  content: '';
  position: absolute;
  top: 0;
  left: 25%;
  right: 25%;
  height: 40%;
  border-radius: 50%;
  background: linear-gradient(to bottom,
      rgba(255, 255, 255, 0.3) 0%,
      rgba(255, 255, 255, 0.1) 60%,
      rgba(255, 255, 255, 0) 100%);
  transform: translateY(-30%) scale(1.5, 0.5);
  pointer-events: none;
}

.shape-svg {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
}

.shape-svg:hover {
  transform: translateY(-4px) scale(1.02);
  filter: brightness(1.1) contrast(1.05) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25));
}

/* Add animation for selected state */
.shape-selected {
  animation: pulse 2s infinite alternate ease-in-out;
}

/* Apply selected animation to SVG as well */
.shape-svg.shape-selected {
  animation: svgPulse 2s infinite alternate ease-in-out;
}

@keyframes pulse {
  0% {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 2px var(--color-primary, #4299e1);
    filter: brightness(1.05);
  }

  100% {
    transform: translateY(-6px) scale(1.04);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3), 0 0 0 4px var(--color-primary, #4299e1);
    filter: brightness(1.15) contrast(1.05);
  }
}

@keyframes svgPulse {
  0% {
    transform: translateY(-4px) scale(1.02);
    filter: brightness(1.05) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25));
  }

  100% {
    transform: translateY(-6px) scale(1.04);
    filter: brightness(1.15) contrast(1.05) drop-shadow(0 16px 32px rgba(0, 0, 0, 0.3));
  }
}

/* Popup animation for new shapes */
.shape-new {
  animation: popupEffect 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.shape-svg.shape-new {
  animation: svgPopupEffect 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes popupEffect {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }

  50% {
    opacity: 1;
    transform: scale(1.1) translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  75% {
    transform: scale(0.95) translateY(5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }

  100% {
    transform: scale(1) translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
}

@keyframes svgPopupEffect {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
    filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
  }

  50% {
    opacity: 1;
    transform: scale(1.1) translateY(-10px);
    filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3));
  }

  75% {
    transform: scale(0.95) translateY(5px);
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
  }

  100% {
    transform: scale(1) translateY(-2px);
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
  }
}
</style>
