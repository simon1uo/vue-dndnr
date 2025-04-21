<script setup lang="ts">
import type { ResizableOptions, ResizeHandle, Size } from '../types'
import { computed, ref, watch } from 'vue'
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
  /** Callback when resizing starts */
  onResizeStart?: (size: Size, event: MouseEvent | TouchEvent) => void
  /** Callback during resizing */
  onResize?: (size: Size, event: MouseEvent | TouchEvent) => void
  /** Callback when resizing ends */
  onResizeEnd?: (size: Size, event: MouseEvent | TouchEvent) => void
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

// Create a ref for the element
const elementRef = ref<HTMLElement | null>(null)

// Track active handle for event handlers
let activeHandle: ResizeHandle | null = null

// Create resizable options with callbacks
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
  onResizeStart: (size, event) => {
    if (activeHandle) {
      emit('resizeStart', event, activeHandle)
      if (props.onResizeStart)
        props.onResizeStart(size, event)
    }
  },
  onResize: (size, event) => {
    if (activeHandle) {
      emit('resize', event, activeHandle)
      if (props.onResize)
        props.onResize(size, event)
    }
  },
  onResizeEnd: (size, event) => {
    if (activeHandle) {
      emit('resizeEnd', event, activeHandle)
      if (props.onResizeEnd)
        props.onResizeEnd(size, event)
      activeHandle = null
    }
  },
}))

// Initialize with options
const {
  size: currentSize,
  isResizing,
  style: resizableStyle,
  setSize,
  onResizeStart,
} = useResizable(elementRef, resizableOptions.value)

// Update the hook when options change
watch(
  resizableOptions,
  () => {
    // The hook will automatically use the updated options for new resize operations
    // We don't need to do anything here
  },
  { deep: true },
)

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

function handleResizeStart(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  activeHandle = handle
  onResizeStart(event, handle)
}

// Handle positions
const handlePositions = {
  't': { top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
  'b': { bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
  'r': { right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' },
  'l': { left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' },
  'tr': { top: '-5px', right: '-5px', cursor: 'ne-resize' },
  'tl': { top: '-5px', left: '-5px', cursor: 'nw-resize' },
  'br': { bottom: '-5px', right: '-5px', cursor: 'se-resize' },
  'bl': { bottom: '-5px', left: '-5px', cursor: 'sw-resize' },
  // Support for full names
  'top': { top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
  'bottom': { bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
  'right': { right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' },
  'left': { left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' },
  'top-right': { top: '-5px', right: '-5px', cursor: 'ne-resize' },
  'top-left': { top: '-5px', left: '-5px', cursor: 'nw-resize' },
  'bottom-right': { bottom: '-5px', right: '-5px', cursor: 'se-resize' },
  'bottom-left': { bottom: '-5px', left: '-5px', cursor: 'sw-resize' },
}

// Get handles to render
const handlesToRender = computed<ResizeHandle[]>(() => {
  return props.handles || ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']
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
    <div
      v-for="handle in handlesToRender" :key="handle" :class="`resizable-handle resizable-handle-${handle}`"
      :style="handlePositions[handle]" @mousedown="(e) => handleResizeStart(e, handle)"
      @touchstart="(e) => handleResizeStart(e, handle)"
    />
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
