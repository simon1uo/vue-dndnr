<script setup lang="ts">
import type { DnROptions, Position, ResizeHandle, ResizeHandleType, Size } from '@/types'
import { useDnR } from '@/hooks'
import { getCursorStyle } from '@/utils/cursor'
import { computed, nextTick, onMounted, onUnmounted, ref, toValue, watch } from 'vue'

interface ResizableProps extends DnROptions {
  size?: Size
  modelValue?: Size
  position?: Position
  active?: boolean
  activeClassName?: string
}

const props = withDefaults(defineProps<ResizableProps>(), {
  size: undefined,
  modelValue: undefined,
  position: undefined,
  active: undefined,
  positionType: 'relative',
  handleType: 'borders',
  lockAspectRatio: false,
  disabled: false,
  activeOn: 'none',
  preventDeactivation: false,
  preventDefault: true,
  stopPropagation: false,
  capture: true,
  throttleDelay: 16,

  activeClassName: 'active',
  disableDrag: true,
})

const emit = defineEmits<{
  'update:size': [size: Size]
  'update:modelValue': [size: Size]
  'update:position': [position: Position]
  'update:active': [active: boolean]
  'resizeStart': [size: Size, event: PointerEvent]
  'resize': [size: Size, event: PointerEvent]
  'resizeEnd': [size: Size, event: PointerEvent]
  'hoverHandleChange': [handle: ResizeHandle | null]
  'activeChange': [active: boolean | undefined]
}>()

const targetRef = ref<HTMLElement | null>(null)
const handleRefs = ref<Map<ResizeHandle, HTMLElement>>(new Map())
const grid = computed(() => toValue(props.grid))
const lockAspectRatio = computed(() => toValue(props.lockAspectRatio))
const positionType = computed(() => toValue(props.positionType))
const handleType = computed<ResizeHandleType>(() => toValue(props.handleType) ?? 'borders')
const handles = computed<ResizeHandle[]>(() => toValue(props.handles) ?? ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'])
const containerElement = computed(() => toValue(props.containerElement))
const disabled = computed(() => toValue(props.disabled))
const pointerTypes = computed(() => toValue(props.pointerTypes))
const preventDefault = computed(() => toValue(props.preventDefault))
const stopPropagation = computed(() => toValue(props.stopPropagation))
const capture = computed(() => toValue(props.capture))
const throttleDelay = computed(() => toValue(props.throttleDelay))
const handleStyles = computed(() => toValue(props.handleStyles) || {})
const preventDeactivation = computed(() => toValue(props.preventDeactivation))

const {
  size: currentSize,
  position: currentPosition,
  isResizing,
  isActive,
  setSize,
  setPosition,
  setActive,
  activeHandle,
  hoverHandle,
  registerHandle,
  unregisterHandle,
  setupHandleElements,
  style,
} = useDnR(targetRef, {
  ...props,
  initialSize: props.size || props.modelValue || { width: 'auto', height: 'auto' },
  initialPosition: props.position || { x: 0, y: 0 },
  initialActive: props.active,

  customHandles: handleRefs,
  positionType,
  grid,
  lockAspectRatio,
  handleType,
  handles,
  containerElement,
  disabled,
  pointerTypes,
  preventDefault,
  stopPropagation,
  capture,
  throttleDelay,
  handleStyles,
  preventDeactivation,
  onResizeStart: (size, event) => {
    if (activeHandle.value) {
      emit('resizeStart', size, event)
      if (props.onResizeStart)
        props.onResizeStart(size, event)
    }
  },
  onResize: (size, event) => {
    if (activeHandle.value) {
      emit('resize', size, event)
      if (props.onResize)
        props.onResize(size, event)
    }
  },
  onResizeEnd: (size, event) => {
    if (activeHandle.value) {
      emit('resizeEnd', size, event)
      if (props.onResizeEnd)
        props.onResizeEnd(size, event)
    }
  },
  onActiveChange: (active) => {
    emit('activeChange', active)
    emit('update:active', active)
    if (props.onActiveChange)
      return props.onActiveChange(active)
    return true
  },
})

watch(hoverHandle, (newHandle) => {
  if (newHandle !== undefined) {
    emit('hoverHandleChange', newHandle)
  }
})

watch(
  [() => props.size, () => props.modelValue],
  ([newSize, newModelValue]) => {
    const sizeToUse = newSize || newModelValue
    if (sizeToUse && !isResizing.value) {
      setSize(sizeToUse)
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

watch(
  currentPosition,
  (newPosition) => {
    emit('update:position', newPosition)
  },
  { deep: true },
)

watch(
  () => props.position,
  (newPosition) => {
    if (newPosition && !isResizing.value) {
      setPosition(newPosition)
    }
  },
  { deep: true },
)

watch(
  () => props.active,
  (newActive) => {
    if (newActive !== undefined && newActive !== isActive.value) {
      setActive(newActive)

      // Force re-register handle elements when active state changes
      if (handleType.value === 'custom') {
        nextTick(registerHandleElements)
      }
    }
  },
)

const combinedClass = computed(() => {
  const classes = ['resizable']

  if (isResizing.value) {
    classes.push('resizing')
  }

  if (isActive.value && props.activeClassName) {
    classes.push(props.activeClassName)
  }

  return classes.join(' ')
})

function registerHandleElements() {
  handleRefs.value.forEach((_, handle) => {
    unregisterHandle(handle)
  })
  handleRefs.value.clear()

  if (handleType.value !== 'custom') {
    return
  }

  nextTick(() => {
    const el = targetRef.value
    if (!el) {
      return
    }

    handles.value.forEach((handle) => {
      const slotSelector = `.handle-slot-${handle}`
      const slotContainer = el.querySelector(slotSelector)
      const handleEl = slotContainer?.firstElementChild as HTMLElement | null

      if (handleEl) {
        handleRefs.value.set(handle, handleEl)
        registerHandle(handle, handleEl)
      }
    })

    if (targetRef.value) {
      setupHandleElements(targetRef.value)
    }
  })
}

function cleanupHandleElements() {
  handleRefs.value.forEach((_, handle) => {
    unregisterHandle(handle)
  })
  handleRefs.value.clear()
}

onMounted(() => {
  nextTick(registerHandleElements)
})

watch([handleType, handles], () => {
  cleanupHandleElements()
  nextTick(registerHandleElements)
}, { flush: 'post' })

onUnmounted(cleanupHandleElements)
</script>

<template>
  <div ref="targetRef" :class="[combinedClass, `handle-type-${handleType}`]" :style="style">
    <slot />
    <template v-if="handleType === 'custom' && (activeOn === 'none' || isActive)">
      <div
        v-for="handlePosition in handles" :key="handlePosition" :class="`handle-slot-${handlePosition}`"
        style="display: contents;"
      >
        <slot
          :name="`handle-${handlePosition}`" :handle="handlePosition" :active="activeHandle === handlePosition"
          :hover="hoverHandle === handlePosition" :is-resizing="isResizing" :position="handlePosition"
          :cursor="getCursorStyle(handlePosition)" :size="currentSize"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.resizable {
  box-sizing: border-box;
  position: relative;
}

/* 自定义句柄位置样式 */
.handle-type-custom .resize-handle-t,
.handle-type-custom .resize-handle-top,
.handle-type-custom .resize-handle-b,
.handle-type-custom .resize-handle-bottom,
.handle-type-custom .resize-handle-l,
.handle-type-custom .resize-handle-left,
.handle-type-custom .resize-handle-r,
.handle-type-custom .resize-handle-right,
.handle-type-custom .resize-handle-tl,
.handle-type-custom .resize-handle-top-left,
.handle-type-custom .resize-handle-tr,
.handle-type-custom .resize-handle-top-right,
.handle-type-custom .resize-handle-bl,
.handle-type-custom .resize-handle-bottom-left,
.handle-type-custom .resize-handle-br,
.handle-type-custom .resize-handle-bottom-right {
  position: absolute;
}
</style>
