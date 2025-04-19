<script setup lang="ts">
import type { ResizableOptions, ResizeHandle, Size } from '../types'
import { computed } from 'vue'
import { useResizable } from '../hooks'

// Define props
const props = defineProps<{
  /**
   * Initial size of the resizable element
   */
  initialSize?: Size

  /**
   * Minimum width of the resizable element
   */
  minWidth?: number

  /**
   * Minimum height of the resizable element
   */
  minHeight?: number

  /**
   * Maximum width of the resizable element
   */
  maxWidth?: number

  /**
   * Maximum height of the resizable element
   */
  maxHeight?: number

  /**
   * Grid to snap to during resizing [x, y]
   */
  grid?: [number, number]

  /**
   * Whether to maintain aspect ratio during resizing
   */
  lockAspectRatio?: boolean

  /**
   * Which resize handles to enable
   */
  handles?: ResizeHandle[]

  /**
   * Whether resizing is disabled
   */
  disabled?: boolean

  /**
   * CSS class to apply to the resizable element
   */
  class?: string

  /**
   * CSS style to apply to the resizable element
   */
  style?: Record<string, string>
}>()

// Define emits
const emit = defineEmits<{
  /**
   * Emitted when resizing starts
   */
  (e: 'resizeStart', event: MouseEvent | TouchEvent, handle: ResizeHandle): void

  /**
   * Emitted during resizing
   */
  (e: 'resize', event: MouseEvent | TouchEvent, handle: ResizeHandle): void

  /**
   * Emitted when resizing ends
   */
  (e: 'resizeEnd', event: MouseEvent | TouchEvent, handle: ResizeHandle): void

  /**
   * Emitted when size changes
   */
  (e: 'update:size', size: Size): void
}>()

// Create options for useResizable
const options = computed<ResizableOptions>(() => ({
  initialSize: props.initialSize,
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight,
  grid: props.grid,
  lockAspectRatio: props.lockAspectRatio,
  handles: props.handles,
  disabled: props.disabled,
}))

// Use the resizable hook
const { size, position, isResizing, elementRef, activeHandle, onResizeStart } = useResizable(options.value)

// Custom event handlers
function handleResizeStart(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  emit('resizeStart', event, handle)
  onResizeStart(event, handle)
}

function handleResize(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  emit('resize', event, handle)
  emit('update:size', size.value)
}

function handleResizeEnd(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  emit('resizeEnd', event, handle)
}

// Computed styles
const resizableStyle = computed(() => {
  return {
    position: 'relative',
    width: typeof size.value.width === 'number' ? `${size.value.width}px` : size.value.width,
    height: typeof size.value.height === 'number' ? `${size.value.height}px` : size.value.height,
    ...props.style,
  }
})

// Computed classes
const resizableClass = computed(() => {
  return {
    'vue-resizable': true,
    'vue-resizable--resizing': isResizing.value,
    ...(props.class ? { [props.class]: true } : {}),
  }
})

// Handle positions
const handlePositions = {
  n: { top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
  s: { bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
  e: { right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' },
  w: { left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' },
  ne: { top: '-5px', right: '-5px', cursor: 'ne-resize' },
  nw: { top: '-5px', left: '-5px', cursor: 'nw-resize' },
  se: { bottom: '-5px', right: '-5px', cursor: 'se-resize' },
  sw: { bottom: '-5px', left: '-5px', cursor: 'sw-resize' },
}

// Get handles to render
const handlesToRender = computed(() => {
  return props.handles || ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
})
</script>

<template>
  <div
    ref="elementRef"
    :class="resizableClass"
    :style="resizableStyle"
  >
    <slot />

    <!-- Resize handles -->
    <div
      v-for="handle in handlesToRender"
      :key="handle"
      :class="`vue-resizable-handle vue-resizable-handle-${handle}`"
      :style="handlePositions[handle]"
      @mousedown="(e) => handleResizeStart(e, handle)"
      @touchstart="(e) => handleResizeStart(e, handle)"
    />
  </div>
</template>

<style scoped>
.vue-resizable {
  box-sizing: border-box;
  position: relative;
}

.vue-resizable--resizing {
  user-select: none;
}

.vue-resizable-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #4299e1;
  border-radius: 50%;
  z-index: 1;
}

.vue-resizable-handle:hover {
  background-color: #3182ce;
}
</style>
