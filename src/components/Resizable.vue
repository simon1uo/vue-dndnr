<script setup lang="ts">
import type { ResizableOptions, ResizeHandle, Size } from '../types'
import { computed, ref, watch } from 'vue'
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
})

const emit = defineEmits<{
  'update:size': [size: Size]
  'update:modelValue': [size: Size]
  'resizeStart': [size: Size, event: MouseEvent | TouchEvent]
  'resize': [size: Size, event: MouseEvent | TouchEvent]
  'resizeEnd': [size: Size, event: MouseEvent | TouchEvent]
  'hoverHandleChange': [handle: ResizeHandle | null]
}>()

// Create a ref for the element
const elementRef = ref<HTMLElement | null>(null)

// Track active handle for event handlers
let activeHandle: ResizeHandle | null = null

// Create resizable options with callbacks
const resizableOptions = computed<ResizableOptions>(() => ({
  ...props,
  initialSize: props.size || props.modelValue || { width: 'auto', height: 'auto' },
  onResizeStart: (size, event) => {
    if (activeHandle) {
      emit('resizeStart', size, event)
      if (props.onResizeStart)
        props.onResizeStart(size, event)
    }
  },
  onResize: (size, event) => {
    if (activeHandle) {
      emit('resize', size, event)
      if (props.onResize)
        props.onResize(size, event)
    }
  },
  onResizeEnd: (size, event) => {
    if (activeHandle) {
      emit('resizeEnd', size, event)
      if (props.onResizeEnd)
        props.onResizeEnd(size, event)
      activeHandle = null
    }
  },
}))

const {
  size: currentSize,
  isResizing,
  setSize,
  activeHandle: currentActiveHandle,
  hoverHandle,
} = useResizable(elementRef, resizableOptions.value)

watch(currentActiveHandle, (newHandle) => {
  activeHandle = newHandle
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
  <div ref="elementRef" :class="combinedClass">
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
