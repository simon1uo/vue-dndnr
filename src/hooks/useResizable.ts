import type { MaybeRefOrGetter } from 'vue'
import type { PointerType, Position, ResizableOptions, ResizeHandle, Size } from '../types'
import { onMounted, ref, toValue, watch } from 'vue'
import {
  applyAspectRatioLock,
  applyGrid,
  applyMinMaxConstraints,
  defaultWindow,
  getElementBounds,
  getElementPosition,
  getElementSize,
  isClient,
} from '../utils'
import { useEventListener } from './useEventListener'

export function useResizable(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: ResizableOptions = {}) {
  const {
    initialSize = { width: 'auto', height: 'auto' },
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    grid,
    lockAspectRatio = false,
    handles = ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'],
    bounds,
    disabled = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
    capture = true,
    boundaryThreshold = 8,
    onResizeStart: onResizeStartCallback,
    onResize: onResizeCallback,
    onResizeEnd: onResizeEndCallback,
  } = options

  const size = ref<Size>({ ...initialSize })
  const position = ref<Position>({ x: 0, y: 0 })
  const isResizing = ref(false)
  const activeHandle = ref<ResizeHandle | null>(null)
  const startEvent = ref<PointerEvent | null>(null)
  const hoverHandle = ref<ResizeHandle | null>(null)
  const isAbsolutePositioned = ref(false)

  const startSize = ref<Size>({ ...initialSize })
  const startPosition = ref<Position>({ x: 0, y: 0 })

  const getCursorForHandle = (handle: ResizeHandle): string => {
    switch (handle) {
      case 't':
      case 'top':
        return 'n-resize'
      case 'b':
      case 'bottom':
        return 's-resize'
      case 'r':
      case 'right':
        return 'e-resize'
      case 'l':
      case 'left':
        return 'w-resize'
      case 'tr':
      case 'top-right':
        return 'ne-resize'
      case 'tl':
      case 'top-left':
        return 'nw-resize'
      case 'br':
      case 'bottom-right':
        return 'se-resize'
      case 'bl':
      case 'bottom-left':
        return 'sw-resize'
      default:
        return 'default'
    }
  }

  const applyStyles = () => {
    const el = toValue(target)
    if (!el)
      return

    const cursorStyle = hoverHandle.value ? getCursorForHandle(hoverHandle.value) : 'default'

    if (!isAbsolutePositioned.value) {
      el.style.position = 'relative'
    }
    else {
      el.style.left = `${position.value.x}px`
      el.style.top = `${position.value.y}px`
    }

    el.style.width = typeof size.value.width === 'number' ? `${size.value.width}px` : size.value.width
    el.style.height = typeof size.value.height === 'number' ? `${size.value.height}px` : size.value.height
    el.style.userSelect = 'none'
    el.style.cursor = isResizing.value && activeHandle.value ? getCursorForHandle(activeHandle.value) : cursorStyle
  }

  const filterEvent = (event: PointerEvent): boolean => {
    if (toValue(disabled))
      return false

    const types = toValue(pointerTypes)
    if (types)
      return types.includes(event.pointerType as PointerType)

    return true
  }

  const handleEvent = (event: PointerEvent) => {
    if (toValue(preventDefault))
      event.preventDefault()
    if (toValue(stopPropagation))
      event.stopPropagation()
  }

  const detectBoundary = (event: PointerEvent, element: HTMLElement | SVGElement): ResizeHandle | null => {
    const rect = element.getBoundingClientRect()
    const clientX = event instanceof MouseEvent ? event.clientX : (event as TouchEvent).touches[0].clientX
    const clientY = event instanceof MouseEvent ? event.clientY : (event as TouchEvent).touches[0].clientY

    const distToTop = Math.abs(clientY - rect.top)
    const distToBottom = Math.abs(clientY - rect.bottom)
    const distToLeft = Math.abs(clientX - rect.left)
    const distToRight = Math.abs(clientX - rect.right)

    const thresholdValue = toValue(boundaryThreshold)
    const isWithinX = clientX >= rect.left - thresholdValue && clientX <= rect.right + thresholdValue
    const isWithinY = clientY >= rect.top - thresholdValue && clientY <= rect.bottom + thresholdValue

    if (!isWithinX || !isWithinY) {
      return null
    }

    if (distToTop <= thresholdValue && distToLeft <= thresholdValue) {
      return 'tl'
    }
    if (distToTop <= thresholdValue && distToRight <= thresholdValue) {
      return 'tr'
    }
    if (distToBottom <= thresholdValue && distToLeft <= thresholdValue) {
      return 'bl'
    }
    if (distToBottom <= thresholdValue && distToRight <= thresholdValue) {
      return 'br'
    }

    if (distToTop <= thresholdValue && isWithinX) {
      return 't'
    }
    if (distToBottom <= thresholdValue && isWithinX) {
      return 'b'
    }
    if (distToLeft <= thresholdValue && isWithinY) {
      return 'l'
    }
    if (distToRight <= thresholdValue && isWithinY) {
      return 'r'
    }

    return null
  }

  const onMouseMove = (event: PointerEvent) => {
    if (isResizing.value || !filterEvent(event)) {
      return
    }

    const el = toValue(target)
    if (!el) {
      return
    }

    const detectedHandle = detectBoundary(event, el)

    if (detectedHandle !== hoverHandle.value) {
      hoverHandle.value = detectedHandle
    }
  }

  const onResizeStart = (event: PointerEvent) => {
    const el = toValue(target)
    if (!filterEvent(event) || !el)
      return

    const handle = detectBoundary(event, el)
    const handlesValue = toValue(handles) 
 
    if (!handle || !handlesValue || !handlesValue.includes(handle))
      return

    startEvent.value = event
    startSize.value = { ...size.value }
    startPosition.value = { ...position.value }
    isResizing.value = true
    activeHandle.value = handle

    if (onResizeStartCallback)
      onResizeStartCallback(size.value, event)

    handleEvent(event)
  }

  const onResize = (event: PointerEvent) => {
    const el = toValue(target)
    if (!isResizing.value || !activeHandle.value || !startEvent.value || !el)
      return

    const clientX = event instanceof MouseEvent ? event.clientX : (event as TouchEvent).touches[0].clientX
    const clientY = event instanceof MouseEvent ? event.clientY : (event as TouchEvent).touches[0].clientY
    const startClientX = startEvent.value instanceof MouseEvent ? startEvent.value.clientX : (startEvent.value as unknown as TouchEvent).touches[0].clientX
    const startClientY = startEvent.value instanceof MouseEvent ? startEvent.value.clientY : (startEvent.value as unknown as TouchEvent).touches[0].clientY

    const deltaX = clientX - startClientX
    const deltaY = clientY - startClientY

    let newSize: Size = { ...startSize.value }
    let width = Number(startSize.value.width)
    let height = Number(startSize.value.height)

    const newPosition = { ...startPosition.value }

    switch (activeHandle.value) {
      case 'r':
      case 'right':
        width = width + deltaX
        break
      case 'l':
      case 'left':
        width = width - deltaX
        if (isAbsolutePositioned.value) {
          newPosition.x = startPosition.value.x + deltaX
        }
        break
      case 'b':
      case 'bottom':
        height = height + deltaY
        break
      case 't':
      case 'top':
        height = height - deltaY
        if (isAbsolutePositioned.value) {
          newPosition.y = startPosition.value.y + deltaY
        }
        break
      case 'tr':
      case 'top-right':
        width = width + deltaX
        height = height - deltaY
        if (isAbsolutePositioned.value) {
          newPosition.y = startPosition.value.y + deltaY
        }
        break
      case 'tl':
      case 'top-left':
        width = width - deltaX
        height = height - deltaY
        if (isAbsolutePositioned.value) {
          newPosition.x = startPosition.value.x + deltaX
          newPosition.y = startPosition.value.y + deltaY
        }
        break
      case 'br':
      case 'bottom-right':
        width = width + deltaX
        height = height + deltaY
        break
      case 'bl':
      case 'bottom-left':
        width = width - deltaX
        height = height + deltaY
        if (isAbsolutePositioned.value) {
          newPosition.x = startPosition.value.x + deltaX
        }
        break
    }

    width = Math.max(0, width)
    height = Math.max(0, height)

    if (isAbsolutePositioned.value) {
      const updatedPosition = { ...position.value }

      if (width > 0 && ['l', 'left', 'tl', 'top-left', 'bl', 'bottom-left'].includes(activeHandle.value)) {
        const constrainedX = Math.max(0, newPosition.x)
        updatedPosition.x = constrainedX

        if (constrainedX > newPosition.x) {
          const positionAdjustment = constrainedX - newPosition.x
          width += positionAdjustment
        }
      }

      if (height > 0 && ['t', 'top', 'tl', 'top-left', 'tr', 'top-right'].includes(activeHandle.value)) {
        const constrainedY = Math.max(0, newPosition.y)
        updatedPosition.y = constrainedY

        if (constrainedY > newPosition.y) {
          const positionAdjustment = constrainedY - newPosition.y
          height += positionAdjustment
        }
      }

      position.value = updatedPosition
    }

    newSize = { width, height }

    let snappedSize = newSize
    const gridValue = toValue(grid)
    if (gridValue) {
      snappedSize = {
        width: typeof newSize.width === 'number' ? applyGrid({ x: newSize.width, y: 0 }, gridValue).x : newSize.width,
        height: typeof newSize.height === 'number' ? applyGrid({ x: 0, y: newSize.height }, gridValue).y : newSize.height,
      }
    }

    let constrainedSize = applyMinMaxConstraints(
      snappedSize,
      toValue(minWidth),
      toValue(minHeight),
      toValue(maxWidth),
      toValue(maxHeight),
    )

    if (toValue(lockAspectRatio)) {
      constrainedSize = applyAspectRatioLock(
        constrainedSize,
        startSize.value,
        true,
      )
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
        const targetRect = getElementBounds(targetEl)
        const targetPos = {
          x: targetRect.left - boundingRect.left,
          y: targetRect.top - boundingRect.top,
        }

        const maxBoundWidth = boundingRect.right - boundingRect.left - targetPos.x
        const maxBoundHeight = boundingRect.bottom - boundingRect.top - targetPos.y

        if (typeof constrainedSize.width === 'number') {
          constrainedSize.width = Math.min(constrainedSize.width, maxBoundWidth)
        }
        if (typeof constrainedSize.height === 'number') {
          constrainedSize.height = Math.min(constrainedSize.height, maxBoundHeight)
        }
      }
    }

    size.value = constrainedSize

    applyStyles()

    if (onResizeCallback)
      onResizeCallback(size.value, event)

    handleEvent(event)
  }

  const onResizeEnd = (event: PointerEvent) => {
    if (!isResizing.value)
      return

    isResizing.value = false
    activeHandle.value = null
    startEvent.value = null

    if (onResizeEndCallback)
      onResizeEndCallback(size.value, event)

    handleEvent(event)
  }

  const setupElementSize = () => {
    if (!isClient) return;

    const el = toValue(target)
    if (el) {
      const computedStyle = window.getComputedStyle(el)
      isAbsolutePositioned.value = computedStyle.position === 'absolute'

      if (isAbsolutePositioned.value) {
        const elementPosition = getElementPosition(el)
        position.value = elementPosition
        startPosition.value = { ...elementPosition }
      }

      if (size.value.width === 'auto' || size.value.height === 'auto') {
        const elementSize = getElementSize(el)
        size.value = {
          width: size.value.width === 'auto' ? elementSize.width : size.value.width,
          height: size.value.height === 'auto' ? elementSize.height : size.value.height,
        }
      }

      applyStyles()

    }
  }

  const getConfig = () => ({
    capture: toValue(capture),
    passive: !toValue(preventDefault),
  })

  
  onMounted(setupElementSize)

  // Watch for changes to the target element
  watch(
    () => toValue(target),
    (newTarget) => {
      if (newTarget) {
        // Set up new listeners
        setupElementSize()
      }
    },
    { immediate: true },
  )

  // Watch for changes to size, position or handle state to update styles
  watch([size, position, hoverHandle, isResizing, activeHandle], () => {
    applyStyles()
  }, { deep: true })

  // Public methods
  const setSize = (newSize: Size) => {
    size.value = { ...newSize }
    applyStyles()
  }

  const setPosition = (newPosition: Position) => {
    // Prevent negative position values for absolute positioned elements
    if (isAbsolutePositioned.value) {
      position.value = {
        x: Math.max(0, newPosition.x),
        y: Math.max(0, newPosition.y),
      }
    }
    else {
      position.value = { ...newPosition }
    }
    applyStyles()
  }


  useEventListener(target, 'pointermove', onMouseMove, getConfig())
  useEventListener(target, 'pointerdown', onResizeStart, getConfig())
  useEventListener(target, 'pointermove', onMouseMove, getConfig())
  useEventListener(target, 'pointerleave', () => {
    hoverHandle.value = null
  }, getConfig())

  useEventListener(defaultWindow, 'pointermove', onResize, getConfig())
  useEventListener(defaultWindow, 'pointerup', onResizeEnd, getConfig())

  // Return values and methods
  return {
    size,
    position,
    isResizing,
    activeHandle,
    hoverHandle,
    isAbsolutePositioned,
    setSize,
    setPosition,
    onResizeStart,
    onResize,
    onResizeEnd,
    detectBoundary,
  }
}

export default useResizable
