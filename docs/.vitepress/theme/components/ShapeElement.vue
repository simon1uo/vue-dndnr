<script setup lang="ts">
import { computed } from 'vue'

type ShapeType = 'rectangle' | 'circle' | 'triangle'

const props = withDefaults(defineProps<{
  type: ShapeType
  color?: string
}>(), {
  color: '#40B38C',
  selected: false,
  isNew: false,
})

// Compute the shape style based on type and color
const shapeStyle = computed(() => {
  const style = {
    background: props.color,
    borderColor: props.color,
    borderWidth: '1px',
    borderStyle: 'solid',
  }

  return style
})

// Compute classes based on shape type and state
const shapeClass = computed(() => {
  return {
    'shape': true,
    'shape-rectangle': props.type === 'rectangle',
    'shape-circle': props.type === 'circle',
    'shape-triangle': props.type === 'triangle',
  }
})

// SVG properties for triangle
const triangleProps = computed(() => {
  return {
    fill: props.color,
    stroke: props.color,
    strokeWidth: 1,
  }
})
</script>

<template>
  <div class="shape-container">
    <div v-if="type !== 'triangle'" :class="shapeClass" :style="shapeStyle" />
    <svg v-else class="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
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
}

.shape {
  width: 100%;
  height: 100%;
  position: relative;
}

.shape-rectangle {
  border-radius: 8px;
}

.shape-circle {
  border-radius: 50%;
}

.shape-svg {
  width: 100%;
  height: 100%;
}
</style>
