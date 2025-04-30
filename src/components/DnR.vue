<script setup lang="ts">
import type { DnROptions, Position, ResizeHandle, Size } from '@/types'
import useDnR from '@/hooks/useDnR'
import { computed, ref, toValue, watch } from 'vue'

interface DnRProps extends DnROptions {
  position?: Position
  size?: Size
  className?: string
  draggingClassName?: string
  resizingClassName?: string
}

const props = withDefaults(defineProps<DnRProps>(), {
  position: undefined,
  size: undefined,
  disabled: false,
  draggingClassName: 'dragging',
  resizingClassName: 'resizing',
})

const emit = defineEmits<{
  'update:position': [position: Position]
  'update:size': [size: Size]

  'dragStart': [position: Position, event: PointerEvent]
  'drag': [position: Position, event: PointerEvent]
  'dragEnd': [position: Position, event: PointerEvent]

  'resizeStart': [size: Size, event: PointerEvent]
  'resize': [size: Size, event: PointerEvent]
  'resizeEnd': [size: Size, event: PointerEvent]
  'hoverHandleChange': [handle: ResizeHandle | null]
}>()

const targetRef = ref<HTMLElement | null>(null)

// Create reactive options object
const dnrOptions: DnROptions = {
  initialPosition: props.position || { x: 0, y: 0 },
  initialSize: props.size || { width: 'auto', height: 'auto' },
  handle: computed(() => toValue(props.handle) ?? targetRef.value),
  bounds: computed(() => toValue(props.bounds)),
  grid: computed(() => toValue(props.grid)),
  axis: computed(() => toValue(props.axis) ?? 'both'),
  scale: computed(() => toValue(props.scale) ?? 1),
  disabled: computed(() => toValue(props.disabled) ?? false),
  pointerTypes: computed(() => toValue(props.pointerTypes)),
  preventDefault: computed(() => toValue(props.preventDefault) ?? true),
  stopPropagation: computed(() => toValue(props.stopPropagation) ?? false),
  capture: computed(() => toValue(props.capture) ?? true),
  lockAspectRatio: computed(() => toValue(props.lockAspectRatio) ?? false),
  handles: computed(() => toValue(props.handles) ?? ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']),
  handleType: computed(() => toValue(props.handleType) ?? 'borders'),
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight,
  onDragStart: (position: Position, event: PointerEvent) => {
    emit('dragStart', position, event)
    if (props.onDragStart)
      props.onDragStart(position, event)
  },
  onDrag: (position: Position, event: PointerEvent) => {
    emit('drag', position, event)
    if (props.onDrag)
      props.onDrag(position, event)
  },
  onDragEnd: (position: Position, event: PointerEvent) => {
    emit('dragEnd', position, event)
    if (props.onDragEnd)
      props.onDragEnd(position, event)
  },
  onResizeStart: (size: Size, event: PointerEvent) => {
    emit('resizeStart', size, event)
    if (props.onResizeStart)
      props.onResizeStart(size, event)
  },
  onResize: (size: Size, event: PointerEvent) => {
    emit('resize', size, event)
    if (props.onResize)
      props.onResize(size, event)
  },
  onResizeEnd: (size: Size, event: PointerEvent) => {
    emit('resizeEnd', size, event)
    if (props.onResizeEnd)
      props.onResizeEnd(size, event)
  },
}

const {
  position,
  size,
  isDragging,
  isResizing,
  interactionMode,
  isNearResizeHandle,
  style: dnrStyle,
  setPosition,
  setSize,
  hoverHandle,
} = useDnR(targetRef, dnrOptions)

watch(
  () => props.position,
  (newPosition) => {
    if (newPosition && interactionMode.value === 'idle') {
      setPosition(newPosition)
    }
  },
  { deep: true },
)

watch(
  () => props.size,
  (newSize) => {
    if (newSize && interactionMode.value === 'idle') {
      setSize(newSize)
    }
  },
  { deep: true },
)

watch(
  position,
  (newPosition) => {
    emit('update:position', newPosition)
  },
  { deep: true },
)

watch(
  size,
  (newSize) => {
    emit('update:size', newSize)
  },
  { deep: true },
)

watch(hoverHandle, (newHandle) => {
  emit('hoverHandleChange', newHandle)
})

const combinedClass = computed(() => {
  const classes = ['dnr']

  if (props.className) {
    classes.push(props.className)
  }

  if (isDragging.value && props.draggingClassName) {
    classes.push(props.draggingClassName)
  }

  if ((isResizing.value || isNearResizeHandle.value) && props.resizingClassName) {
    classes.push(props.resizingClassName)
  }

  return classes.join(' ')
})
</script>

<template>
  <div ref="targetRef" :class="combinedClass" :style="dnrStyle">
    <slot />
  </div>
</template>

<style scoped>
.dnr {
  position: absolute;
  touch-action: none;
  user-select: none;
}

.dnr.dragging {
  opacity: 0.8;
  z-index: 1;
  cursor: grabbing;
}

.dnr.resizing {
  opacity: 0.8;
  z-index: 1;

}
</style>
