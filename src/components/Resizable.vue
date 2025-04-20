<script setup lang="ts">
import type { ResizableOptions, ResizeHandle, Size } from '../types'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useResizable } from '../hooks'

// Define props
const props = withDefaults(defineProps<{
  /** The size of the resizable element */
  size?: Size
  /** The v-model value for the size */
  modelValue?: Size
  /** The minimum width of the resizable element */
  minWidth?: number
  /** The minimum height of the resizable element */
  minHeight?: number
  /** The maximum width of the resizable element */
  maxWidth?: number
  /** The maximum height of the resizable element */
  maxHeight?: number
  /** The grid to snap to while resizing */
  grid?: [number, number]
  /** Whether to maintain aspect ratio during resizing */
  lockAspectRatio?: boolean
  /** Which resize handles to enable */
  handles?: ResizeHandle[]
  /** Whether resizing is disabled */
  disabled?: boolean
  /** The CSS class to apply to the resizable element */
  class?: string
  /** The CSS class to apply when resizing */
  resizingClass?: string
  /** The CSS style to apply to the resizable element */
  style?: Record<string, string>
}>(), {
  size: undefined,
  modelValue: undefined,
  lockAspectRatio: false,
  disabled: false,
  resizingClass: 'resizing',
})

const emit = defineEmits<{
  'update:size': [size: Size]
  'update:modelValue': [size: Size]
  'resizeStart': [event: MouseEvent | TouchEvent, handle: ResizeHandle]
  'resize': [event: MouseEvent | TouchEvent, handle: ResizeHandle]
  'resizeEnd': [event: MouseEvent | TouchEvent, handle: ResizeHandle]
}>()

const resizableOptions = computed<ResizableOptions>(() => ({
  initialSize: props.size || props.modelValue || { width: 'auto', height: 'auto' },
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight,
  grid: props.grid,
  lockAspectRatio: props.lockAspectRatio,
  handles: props.handles,
  disabled: props.disabled,
}))

const {
  size: currentSize,
  isResizing,
  style: resizableStyle,
  elementRef,
  setSize,
  onResizeStart,
} = useResizable(resizableOptions.value)

watch(
  () => props.size,
  (newSize) => {
    if (newSize && !isResizing.value) {
      setSize(newSize)
    }
  },
  { deep: true },
)

watch(
  () => props.modelValue,
  (newSize) => {
    if (newSize && !isResizing.value) {
      setSize(newSize)
    }
  },
  { deep: true },
)

watch(
  currentSize,
  (newSize) => {
    emit('update:size', newSize)
    emit('update:modelValue', newSize)
  },
  { deep: true },
)

// Track active handle for event handlers
let activeHandle: ResizeHandle | null = null

function handleResizeStart(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  activeHandle = handle
  onResizeStart(event, handle)
  emit('resizeStart', event, handle)
}

function handleResize(event: MouseEvent | TouchEvent) {
  if (isResizing.value && activeHandle) {
    emit('resize', event, activeHandle)
  }
}

function handleResizeEnd(event: MouseEvent | TouchEvent) {
  if (isResizing.value && activeHandle) {
    emit('resizeEnd', event, activeHandle)
    activeHandle = null
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleResize as EventListener)
  window.addEventListener('mouseup', handleResizeEnd as EventListener)
  window.addEventListener('touchmove', handleResize as EventListener)
  window.addEventListener('touchend', handleResizeEnd as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleResize as EventListener)
  window.removeEventListener('mouseup', handleResizeEnd as EventListener)
  window.removeEventListener('touchmove', handleResize as EventListener)
  window.removeEventListener('touchend', handleResizeEnd as EventListener)
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
const handlesToRender = computed<ResizeHandle[]>(() => {
  return props.handles || ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
})

const combinedClass = computed(() => {
  const classes = ['resizable']

  if (props.class) {
    classes.push(props.class)
  }

  if (isResizing.value && props.resizingClass) {
    classes.push(props.resizingClass)
  }

  return classes.join(' ')
})
</script>

<template>
  <div ref="elementRef" :class="combinedClass" :style="resizableStyle">
    <slot />

    <!-- Resize handles -->
    <div v-for="handle in handlesToRender" :key="handle" :class="`resizable-handle resizable-handle-${handle}`"
      :style="handlePositions[handle]" @mousedown="(e) => handleResizeStart(e, handle)"
      @touchstart="(e) => handleResizeStart(e, handle)" />
  </div>
</template>

<style scoped>
.resizable {
  box-sizing: border-box;
  position: relative;
  touch-action: none;
  user-select: none;
}

.resizable.resizing {
  z-index: 1;
}

.resizable-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #4299e1;
  border-radius: 50%;
  z-index: 1;
}

.resizable-handle:hover {
  background-color: #3182ce;
}
</style>
