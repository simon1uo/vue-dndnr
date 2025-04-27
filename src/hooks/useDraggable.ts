import type { DraggableOptions, PointerType, Position } from '@/types'
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
import { computed, ref, toValue } from 'vue'

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
    onDragStart: onDragStartCallback,
    onDrag: onDragCallback,
    onDragEnd: onDragEndCallback,
    throttleDelay = 16, // Default to ~60fps
  } = options

  const position = ref<Position>({ ...initialPosition })
  const startPosition = ref<Position>({ ...initialPosition })
  const isDragging = ref(false)

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
   * Filter pointer events based on disabled state and pointer types
   * @param event - The pointer event to filter
   * @returns True if the event should be processed, false otherwise
   */
  const filterEvent = (event: PointerEvent): boolean => {
    if (toValue(disabled))
      return false
    const types = toValue(pointerTypes)
    if (types)
      return types.includes(event.pointerType as PointerType)
    return true
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
      x: startPosition.value.x + delta.x,
      y: startPosition.value.y + delta.y,
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

    position.value = newPosition
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

  useEventListener(draggingHandle, 'pointerdown', onDragStart, getConfig())
  useEventListener(draggingElement, 'pointermove', onDrag, getConfig())
  useEventListener(draggingElement, 'pointerup', onDragEnd, getConfig())

  /**
   * Set the position of the draggable element
   * @param newPosition - The new position to set
   */
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
