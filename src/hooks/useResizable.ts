import type { Position, ResizableOptions, Size } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@/hooks/useEventListener'
import { useResizeHandles } from '@/hooks/useResizeHandles'
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
import { onMounted, onUnmounted, ref, toValue, watch } from 'vue'

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
    handleType = 'borders',
    handles = ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'],
    customHandles,
    bounds,
    disabled = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
    capture = true,
    handlesSize = 8,
    handleBorderStyle = 'none',
    initialActive = false,
    activeOn = 'none',
    throttleDelay = 16, // Default to ~60fps
    onResizeStart: onResizeStartCallback,
    onResize: onResizeCallback,
    onResizeEnd: onResizeEndCallback,
    onActiveChange: onActiveChangeCallback,
  } = options

  const size = ref<Size>({ ...initialSize })
  const position = ref<Position>({ x: 0, y: 0 })
  const isResizing = ref(false)
  const isActive = ref(initialActive)
  const startEvent = ref<PointerEvent | null>(null)
  const isAbsolutePositioned = ref(false)

  const startSize = ref<Size>({ ...initialSize })
  const startPosition = ref<Position>({ x: 0, y: 0 })

  // Handle event by preventing default and stopping propagation if configured
  const handleEvent = (event: PointerEvent) => {
    if (toValue(preventDefault))
      event.preventDefault()
    if (toValue(stopPropagation))
      event.stopPropagation()
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

  // Initialize resize handles
  const {
    handleType: currentHandleType,
    activeHandle,
    hoverHandle,
    handleElements,
    getCursorForHandle,
    registerHandle,
    unregisterHandle,
    setupHandleElements,
    cleanup: cleanupHandles,
    detectBoundary,
  } = useResizeHandles(target, {
    handleType,
    handles,
    customHandles,
    handlesSize,
    handleBorderStyle,
    preventDefault,
    stopPropagation,
    capture,
    pointerTypes,
    disabled: toValue(disabled) || (toValue(activeOn) !== 'none' && !isActive.value),
    onResizeStart: (event: PointerEvent) => {
      // Check if element is active when activeOn is not 'none'
      const currentActiveOn = toValue(activeOn)
      if (currentActiveOn !== 'none' && !isActive.value)
        return

      // Handle resize start from handle elements
      startEvent.value = event
      startSize.value = { ...size.value }
      startPosition.value = { ...position.value }
      isResizing.value = true

      if (onResizeStartCallback)
        onResizeStartCallback(size.value, event)

      handleEvent(event)
    },
  })

  const applyStyles = () => {
    const el = toValue(target)
    if (!el)
      return

    // Only apply cursor styles for 'borders' type
    // For 'handles' and 'custom' types, cursor is handled by CSS
    const cursorStyle = currentHandleType.value === 'borders' && hoverHandle.value
      ? getCursorForHandle(hoverHandle.value)
      : 'default'

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

    // Apply cursor style only for 'borders' type
    if (currentHandleType.value === 'borders') {
      el.style.cursor = isResizing.value && activeHandle.value
        ? getCursorForHandle(activeHandle.value)
        : cursorStyle
      const borderStyle = toValue(handleBorderStyle)
      if (borderStyle && borderStyle !== 'none') {
        el.style.border = borderStyle
      }
      else {
        el.style.border = ''
      }
    }
    else {
      // 非 borders 类型时不设置 border
      el.style.border = ''
    }
  }

  /**
   * Handle mouse movement for resize handle detection
   * @param event - The pointer event from mouse movement
   */
  const onMouseMove = (event: PointerEvent) => {
    // For 'handles' or 'custom' type, hover is handled by CSS :hover
    // so we only need to handle 'borders' type here
    if (currentHandleType.value !== 'borders')
      return

    if (isResizing.value) {
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
    // Check if element is active when activeOn is not 'none'
    const currentActiveOn = toValue(activeOn)
    // If activeOn is 'click', set active state on resize start
    if (currentActiveOn === 'click') {
      setActive(true)
    }
    // For 'handles' or 'custom' type, resize is started by handle elements directly
    // so we only need to handle 'borders' type here
    if (currentHandleType.value !== 'borders')
      return

    if (currentActiveOn !== 'none' && !isActive.value)
      return

    const el = toValue(target)
    if (!el)
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
    size.value = {
      width: typeof constrainedSize.width === 'number' ? Math.round(constrainedSize.width) : constrainedSize.width,
      height: typeof constrainedSize.height === 'number' ? Math.round(constrainedSize.height) : constrainedSize.height,
    }
    if (isAbsolutePositioned.value) {
      position.value = {
        x: Math.round(newPosition.x),
        y: Math.round(newPosition.y),
      }
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

  // Clean up on unmount
  onUnmounted(cleanupHandles)

  // Watch for changes to handleType and target
  watch([currentHandleType, () => toValue(target), () => toValue(handles)], () => {
    const el = toValue(target)
    if (el) {
      setupHandleElements(el)
    }
  })

  // Watch for changes to the target element
  watch(
    () => toValue(target),
    (newTarget) => {
      if (newTarget) {
        // Set up new listeners
        setupElementSize()
        setupHandleElements(newTarget)
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
    size.value = {
      width: typeof newSize.width === 'number' ? Math.round(newSize.width) : newSize.width,
      height: typeof newSize.height === 'number' ? Math.round(newSize.height) : newSize.height,
    }
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
            x: Math.round(Math.max(0, Math.min(newPosition.x, maxX))),
            y: Math.round(Math.max(0, Math.min(newPosition.y, maxY))),
          }
        }
        else {
          // 如果没有边界元素,至少确保不会出现负值
          position.value = {
            x: Math.round(Math.max(0, newPosition.x)),
            y: Math.round(Math.max(0, newPosition.y)),
          }
        }
      }
      else {
        // 没有边界约束时,直接更新位置,但确保不会出现负值
        position.value = {
          x: Math.round(Math.max(0, newPosition.x)),
          y: Math.round(Math.max(0, newPosition.y)),
        }
      }
    }
    else {
      // 对于相对定位元素,直接更新位置
      position.value = {
        x: Math.round(newPosition.x),
        y: Math.round(newPosition.y),
      }
    }

    // 应用新的位置
    applyStyles()
  }

  // Handle activation based on activeOn setting
  const onPointerEnter = (_event: PointerEvent) => {
    const currentActiveOn = toValue(activeOn)

    // If activeOn is 'hover', set active state on pointer enter
    if (currentActiveOn === 'hover') {
      setActive(true)
    }
  }

  const onPointerLeave = (event: PointerEvent) => {
    const currentActiveOn = toValue(activeOn)
    const el = toValue(target)

    // If activeOn is 'hover', remove active state on pointer leave
    // But only if the pointer is not moving to a child element
    if (currentActiveOn === 'hover' && el) {
      const relatedTarget = event.relatedTarget as Node | null
      // Check if relatedTarget is a child of the current element
      if (!relatedTarget || !el.contains(relatedTarget)) {
        setActive(false)
      }
    }

    // Clear hover handle only if not moving to a child element
    if (el) {
      const relatedTarget = event.relatedTarget as Node | null
      if (!relatedTarget || !el.contains(relatedTarget)) {
        hoverHandle.value = null
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

    // Only process if activeOn is 'click' and element is active
    if (currentActiveOn === 'click' && isActive.value && el) {
      // Check if the click is outside the element
      const targetElement = event.target as Node
      if (!el.contains(targetElement)) {
        setActive(false)
      }
    }
  }

  // Set up event listeners
  useEventListener(target, 'pointermove', onMouseMove, getConfig())
  useEventListener(target, 'pointerdown', onResizeStart, getConfig())
  useEventListener(target, 'pointerenter', onPointerEnter, getConfig())
  useEventListener(target, 'pointerleave', onPointerLeave, getConfig())

  useEventListener(defaultWindow, 'pointermove', onResize, getConfig())
  useEventListener(defaultWindow, 'pointerup', onResizeEnd, getConfig())

  // Add document click listener to handle clicking outside
  const documentListener = useEventListener(document, 'pointerdown', onDocumentPointerDown, { capture: true })

  // Add cleanup for document listener to the unmount handler
  onUnmounted(() => {
    documentListener()
  })

  // Return values and methods
  return {
    size,
    position,
    isResizing,
    isActive,
    activeHandle,
    hoverHandle,
    isAbsolutePositioned,
    handleType: currentHandleType,
    handleElements,
    setSize,
    setPosition,
    setActive,
    onResizeStart,
    onResize,
    onResizeEnd,
    detectBoundary,
    registerHandle,
    unregisterHandle,
    setupHandleElements,
  }
}

export default useResizable
