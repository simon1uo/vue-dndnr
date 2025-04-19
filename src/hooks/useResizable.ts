/**
 * Hook for adding resizable functionality to an element
 */

import type { ResizableOptions, ResizeHandle, Size } from '../types'
import { onMounted, onUnmounted, ref } from 'vue'
import {
  addPassiveEventListener,
  applyAspectRatioLock,
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
  } = options

  // State
  const size = ref<Size>({ ...initialSize })
  const position = ref({ x: 0, y: 0 })
  const isResizing = ref(false)
  const elementRef = ref<HTMLElement | null>(null)
  const activeHandle = ref<ResizeHandle | null>(null)

  // Internal state
  let startSize: Size = { ...initialSize }
  let startPosition = { x: 0, y: 0 }
  let offsetX = 0
  let offsetY = 0

  // Event handlers
  const onResizeStart = (event: MouseEvent | TouchEvent, handle: ResizeHandle) => {
    if (disabled || !handles.includes(handle))
      return

    event.preventDefault()

    // Store the current size as the start size
    startSize = { ...size.value }
    startPosition = { ...position.value }

    // Calculate the offset from the mouse/touch position
    if (event instanceof MouseEvent) {
      offsetX = event.clientX
      offsetY = event.clientY
    }
    else {
      offsetX = event.touches[0].clientX
      offsetY = event.touches[0].clientY
    }

    isResizing.value = true
    activeHandle.value = handle

    // Add event listeners for resize and resizeEnd
    addPassiveEventListener(window, 'mousemove', onResize)
    addPassiveEventListener(window, 'touchmove', onResize, { passive: false })
    addPassiveEventListener(window, 'mouseup', onResizeEnd)
    addPassiveEventListener(window, 'touchend', onResizeEnd)
  }

  const onResize = (event: MouseEvent | TouchEvent) => {
    if (!isResizing.value || !activeHandle.value)
      return

    event.preventDefault()

    // Calculate the new size and position
    const { size: newSize, position: newPosition } = calculateSize(
      event,
      startSize,
      activeHandle.value,
      startPosition,
      { x: offsetX, y: offsetY },
    )

    // Apply min/max constraints
    let constrainedSize = applyMinMaxConstraints(
      newSize,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
    )

    // Apply aspect ratio lock if specified
    if (lockAspectRatio) {
      constrainedSize = applyAspectRatioLock(
        constrainedSize,
        startSize,
        lockAspectRatio,
      )
    }

    // Update the size and position
    size.value = constrainedSize
    position.value = newPosition
  }

  const onResizeEnd = () => {
    isResizing.value = false
    activeHandle.value = null

    // Remove event listeners
    removeEventListener(window, 'mousemove', onResize)
    removeEventListener(window, 'touchmove', onResize)
    removeEventListener(window, 'mouseup', onResizeEnd)
    removeEventListener(window, 'touchend', onResizeEnd)
  }

  // Setup and cleanup
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
    }
  })

  onUnmounted(() => {
    // Remove window event listeners
    removeEventListener(window, 'mousemove', onResize)
    removeEventListener(window, 'touchmove', onResize)
    removeEventListener(window, 'mouseup', onResizeEnd)
    removeEventListener(window, 'touchend', onResizeEnd)
  })

  // Methods
  const setSize = (newSize: Size) => {
    size.value = newSize
  }

  // Return values and methods
  return {
    size,
    position,
    isResizing,
    elementRef,
    activeHandle,
    setSize,
    onResizeStart,
  }
}
