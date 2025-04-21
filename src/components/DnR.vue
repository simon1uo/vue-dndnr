<script setup lang="ts">
import type { DnROptions, Position, ResizeHandle, Size } from '../types'
import { computed, ref, watch } from 'vue'
import { useDnR } from '../hooks'

// Define props
const props = withDefaults(defineProps<{
  /** The position of the element */
  position?: Position
  /** The v-model value for the position */
  modelValue?: Position
  /** The size of the element */
  size?: Size
  /** The v-model value for the size */
  sizeModel?: Size
  /** The boundaries for the draggable element */
  bounds?: HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number }
  /** The grid to snap to while dragging */
  grid?: [number, number]
  /** The axis to restrict movement to */
  axis?: 'x' | 'y' | 'both'
  /** The selector for the drag handle */
  handle?: string
  /** The selector for elements that cancel dragging */
  cancel?: string
  /** The scale factor for the draggable element */
  scale?: number
  /** The minimum width of the resizable element */
  minWidth?: number
  /** The minimum height of the resizable element */
  minHeight?: number
  /** The maximum width of the resizable element */
  maxWidth?: number
  /** The maximum height of the resizable element */
  maxHeight?: number
  /** Whether to maintain aspect ratio during resizing */
  lockAspectRatio?: boolean
  /** Which resize handles to enable */
  handles?: ResizeHandle[]
  /** Whether dragging and resizing are disabled */
  disabled?: boolean
  /** The CSS class to apply to the element */
  class?: string
  /** The CSS class to apply when dragging */
  draggingClass?: string
  /** The CSS class to apply when resizing */
  resizingClass?: string
  /** The CSS style to apply to the element */
  style?: Record<string, string>
  /** Callback when dragging starts */
  onDragStart?: (position: Position, event: MouseEvent | TouchEvent) => void
  /** Callback during dragging */
  onDrag?: (position: Position, event: MouseEvent | TouchEvent) => void
  /** Callback when dragging ends */
  onDragEnd?: (position: Position, event: MouseEvent | TouchEvent) => void
  /** Callback when resizing starts */
  onResizeStart?: (size: Size, event: MouseEvent | TouchEvent) => void
  /** Callback during resizing */
  onResize?: (size: Size, event: MouseEvent | TouchEvent) => void
  /** Callback when resizing ends */
  onResizeEnd?: (size: Size, event: MouseEvent | TouchEvent) => void
}>(), {
  position: undefined,
  modelValue: undefined,
  size: undefined,
  sizeModel: undefined,
  axis: 'both',
  scale: 1,
  lockAspectRatio: false,
  disabled: false,
  draggingClass: 'dragging',
  resizingClass: 'resizing',
  handles: () => ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'],
})

const emit = defineEmits<{
  'update:position': [position: Position]
  'update:modelValue': [position: Position]
  'update:size': [size: Size]
  'update:sizeModel': [size: Size]
  'dragStart': [position: Position, event: MouseEvent | TouchEvent]
  'drag': [position: Position, event: MouseEvent | TouchEvent]
  'dragEnd': [position: Position, event: MouseEvent | TouchEvent]
  'resizeStart': [event: MouseEvent | TouchEvent, handle: ResizeHandle]
  'resize': [event: MouseEvent | TouchEvent, handle: ResizeHandle]
  'resizeEnd': [event: MouseEvent | TouchEvent, handle: ResizeHandle]
}>()

// Create a ref for the element
const elementRef = ref<HTMLElement | null>(null)

// Track active handle for event handlers
let activeHandle: ResizeHandle | null = null

// Create DnR options with callbacks
const dnrOptions = computed<DnROptions>(() => ({
  draggable: {
    initialPosition: props.position || props.modelValue || { x: 0, y: 0 },
    bounds: props.bounds,
    grid: props.grid,
    axis: props.axis,
    handle: props.handle,
    cancel: props.cancel,
    scale: props.scale,
    disabled: props.disabled,
    onDragStart: (position, event) => {
      emit('dragStart', position, event)
      if (props.onDragStart)
        props.onDragStart(position, event)
    },
    onDrag: (position, event) => {
      emit('drag', position, event)
      if (props.onDrag)
        props.onDrag(position, event)
    },
    onDragEnd: (position, event) => {
      emit('dragEnd', position, event)
      if (props.onDragEnd)
        props.onDragEnd(position, event)
    },
  },
  resizable: {
    initialSize: props.size || props.sizeModel || { width: 'auto', height: 'auto' },
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
  },
  disabled: props.disabled,
}))

// Initialize with options
const {
  position,
  size,
  isDragging,
  isResizing,
  style: dnrStyle,
  setPosition,
  setSize,
  onResizeStart,
} = useDnR(elementRef, dnrOptions.value)

// Update when props change
watch(
  () => props.position,
  (newPosition) => {
    if (newPosition && !isDragging.value) {
      setPosition(newPosition)
    }
  },
  { deep: true },
)

watch(
  () => props.modelValue,
  (newPosition) => {
    if (newPosition && !isDragging.value) {
      setPosition(newPosition)
    }
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
  () => props.sizeModel,
  (newSize) => {
    if (newSize && !isResizing.value) {
      setSize(newSize)
    }
  },
  { deep: true },
)

// Emit updates
watch(
  position,
  (newPosition) => {
    emit('update:position', newPosition)
    emit('update:modelValue', newPosition)
  },
  { deep: true },
)

watch(
  size,
  (newSize) => {
    emit('update:size', newSize)
    emit('update:sizeModel', newSize)
  },
  { deep: true },
)

// Handle resize start with handle information
function handleResizeStart(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  activeHandle = handle
  onResizeStart(event, handle)
}

// Compute handle positions for rendering
const handlePositions = computed(() => {
  return {
    't': { top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    'b': { bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    'l': { left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' },
    'r': { right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' },
    'tl': { top: '-5px', left: '-5px', cursor: 'nw-resize' },
    'tr': { top: '-5px', right: '-5px', cursor: 'ne-resize' },
    'bl': { bottom: '-5px', left: '-5px', cursor: 'sw-resize' },
    'br': { bottom: '-5px', right: '-5px', cursor: 'se-resize' },
    'top': { top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    'bottom': { bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    'left': { left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' },
    'right': { right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' },
    'top-left': { top: '-5px', left: '-5px', cursor: 'nw-resize' },
    'top-right': { top: '-5px', right: '-5px', cursor: 'ne-resize' },
    'bottom-left': { bottom: '-5px', left: '-5px', cursor: 'sw-resize' },
    'bottom-right': { bottom: '-5px', right: '-5px', cursor: 'se-resize' },
  }
})

// Map abbreviated handles to their full names for rendering
const handleMap: Record<string, string> = {
  t: 'top',
  b: 'bottom',
  l: 'left',
  r: 'right',
  tl: 'top-left',
  tr: 'top-right',
  bl: 'bottom-left',
  br: 'bottom-right',
}

// Get handles to render based on props
const handlesToRender = computed(() => {
  return props.handles.map(handle => handle)
})

// Combine classes based on state
const combinedClass = computed(() => {
  const classes = ['dnr']

  if (props.class) {
    classes.push(props.class)
  }

  if (isDragging.value && props.draggingClass) {
    classes.push(props.draggingClass)
  }

  if (isResizing.value && props.resizingClass) {
    classes.push(props.resizingClass)
  }

  return classes.join(' ')
})

// Combine styles
const combinedStyle = computed(() => {
  return {
    ...dnrStyle.value,
    ...(props.style || {}),
  }
})
</script>

<template>
  <div ref="elementRef" :class="combinedClass" :style="combinedStyle">
    <slot />

    <!-- Resize handles -->
    <div
      v-for="handle in handlesToRender" :key="handle" :class="`dnr-handle dnr-handle-${handleMap[handle] || handle}`"
      :style="handlePositions[handle]" @mousedown.exact="(e) => handleResizeStart(e, handle)"
      @touchstart.exact="(e) => handleResizeStart(e, handle)"
    />
  </div>
</template>

<style scoped>
.dnr {
  box-sizing: border-box;
  position: absolute;
  touch-action: none;
  user-select: none;
}

.dnr-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 50%;
  z-index: 1;
}

.dark .dnr-handle {
  background-color: #333;
  border-color: #666;
}

.dragging {
  opacity: 0.8;
  z-index: 10;
}

.resizing {
  opacity: 0.8;
  z-index: 10;
}
</style>
