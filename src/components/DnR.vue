<script setup lang="ts">
import type { DnROptions, HandleStyles, Position, ResizeHandle, Size, StateStyles } from '@/types'
import useDnR from '@/hooks/useDnR'
import { getCursorStyle } from '@/utils/cursor'
import { computed, nextTick, onMounted, onUnmounted, ref, toValue, watch } from 'vue'

interface DnRProps extends DnROptions {
  position?: Position
  size?: Size
  active?: boolean
  className?: string
  draggingClassName?: string
  resizingClassName?: string
  activeClassName?: string
  stateStyles?: Partial<StateStyles>
  handleStyles?: Partial<HandleStyles>
  positionType?: 'absolute' | 'relative'
  zIndex?: string | number
}

const props = withDefaults(defineProps<DnRProps>(), {
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
  stateStyles: () => ({}),
  handleStyles: () => ({}),
  positionType: 'absolute',
  zIndex: 'auto',
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
const handleRefs = ref<Map<ResizeHandle, HTMLElement>>(new Map())

const handle = computed(() => toValue(props.handle) ?? targetRef.value)
const containerElement = computed(() => toValue(props.containerElement))
const grid = computed(() => toValue(props.grid))
const axis = computed(() => toValue(props.axis) ?? 'both')
const scale = computed(() => toValue(props.scale) ?? 1)
const disabled = computed(() => toValue(props.disabled))
const pointerTypes = computed(() => toValue(props.pointerTypes))
const preventDefault = computed(() => toValue(props.preventDefault))
const stopPropagation = computed(() => toValue(props.stopPropagation) ?? false)
const capture = computed(() => toValue(props.capture))
const throttleDelay = computed(() => toValue(props.throttleDelay))
const lockAspectRatio = computed(() => toValue(props.lockAspectRatio))
const handles = computed<ResizeHandle[]>(() => toValue(props.handles) ?? ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'])
const handleType = computed(() => toValue(props.handleType))
const stateStyles = computed(() => toValue(props.stateStyles))
const handleStyles = computed(() => toValue(props.handleStyles))
const positionType = computed(() => toValue(props.positionType) ?? 'absolute')
const zIndex = computed(() => toValue(props.zIndex))

// Create reactive options object
const dnrOptions: DnROptions = {
  initialPosition: props.position || { x: 0, y: 0 },
  initialSize: props.size || { width: 'auto', height: 'auto' },
  initialActive: props.active,
  activeOn: props.activeOn,
  preventDeactivation: props.preventDeactivation,
  handle,
  containerElement,
  grid,
  axis,
  scale,
  disabled,
  pointerTypes,
  preventDefault,
  stopPropagation,
  capture,
  throttleDelay,
  lockAspectRatio,
  handles,
  handleType,
  stateStyles,
  handleStyles,
  customHandles: handleRefs,
  positionType,
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight,
  zIndex,
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
  onActiveChange: (active: boolean) => {
    emit('activeChange', active)
    emit('update:active', active)
    if (props.onActiveChange)
      return props.onActiveChange(active)
    return true
  },
}

const {
  position,
  size,
  isDragging,
  isResizing,
  isActive,
  interactionMode,
  style: dnrStyle,
  setPosition,
  setSize,
  setActive,
  hoverHandle,
  activeHandle,
  registerHandle,
  unregisterHandle,
  setupHandleElements,
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
  () => props.active,
  (newActive) => {
    if (newActive !== undefined && newActive !== isActive.value) {
      setActive(newActive)

      // Force re-register handle elements when active state changes
      if (handleType.value === 'custom') {
        nextTick(() => {
          registerHandleElements()
        })
      }
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

// Function to register custom handle elements with the hook
function registerHandleElements() {
  // Clean up any existing handle registrations first
  handleRefs.value.forEach((_, handle) => {
    unregisterHandle(handle)
  })
  handleRefs.value.clear()

  // Only continue processing for custom handles
  if (handleType.value !== 'custom') {
    return
  }

  // Wait for the DOM to update using nextTick
  nextTick(() => {
    const el = targetRef.value
    if (!el) {
      return
    }

    // Process all handles from the handles prop
    handles.value.forEach((handle) => {
      // Find the slot content for this handle
      const slotSelector = `.handle-slot-${handle}`
      const slotContainer = el.querySelector(slotSelector)
      const handleEl = slotContainer?.firstElementChild as HTMLElement | null

      if (handleEl) {
        // Store reference to the handle element and register it with the hook
        handleRefs.value.set(handle, handleEl)
        registerHandle(handle, handleEl)
      }
    })

    // Trigger the hook's setupHandleElements to ensure proper registration
    // If no slot content was found for any handle, the hook will create default handles
    // This provides a fallback mechanism while avoiding duplicate handle creation
    if (targetRef.value) {
      setupHandleElements(targetRef.value)
    }
  })
}

// Function to clean up event listeners and handle references
function cleanupHandleElements() {
  // Unregister all handles
  handleRefs.value.forEach((_, handle) => {
    unregisterHandle(handle)
  })
  handleRefs.value.clear()
}

// Register handles when component is mounted
onMounted(() => {
  // Wait for the initial render to complete
  nextTick(registerHandleElements)
})

// Watch for changes to handleType or handles
watch([handleType, handles], () => {
  // Clean up existing handles first
  cleanupHandleElements()

  // When handleType or handles change, wait for DOM update then register handles
  nextTick(registerHandleElements)
}, { flush: 'post' })

// Clean up when component is unmounted
onUnmounted(cleanupHandleElements)

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
</script>

<template>
  <div ref="targetRef" :class="combinedClass" :style="dnrStyle">
    <slot />
    <!--
      Custom handles when handleType is 'custom'
      We only provide slots here, and let the hook create default handles if needed
      This avoids duplicate handle creation between component and hook
    -->
    <template v-if="handleType === 'custom' && (activeOn === 'none' || isActive)">
      <div
        v-for="handlePosition in handles" :key="handlePosition" :class="`handle-slot-${handlePosition}`"
        style="display: contents;"
      >
        <slot
          :name="`handle-${handlePosition}`" :handle="handlePosition" :active="activeHandle === handlePosition"
          :hover="hoverHandle === handlePosition" :is-resizing="isResizing" :position="handlePosition"
          :cursor="getCursorStyle(handlePosition)" :size="size"
        />
      </div>
    </template>
  </div>
</template>
