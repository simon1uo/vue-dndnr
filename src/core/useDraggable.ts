import type { InternalState, PointerType, Position } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { usePublicState } from '@/stores'
import {
  getElementBounds,
  getElementPosition,
  getElementSize,
} from '@/utils'
import { defaultWindow, isClient, tryOnUnmounted, useEventListener, useThrottleFn } from '@vueuse/core'
import { computed, onMounted, shallowRef, toValue, watch } from 'vue'
import { useInteractive } from './useInteractive'

// Style constants
const BASE_STYLES = {
  userSelect: 'none',
  touchAction: 'none',
  boxSizing: 'border-box',
} as const

const CURSOR_STYLES = {
  dragging: 'grabbing',
  draggable: 'grab',
} as const

const DEFAULT_STATE_STYLES = {
  active: {
    outline: '1px solid #aaaaaa',
  },
  dragging: {
    opacity: '0.8',
    cursor: 'grabbing',
  },
} as const

/**
 * Calculate position from a pointer event with optional scaling
 * @param event - The pointer event containing position information
 * @param scale - Optional scale factor to apply to the position
 * @returns The calculated position coordinates
 */
function calculatePosition(event: PointerEvent, scale = 1): Position {
  const clientX = event.clientX
  const clientY = event.clientY

  return {
    x: clientX / scale,
    y: clientY / scale,
  }
}

export interface UseDraggableOptions extends InternalState {
  /**
   * Initial position of the element
   * @default { x: 0, y: 0 }
   */
  initialPosition?: Position

  /**
   * Axis to constrain dragging movement
   * @default 'both'
   */
  axis?: MaybeRefOrGetter<'x' | 'y' | 'both'>

  /**
   * Element that triggers dragging
   * @default the draggable element itself
   */
  handle?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * Element to attach pointer event listeners to
   * @default window
   */
  draggingElement?: MaybeRefOrGetter<HTMLElement | SVGElement | Window | Document | null | undefined>

  /**
   * Scale factor for the draggable element
   * @default 1
   */
  scale?: MaybeRefOrGetter<number>

  /**
   * Called when dragging starts
   */
  onDragStart?: (position: Position, event: PointerEvent) => void | boolean

  /**
   * Called during dragging
   */
  onDrag?: (position: Position, event: PointerEvent) => void | boolean

  /**
   * Called when dragging ends
   */
  onDragEnd?: (position: Position, event: PointerEvent) => void | boolean
}

export function useDraggable(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseDraggableOptions = {},
) {
  const publicState = usePublicState()

  const {
    elementId,
    initialPosition = { x: 0, y: 0 },
    handle: draggingHandle = target,
    draggingElement = defaultWindow,
    scale = 1,
    axis = 'both',
    grid,
    containerElement,
    throttleDelay = 16,
    stateStyles = {},
    positionType = 'absolute',
    zIndex = 'auto',

    onDragStart,
    onDrag,
    onDragEnd,
  } = options

  const {
    isActive,
    setActive,
    disabledValue,
    pointerTypesValue,
    preventDefaultValue,
    stopPropagationValue,
    activeOnValue,
  } = useInteractive(target, { ...options, elementId })

  const position = shallowRef<Position>({ ...initialPosition })
  const startEvent = shallowRef<PointerEvent | null>(null)
  const startPosition = shallowRef<Position>({ x: 0, y: 0 })
  const elementSize = shallowRef<{ width: number, height: number }>({ width: 0, height: 0 })

  const isDragging = computed(() => publicState.state.isDragging && isActive.value)

  const scaleValue = computed(() => toValue(scale))
  const axisValue = computed(() => toValue(axis))
  const gridValue = computed(() => toValue(grid))
  const containerElementValue = computed(() => toValue(containerElement))
  const throttleDelayValue = computed(() => toValue(throttleDelay))
  const stateStylesValue = computed(() => toValue(stateStyles))
  const positionTypeValue = computed(() => toValue(positionType))
  const zIndexValue = computed(() => toValue(zIndex))

  const mergedStateStyles = computed(() => {
    const userStyles = stateStylesValue.value
    return {
      active: { ...DEFAULT_STATE_STYLES.active, ...(userStyles?.active || {}) },
      dragging: { ...DEFAULT_STATE_STYLES.dragging, ...(userStyles?.dragging || {}) },
    }
  })

  /**
   * Filter pointer events based on disabled state, active state, and pointer types
   * @param event - The pointer event to filter
   * @returns True if the event should be processed, false otherwise
   */
  const filterEvent = (event: PointerEvent): boolean => {
    if (disabledValue.value)
      return false
    if (activeOnValue.value !== 'none' && !isActive.value)
      return false
    const types = pointerTypesValue.value
    if (types)
      return types.includes(event.pointerType as PointerType)
    return true
  }

  /**
   * Handle event prevention and propagation based on options
   * @param event - The pointer event to handle
   */
  const handleEvent = (event: PointerEvent) => {
    if (preventDefaultValue.value)
      event.preventDefault()
    if (stopPropagationValue.value)
      event.stopPropagation()
  }

  /**
   * Handle the start of a drag operation
   * @param event - The pointer event that triggered the drag start
   */
  const handleDragStart = (event: PointerEvent) => {
    const el = toValue(draggingHandle)
    const targetEl = toValue(target)
    if (!filterEvent(event) || !el || !targetEl)
      return

    // Don't start drag if element is being resized
    if (publicState.state.isResizing || !isActive.value || publicState.state.activeHandle || publicState.state.hoverHandle)
      return

    startEvent.value = event
    startPosition.value = { ...position.value }

    if (onDragStart?.(startPosition.value, event) === false)
      return

    publicState.setDragging(true)

    elementSize.value = getElementSize(targetEl)
    handleEvent(event)
  }

  /**
   * Update element position during drag
   * @param event - The pointer event containing new position information
   */
  const updateDragPosition = (event: PointerEvent) => {
    if (!isDragging.value || !startEvent.value)
      return

    const eventPosition = calculatePosition(event, scaleValue.value)
    const startEventPosition = calculatePosition(startEvent.value, scaleValue.value)
    const deltaX = eventPosition.x - startEventPosition.x
    const deltaY = eventPosition.y - startEventPosition.y

    let newX = Math.round(startPosition.value.x + deltaX)
    let newY = Math.round(startPosition.value.y + deltaY)

    if (axisValue.value !== 'both') {
      if (axisValue.value === 'x')
        newY = startPosition.value.y
      else if (axisValue.value === 'y')
        newX = startPosition.value.x
    }

    if (gridValue.value) {
      newX = Math.round(newX / gridValue.value[0]) * gridValue.value[0]
      newY = Math.round(newY / gridValue.value[1]) * gridValue.value[1]
    }

    const newPosition: Position = { x: newX, y: newY }

    if (containerElementValue.value) {
      const targetEl = toValue(target)
      const containerEl = toValue(containerElementValue)

      if (containerEl && targetEl) {
        const containerRect = getElementBounds(containerEl)
        const targetRect = getElementBounds(targetEl)

        const elSize = {
          width: targetRect.right - targetRect.left,
          height: targetRect.bottom - targetRect.top,
        }

        const boundsRect = {
          left: 0,
          top: 0,
          right: containerRect.right - containerRect.left,
          bottom: containerRect.bottom - containerRect.top,
        }
        newPosition.x = Math.min(
          Math.max(newPosition.x, boundsRect.left),
          boundsRect.right - elSize.width,
        )
        newPosition.y = Math.min(
          Math.max(newPosition.y, boundsRect.top),
          boundsRect.bottom - elSize.height,
        )
      }
    }

    if (onDrag?.(newPosition, event) === false)
      return

    position.value = {
      x: Math.round(newPosition.x),
      y: Math.round(newPosition.y),
    }

    publicState.setPosition(position.value)

    handleEvent(event)
  }

  // Create a throttled version of the updateDragPosition function
  const throttledUpdateDragPosition = useThrottleFn(updateDragPosition, throttleDelayValue, true, true)

  /**
   * Handle drag movement with throttling
   * @param event - The pointer event from drag movement
   */
  const handleDrag = (event: PointerEvent) => {
    throttledUpdateDragPosition(event)
  }

  /**
   * Handle the end of a drag operation
   * @param event - The pointer event that triggered the drag end
   */
  const handleDragEnd = (event: PointerEvent) => {
    if (!isDragging.value)
      return

    startEvent.value = null
    publicState.setDragging(false)

    if (onDragEnd?.(position.value, event) === false)
      return

    handleEvent(event)
  }

  const onPointerDown = (event: PointerEvent) => {
    handleDragStart(event)
  }

  const onPointerMove = (event: PointerEvent) => {
    handleDrag(event)
  }

  const onPointerUp = (event: PointerEvent) => {
    handleDragEnd(event)
  }

  const setupElementPosition = () => {
    const el = toValue(target)
    if (!el)
      return

    if (positionTypeValue.value === 'absolute'
      && (position.value.x === 0 && position.value.y === 0)) {
      position.value = getElementPosition(el)
    }
  }

  watch(
    () => publicState.state.dragPosition,
    (storePosition) => {
      if (!isDragging.value && isActive.value)
        position.value = { ...storePosition }
    },
    { deep: true },
  )

  if (isClient) {
    onMounted(() => {
      const el = toValue(target)
      if (el)
        setupElementPosition()
    })

    tryOnUnmounted(() => {
      const el = toValue(target)
      if (el) {
        const stylesToRemove = [
          mergedStateStyles.value.active,
          mergedStateStyles.value.dragging,
        ]
        stylesToRemove.forEach((styleGroup) => {
          if (styleGroup) {
            Object.keys(styleGroup).forEach((key) => {
              try {
                (el as HTMLElement).style[key as any] = ''
              }
              catch { }
            })
          }
        })
        Object.keys(BASE_STYLES).forEach((key) => {
          try {
            (el as HTMLElement).style[key as any] = ''
          }
          catch { }
        })
      }
    })

    const config = computed(() => ({
      capture: toValue(options.capture),
      passive: !preventDefaultValue.value,
    }))

    const draggingElementValue = computed(() => toValue(draggingElement) || defaultWindow)

    useEventListener(target, 'pointerdown', onPointerDown, config)
    useEventListener(draggingElementValue, 'pointermove', onPointerMove, config)
    useEventListener(draggingElementValue, 'pointerup', onPointerUp, config)
    useEventListener(draggingElementValue, 'pointercancel', onPointerUp, config)
  }

  const style = computed(() => {
    const computedStyle: Record<string, string> = {
      position: positionTypeValue.value,
      zIndex: String(zIndexValue.value),
      ...BASE_STYLES,
    }

    if (positionTypeValue.value === 'absolute' && position.value) {
      computedStyle.left = `${position.value.x}px`
      computedStyle.top = `${position.value.y}px`
    }

    if (isActive.value)
      Object.assign(computedStyle, mergedStateStyles.value.active)

    if (isDragging.value) {
      Object.assign(computedStyle, mergedStateStyles.value.dragging)
      if (zIndexValue.value === 'auto') {
        computedStyle.zIndex = '9999'
      }
    }

    if (!isDragging.value) {
      if (!disabledValue.value) {
        if (!computedStyle.cursor || computedStyle.cursor === 'auto')
          computedStyle.cursor = CURSOR_STYLES.draggable
      }
    }

    return computedStyle
  })

  /**
   * Function to programmatically set position
   * @param newPosition - The new position to set
   */
  const setPosition = (newPosition: Position) => {
    position.value = newPosition
    publicState.setPosition(newPosition)
  }

  return {
    x: computed(() => position.value.x),
    y: computed(() => position.value.y),
    position,
    isDragging,
    isActive,
    style,
    setActive,
    setPosition,
  }
}
