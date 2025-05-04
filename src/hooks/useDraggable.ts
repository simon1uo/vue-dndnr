import type { ActivationTrigger, DraggableOptions, PointerType, Position } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@/hooks/useEventListener'
import {
  applyAxisConstraint,
  applyBounds,
  applyGrid,
  calculateDelta,
  calculatePosition,
  defaultWindow,
  getElementBounds,
  getElementSize,
} from '@/utils'
import { throttle } from '@/utils/throttle'
import { computed, onUnmounted, ref, toValue } from 'vue'

/**
 * Hook that adds drag functionality to an element
 * @param target - Reference to the element to make draggable
 * @param options - Configuration options for draggable behavior
 * @returns Object containing draggable state and methods
 */
export function useDraggable(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: DraggableOptions = {}) {
  const {
    initialPosition = { x: 0, y: 0 },
    handle: draggingHandle = target,
    draggingElement = defaultWindow,
    bounds,
    grid,
    axis = 'both',
    scale = 1,
    disabled = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
    capture = true,
    initialActive = false,
    activeOn = 'none' as ActivationTrigger,
    preventDeactivation = false,
    onDragStart: onDragStartCallback,
    onDrag: onDragCallback,
    onDragEnd: onDragEndCallback,
    onActiveChange: onActiveChangeCallback,
    throttleDelay = 16, // Default to ~60fps
  } = options

  const position = ref<Position>({ ...initialPosition })
  const startPosition = ref<Position>({ ...initialPosition })
  const isDragging = ref(false)
  const isActive = ref(initialActive)

  const startEvent = ref<PointerEvent | null>(null)
  const elementSize = ref<{ width: number, height: number }>({ width: 0, height: 0 })

  const style = computed(() => ({
    position: 'absolute' as const,
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    touchAction: 'none' as const,
    userSelect: 'none' as const,
  }))

  /**
   * Filter pointer events based on disabled state, active state, and pointer types
   * @param event - The pointer event to filter
   * @returns True if the event should be processed, false otherwise
   */
  const filterEvent = (event: PointerEvent): boolean => {
    if (toValue(disabled))
      return false

    // Check if element is active when activeOn is not 'none'
    const currentActiveOn = toValue(activeOn)
    if (currentActiveOn !== 'none' && !isActive.value)
      return false

    const types = toValue(pointerTypes)
    if (types)
      return types.includes(event.pointerType as PointerType)
    return true
  }

  /**
   * Set the active state and trigger callback
   * @param value - New active state
   */
  const setActive = (value: boolean) => {
    if (value === isActive.value)
      return

    // Call the callback and check if we should prevent the change
    if (onActiveChangeCallback?.(value) === false)
      return

    isActive.value = value
  }

  /**
   * Handle event prevention and propagation based on options
   * @param event - The pointer event to handle
   */
  const handleEvent = (event: PointerEvent) => {
    if (toValue(preventDefault))
      event.preventDefault()
    if (toValue(stopPropagation))
      event.stopPropagation()
  }

  /**
   * Handle the start of a drag operation
   * @param event - The pointer event that triggered the drag start
   */
  const onDragStart = (event: PointerEvent) => {
    const el = toValue(draggingHandle)
    const targetEl = toValue(target)
    if (!filterEvent(event) || !el || !targetEl)
      return
    startEvent.value = event
    startPosition.value = { ...position.value }

    if (onDragStartCallback?.(position.value, event) === false)
      return
    isDragging.value = true
    elementSize.value = getElementSize(targetEl)
    handleEvent(event)
  }

  /**
   * Update element position during drag
   * @param event - The pointer event containing new position information
   */
  const updatePosition = (event: PointerEvent) => {
    const el = toValue(draggingHandle)
    if (!isDragging.value || !startEvent.value || !el)
      return

    const scaleValue = toValue(scale)
    const eventPosition = calculatePosition(event, scaleValue)
    const startEventPosition = calculatePosition(startEvent.value, scaleValue)
    const delta = calculateDelta(startEventPosition, eventPosition)

    let newPosition = {
      x: Math.round(startPosition.value.x + delta.x),
      y: Math.round(startPosition.value.y + delta.y),
    }

    const axisValue = toValue(axis)
    newPosition = applyAxisConstraint(newPosition, axisValue, startPosition.value)

    const gridValue = toValue(grid)
    if (gridValue) {
      newPosition = applyGrid(newPosition, gridValue)
    }

    if (bounds) {
      let boundingElement: HTMLElement | null = null
      const boundsValue = toValue(bounds)
      const targetEl = toValue(target)

      if (boundsValue === 'parent' && targetEl?.parentElement) {
        boundingElement = targetEl.parentElement
      }
      else if (boundsValue instanceof HTMLElement) {
        boundingElement = boundsValue
      }

      if (boundingElement && targetEl) {
        const boundingRect = getElementBounds(boundingElement)
        const elementRect = getElementBounds(targetEl)

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
      else if (typeof boundsValue === 'object' && boundsValue) {
        newPosition = applyBounds(
          newPosition,
          boundsValue,
          elementSize.value,
        )
      }
    }

    if (onDragCallback?.(position.value, event) === false)
      return

    position.value = {
      x: Math.round(newPosition.x),
      y: Math.round(newPosition.y),
    }
    handleEvent(event)
  }

  // Create a throttled version of the updatePosition function
  const throttledUpdatePosition = throttle(updatePosition, toValue(throttleDelay))

  /**
   * Handle drag movement with throttling
   * @param event - The pointer event from drag movement
   */
  const onDrag = (event: PointerEvent) => {
    throttledUpdatePosition(event)
  }

  /**
   * Handle the end of a drag operation
   * @param event - The pointer event that triggered the drag end
   */
  const onDragEnd = (event: PointerEvent) => {
    if (!isDragging.value)
      return
    isDragging.value = false
    startEvent.value = null

    if (onDragEndCallback?.(position.value, event) === false)
      return
    handleEvent(event)
  }

  /**
   * Get event listener configuration based on current options
   * @returns Event listener options object
   */
  const getConfig = () => ({
    capture: toValue(capture),
    passive: !toValue(preventDefault),
  })

  // Handle activation based on activeOn setting
  const onPointerDown = (event: PointerEvent) => {
    const currentActiveOn = toValue(activeOn)

    // If activeOn is 'click', set active state on pointer down
    if (currentActiveOn === 'click') {
      setActive(true)
    }

    // Then try to start dragging if conditions are met
    onDragStart(event)
  }

  const onPointerEnter = (_event: PointerEvent) => {
    const currentActiveOn = toValue(activeOn)

    // If activeOn is 'hover', set active state on pointer enter
    if (currentActiveOn === 'hover') {
      setActive(true)
    }
  }

  const onPointerLeave = (event: PointerEvent) => {
    const currentActiveOn = toValue(activeOn)
    const el = toValue(draggingHandle)
    const shouldPreventDeactivation = toValue(preventDeactivation)

    // If activeOn is 'hover', remove active state on pointer leave
    // But only if the pointer is not moving to a child element
    // And preventDeactivation is false
    if (currentActiveOn === 'hover' && el && !shouldPreventDeactivation) {
      const relatedTarget = event.relatedTarget as Node | null
      // Check if relatedTarget is a child of the current element
      if (!relatedTarget || !el.contains(relatedTarget)) {
        setActive(false)
      }
    }
  }

  /**
   * Handle document click to deactivate when clicking outside the element
   * @param event - The pointer event from document click
   */
  const onDocumentPointerDown = (event: PointerEvent) => {
    const currentActiveOn = toValue(activeOn)
    const el = toValue(target)
    const shouldPreventDeactivation = toValue(preventDeactivation)

    // Only process if activeOn is 'click' and element is active
    // And preventDeactivation is false
    if (currentActiveOn === 'click' && isActive.value && el && !shouldPreventDeactivation) {
      // Check if the click is outside the element
      const targetElement = event.target as Node
      if (!el.contains(targetElement)) {
        setActive(false)
      }
    }
  }

  // Set up event listeners
  useEventListener(draggingHandle, 'pointerdown', onPointerDown, getConfig())
  useEventListener(draggingElement, 'pointermove', onDrag, getConfig())
  useEventListener(draggingElement, 'pointerup', onDragEnd, getConfig())

  // Add activation-related event listeners
  useEventListener(draggingHandle, 'pointerenter', onPointerEnter, getConfig())
  useEventListener(draggingHandle, 'pointerleave', onPointerLeave, getConfig())

  // Add document click listener to handle clicking outside
  const documentListener = useEventListener(document, 'pointerdown', onDocumentPointerDown, { capture: true })

  // Clean up document listener on unmount
  onUnmounted(() => {
    documentListener()
  })

  /**
   * Set the position of the draggable element
   * @param newPosition - The new position to set
   */
  const setPosition = (newPosition: Position) => {
    position.value = {
      x: Math.round(newPosition.x),
      y: Math.round(newPosition.y),
    }
  }

  return {
    position,
    isDragging,
    isActive,
    style,
    setPosition,
    setActive,
    onDragStart,
    onDrag,
    onDragEnd,
  }
}

export default useDraggable
