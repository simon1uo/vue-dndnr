<script setup lang="ts">
import type { DraggableOptions, Position } from '../types'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDraggable } from '../hooks'

// Define props
const props = withDefaults(defineProps<{
  /** The position of the draggable element */
  position?: Position
  /** The v-model value for the position */
  modelValue?: Position
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
  /** Whether dragging is disabled */
  disabled?: boolean
  /** The CSS class to apply to the draggable element */
  class?: string
  /** The CSS class to apply when dragging */
  draggingClass?: string
  /** Callback when dragging starts */
  onDragStart?: (position: Position, event: MouseEvent | TouchEvent) => void
  /** Callback during dragging */
  onDrag?: (position: Position, event: MouseEvent | TouchEvent) => void
  /** Callback when dragging ends */
  onDragEnd?: (position: Position, event: MouseEvent | TouchEvent) => void
}>(), {
  position: undefined,
  modelValue: undefined,
  axis: 'both',
  scale: 1,
  disabled: false,
  draggingClass: 'dragging',
})

const emit = defineEmits<{
  'update:position': [position: Position]
  'update:modelValue': [position: Position]
  'dragStart': [position: Position, event: MouseEvent | TouchEvent]
  'drag': [position: Position, event: MouseEvent | TouchEvent]
  'dragEnd': [position: Position, event: MouseEvent | TouchEvent]
}>()

const draggableOptions = computed<DraggableOptions>(() => ({
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
}))

// Create a ref for the element
const elementRef = ref<HTMLElement | null>(null)

const {
  position,
  isDragging,
  style: draggableStyle,
  setPosition,
} = useDraggable(elementRef, draggableOptions.value)

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
  position,
  (newPosition) => {
    emit('update:position', newPosition)
    emit('update:modelValue', newPosition)
  },
  { deep: true },
)

const combinedClass = computed(() => {
  const classes = ['draggable']

  if (props.class) {
    classes.push(props.class)
  }

  if (isDragging.value && props.draggingClass) {
    classes.push(props.draggingClass)
  }

  return classes.join(' ')
})
</script>

<template>
  <div ref="elementRef" :class="combinedClass" :style="draggableStyle">
    <slot />
  </div>
</template>

<style scoped>
.draggable {
  position: absolute;
  touch-action: none;
  user-select: none;
}

.draggable.dragging {
  opacity: 0.8;
  z-index: 1;
  cursor: grabbing;
}
</style>
