<script setup lang="ts">
import type { DraggableOptions, Position, ResizableOptions, ResizeHandle, Size } from '../types'
import { computed } from 'vue'
import { useDraggable, useResizable } from '../hooks'

// Define props
const props = defineProps<{
  // Draggable props
  initialPosition?: Position
  bounds?: HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number }
  grid?: [number, number]
  axis?: 'x' | 'y' | 'both'
  handle?: string
  cancel?: string
  scale?: number
  dragDisabled?: boolean

  // Resizable props
  initialSize?: Size
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  lockAspectRatio?: boolean
  handles?: ResizeHandle[]
  resizeDisabled?: boolean

  // Common props
  class?: string
  style?: Record<string, string>
}>()

// Define emits
const emit = defineEmits<{
  // Draggable events
  (e: 'dragStart', event: MouseEvent | TouchEvent): void
  (e: 'drag', event: MouseEvent | TouchEvent): void
  (e: 'dragEnd', event: MouseEvent | TouchEvent): void
  (e: 'update:position', position: Position): void

  // Resizable events
  (e: 'resizeStart', event: MouseEvent | TouchEvent, handle: ResizeHandle): void
  (e: 'resize', event: MouseEvent | TouchEvent, handle: ResizeHandle): void
  (e: 'resizeEnd', event: MouseEvent | TouchEvent, handle: ResizeHandle): void
  (e: 'update:size', size: Size): void
}>()

// Create options for useDraggable
const draggableOptions = computed<DraggableOptions>(() => ({
  initialPosition: props.initialPosition,
  bounds: props.bounds,
  grid: props.grid,
  axis: props.axis,
  handle: props.handle,
  cancel: props.cancel,
  scale: props.scale,
  disabled: props.dragDisabled,
}))

// Create options for useResizable
const resizableOptions = computed<ResizableOptions>(() => ({
  initialSize: props.initialSize,
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight,
  grid: props.grid,
  lockAspectRatio: props.lockAspectRatio,
  handles: props.handles,
  disabled: props.resizeDisabled,
}))

// Use the hooks
const { position, isDragging, elementRef: dragRef } = useDraggable(draggableOptions.value)
const { size, isResizing, elementRef: resizeRef, activeHandle, onResizeStart } = useResizable(resizableOptions.value)

// Set the element ref for both hooks to the same element
function setRef(el: HTMLElement | null) {
  if (el) {
    dragRef.value = el
    resizeRef.value = el
  }
}

// Custom event handlers
// Drag events
function onDragStart(event: MouseEvent | TouchEvent) {
  emit('dragStart', event)
}

function onDrag(event: MouseEvent | TouchEvent) {
  emit('drag', event)
  emit('update:position', position.value)
}

function onDragEnd(event: MouseEvent | TouchEvent) {
  emit('dragEnd', event)
}

// Resize events
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
const combinedStyle = computed(() => {
  return {
    position: 'absolute',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    width: typeof size.value.width === 'number' ? `${size.value.width}px` : size.value.width,
    height: typeof size.value.height === 'number' ? `${size.value.height}px` : size.value.height,
    ...props.style,
  }
})

// Computed classes
const combinedClass = computed(() => {
  return {
    'vue-draggable-resizable': true,
    'vue-draggable-resizable--dragging': isDragging.value,
    'vue-draggable-resizable--resizing': isResizing.value,
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
    ref="setRef"
    :class="combinedClass"
    :style="combinedStyle"
    @mousedown="onDragStart"
    @touchstart="onDragStart"
  >
    <slot />

    <!-- Resize handles -->
    <div
      v-for="handle in handlesToRender"
      :key="handle"
      :class="`vue-draggable-resizable-handle vue-draggable-resizable-handle-${handle}`"
      :style="handlePositions[handle]"
      @mousedown.stop="(e) => handleResizeStart(e, handle)"
      @touchstart.stop="(e) => handleResizeStart(e, handle)"
    />
  </div>
</template>

<style scoped>
.vue-draggable-resizable {
  box-sizing: border-box;
  position: absolute;
  user-select: none;
  touch-action: none;
}

.vue-draggable-resizable--dragging {
  opacity: 0.8;
  z-index: 1;
  cursor: grabbing;
}

.vue-draggable-resizable--resizing {
  z-index: 1;
}

.vue-draggable-resizable-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #4299e1;
  border-radius: 50%;
  z-index: 2;
}

.vue-draggable-resizable-handle:hover {
  background-color: #3182ce;
}
</style>
