<script setup lang="ts">
import type { DraggableOptions } from '../types'
import { computed, ref } from 'vue'
import { useDraggable } from '../hooks'

// Define props
const props = defineProps<{
  /**
   * Initial position of the draggable element
   */
  initialPosition?: { x: number, y: number }

  /**
   * Bounds for the draggable element
   * Can be an HTMLElement, 'parent', or an object with left, top, right, bottom values
   */
  bounds?: HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number }

  /**
   * Grid to snap to during dragging [x, y]
   */
  grid?: [number, number]

  /**
   * Axis constraint for dragging: 'x', 'y', or 'both'
   */
  axis?: 'x' | 'y' | 'both'

  /**
   * CSS selector for the drag handle
   */
  handle?: string

  /**
   * CSS selector for elements that should cancel dragging
   */
  cancel?: string

  /**
   * Scale factor for nested transformations
   */
  scale?: number

  /**
   * Whether dragging is disabled
   */
  disabled?: boolean

  /**
   * CSS class to apply to the draggable element
   */
  class?: string

  /**
   * CSS style to apply to the draggable element
   */
  style?: Record<string, string>
}>()

// Define emits
const emit = defineEmits<{
  /**
   * Emitted when dragging starts
   */
  (e: 'dragStart', event: MouseEvent | TouchEvent): void

  /**
   * Emitted during dragging
   */
  (e: 'drag', event: MouseEvent | TouchEvent): void

  /**
   * Emitted when dragging ends
   */
  (e: 'dragEnd', event: MouseEvent | TouchEvent): void

  /**
   * Emitted when position changes
   */
  (e: 'update:position', position: { x: number, y: number }): void
}>()

// Create options for useDraggable
const options = computed<DraggableOptions>(() => ({
  initialPosition: props.initialPosition,
  bounds: props.bounds,
  grid: props.grid,
  axis: props.axis,
  handle: props.handle,
  cancel: props.cancel,
  scale: props.scale,
  disabled: props.disabled,
}))

// Use the draggable hook
const { position, isDragging, elementRef } = useDraggable(options.value)

// Watch for position changes and emit update event
const originalOnDragStart = ref<((event: MouseEvent | TouchEvent) => void) | null>(null)
const originalOnDrag = ref<((event: MouseEvent | TouchEvent) => void) | null>(null)
const originalOnDragEnd = ref<((event: MouseEvent | TouchEvent) => void) | null>(null)

// Custom event handlers that emit events
function onDragStart(event: MouseEvent | TouchEvent) {
  emit('dragStart', event)
  if (originalOnDragStart.value) {
    originalOnDragStart.value(event)
  }
}

function onDrag(event: MouseEvent | TouchEvent) {
  emit('drag', event)
  emit('update:position', position.value)
  if (originalOnDrag.value) {
    originalOnDrag.value(event)
  }
}

function onDragEnd(event: MouseEvent | TouchEvent) {
  emit('dragEnd', event)
  if (originalOnDragEnd.value) {
    originalOnDragEnd.value(event)
  }
}

// Computed styles
const draggableStyle = computed(() => {
  return {
    position: 'absolute',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    cursor: isDragging.value ? 'grabbing' : 'grab',
    userSelect: 'none',
    ...props.style,
  }
})

// Computed classes
const draggableClass = computed(() => {
  return {
    'vue-draggable': true,
    'vue-draggable--dragging': isDragging.value,
    ...(props.class ? { [props.class]: true } : {}),
  }
})
</script>

<template>
  <div
    ref="elementRef"
    :class="draggableClass"
    :style="draggableStyle"
    @mousedown="onDragStart"
    @touchstart="onDragStart"
  >
    <slot />
  </div>
</template>

<style scoped>
.vue-draggable {
  touch-action: none;
}

.vue-draggable--dragging {
  opacity: 0.8;
  z-index: 1;
}
</style>
