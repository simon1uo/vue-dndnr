import type { ResizableOptions, ResizeHandle, Size } from '../types'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  addPassiveEventListener,
  applyAspectRatioLock,
  applyGrid,
  applyMinMaxConstraints,
  calculateSize,
  getElementSize,
  removeEventListener,
} from '../utils'

export function useResizable(options: ResizableOptions = {}) {
  const {
    initialSize = { width: 'auto', height: 'auto' },
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    grid,
    lockAspectRatio = false,
    handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
    disabled = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
  } = options

  // State
  const size = ref<Size>({ ...initialSize })
  const position = ref({ x: 0, y: 0 })
  const isResizing = ref(false)
  const elementRef = ref<HTMLElement | null>(null)
  const activeHandle = ref<ResizeHandle | null>(null)
  const startEvent = ref<MouseEvent | TouchEvent | null>(null)

  // Internal state
  const startSize = ref<Size>({ ...initialSize })
  const startPosition = ref({ x: 0, y: 0 })

  // Computed style
  const style = computed(() => {
    return {
      position: 'relative' as const,
      width: typeof size.value.width === 'number' ? `${size.value.width}px` : size.value.width,
      height: typeof size.value.height === 'number' ? `${size.value.height}px` : size.value.height,
      userSelect: 'none' as const,
    }
  })

  // Filter events based on options
  const filterEvent = (event: MouseEvent | TouchEvent): boolean => {
    // Check if resizing is disabled
    if (disabled)
      return false

    // Check pointer type
    if (event instanceof MouseEvent) {
      if (!pointerTypes.includes('mouse'))
        return false
    }
    else if (event instanceof TouchEvent) {
      if (!pointerTypes.includes('touch'))
        return false
    }

    return true
  }

  // Handle event options
  const handleEvent = (event: MouseEvent | TouchEvent) => {
    if (preventDefault)
      event.preventDefault()
    if (stopPropagation)
      event.stopPropagation()
  }

  // Event handlers
  const onResizeStart = (event: MouseEvent | TouchEvent, handle: ResizeHandle) => {
    if (!filterEvent(event) || !handles.includes(handle) || !elementRef.value)
      return

    // Store the start event, size and position
    startEvent.value = event
    startSize.value = { ...size.value }
    startPosition.value = { ...position.value }
    isResizing.value = true
    activeHandle.value = handle

    // Handle the event
    handleEvent(event)
  }

  const onResize = (event: MouseEvent | TouchEvent) => {
    if (!isResizing.value || !activeHandle.value || !startEvent.value || !elementRef.value)
      return

    // Calculate the new size and position
    const { size: newSize, position: newPosition } = calculateSize(
      event,
      startSize.value,
      activeHandle.value,
      startPosition.value,
      {
        x: startEvent.value instanceof MouseEvent ? startEvent.value.clientX : (startEvent.value as TouchEvent).touches[0].clientX,
        y: startEvent.value instanceof MouseEvent ? startEvent.value.clientY : (startEvent.value as TouchEvent).touches[0].clientY,
      },
    )

    // Apply grid snapping if specified
    let snappedSize = newSize
    if (grid) {
      snappedSize = {
        width: typeof newSize.width === 'number' ? applyGrid({ x: newSize.width, y: 0 }, grid).x : newSize.width,
        height: typeof newSize.height === 'number' ? applyGrid({ x: 0, y: newSize.height }, grid).y : newSize.height,
      }
    }

    // Apply min/max constraints
    let constrainedSize = applyMinMaxConstraints(
      snappedSize,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
    )

    // Apply aspect ratio lock if specified
    if (lockAspectRatio) {
      constrainedSize = applyAspectRatioLock(
        constrainedSize,
        startSize.value,
        lockAspectRatio,
      )
    }

    // Update the size and position
    size.value = constrainedSize
    position.value = newPosition

    // Handle the event
    handleEvent(event)
  }

  const onResizeEnd = (event: MouseEvent | TouchEvent) => {
    if (!isResizing.value)
      return

    isResizing.value = false
    activeHandle.value = null
    startEvent.value = null

    // Handle the event
    handleEvent(event)
  }

  // Set up event listeners
  onMounted(() => {
    if (elementRef.value) {
      // Initialize size if set to auto
      if (size.value.width === 'auto' || size.value.height === 'auto') {
        const elementSize = getElementSize(elementRef.value)
        size.value = {
          width: size.value.width === 'auto' ? elementSize.width : size.value.width,
          height: size.value.height === 'auto' ? elementSize.height : size.value.height,
        }
      }

      // Add global event listeners for resize and resizeEnd
      addPassiveEventListener(window, 'mousemove', onResize as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchmove', onResize as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'mouseup', onResizeEnd as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchend', onResizeEnd as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchcancel', onResizeEnd as EventListener, { passive: !preventDefault })
    }
  })

  // Clean up event listeners
  onUnmounted(() => {
    // Remove window event listeners
    removeEventListener(window, 'mousemove', onResize as EventListener)
    removeEventListener(window, 'touchmove', onResize as EventListener)
    removeEventListener(window, 'mouseup', onResizeEnd as EventListener)
    removeEventListener(window, 'touchend', onResizeEnd as EventListener)
    removeEventListener(window, 'touchcancel', onResizeEnd as EventListener)
  })

  // Public methods
  const setSize = (newSize: Size) => {
    size.value = { ...newSize }
  }

  // Return values and methods
  return {
    size,
    position,
    isResizing,
    style,
    elementRef,
    activeHandle,
    setSize,
    onResizeStart,
    onResize,
    onResizeEnd,
  }
}

export default useResizable
