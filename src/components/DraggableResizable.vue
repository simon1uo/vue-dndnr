<script setup lang="ts">
import type { Position, ResizeHandle, Size } from '../types'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Draggable from './Draggable.vue'
import Resizable from './Resizable.vue'

const props = defineProps<{
  /** The initial position of the element */
  initialPosition?: Position
  /** The position of the element (v-model support) */
  position?: Position
  /** The position of the element (v-model support, alternative name) */
  modelValue?: Position
  /** The boundaries for the draggable element */
  bounds?: HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number }
  /** The grid to snap to while dragging and resizing */
  grid?: [number, number]
  /** The axis to restrict movement to */
  axis?: 'x' | 'y' | 'both'
  /** The selector for the drag handle */
  handle?: string
  /** The selector for elements that cancel dragging */
  cancel?: string
  /** The scale factor for the draggable element */
  scale?: number
  /** Whether dragging is disabled */
  dragDisabled?: boolean

  /** The initial size of the element */
  initialSize?: Size
  /** The size of the element (v-model support) */
  size?: Size
  /** The size of the element (v-model support, alternative name) */
  sizeModel?: Size
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
  /** Whether resizing is disabled */
  resizeDisabled?: boolean

  /** The CSS class to apply to the element */
  class?: string
  /** The CSS class to apply when dragging */
  draggingClass?: string
  /** The CSS class to apply when resizing */
  resizingClass?: string
  /** The CSS style to apply to the element */
  style?: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'dragStart', event: MouseEvent | TouchEvent): void
  (e: 'drag', event: MouseEvent | TouchEvent): void
  (e: 'dragEnd', event: MouseEvent | TouchEvent): void
  (e: 'update:position', position: Position): void
  (e: 'update:modelValue', position: Position): void
  (e: 'resizeStart', event: MouseEvent | TouchEvent, handle: ResizeHandle): void
  (e: 'resize', event: MouseEvent | TouchEvent, handle: ResizeHandle): void
  (e: 'resizeEnd', event: MouseEvent | TouchEvent, handle: ResizeHandle): void
  (e: 'update:size', size: Size): void
  (e: 'update:sizeModel', size: Size): void
}>()

// Internal state
const currentPosition = ref<Position>(props.initialPosition || props.position || props.modelValue || { x: 0, y: 0 })
const currentSize = ref<Size>(props.initialSize || props.size || props.sizeModel || { width: 'auto', height: 'auto' })
const isDragging = ref(false)
const isResizing = ref(false)
const parentBounds = ref<{ width: number, height: number } | null>(null)

// Function to check and adjust size based on bounds
function adjustSizeForBounds(size: Size, position: Position): Size {
  if (!props.bounds || props.bounds !== 'parent' || !parentBounds.value) {
    return size
  }

  const { width: parentWidth, height: parentHeight } = parentBounds.value
  const newWidth = typeof size.width === 'number' ? size.width : Number.parseFloat(size.width as string)
  const newHeight = typeof size.height === 'number' ? size.height : Number.parseFloat(size.height as string)

  // Ensure the element doesn't exceed parent bounds
  const maxWidth = Math.min(
    props.maxWidth || Infinity,
    parentWidth - position.x,
  )

  const maxHeight = Math.min(
    props.maxHeight || Infinity,
    parentHeight - position.y,
  )

  return {
    width: Math.min(newWidth, maxWidth),
    height: Math.min(newHeight, maxHeight),
  }
}

// Get parent element dimensions on mount
onMounted(() => {
  if (props.bounds === 'parent') {
    nextTick(() => {
      const el = document.querySelector('.draggable-resizable')?.parentElement
      if (el) {
        parentBounds.value = {
          width: el.clientWidth,
          height: el.clientHeight,
        }
      }
    })
  }
})

// Watch for external position changes
if (props.position) {
  watch(
    () => props.position,
    (newPosition) => {
      if (newPosition && !isDragging.value) {
        currentPosition.value = { ...newPosition }
      }
    },
    { deep: true },
  )
}

if (props.modelValue) {
  watch(
    () => props.modelValue,
    (newPosition) => {
      if (newPosition && !isDragging.value) {
        currentPosition.value = { ...newPosition }
      }
    },
    { deep: true },
  )
}

if (props.size) {
  watch(
    () => props.size,
    (newSize) => {
      if (newSize && !isResizing.value) {
        currentSize.value = { ...newSize }
      }
    },
    { deep: true },
  )
}

if (props.sizeModel) {
  watch(
    () => props.sizeModel,
    (newSize) => {
      if (newSize && !isResizing.value) {
        currentSize.value = { ...newSize }
      }
    },
    { deep: true },
  )
}

// Event handlers
function onDragStart(event: MouseEvent | TouchEvent) {
  isDragging.value = true
  emit('dragStart', event)
}

function onDrag(event: MouseEvent | TouchEvent) {
  emit('drag', event)
}

function onDragEnd(event: MouseEvent | TouchEvent) {
  isDragging.value = false
  emit('dragEnd', event)
}

function onPositionUpdate(position: Position) {
  currentPosition.value = position
  emit('update:position', position)
  emit('update:modelValue', position)
}

function onResizeStart(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  isResizing.value = true
  emit('resizeStart', event, handle)
}

function onResize(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  emit('resize', event, handle)
}

function onResizeEnd(event: MouseEvent | TouchEvent, handle: ResizeHandle) {
  isResizing.value = false
  emit('resizeEnd', event, handle)
}

function onSizeUpdate(size: Size) {
  // Adjust size based on bounds and current position
  const adjustedSize = adjustSizeForBounds(size, currentPosition.value)
  currentSize.value = adjustedSize
  emit('update:size', adjustedSize)
  emit('update:sizeModel', adjustedSize)
}

// Computed classes
const combinedClass = computed(() => {
  const classes = ['draggable-resizable']

  if (props.class) {
    classes.push(props.class)
  }

  if (isDragging.value) {
    classes.push('draggable-resizable--dragging')
    if (props.draggingClass) {
      classes.push(props.draggingClass)
    }
  }

  if (isResizing.value) {
    classes.push('draggable-resizable--resizing')
    if (props.resizingClass) {
      classes.push(props.resizingClass)
    }
  }

  return classes.join(' ')
})
</script>

<template>
  <Draggable
    v-model:position="currentPosition" :bounds="props.bounds" :grid="props.grid" :axis="props.axis"
    :handle="props.handle" cancel=".resizable-handle" :scale="props.scale" :disabled="props.dragDisabled || isResizing"
    :class="combinedClass" :style="props.style" @drag-start="onDragStart" @drag="onDrag" @drag-end="onDragEnd"
    @update:position="onPositionUpdate"
  >
    <Resizable
      v-model:size="currentSize" :min-width="props.minWidth" :min-height="props.minHeight"
      :max-width="props.maxWidth" :max-height="props.maxHeight" :grid="props.grid"
      :lock-aspect-ratio="props.lockAspectRatio" :handles="props.handles" :disabled="props.resizeDisabled"
      class="resizable-inner" @resize-start="onResizeStart" @resize="onResize" @resize-end="onResizeEnd"
      @update:size="onSizeUpdate"
    >
      <slot />
    </Resizable>
  </Draggable>
</template>

<style scoped>
.draggable-resizable {
  box-sizing: border-box;
  user-select: none;
  touch-action: none;
}

.draggable-resizable--dragging {
  opacity: 0.8;
  z-index: 1;
  cursor: grabbing;
}

.draggable-resizable--resizing {
  z-index: 1;
}

.resizable-inner {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
