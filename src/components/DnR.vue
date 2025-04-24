<script setup lang="ts">
import type { DnROptions, Position, ResizeHandle, Size } from '../types'
import { computed, ref, toValue, watch } from 'vue'
import useDnR from '../hooks/useDnR'

interface DnRProps extends DnROptions {
  position?: Position
  positionModel?: Position

  size?: Size
  sizeModel?: Size

  className?: string
  draggingClassName?: string
  resizingClassName?: string
}

const props = withDefaults(defineProps<DnRProps>(), {
  position: undefined,
  positionModel: undefined,
  size: undefined,
  sizeModel: undefined,
  disabled: false,
  draggingClassName: 'dragging',
  resizingClassName: 'resizing',
})

const emit = defineEmits<{
  'update:position': [position: Position]
  'update:positionModel': [position: Position]

  'update:size': [size: Size]
  'update:sizeModel': [size: Size]

  'dragStart': [position: Position, event: MouseEvent | TouchEvent]
  'drag': [position: Position, event: MouseEvent | TouchEvent]
  'dragEnd': [position: Position, event: MouseEvent | TouchEvent]

  'resizeStart': [size: Size, event: MouseEvent | TouchEvent]
  'resize': [size: Size, event: MouseEvent | TouchEvent]
  'resizeEnd': [size: Size, event: MouseEvent | TouchEvent]
  'hoverHandleChange': [handle: ResizeHandle | null]
}>()

const targetRef = ref<HTMLElement | null>(null)
const handle = computed<HTMLElement | SVGElement | null | undefined>(() => toValue(props.handle) ?? toValue(targetRef))

const dnrOptions = computed<DnROptions>(() => ({
  ...props,
  initialPosition: props.position || props.positionModel || { x: 0, y: 0 },
  initialSize: props.size || props.sizeModel || { width: 'auto', height: 'auto' },
  handle,
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

  onResizeStart: (size, event) => {
    emit('resizeStart', size, event)
    if (props.onResizeStart)
      props.onResizeStart(size, event)
  },
  onResize: (size, event) => {
    emit('resize', size, event)
    if (props.onResize)
      props.onResize(size, event)
  },
  onResizeEnd: (size, event) => {
    emit('resizeEnd', size, event)
    if (props.onResizeEnd)
      props.onResizeEnd(size, event)
  },
}))

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
} = useDnR(targetRef, dnrOptions.value)

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
  () => props.positionModel,
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
  () => props.sizeModel,
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
    emit('update:positionModel', newPosition)
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
