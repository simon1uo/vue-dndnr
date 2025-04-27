import type { PointerType, Position, ResizableOptions, ResizeHandle, Size } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@/hooks/useEventListener'
import {
  applyAspectRatioLock,
  applyGrid,
  applyMinMaxConstraints,
  defaultWindow,
  getElementBounds,
  getElementPosition,
  getElementSize,
  isClient,
} from '@/utils'
import { throttle } from '@/utils/throttle'
import { onMounted, ref, toValue, watch } from 'vue'

/**
 * Hook that adds resize functionality to an element
 * @param target - Reference to the element to make resizable
 * @param options - Configuration options for resizable behavior
 * @returns Object containing resizable state and methods
 */
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
    throttleDelay = 16, // Default to ~60fps
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
    const clientX = event.clientX ?? ((event as unknown as TouchEvent).touches?.[0]?.clientX ?? 0)
    const clientY = event.clientY ?? ((event as unknown as TouchEvent).touches?.[0]?.clientY ?? 0)

    const distToTop = Math.abs(clientY - rect.top)
    const distToBottom = Math.abs(clientY - rect.bottom)
    const distToLeft = Math.abs(clientX - rect.left)
    const distToRight = Math.abs(clientX - rect.right)

    const thresholdValue = toValue(boundaryThreshold)

    const expandedRect = {
      left: rect.left - thresholdValue,
      right: rect.right + thresholdValue,
      top: rect.top - thresholdValue,
      bottom: rect.bottom + thresholdValue,
    }

    const isWithinX = clientX >= expandedRect.left && clientX <= expandedRect.right
    const isWithinY = clientY >= expandedRect.top && clientY <= expandedRect.bottom

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

    const edgeThreshold = thresholdValue * 0.8

    if (distToTop <= edgeThreshold && isWithinX) {
      return 't'
    }
    if (distToBottom <= edgeThreshold && isWithinX) {
      return 'b'
    }
    if (distToLeft <= edgeThreshold && isWithinY) {
      return 'l'
    }
    if (distToRight <= edgeThreshold && isWithinY) {
      return 'r'
    }

    return null
  }

  /**
   * Handle mouse movement for resize handle detection
   * @param event - The pointer event from mouse movement
   */
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

  /**
   * Handle the start of a resize operation
   * @param event - The pointer event that triggered the resize start
   */
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

  /**
   * Update element size during resize
   * @param event - The pointer event containing new size information
   */
  const updateSize = (event: PointerEvent) => {
    const el = toValue(target)
    if (!isResizing.value || !activeHandle.value || !startEvent.value || !el)
      return

    const clientX = event.clientX ?? ((event as unknown as TouchEvent).touches?.[0]?.clientX ?? 0)
    const clientY = event.clientY ?? ((event as unknown as TouchEvent).touches?.[0]?.clientY ?? 0)
    const startClientX = startEvent.value.clientX ?? ((startEvent.value as unknown as TouchEvent).touches?.[0]?.clientX ?? 0)
    const startClientY = startEvent.value.clientY ?? ((startEvent.value as unknown as TouchEvent).touches?.[0]?.clientY ?? 0)

    const deltaX = clientX - startClientX
    const deltaY = clientY - startClientY

    const newPosition = { ...startPosition.value }
    const minWidthValue = toValue(minWidth) ?? 0
    const minHeightValue = toValue(minHeight) ?? 0
    const maxWidthValue = toValue(maxWidth) ?? Infinity
    const maxHeightValue = toValue(maxHeight) ?? Infinity

    // Get current element dimensions and position
    const rect = el.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(el)
    const borderLeft = Number.parseFloat(computedStyle.borderLeftWidth) || 0
    const borderRight = Number.parseFloat(computedStyle.borderRightWidth) || 0
    const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0
    const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0

    // Calculate available space
    const availableWidth = rect.width - borderLeft - borderRight
    const availableHeight = rect.height - borderTop - borderBottom

    // Pre-calculate potential dimensions
    let newWidth = Number(startSize.value.width === 'auto' ? availableWidth : startSize.value.width)
    let newHeight = Number(startSize.value.height === 'auto' ? availableHeight : startSize.value.height)

    // Track accumulated position changes
    let accumulatedDeltaX = 0
    let accumulatedDeltaY = 0

    // Calculate new dimensions with constraints
    const calculateNewDimensions = () => {
      let widthChange = 0
      let heightChange = 0
      let shouldUpdateX = false
      let shouldUpdateY = false

      // Calculate changes based on different resize handles
      switch (activeHandle.value) {
        case 'r':
        case 'right':
          widthChange = deltaX
          break
        case 'l':
        case 'left':
          widthChange = -deltaX
          shouldUpdateX = true
          break
        case 'b':
        case 'bottom':
          heightChange = deltaY
          break
        case 't':
        case 'top':
          heightChange = -deltaY
          shouldUpdateY = true
          break
        case 'tr':
        case 'top-right':
          widthChange = deltaX
          heightChange = -deltaY
          shouldUpdateY = true
          break
        case 'tl':
        case 'top-left':
          widthChange = -deltaX
          heightChange = -deltaY
          shouldUpdateX = true
          shouldUpdateY = true
          break
        case 'br':
        case 'bottom-right':
          widthChange = deltaX
          heightChange = deltaY
          break
        case 'bl':
        case 'bottom-left':
          widthChange = -deltaX
          heightChange = deltaY
          shouldUpdateX = true
          break
      }

      // Calculate new dimensions with constraints
      const currentWidth = typeof startSize.value.width === 'number' ? startSize.value.width : newWidth
      const currentHeight = typeof startSize.value.height === 'number' ? startSize.value.height : newHeight

      // Fix: Reset accumulated changes to avoid reverse movement
      let effectiveWidthChange = widthChange
      let effectiveHeightChange = heightChange

      // Handle width changes
      if (shouldUpdateX) {
        const potentialWidth = currentWidth + widthChange
        if (potentialWidth < minWidthValue) {
          // If new width is less than minimum, adjust the offset
          effectiveWidthChange = minWidthValue - currentWidth
          accumulatedDeltaX = -effectiveWidthChange
        }
        else if (potentialWidth > maxWidthValue) {
          // If new width is greater than maximum, adjust the offset
          effectiveWidthChange = maxWidthValue - currentWidth
          accumulatedDeltaX = -effectiveWidthChange
        }
        else {
          // In normal cases, use the direct offset
          accumulatedDeltaX = -widthChange
        }
      }

      // Handle height changes
      if (shouldUpdateY) {
        const potentialHeight = currentHeight + heightChange
        if (potentialHeight < minHeightValue) {
          // If new height is less than minimum, adjust the offset
          effectiveHeightChange = minHeightValue - currentHeight
          accumulatedDeltaY = -effectiveHeightChange
        }
        else if (potentialHeight > maxHeightValue) {
          // If new height is greater than maximum, adjust the offset
          effectiveHeightChange = maxHeightValue - currentHeight
          accumulatedDeltaY = -effectiveHeightChange
        }
        else {
          // In normal cases, use the direct offset
          accumulatedDeltaY = -heightChange
        }
      }

      // Apply final dimension changes
      newWidth = Math.min(Math.max(currentWidth + effectiveWidthChange, minWidthValue), maxWidthValue)
      newHeight = Math.min(Math.max(currentHeight + effectiveHeightChange, minHeightValue), maxHeightValue)

      // Update position using corrected accumulated changes
      if (isAbsolutePositioned.value) {
        if (shouldUpdateX) {
          newPosition.x = Math.max(0, startPosition.value.x + accumulatedDeltaX)
        }
        if (shouldUpdateY) {
          newPosition.y = Math.max(0, startPosition.value.y + accumulatedDeltaY)
        }
      }
    }

    calculateNewDimensions()

    // 应用网格对齐
    const newSize = { width: newWidth, height: newHeight }
    let snappedSize = newSize
    const gridValue = toValue(grid)
    if (gridValue) {
      snappedSize = {
        width: typeof newSize.width === 'number' ? applyGrid({ x: newSize.width, y: 0 }, gridValue).x : newSize.width,
        height: typeof newSize.height === 'number' ? applyGrid({ x: 0, y: newSize.height }, gridValue).y : newSize.height,
      }
    }

    // 应用最小/最大约束
    let constrainedSize = applyMinMaxConstraints(
      snappedSize,
      minWidthValue,
      minHeightValue,
      maxWidthValue,
      maxHeightValue,
    )

    // 应用宽高比锁定
    if (toValue(lockAspectRatio)) {
      constrainedSize = applyAspectRatioLock(
        constrainedSize,
        startSize.value,
        true,
      )
    }

    // 应用边界约束
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

        // 考虑边界约束时的最大尺寸
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

    // 更新状态
    size.value = constrainedSize
    if (isAbsolutePositioned.value) {
      position.value = newPosition
    }

    // 应用样式
    applyStyles()

    if (onResizeCallback) {
      onResizeCallback(size.value, event)
    }

    handleEvent(event)
  }

  // Create a throttled version of the updateSize function
  const throttledUpdateSize = throttle(updateSize, toValue(throttleDelay))

  const onResize = (event: PointerEvent) => {
    throttledUpdateSize(event)
  }

  /**
   * Handle the end of a resize operation
   * @param event - The pointer event that triggered the resize end
   */
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

  /**
   * Set up initial element size and position
   */
  const setupElementSize = () => {
    if (!isClient)
      return

    const el = toValue(target)
    if (el) {
      // Check positioning type
      const computedStyle = window.getComputedStyle(el)
      isAbsolutePositioned.value = computedStyle.position === 'absolute'

      // Set initial position for absolute positioned elements
      if (isAbsolutePositioned.value) {
        const elementPosition = getElementPosition(el)
        position.value = elementPosition
        startPosition.value = { ...elementPosition }
      }

      // Set initial size if auto
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

  /**
   * Get event listener configuration based on current options
   * @returns Event listener options object
   */
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

  /**
   * Set the size of the resizable element
   * @param newSize - The new size to set
   */
  const setSize = (newSize: Size) => {
    size.value = { ...newSize }
    applyStyles()
  }

  /**
   * Set the position of the resizable element
   * @param newPosition - The new position to set
   */
  const setPosition = (newPosition: Position) => {
    const el = toValue(target)
    if (!el)
      return

    // 获取元素的当前位置和尺寸信息
    const rect = el.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(el)
    const marginLeft = Number.parseFloat(computedStyle.marginLeft) || 0
    const marginTop = Number.parseFloat(computedStyle.marginTop) || 0

    // 如果元素是绝对定位
    if (isAbsolutePositioned.value) {
      // 考虑边界约束
      if (bounds) {
        const boundsValue = toValue(bounds)
        let boundingElement: HTMLElement | null = null

        if (boundsValue === 'parent' && el.parentElement) {
          boundingElement = el.parentElement
        }
        else if (boundsValue instanceof HTMLElement) {
          boundingElement = boundsValue
        }

        if (boundingElement) {
          const boundingRect = boundingElement.getBoundingClientRect()
          const maxX = boundingRect.width - rect.width - marginLeft
          const maxY = boundingRect.height - rect.height - marginTop

          // 确保位置在边界内
          position.value = {
            x: Math.max(0, Math.min(newPosition.x, maxX)),
            y: Math.max(0, Math.min(newPosition.y, maxY)),
          }
        }
        else {
          // 如果没有边界元素,至少确保不会出现负值
          position.value = {
            x: Math.max(0, newPosition.x),
            y: Math.max(0, newPosition.y),
          }
        }
      }
      else {
        // 没有边界约束时,直接更新位置,但确保不会出现负值
        position.value = {
          x: Math.max(0, newPosition.x),
          y: Math.max(0, newPosition.y),
        }
      }
    }
    else {
      // 对于相对定位元素,直接更新位置
      position.value = { ...newPosition }
    }

    // 应用新的位置
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
