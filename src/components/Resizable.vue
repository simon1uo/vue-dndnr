<script setup lang="ts">
import type { ResizableOptions, ResizeHandle, Size } from '../types'
import { computed, ref, toValue, watch } from 'vue'
import { useResizable } from '../hooks'

interface ResizableProps extends ResizableOptions {
  size?: Size
  modelValue?: Size
}

const props = withDefaults(defineProps<ResizableProps>(), {
  size: undefined,
  modelValue: undefined,
  lockAspectRatio: false,
  disabled: false,
  preventDefault: true,
  stopPropagation: false,
  capture: true,
  throttleDelay: 16,
})

const emit = defineEmits<{
  'update:size': [size: Size]
  'update:modelValue': [size: Size]
  'resizeStart': [size: Size, event: PointerEvent]
  'resize': [size: Size, event: PointerEvent]
  'resizeEnd': [size: Size, event: PointerEvent]
  'hoverHandleChange': [handle: ResizeHandle | null]
}>()

const targetRef = ref<HTMLElement | null>(null)
const grid = computed(() => toValue(props.grid))
const lockAspectRatio = computed(() => toValue(props.lockAspectRatio))
const handles = computed<ResizeHandle[]>(() => toValue(props.handles) ?? ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'])
const bounds = computed(() => toValue(props.bounds))
const disabled = computed(() => toValue(props.disabled))
const pointerTypes = computed(() => toValue(props.pointerTypes))
const preventDefault = computed(() => toValue(props.preventDefault))
const stopPropagation = computed(() => toValue(props.stopPropagation))
const capture = computed(() => toValue(props.capture))
const throttleDelay = computed(() => toValue(props.throttleDelay))

const {
  size: currentSize,
  isResizing,
  setSize,
  activeHandle,
  hoverHandle,
} = useResizable(targetRef, {
  ...props,
  initialSize: props.size || props.modelValue || { width: 'auto', height: 'auto' },
  grid,
  lockAspectRatio,
  handles,
  bounds,
  disabled,
  pointerTypes,
  preventDefault,
  stopPropagation,
  capture,
  throttleDelay,
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
})

watch(hoverHandle, (newHandle) => {
  emit('hoverHandleChange', newHandle)
})

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
  () => props.modelValue,
  (newSize) => {
    if (newSize && !isResizing.value) {
      setSize(newSize)
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

const combinedClass = computed(() => {
  return isResizing.value ? 'resizable resizing' : 'resizable'
})
</script>

<template>
  <div ref="targetRef" :class="combinedClass">
    <slot />
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
</style>
