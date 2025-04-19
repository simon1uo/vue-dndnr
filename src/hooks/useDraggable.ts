/**
 * Hook for adding draggable functionality to an element
 */

import type { DraggableOptions, Position } from '../types'
import { onMounted, onUnmounted, ref } from 'vue'
import {
  addPassiveEventListener,
  applyAxisConstraints,
  applyBoundsConstraints,
  applyGrid,
  calculatePosition,
  getElementBounds,
  getElementSize,
  matchesSelectorAndParents,
  removeEventListener,
} from '../utils'

export function useDraggable(options: DraggableOptions = {}) {
  const {
    initialPosition = { x: 0, y: 0 },
    bounds,
    grid,
    axis = 'both',
    handle,
    cancel,
    scale = 1,
    disabled = false,
  } = options

  // State
  const position = ref<Position>({ ...initialPosition })
  const isDragging = ref(false)
  const elementRef = ref<HTMLElement | null>(null)

  // Internal state
  let startPosition = { ...initialPosition }
  let offsetX = 0
  let offsetY = 0

  // Event handlers
  const onDragStart = (event: MouseEvent | TouchEvent) => {
    if (disabled)
      return

    // Check if the event target matches the handle selector
    if (handle && elementRef.value) {
      const target = event.target as HTMLElement
      if (!matchesSelectorAndParents(target, handle))
        return
    }

    // Check if the event target matches the cancel selector
    if (cancel && elementRef.value) {
      const target = event.target as HTMLElement
      if (matchesSelectorAndParents(target, cancel))
        return
    }

    event.preventDefault()

    // Store the current position as the start position
    startPosition = { ...position.value }

    // Calculate the offset from the mouse/touch position to the element position
    if (event instanceof MouseEvent) {
      offsetX = event.clientX - position.value.x
      offsetY = event.clientY - position.value.y
    }
    else {
      offsetX = event.touches[0].clientX - position.value.x
      offsetY = event.touches[0].clientY - position.value.y
    }

    isDragging.value = true

    // Add event listeners for drag and dragEnd
    addPassiveEventListener(window, 'mousemove', onDrag)
    addPassiveEventListener(window, 'touchmove', onDrag, { passive: false })
    addPassiveEventListener(window, 'mouseup', onDragEnd)
    addPassiveEventListener(window, 'touchend', onDragEnd)
  }

  const onDrag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value)
      return

    event.preventDefault()

    // Calculate the new position
    let newPosition = calculatePosition(
      event,
      startPosition,
      { x: offsetX, y: offsetY },
    )

    // Apply grid snapping if specified
    if (grid) {
      newPosition = applyGrid(newPosition, grid)
    }

    // Apply axis constraints if specified
    newPosition = applyAxisConstraints(newPosition, axis, startPosition)

    // Apply bounds constraints if specified
    if (bounds && elementRef.value) {
      const element = elementRef.value
      const { width, height } = getElementSize(element)

      let boundsRect

      if (bounds === 'parent' && element.parentElement) {
        boundsRect = getElementBounds(element.parentElement)
      }
      else if (bounds instanceof HTMLElement) {
        boundsRect = getElementBounds(bounds)
      }
      else if (typeof bounds === 'object') {
        boundsRect = bounds
      }

      if (boundsRect) {
        newPosition = applyBoundsConstraints(
          newPosition,
          boundsRect,
          width,
          height,
        )
      }
    }

    // Update the position
    position.value = newPosition
  }

  const onDragEnd = () => {
    isDragging.value = false

    // Remove event listeners
    removeEventListener(window, 'mousemove', onDrag)
    removeEventListener(window, 'touchmove', onDrag)
    removeEventListener(window, 'mouseup', onDragEnd)
    removeEventListener(window, 'touchend', onDragEnd)
  }

  // Setup and cleanup
  onMounted(() => {
    if (elementRef.value) {
      // Add event listeners for dragStart
      addPassiveEventListener(elementRef.value, 'mousedown', onDragStart)
      addPassiveEventListener(elementRef.value, 'touchstart', onDragStart, { passive: false })
    }
  })

  onUnmounted(() => {
    if (elementRef.value) {
      // Remove event listeners
      removeEventListener(elementRef.value, 'mousedown', onDragStart)
      removeEventListener(elementRef.value, 'touchstart', onDragStart)
    }

    // Remove window event listeners
    removeEventListener(window, 'mousemove', onDrag)
    removeEventListener(window, 'touchmove', onDrag)
    removeEventListener(window, 'mouseup', onDragEnd)
    removeEventListener(window, 'touchend', onDragEnd)
  })

  // Methods
  const setPosition = (newPosition: Position) => {
    position.value = newPosition
  }

  // Return values and methods
  return {
    position,
    isDragging,
    elementRef,
    setPosition,
  }
}
