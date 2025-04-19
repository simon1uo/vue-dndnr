import type { DraggableOptions, Position } from '../types'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  addPassiveEventListener,
  applyAxisConstraint,
  applyBounds,
  applyGrid,
  calculateDelta,
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
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
  } = options

  const position = ref<Position>({ ...initialPosition })
  const startPosition = ref<Position>({ ...initialPosition })
  const isDragging = ref(false)
  const elementRef = ref<HTMLElement | null>(null)
  const startEvent = ref<MouseEvent | TouchEvent | null>(null)
  const elementSize = ref<{ width: number, height: number }>({ width: 0, height: 0 })

  const style = computed(() => {
    return {
      position: 'absolute' as const,
      left: `${position.value.x}px`,
      top: `${position.value.y}px`,
      touchAction: 'none' as const,
      userSelect: 'none' as const,
    }
  })

  const filterEvent = (event: MouseEvent | TouchEvent): boolean => {
    // Check if dragging is disabled
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

    // Check if element has a handle and if the event target matches it
    if (handle && elementRef.value) {
      const target = event.target as HTMLElement
      if (!matchesSelectorAndParents(target, handle))
        return false
    }

    // Check if event target matches cancel selector
    if (cancel && event.target) {
      const target = event.target as HTMLElement
      if (matchesSelectorAndParents(target, cancel))
        return false
    }

    return true
  }

  const handleEvent = (event: MouseEvent | TouchEvent) => {
    if (preventDefault)
      event.preventDefault()
    if (stopPropagation)
      event.stopPropagation()
  }

  const onDragStart = (event: MouseEvent | TouchEvent) => {
    if (!filterEvent(event) || !elementRef.value)
      return

    // Store the start event and position
    startEvent.value = event
    startPosition.value = { ...position.value }
    isDragging.value = true

    // Get element size for bounds calculation
    elementSize.value = getElementSize(elementRef.value)

    // Handle the event
    handleEvent(event)
  }

  const onDrag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value || !startEvent.value || !elementRef.value)
      return

    // Calculate the new position
    const eventPosition = calculatePosition(event, scale)
    const startEventPosition = calculatePosition(startEvent.value, scale)
    const delta = calculateDelta(startEventPosition, eventPosition)

    let newPosition = {
      x: startPosition.value.x + delta.x,
      y: startPosition.value.y + delta.y,
    }

    // Apply constraints
    newPosition = applyAxisConstraint(newPosition, axis, startPosition.value)
    newPosition = applyGrid(newPosition, grid)

    // Apply bounds if specified
    if (bounds) {
      let boundingElement: HTMLElement | null = null

      if (bounds === 'parent' && elementRef.value.parentElement) {
        boundingElement = elementRef.value.parentElement
      }
      else if (bounds instanceof HTMLElement) {
        boundingElement = bounds
      }

      if (boundingElement) {
        const boundingRect = getElementBounds(boundingElement)
        const elementRect = getElementBounds(elementRef.value)

        newPosition = applyBounds(
          newPosition,
          {
            left: 0,
            top: 0,
            right: boundingRect.right - boundingRect.left,
            bottom: boundingRect.bottom - boundingRect.top,
          },
          {
            width: elementRect.right - elementRect.left,
            height: elementRect.bottom - elementRect.top,
          },
        )
      }
      else if (typeof bounds === 'object') {
        newPosition = applyBounds(
          newPosition,
          bounds,
          elementSize.value,
        )
      }
    }

    // Update position
    position.value = newPosition

    // Handle the event
    handleEvent(event)
  }

  const onDragEnd = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value)
      return

    isDragging.value = false
    startEvent.value = null

    // Handle the event
    handleEvent(event)
  }

  // Set up event listeners
  onMounted(() => {
    if (elementRef.value) {
      // Mouse events
      addPassiveEventListener(elementRef.value, 'mousedown', onDragStart as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'mousemove', onDrag as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'mouseup', onDragEnd as EventListener, { passive: !preventDefault })

      // Touch events
      addPassiveEventListener(elementRef.value, 'touchstart', onDragStart as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchmove', onDrag as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchend', onDragEnd as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchcancel', onDragEnd as EventListener, { passive: !preventDefault })
    }
  })

  // Clean up event listeners
  onUnmounted(() => {
    if (elementRef.value) {
      // Mouse events
      removeEventListener(elementRef.value, 'mousedown', onDragStart as EventListener)
      removeEventListener(window, 'mousemove', onDrag as EventListener)
      removeEventListener(window, 'mouseup', onDragEnd as EventListener)

      // Touch events
      removeEventListener(elementRef.value, 'touchstart', onDragStart as EventListener)
      removeEventListener(window, 'touchmove', onDrag as EventListener)
      removeEventListener(window, 'touchend', onDragEnd as EventListener)
      removeEventListener(window, 'touchcancel', onDragEnd as EventListener)
    }
  })

  // Public methods
  const setPosition = (newPosition: Position) => {
    position.value = { ...newPosition }
  }

  return {
    position,
    isDragging,
    style,
    elementRef,
    setPosition,
    onDragStart,
    onDrag,
    onDragEnd,
  }
}

export default useDraggable
