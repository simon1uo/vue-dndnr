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
  
  if (props.type === 'triangle') {
    style.borderBottom = `100px solid ${props.color}`
    style.borderLeft = '50px solid transparent'
    style.borderRight = '50px solid transparent'
    style.backgroundColor = 'transparent'
    style.width = '0'
    style.height = '0'
  }
  
  return style
})

// Compute classes based on shape type
const shapeClass = computed(() => {
  return {
    'shape': true,
    'shape-rectangle': props.type === 'rectangle',
    'shape-circle': props.type === 'circle',
    'shape-triangle': props.type === 'triangle',
    'shape-selected': props.selected
  }
})
</script>

<template>
  <div class="shape-container">
    <div :class="shapeClass" :style="shapeStyle"></div>
  </div>
</template>

<style scoped>
.shape-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
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

.shape-triangle {
  /* Triangle styling is handled in the computed style */
  transform: translateY(-25%);
}

.shape-selected {
  box-shadow: 0 0 0 2px var(--color-primary);
}
</style>
