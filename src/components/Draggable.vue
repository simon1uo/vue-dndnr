<script setup lang="ts">
import type { UseDraggableOptions } from '@/core/useDraggable'
import type { Position } from '@/types'
import { useDraggable } from '@/core/useDraggable'
import { computed, ref, watch } from 'vue'

export interface DraggableProps extends UseDraggableOptions {
  position?: Position
  modelValue?: Position
  active?: boolean
  className?: string
  draggingClassName?: string
  activeClassName?: string
  onDragStart?: (position: Position, event: PointerEvent) => void | boolean
  onDrag?: (position: Position, event: PointerEvent) => void | boolean
  onDragEnd?: (position: Position, event: PointerEvent) => void | boolean
  onActiveChange?: (active: boolean) => void | boolean
}

const props = withDefaults(defineProps<DraggableProps>(), {
  position: undefined,
  modelValue: undefined,
  active: undefined,
  axis: 'both',
  scale: 1,
  disabled: false,
  activeOn: 'none',
  preventDeactivation: false,
  preventDefault: true,
  stopPropagation: false,
  capture: true,
  throttleDelay: 16,
  draggingClassName: 'dragging',
  activeClassName: 'active',
})

const emit = defineEmits<{
  'update:position': [position: Position]
  'update:modelValue': [position: Position]
  'update:active': [active: boolean]
  'dragStart': [position: Position, event: PointerEvent]
  'drag': [position: Position, event: PointerEvent]
  'dragEnd': [position: Position, event: PointerEvent]
  'activeChange': [active: boolean]
}>()

const targetRef = ref<HTMLElement | null | undefined>(null)

const {
  position,
  isDragging,
  isActive,
  style: draggableStyle,
  setPosition,
  setActive,
} = useDraggable(targetRef, {
  ...props,
  initialPosition: props.position || props.modelValue || { x: 0, y: 0 },
  initialActive: props.active,
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
  onActiveChange: (active) => {
    emit('activeChange', active)
    emit('update:active', active)
    if (props.onActiveChange)
      return props.onActiveChange(active)
    return true
  },
})

watch(
  [() => props.position, () => props.modelValue],
  ([newPosition, newModelValue]) => {
    const positionToUse = newPosition || newModelValue
    if (positionToUse && !isDragging.value) {
      setPosition(positionToUse)
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

watch(
  () => props.active,
  (newActive) => {
    if (newActive !== undefined && newActive !== isActive.value) {
      setActive(newActive)
    }
  },
)

const combinedClass = computed(() => {
  const classes = ['draggable']

  if (props.className) {
    classes.push(props.className)
  }

  if (isDragging.value && props.draggingClassName) {
    classes.push(props.draggingClassName)
  }

  if (isActive.value && props.activeClassName) {
    classes.push(props.activeClassName)
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
}
</style>
