<script setup lang="ts">
import type { UseDnrOptions } from '@/core'
import type {
  Position,
  ResizeHandle,
  Size,
} from '@/types'
import { useDnr } from '@/core'
import { getCursorStyle } from '@/utils/cursor'
import { computed, ref, toValue, watch } from 'vue'

export interface DnrProps extends UseDnrOptions {
  position?: Position
  size?: Size
  active?: boolean
  className?: string
  draggingClassName?: string
  resizingClassName?: string
  activeClassName?: string
}

const props = withDefaults(defineProps<DnrProps>(), {
  position: undefined,
  size: undefined,
  active: undefined,
  disabled: false,
  draggingClassName: 'dragging',
  resizingClassName: 'resizing',
  activeClassName: 'active',
  lockAspectRatio: false,
  activeOn: 'none',
  preventDeactivation: false,
  preventDefault: true,
  stopPropagation: false,
  capture: true,
  throttleDelay: 16,
  handleType: 'borders',
  positionType: 'absolute',
  zIndex: 'auto',
  disableDrag: false,
  disableResize: false,
  stateStyles: () => ({}),
  handleStyles: () => ({}),
})

const emit = defineEmits<{
  'update:position': [position: Position]
  'update:size': [size: Size]
  'update:active': [active: boolean]
  'dragStart': [position: Position, event: PointerEvent]
  'drag': [position: Position, event: PointerEvent]
  'dragEnd': [position: Position, event: PointerEvent]
  'resizeStart': [size: Size, event: PointerEvent]
  'resize': [size: Size, event: PointerEvent]
  'resizeEnd': [size: Size, event: PointerEvent]
  'hoverHandleChange': [handle: ResizeHandle | null]
  'activeChange': [active: boolean]
}>()

const targetRef = ref<HTMLElement | null>(null)

const options = computed<UseDnrOptions>(() => {
  return {
    ...props,
    initialPosition: props.position || { x: 0, y: 0 },
    initialSize: props.size || { width: 'auto', height: 'auto' },
    initialActive: props.active,
    onDragStart: (position, event) => {
      emit('dragStart', position, event)
      props.onDragStart?.(position, event)
    },
    onDrag: (position, event) => {
      emit('drag', position, event)
      props.onDrag?.(position, event)
    },
    onDragEnd: (position, event) => {
      emit('dragEnd', position, event)
      props.onDragEnd?.(position, event)
    },
    onResizeStart: (size, event) => {
      emit('resizeStart', size, event)
      props.onResizeStart?.(size, event)
    },
    onResize: (size, event) => {
      emit('resize', size, event)
      props.onResize?.(size, event)
    },
    onResizeEnd: (size, event) => {
      emit('resizeEnd', size, event)
      props.onResizeEnd?.(size, event)
    },
    onActiveChange: (active) => {
      emit('activeChange', active)
      emit('update:active', active)
      return props.onActiveChange?.(active) ?? true
    },
  }
})

const {
  position,
  size,
  isDragging,
  isResizing,
  isActive,
  style: dnrStyle,
  setPosition,
  setSize,
  setActive,
  hoverHandle,
  activeHandle,
} = useDnr(targetRef, toValue(options))

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
  () => props.size,
  (newSize) => {
    if (newSize && !isResizing.value) {
      setSize(newSize)
    }
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

  if (isResizing.value && props.resizingClassName) {
    classes.push(props.resizingClassName)
  }

  if (isActive.value && props.activeClassName) {
    classes.push(props.activeClassName)
  }

  return classes.join(' ')
})

const activeOn = computed(() => toValue(props.activeOn))
const handleType = computed(() => toValue(props.handleType))
const handles = computed<ResizeHandle[]>(() => toValue(props.handles) ?? ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'])
</script>

<template>
  <div ref="targetRef" :class="combinedClass" :style="dnrStyle">
    <slot />
    <template v-if="handleType === 'custom' && (activeOn === 'none' || isActive)">
      <div
        v-for="handlePosition in handles"
        :key="handlePosition"
        :class="`handle-slot-${handlePosition}`"
        style="display: contents"
      >
        <slot
          :name="`handle-${handlePosition}`"
          :handle="handlePosition"
          :active="activeHandle === handlePosition"
          :hover="hoverHandle === handlePosition"
          :is-resizing="isResizing"
          :position="handlePosition"
          :cursor="getCursorStyle(handlePosition)"
          :size="size"
        />
      </div>
    </template>
  </div>
</template>
