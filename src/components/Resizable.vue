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
  handleBorderStyle: 'none',
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
const handleBorderStyle = computed(() => toValue(props.handleBorderStyle))
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
  handleBorderStyle,
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
  touch-action: none;
  user-select: none;
}

.resizable.resizing {
  z-index: 1;
}

.resizable.active {
  z-index: 1;
  outline: 2px solid #4299e1;
}

/* Resize handles styling */
.resize-handle {
  position: absolute;
  background-color: #4299e1;
  border: 1px solid #2b6cb0;
  box-sizing: border-box;
  z-index: 1;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.resize-handle:hover,
.resize-handle.hover {
  background-color: #3182ce;
  transform: scale(1.1);
}

.resize-handle.active {
  background-color: #2b6cb0;
  transform: scale(1.2);
}

/* Corner handles */
.resize-handle-tl,
.resize-handle-tr,
.resize-handle-bl,
.resize-handle-br,
.resize-handle-top-left,
.resize-handle-top-right,
.resize-handle-bottom-left,
.resize-handle-bottom-right {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* Edge handles */
.resize-handle-t,
.resize-handle-b,
.resize-handle-top,
.resize-handle-bottom {
  width: 10px;
  height: 10px;
  left: calc(50% - 5px);
  border-radius: 50%;
}

.resize-handle-l,
.resize-handle-r,
.resize-handle-left,
.resize-handle-right {
  width: 10px;
  height: 10px;
  top: calc(50% - 5px);
  border-radius: 50%;
}

/* Position the handles */
.resize-handle-t,
.resize-handle-top {
  top: -5px;
  cursor: n-resize;
}

.resize-handle-b,
.resize-handle-bottom {
  bottom: -5px;
  cursor: s-resize;
}

.resize-handle-l,
.resize-handle-left {
  left: -5px;
  cursor: w-resize;
}

.resize-handle-r,
.resize-handle-right {
  right: -5px;
  cursor: e-resize;
}

.resize-handle-tl,
.resize-handle-top-left {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
}

.resize-handle-tr,
.resize-handle-top-right {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
}

.resize-handle-bl,
.resize-handle-bottom-left {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
}

.resize-handle-br,
.resize-handle-bottom-right {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}

/* Custom handles styling */
.resize-handle-custom {
  background-color: rgba(66, 153, 225, 0.6);
  border: 1px solid rgba(43, 108, 176, 0.6);
  transition: all 0.15s ease;
}

.resize-handle-custom:hover,
.resize-handle-custom.hover {
  background-color: rgba(49, 130, 206, 0.8);
  transform: scale(1.1);
  border-color: rgba(43, 108, 176, 0.8);
}

.resize-handle-custom.active,
.resize-handle-custom.resizing {
  background-color: rgba(43, 108, 176, 1);
  transform: scale(1.2);
  border-color: rgba(30, 90, 150, 1);
}

/* Position custom handles the same way as regular handles */
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
