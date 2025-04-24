import type { MaybeRefOrGetter } from 'vue'
import type { DraggableOptions, PointerType, Position } from '../types'
import { computed, ref, toValue } from 'vue'
import {
  applyAxisConstraint,
  applyBounds,
  applyGrid,
  calculateDelta,
  calculatePosition,
  defaultWindow,
  getElementBounds,
  getElementSize,
} from '../utils'
import { useEventListener } from './useEventListener'

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
    onDragStart: onDragStartCallback,
    onDrag: onDragCallback,
    onDragEnd: onDragEndCallback,
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

  const filterEvent = (event: PointerEvent): boolean => {
    if (disabled)
      return false
    if (pointerTypes)
      return pointerTypes.includes(event.pointerType as PointerType)
    return true
  }

  const handleEvent = (event: PointerEvent) => {
    if (preventDefault)
      event.preventDefault()
    if (stopPropagation)
      event.stopPropagation()
  }

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

  const onDrag = (event: PointerEvent) => {
    const el = toValue(draggingHandle)
    if (!isDragging.value || !startEvent.value || !el)
      return

    const eventPosition = calculatePosition(event, scale)
    const startEventPosition = calculatePosition(startEvent.value, scale)
    const delta = calculateDelta(startEventPosition, eventPosition)

    let newPosition = {
      x: startPosition.value.x + delta.x,
      y: startPosition.value.y + delta.y,
    }

    newPosition = applyAxisConstraint(newPosition, axis, startPosition.value)
    newPosition = applyGrid(newPosition, grid)

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
      else if (typeof boundsValue === 'object') {
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

  const onDragEnd = (event: PointerEvent) => {
    if (!isDragging.value)
      return
    isDragging.value = false
    startEvent.value = null

    if (onDragEndCallback?.(position.value, event) === false)
      return
    handleEvent(event)
  }

  const config = ({
    capture: options.capture ?? true,
    passive: !preventDefault,
  })

  useEventListener(draggingHandle, 'pointerdown', onDragStart, config)
  useEventListener(draggingElement, 'pointermove', onDrag, config)
  useEventListener(draggingElement, 'pointerup', onDragEnd, config)

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
