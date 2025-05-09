<script setup lang="ts">
import type { DnROptions, Position } from '@/types'
import { useDnR } from '@/hooks'
import { computed, ref, toValue, watch } from 'vue'

interface DraggableProps extends DnROptions {
  position?: Position
  modelValue?: Position
  active?: boolean
  className?: string
  draggingClassName?: string
  activeClassName?: string
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
  disableResize: true,
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

const targetRef = ref<HTMLElement | SVGElement | null | undefined>(null)
const containerElement = computed(() => toValue(props.containerElement))
const handle = computed(() => toValue(props.handle) ?? targetRef.value)
const grid = computed(() => toValue(props.grid))
const axis = computed(() => toValue(props.axis))
const scale = computed(() => toValue(props.scale))
const disabled = computed(() => toValue(props.disabled))
const pointerTypes = computed(() => toValue(props.pointerTypes))
const preventDefault = computed(() => toValue(props.preventDefault))
const stopPropagation = computed(() => toValue(props.stopPropagation))
const capture = computed(() => toValue(props.capture))
const throttleDelay = computed(() => toValue(props.throttleDelay))
const activeOn = computed(() => toValue(props.activeOn))
const preventDeactivation = computed(() => toValue(props.preventDeactivation))
const disableResize = computed(() => toValue(props.disableResize))

const {
  position,
  isDragging,
  isActive,
  style: draggableStyle,
  setPosition,
  setActive,
} = useDnR(targetRef, {
  ...props,
  initialPosition: props.position || props.modelValue || { x: 0, y: 0 },
  initialActive: props.active,
  containerElement,
  handle,
  grid,
  axis,
  scale,
  disabled,
  pointerTypes,
  preventDefault,
  stopPropagation,
  capture,
  throttleDelay,
  activeOn,
  preventDeactivation,
  disableResize,
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
