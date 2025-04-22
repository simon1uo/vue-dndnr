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
  /** Threshold in pixels for boundary detection */
  boundaryThreshold?: number
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
  'hoverHandleChange': [handle: ResizeHandle | null]
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
  boundaryThreshold: props.boundaryThreshold,
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
  activeHandle: currentActiveHandle,
  hoverHandle,
} = useResizable(elementRef, resizableOptions.value)

// Watch for active handle changes from the hook
watch(currentActiveHandle, (newHandle) => {
  activeHandle = newHandle
})

// Watch for hover handle changes and emit events
watch(hoverHandle, (newHandle) => {
  emit('hoverHandleChange', newHandle)
})

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

// No longer need the handleResizeStart function or handle positions
// as we're using boundary detection instead

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
</style>
