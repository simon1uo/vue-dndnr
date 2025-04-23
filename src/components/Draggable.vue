<script setup lang="ts">
import type { DraggableOptions, Position } from '../types'
import { computed, ref, toValue, watch } from 'vue'
import { useDraggable } from '../hooks'

interface DraggableProps extends DraggableOptions {
  position?: Position
  modelValue?: Position

  className?: string
  draggingClassName?: string
}

const props = withDefaults(defineProps<DraggableProps>(), {
  position: undefined,
  modelValue: undefined,
  axis: 'both',
  scale: 1,
  disabled: false,
  draggingClassName: 'dragging',
})

const emit = defineEmits<{
  'update:position': [position: Position]
  'update:modelValue': [position: Position]
  'dragStart': [position: Position, event: MouseEvent | TouchEvent]
  'drag': [position: Position, event: MouseEvent | TouchEvent]
  'dragEnd': [position: Position, event: MouseEvent | TouchEvent]
}>()

const targetRef = ref<HTMLElement | SVGElement | null | undefined>(null)
const handle = computed(() => toValue(props.handle) ?? targetRef.value)

const draggableOptions = computed<DraggableOptions>(() => ({
  ...props,
  handle,
  initialPosition: props.position || props.modelValue || { x: 0, y: 0 },
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

const {
  position,
  isDragging,
  style: draggableStyle,
  setPosition,
} = useDraggable(targetRef, draggableOptions.value)

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

  if (props.className) {
    classes.push(props.className)
  }

  if (isDragging.value && props.draggingClassName) {
    classes.push(props.draggingClassName)
  }

  return classes.join(' ')
})
</script>

<template>
  <div ref="targetRef" :class="combinedClass" :style="draggableStyle">
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
