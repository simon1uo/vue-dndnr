import type { MaybeRefOrGetter } from 'vue'
import type { DraggableOptions, Position } from '../types'
import { computed, onMounted, onUnmounted, ref, toValue, watch } from 'vue'
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

export function useDraggable(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: DraggableOptions = {}) {
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
    onDragStart: onDragStartCallback,
    onDrag: onDragCallback,
    onDragEnd: onDragEndCallback,
  } = options

  const position = ref<Position>({ ...initialPosition })
  const startPosition = ref<Position>({ ...initialPosition })
  const isDragging = ref(false)
  // Use the provided target element instead of creating a new ref
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
    const el = toValue(target)
    if (handle && el) {
      const eventTarget = event.target as HTMLElement
      if (!matchesSelectorAndParents(eventTarget, handle))
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
    const el = toValue(target)
    if (!filterEvent(event) || !el)
      return

    // Store the start event and position
    startEvent.value = event
    startPosition.value = { ...position.value }
    isDragging.value = true

    // Get element size for bounds calculation
    elementSize.value = getElementSize(el)

    // Handle the event
    handleEvent(event)

    // Call the callback if provided
    if (onDragStartCallback)
      onDragStartCallback(position.value, event)
  }

  const onDrag = (event: MouseEvent | TouchEvent) => {
    const el = toValue(target)
    if (!isDragging.value || !startEvent.value || !el)
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

      const el = toValue(target)
      if (bounds === 'parent' && el?.parentElement) {
        boundingElement = el.parentElement
      }
      else if (bounds instanceof HTMLElement) {
        boundingElement = bounds
      }

      if (boundingElement && el) {
        const boundingRect = getElementBounds(boundingElement)
        const elementRect = getElementBounds(el)

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

    // Call the callback if provided
    if (onDragCallback)
      onDragCallback(position.value, event)
  }

  const onDragEnd = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value)
      return

    isDragging.value = false
    startEvent.value = null

    // Handle the event
    handleEvent(event)

    // Call the callback if provided
    if (onDragEndCallback)
      onDragEndCallback(position.value, event)
  }

  // Set up event listeners
  const setupEventListeners = () => {
    const el = toValue(target)
    if (el) {
      // Mouse events
      addPassiveEventListener(el, 'mousedown', onDragStart as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'mousemove', onDrag as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'mouseup', onDragEnd as EventListener, { passive: !preventDefault })

      // Touch events
      addPassiveEventListener(el, 'touchstart', onDragStart as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchmove', onDrag as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchend', onDragEnd as EventListener, { passive: !preventDefault })
      addPassiveEventListener(window, 'touchcancel', onDragEnd as EventListener, { passive: !preventDefault })
    }
  }

  onMounted(setupEventListeners)

  // Clean up event listeners
  const cleanupEventListeners = () => {
    const el = toValue(target)
    if (el) {
      // Mouse events
      removeEventListener(el, 'mousedown', onDragStart as EventListener)
      removeEventListener(window, 'mousemove', onDrag as EventListener)
      removeEventListener(window, 'mouseup', onDragEnd as EventListener)

      // Touch events
      removeEventListener(el, 'touchstart', onDragStart as EventListener)
      removeEventListener(window, 'touchmove', onDrag as EventListener)
      removeEventListener(window, 'touchend', onDragEnd as EventListener)
      removeEventListener(window, 'touchcancel', onDragEnd as EventListener)
    }
  }

  onUnmounted(cleanupEventListeners)

  // Watch for changes to the target element
  watch(
    () => toValue(target),
    (newTarget, oldTarget) => {
      if (oldTarget) {
        // Clean up old listeners
        cleanupEventListeners()
      }
      if (newTarget) {
        // Set up new listeners
        setupEventListeners()
      }
    },
    { immediate: true },
  )

  // Public methods
  const setPosition = (newPosition: Position) => {
    position.value = { ...newPosition }
  }

  return {
    position,
    isDragging,
    style,
    setPosition,
    onDragStart,
    onDrag,
    onDragEnd,
  }
}

export default useDraggable
