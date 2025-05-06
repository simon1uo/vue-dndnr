import type { ActivationTrigger, DnROptions, PointerType, Position, ResizeHandle, Size } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@/hooks/useEventListener'
import { useResizeHandles } from '@/hooks/useResizeHandles'
import {
  applyAspectRatioLock,
  applyBounds,
  applyMinMaxConstraints,
  calculateDelta,
  calculatePosition,
  defaultWindow,
  getElementBounds,
  getElementPosition,
  getElementSize,
  isClient,
} from '@/utils'
import { throttle } from '@/utils/throttle'
import { computed, onMounted, onUnmounted, ref, shallowRef, toValue, watch } from 'vue'

/**
 * Combined hook for draggable and resizable functionality (DnR)
 * @param target - Reference to the element to make draggable and resizable
 * @param options - Combined configuration options for drag and resize behavior
 * @returns {object} Object containing combined state and methods
 */
export function useDnR(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: DnROptions) {
  const {
    // Common options
    initialPosition = { x: 0, y: 0 },
    initialSize = { width: 'auto', height: 'auto' },
    disabled = false,
    disableDrag = false,
    disableResize = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
    capture = true,
    initialActive = false,
    activeOn = 'none' as ActivationTrigger,
    preventDeactivation = false,
    throttleDelay = 16, // Default to ~60fps

    // Drag options
    handle: draggingHandle = target,
    draggingElement = defaultWindow,
    containerElement,
    grid,
    axis = 'both',
    scale = 1,

    // Resize options
    positionType = 'absolute',
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    lockAspectRatio = false,
    handleType = 'borders',
    handles = ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'],
    customHandles,
    handlesSize = 8,
    handleBorderStyle = 'none',

    // Callbacks
    onDragStart: onDragStartCallback,
    onDrag: onDragCallback,
    onDragEnd: onDragEndCallback,
    onResizeStart: onResizeStartCallback,
    onResize: onResizeCallback,
    onResizeEnd: onResizeEndCallback,
    onActiveChange,
  } = options

  // Unified state
  const interactionMode = ref<'idle' | 'dragging' | 'resizing'>('idle')
  const position = shallowRef<Position>({ ...initialPosition })
  const size = shallowRef<Size>({ ...initialSize })
  const isActive = ref(initialActive)
  const isDragging = computed(() => interactionMode.value === 'dragging')
  const isResizing = computed(() => interactionMode.value === 'resizing')
  const isNearResizeHandle = ref(false)

  // Common state for interaction operations
  const startEvent = shallowRef<PointerEvent | null>(null)
  const startPosition = shallowRef<Position>({ ...initialPosition })
  const startSize = shallowRef<Size>({ ...initialSize })
  const elementSize = shallowRef<{ width: number, height: number }>({ width: 0, height: 0 })

  // Cache frequently accessed reactive values
  const handleTypeValue = computed(() => toValue(handleType))
  const positionTypeValue = computed(() => toValue(positionType))
  const disabledValue = computed(() => toValue(disabled))
  const disableDragValue = computed(() => toValue(disableDrag) || toValue(disabled))
  const disableResizeValue = computed(() => toValue(disableResize) || toValue(disabled))
  const activeOnValue = computed(() => toValue(activeOn))
  const gridValue = computed(() => toValue(grid))
  const axisValue = computed(() => toValue(axis))
  const scaleValue = computed(() => toValue(scale))
  const containerElementValue = computed(() => toValue(containerElement))
  const lockAspectRatioValue = computed(() => toValue(lockAspectRatio))
  const preventDefaultValue = computed(() => toValue(preventDefault))
  const stopPropagationValue = computed(() => toValue(stopPropagation))

  /**
   * Set the active state and trigger callback
   * @param value - New active state
   */
  const setActive = (value: boolean) => {
    if (value === isActive.value)
      return

    // Call the callback and check if we should prevent the change
    if (onActiveChange?.(value) === false)
      return

    isActive.value = value
  }

  /**
   * Filter pointer events based on disabled state, active state, and pointer types
   * @param event - The pointer event to filter
   * @param forDrag - Whether this is for a drag operation
   * @param forResize - Whether this is for a resize operation
   * @returns True if the event should be processed, false otherwise
   */
  const filterEvent = (event: PointerEvent, forDrag = false, forResize = false): boolean => {
    // Check global disabled state
    if (disabledValue.value)
      return false

    // Check specific disabled states
    if (forDrag && disableDragValue.value)
      return false

    if (forResize && disableResizeValue.value)
      return false

    // Check if element is active when activeOn is not 'none'
    if (activeOnValue.value !== 'none' && !isActive.value)
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
    if (preventDefaultValue.value)
      event.preventDefault()
    if (stopPropagationValue.value)
      event.stopPropagation()
  }

  // Initialize resize handles
  const {
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
    handleType: disableResizeValue.value ? 'none' : handleType,
    handles,
    customHandles,
    handlesSize,
    handleBorderStyle,
    preventDefault,
    stopPropagation,
    capture,
    pointerTypes,
    disabled: computed(() => disabledValue.value || disableResizeValue.value || (activeOnValue.value !== 'none' && !isActive.value)),
    onResizeStart: (event: PointerEvent, handle: ResizeHandle) => {
      if (interactionMode.value === 'dragging')
        return

      // Check if resize is disabled
      if (disableResizeValue.value)
        return

      // Check if element is active when activeOn is not 'none'
      if (activeOnValue.value !== 'none' && !isActive.value)
        return

      // Set active state on resize start if configured
      if (activeOnValue.value === 'click') {
        setActive(true)
      }

      startEvent.value = event
      startSize.value = size.value
      startPosition.value = position.value
      interactionMode.value = 'resizing'
      activeHandle.value = handle

      if (onResizeStartCallback)
        onResizeStartCallback(size.value, event)

      handleEvent(event)
    },
  })

  // Watch for hover handle changes to detect proximity to resize handles
  watch(hoverHandle, (newHandle) => {
    isNearResizeHandle.value = newHandle !== null
  })

  /**
   * Handle the start of a drag operation
   * @param event - The pointer event that triggered the drag start
   */
  const handleDragStart = (event: PointerEvent) => {
    if (interactionMode.value === 'resizing' || isNearResizeHandle.value)
      return false

    const el = toValue(draggingHandle)
    const targetEl = toValue(target)
    if (!filterEvent(event, true, false) || !el || !targetEl)
      return false

    if (handleTypeValue.value === 'handles' || handleTypeValue.value === 'custom') {
      const target = event.target as HTMLElement
      for (const handleEl of handleElements.value.values()) {
        if (handleEl === target || handleEl.contains(target)) {
          return false
        }
      }
    }

    // Set active state on drag start if configured
    if (activeOnValue.value === 'click') {
      setActive(true)
    }

    startEvent.value = event
    startPosition.value = position.value

    if (onDragStartCallback?.(position.value, event) === false)
      return false

    interactionMode.value = 'dragging'
    elementSize.value = getElementSize(targetEl)
    handleEvent(event)
    return true
  }

  /**
   * Update element position during drag
   * @param event - The pointer event containing new position information
   */
  const updateDragPosition = (event: PointerEvent) => {
    if (interactionMode.value !== 'dragging' || !startEvent.value)
      return false

    const el = toValue(draggingHandle)
    if (!el)
      return false

    const eventPosition = calculatePosition(event, scaleValue.value)
    const startEventPosition = calculatePosition(startEvent.value, scaleValue.value)
    const delta = calculateDelta(startEventPosition, eventPosition)

    // Create a new position object - avoiding mutating the reactive state directly
    let newX = Math.round(startPosition.value.x + delta.x)
    let newY = Math.round(startPosition.value.y + delta.y)

    // Apply axis constraint
    if (axisValue.value !== 'both') {
      if (axisValue.value === 'x') {
        newY = startPosition.value.y
      }
      else if (axisValue.value === 'y') {
        newX = startPosition.value.x
      }
    }

    // Apply grid
    if (gridValue.value) {
      newX = Math.round(newX / gridValue.value[0]) * gridValue.value[0]
      newY = Math.round(newY / gridValue.value[1]) * gridValue.value[1]
    }

    // Prepare new position for bounds check
    let newPosition: Position = { x: newX, y: newY }

    // Apply bounds if container element is specified
    if (containerElementValue.value) {
      const targetEl = toValue(target)
      const containerEl = toValue(containerElementValue)

      if (containerEl && targetEl) {
        // Get the bounding rectangles of both elements
        const containerRect = getElementBounds(containerEl)
        const targetRect = getElementBounds(targetEl)

        // Calculate the size of the target element
        const elementSize = {
          width: targetRect.right - targetRect.left,
          height: targetRect.bottom - targetRect.top,
        }

        // Calculate the bounds relative to the container
        // The container's top-left corner becomes (0,0)
        const boundsRect = {
          left: 0,
          top: 0,
          right: containerRect.right - containerRect.left,
          bottom: containerRect.bottom - containerRect.top,
        }

        // Apply bounds constraints to the position
        newPosition = applyBounds(newPosition, boundsRect, elementSize)
      }
    }

    if (onDragCallback?.(position.value, event) === false)
      return false

    // Update position
    position.value = {
      x: Math.round(newPosition.x),
      y: Math.round(newPosition.y),
    }

    handleEvent(event)
    return true
  }

  // Create a throttled version of the updateDragPosition function
  const throttledUpdateDragPosition = throttle(updateDragPosition, toValue(throttleDelay))

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
    if (interactionMode.value !== 'dragging')
      return false

    interactionMode.value = 'idle'
    startEvent.value = null

    if (onDragEndCallback?.(position.value, event) === false)
      return false

    handleEvent(event)
    return true
  }

  /**
   * Handle the start of a resize operation
   * @param event - The pointer event that triggered the resize start
   */
  const handleResizeStart = (event: PointerEvent) => {
    if (interactionMode.value === 'dragging')
      return

    // For 'handles' or 'custom' type, resize is handled by the resize handles
    // so we only need to handle 'borders' type here
    if (handleTypeValue.value !== 'borders')
      return

    // Check if resize is disabled
    if (!filterEvent(event, false, true))
      return

    const el = toValue(target)
    if (!el)
      return

    const handle = detectBoundary(event, el)
    const handlesValue = toValue(handles)

    if (!handle || !handlesValue || !handlesValue.includes(handle))
      return

    // Set active state on resize start if configured
    if (activeOnValue.value === 'click') {
      setActive(true)
    }

    startEvent.value = event
    startSize.value = size.value
    startPosition.value = position.value
    interactionMode.value = 'resizing'
    activeHandle.value = handle

    if (onResizeStartCallback)
      onResizeStartCallback(size.value, event)

    handleEvent(event)
  }

  // Cache computed min/max values
  const minWidthValue = computed(() => toValue(minWidth) ?? 0)
  const minHeightValue = computed(() => toValue(minHeight) ?? 0)
  const maxWidthValue = computed(() => toValue(maxWidth) ?? Infinity)
  const maxHeightValue = computed(() => toValue(maxHeight) ?? Infinity)

  /**
   * Update element size during resize
   * @param event - The pointer event containing new size information
   */
  const updateSize = (event: PointerEvent) => {
    if (interactionMode.value !== 'resizing' || !activeHandle.value || !startEvent.value)
      return

    const el = toValue(target)
    if (!el)
      return

    const clientX = event.clientX
    const clientY = event.clientY
    const startClientX = startEvent.value.clientX
    const startClientY = startEvent.value.clientY

    const deltaX = clientX - startClientX
    const deltaY = clientY - startClientY

    // Calculate new dimensions based on resize handle and constraints
    const calculateNewDimensions = () => {
      const handle = activeHandle.value
      if (!handle)
        return { newSize: size.value, newPosition: position.value }

      // Convert string dimensions to numbers for calculations
      const currentWidth = typeof startSize.value.width === 'number'
        ? startSize.value.width
        : (el as HTMLElement).offsetWidth
      const currentHeight = typeof startSize.value.height === 'number'
        ? startSize.value.height
        : (el as HTMLElement).offsetHeight

      let newWidth = currentWidth
      let newHeight = currentHeight
      let newX = startPosition.value.x
      let newY = startPosition.value.y

      // Determine size and position changes based on handle
      if (handle.includes('r') || handle === 'right') {
        newWidth = currentWidth + deltaX
      }
      else if (handle.includes('l') || handle === 'left') {
        newWidth = currentWidth - deltaX
        newX = startPosition.value.x + deltaX
      }

      if (handle.includes('b') || handle === 'bottom') {
        newHeight = currentHeight + deltaY
      }
      else if (handle.includes('t') || handle === 'top') {
        newHeight = currentHeight - deltaY
        newY = startPosition.value.y + deltaY
      }

      // Create the new size and position objects
      let newSize: Size = {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      }

      const newPosition: Position = {
        x: Math.round(newX),
        y: Math.round(newY),
      }

      // Apply aspect ratio lock if enabled
      if (lockAspectRatioValue.value) {
        newSize = applyAspectRatioLock(
          newSize,
          {
            width: currentWidth,
            height: currentHeight,
          },
          true,
        )
      }

      // Apply min/max constraints
      newSize = applyMinMaxConstraints(
        newSize,
        minWidthValue.value,
        minHeightValue.value,
        maxWidthValue.value,
        maxHeightValue.value,
      )

      // Apply grid constraints
      if (gridValue.value) {
        if (typeof newSize.width === 'number') {
          newSize.width = Math.round(newSize.width / gridValue.value[0]) * gridValue.value[0]
        }
        if (typeof newSize.height === 'number') {
          newSize.height = Math.round(newSize.height / gridValue.value[1]) * gridValue.value[1]
        }
        newPosition.x = Math.round(newPosition.x / gridValue.value[0]) * gridValue.value[0]
        newPosition.y = Math.round(newPosition.y / gridValue.value[1]) * gridValue.value[1]
      }

      // If position needs to be adjusted for size constraints
      if (positionTypeValue.value === 'absolute') {
        // If width changed and left handle was used
        if (typeof newSize.width === 'number' && (handle.includes('l') || handle === 'left')) {
          newPosition.x = startPosition.value.x + (currentWidth - newSize.width)
        }

        // If height changed and top handle was used
        if (typeof newSize.height === 'number' && (handle.includes('t') || handle === 'top')) {
          newPosition.y = startPosition.value.y + (currentHeight - newSize.height)
        }
      }

      return { newSize, newPosition }
    }

    const { newSize, newPosition } = calculateNewDimensions()

    // Check bounds if container element is specified and using absolute positioning
    if (containerElementValue.value && positionTypeValue.value === 'absolute') {
      const containerEl = containerElementValue.value

      // Apply bounds to position if a container element is found
      if (containerEl) {
        // Calculate the element's dimensions based on the new size
        const elementWidth = typeof newSize.width === 'number' ? newSize.width : (el as HTMLElement).offsetWidth
        const elementHeight = typeof newSize.height === 'number' ? newSize.height : (el as HTMLElement).offsetHeight
        const elementSize = { width: elementWidth, height: elementHeight }

        // Get the container's bounding rectangle
        const containerRect = getElementBounds(containerEl)

        // Calculate the bounds relative to the container
        // The container's top-left corner becomes (0,0)
        const boundsRect = {
          left: 0,
          top: 0,
          right: containerRect.right - containerRect.left,
          bottom: containerRect.bottom - containerRect.top,
        }

        // Apply bounds constraints to the position
        const adjustedPosition = applyBounds(newPosition, boundsRect, elementSize)

        // Only adjust position, not size
        // This allows the element to resize freely but keeps it within the container
        newPosition.x = adjustedPosition.x
        newPosition.y = adjustedPosition.y
      }
    }

    // Trigger the callback and abort if it returns false
    if (onResizeCallback) {
      // Call the callback but don't directly compare its return value
      // as it could be void which causes a linter error
      const result = onResizeCallback(newSize, event)
      // Only check if it's explicitly false
      if (result === false as any)
        return
    }

    // Update the state
    size.value = newSize
    if (positionTypeValue.value === 'absolute') {
      position.value = newPosition
    }

    handleEvent(event)
  }

  // Create a throttled version of the updateSize function
  const throttledUpdateSize = throttle(updateSize, toValue(throttleDelay))

  /**
   * Handle resize movement with throttling
   * @param event - The pointer event from resize movement
   */
  const handleResize = (event: PointerEvent) => {
    throttledUpdateSize(event)
  }

  /**
   * Handle the end of a resize operation
   * @param event - The pointer event that triggered the resize end
   */
  const handleResizeEnd = (event: PointerEvent) => {
    if (interactionMode.value !== 'resizing')
      return

    interactionMode.value = 'idle'
    activeHandle.value = null
    startEvent.value = null

    onResizeEndCallback?.(size.value, event)
    handleEvent(event)
  }

  /**
   * Get event listener configuration based on current options
   */
  const getConfig = computed(() => ({
    capture: toValue(capture),
    passive: !preventDefaultValue.value,
  }))

  // Handle pointer events
  const onPointerDown = (event: PointerEvent) => {
    // Check if element is active when activeOn is not 'none'
    // If in click mode, set active on pointer down regardless of interaction
    if (activeOnValue.value === 'click') {
      setActive(true)
    }

    // Handle resize first (if not disabled)
    if (!disableResizeValue.value && handleTypeValue.value === 'borders') {
      handleResizeStart(event)
    }

    // Handle drag if not already resizing and not disabled
    if (!disableDragValue.value && interactionMode.value !== 'resizing') {
      handleDragStart(event)
    }
  }

  // Using computed to combine position and size into a style object
  const style = computed(() => {
    // Base styles
    const baseStyle: Record<string, string> = {
      position: positionTypeValue.value,
      userSelect: 'none',
      width: typeof size.value.width === 'number' ? `${size.value.width}px` : size.value.width,
      height: typeof size.value.height === 'number' ? `${size.value.height}px` : size.value.height,
      touchAction: 'none',
    }

    // Position styles
    if (positionTypeValue.value === 'absolute') {
      baseStyle.left = `${position.value.x}px`
      baseStyle.top = `${position.value.y}px`
    }

    // Add cursor styles for resize handles only if resize is not disabled
    if (handleTypeValue.value === 'borders' && !disableResizeValue.value) {
      if (interactionMode.value === 'resizing' && activeHandle.value) {
        baseStyle.cursor = getCursorForHandle(activeHandle.value)
      }
      else if (hoverHandle.value) {
        baseStyle.cursor = getCursorForHandle(hoverHandle.value)
      }
      else {
        baseStyle.cursor = 'default'
      }

      // Add border style if specified
      const borderStyle = toValue(handleBorderStyle)
      if (borderStyle && borderStyle !== 'none') {
        baseStyle.border = borderStyle
      }
    }

    // Add cursor style for dragging if resize is disabled but drag is enabled
    if (disableResizeValue.value && !disableDragValue.value) {
      if (interactionMode.value === 'dragging') {
        baseStyle.cursor = 'grabbing'
      }
      else {
        baseStyle.cursor = 'grab'
      }
    }

    return baseStyle
  })

  // Handle mouse movement for resize handle detection
  const onMouseMove = (event: PointerEvent) => {
    if (interactionMode.value !== 'idle') {
      // During dragging, do nothing about hover detection
      if (interactionMode.value === 'dragging') {
        handleDrag(event)
        return
      }

      // During resizing, update the size based on movement
      if (interactionMode.value === 'resizing') {
        handleResize(event)
        return
      }
    }

    // Skip resize handle detection if resize is disabled or handle type is not borders
    if (disableResizeValue.value || handleTypeValue.value !== 'borders')
      return

    const el = toValue(target)
    if (!el) {
      return
    }

    // Detect if mouse is near a resize handle
    const detectedHandle = detectBoundary(event, el)
    if (detectedHandle !== hoverHandle.value) {
      hoverHandle.value = detectedHandle
    }
  }

  // Handle pointer up to end any active interaction
  const onPointerUp = (event: PointerEvent) => {
    if (interactionMode.value === 'dragging') {
      handleDragEnd(event)
    }
    else if (interactionMode.value === 'resizing') {
      handleResizeEnd(event)
    }
  }

  // Handle activation based on activeOn setting
  const onPointerEnter = (_event: PointerEvent) => {
    if (activeOnValue.value === 'hover') {
      setActive(true)
    }
  }

  const onPointerLeave = (_event: PointerEvent) => {
    if (activeOnValue.value === 'hover' && !preventDeactivation) {
      setActive(false)
    }

    // Clear hover handle when mouse leaves
    if (hoverHandle.value) {
      hoverHandle.value = null
    }
  }

  // Handle clicks outside the element
  const onDocumentPointerDown = (event: PointerEvent) => {
    if (activeOnValue.value === 'click' && isActive.value && !preventDeactivation) {
      // Check if the click was outside the element
      const el = toValue(target)
      if (!el?.contains(event.target as Node)) {
        setActive(false)
      }
    }
  }

  /**
   * Function to programmatically set position
   * @param newPosition - The new position to set
   */
  const setPosition = (newPosition: Position) => {
    position.value = newPosition
  }

  /**
   * Function to programmatically set size
   * @param newSize - The new size to set
   */
  const setSize = (newSize: Size) => {
    size.value = newSize
  }

  // Setup element size on mount
  const setupElementSize = () => {
    const el = toValue(target)
    if (!el)
      return

    // Setup initial size if 'auto'
    if (size.value.width === 'auto' || size.value.height === 'auto') {
      const { width, height } = getElementSize(el)
      const newSize: Size = {
        width: size.value.width === 'auto' ? width : size.value.width,
        height: size.value.height === 'auto' ? height : size.value.height,
      }
      size.value = newSize
    }

    // Setup initial position for absolute positioning
    if (positionTypeValue.value === 'absolute'
      && (position.value.x === 0 && position.value.y === 0)) {
      position.value = getElementPosition(el)
    }

    // Setup handles if needed
    if (handleTypeValue.value === 'handles' || handleTypeValue.value === 'custom') {
      setupHandleElements(el)
    }
  }

  // Setup event listeners
  if (isClient) {
    onMounted(() => {
      const el = toValue(target)
      if (el) {
        setupElementSize()
      }
    })

    // Add event listeners to the target element
    useEventListener(target, 'pointerdown', onPointerDown, getConfig.value)
    useEventListener(target, 'pointerenter', onPointerEnter, getConfig.value)
    useEventListener(target, 'pointerleave', onPointerLeave, getConfig.value)
    useEventListener(target, 'pointermove', onMouseMove, getConfig.value)

    // Add document-level event listeners for pointer events
    const draggingElementValue = toValue(draggingElement) || defaultWindow
    if (draggingElementValue) {
      useEventListener(draggingElementValue, 'pointermove', onMouseMove, getConfig.value)
      useEventListener(draggingElementValue, 'pointerup', onPointerUp, getConfig.value)
      useEventListener(draggingElementValue, 'pointercancel', onPointerUp, getConfig.value)
      useEventListener(draggingElementValue, 'pointerdown', onDocumentPointerDown, getConfig.value)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cleanupHandles()
  })

  return {
    position,
    size,
    isDragging,
    isResizing,
    isActive,
    interactionMode,
    activeHandle,
    hoverHandle,
    style,
    setPosition,
    setSize,
    setActive,
    detectBoundary,
    registerHandle,
    unregisterHandle,
    setupHandleElements,
  }
}

export default useDnR
