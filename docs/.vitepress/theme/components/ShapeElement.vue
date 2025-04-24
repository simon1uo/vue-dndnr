<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['rectangle', 'circle', 'triangle'].includes(value)
  },
  color: {
    type: String,
    default: '#4299e1'
  },
  selected: {
    type: Boolean,
    default: false
  }
})

// Compute the shape style based on type and color
const shapeStyle = computed(() => {
  const style = {
    backgroundColor: props.type !== 'triangle' ? props.color : 'transparent',
    borderColor: props.selected ? 'var(--color-primary)' : 'transparent',
    borderWidth: props.selected ? '2px' : '0',
    borderStyle: 'solid',
  }

  return style
})

// Compute classes based on shape type
const shapeClass = computed(() => {
  return {
    'shape': true,
    'shape-rectangle': props.type === 'rectangle',
    'shape-circle': props.type === 'circle',
    'shape-selected': props.selected
  }
})

// SVG properties for triangle
const triangleProps = computed(() => {
  return {
    fill: props.color,
    stroke: props.selected ? 'var(--color-primary)' : 'none',
    strokeWidth: props.selected ? 2 : 0
  }
})
</script>

<template>
  <div class="shape-container">
    <div v-if="type !== 'triangle'" :class="shapeClass" :style="shapeStyle"></div>
    <svg v-else class="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon
        points="50,0 0,100 100,100"
        v-bind="triangleProps"
      />
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
  transition: background-color 0.2s;
}

.shape-rectangle {
  border-radius: 4px;
}

.shape-circle {
  border-radius: 50%;
}

.shape-svg {
  width: 100%;
  height: 100%;
  transition: fill 0.2s;
}

 
</style>
