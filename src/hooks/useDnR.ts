import type { ActivationTrigger, DnROptions, PointerType, Position, ResizeHandle, Size } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
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
import { tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, onMounted, ref, shallowRef, toValue, watch } from 'vue'

// Define style constants for consistency
const BASE_STYLES = {
  userSelect: 'none',
  touchAction: 'none',
  boxSizing: 'border-box',
}

// Cursor styles
const CURSOR_STYLES = {
  dragging: 'grabbing',
  draggable: 'grab',
}

// Handle visibility
const HANDLE_VISIBILITY = {
  visible: '',
  hidden: 'none',
}

// Default state styles
const DEFAULT_STATE_STYLES = {
  // Active state
  active: {
    outline: '1px solid #aaaaaa',
  },
  // Dragging state
  dragging: {
    opacity: '0.8',
    cursor: 'grabbing',
  },
  // Resizing state
  resizing: {
    opacity: '0.8',
  },
  // Hover state (for resize handles)
  hover: {
    cursor: 'auto', // Will be overridden by specific handle cursor
  },
}

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
    initialActive = false,
    disabled = false,
    disableDrag = false,
    disableResize = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
    capture = true,
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
    zIndex = 'auto',

    // Custom styles
    stateStyles = {},
    handleStyles = {},

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
  const isActive = ref(activeOn === 'none' ? true : initialActive)
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
  const zIndexValue = computed(() => toValue(zIndex))
  const preventDefaultValue = computed(() => toValue(preventDefault))
  const stopPropagationValue = computed(() => toValue(stopPropagation))
  const preventDeactivationValue = computed(() => toValue(preventDeactivation))
  const throttleDelayValue = computed(() => toValue(throttleDelay))
  const pointerTypesValue = computed(() => toValue(pointerTypes))
  const stateStylesValue = computed(() => toValue(stateStyles))

  // Merge default state styles with user-provided styles
  const mergedStateStyles = computed(() => {
    const userStyles = stateStylesValue.value
    return {
      active: { ...DEFAULT_STATE_STYLES.active, ...(userStyles?.active || {}) },
      dragging: { ...DEFAULT_STATE_STYLES.dragging, ...(userStyles?.dragging || {}) },
      resizing: { ...DEFAULT_STATE_STYLES.resizing, ...(userStyles?.resizing || {}) },
      hover: { ...DEFAULT_STATE_STYLES.hover, ...(userStyles?.hover || {}) },
    }
  })

  /**
   * Set the active state and trigger callback
   * @param value - New active state
   */
  const setActive = (value: boolean) => {
    // When activeOn is 'none', the element should always be active
    if (activeOnValue.value === 'none') {
      isActive.value = true
      return
    }

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
    resetActiveHandle,
  } = useResizeHandles(target, {
    handleType: disableResizeValue.value ? 'none' : handleType,
    handles,
    customHandles,
    handlesSize,
    handleStyles,
    preventDefault,
    stopPropagation,
    capture,
    pointerTypes: pointerTypesValue,
    disabled: computed(() => {
      if (disabledValue.value || disableResizeValue.value) {
        return true
      }
      if (activeOnValue.value === 'none') {
        return false
      }
      return !isActive.value
    }),
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

  // Watch for active state changes to update handle visibility and cursor styles
  watch(isActive, (newActive) => {
    // Ensure active state is always true when activeOn is 'none'
    if (activeOnValue.value === 'none' && !newActive) {
      return
    }

    const el = toValue(target)
    if (!el)
      return

    if (newActive) {
      // For 'handles' or 'custom' type, we need to recreate or update the handles
      if (handleTypeValue.value === 'handles' || handleTypeValue.value === 'custom') {
        setupHandleElements(el)

        // For custom handles, make sure they're visible when active
        if (handleTypeValue.value === 'custom') {
          const customHandlesValue = toValue(customHandles)
          if (customHandlesValue && customHandlesValue.size > 0) {
            customHandlesValue.forEach((handleEl) => {
              // Show the custom handle when active
              if (handleEl.style) {
                handleEl.style.display = HANDLE_VISIBILITY.visible
              }
            })
          }
        }
      }
    }
    else {
      // When deactivating, make sure to clean up all handles
      cleanupHandles()

      // For custom handles, we need to make sure they're hidden
      if (handleTypeValue.value === 'custom') {
        const customHandlesValue = toValue(customHandles)
        if (customHandlesValue && customHandlesValue.size > 0) {
          customHandlesValue.forEach((handleEl) => {
            // Hide the custom handle when inactive
            if (handleEl.style) {
              handleEl.style.display = HANDLE_VISIBILITY.hidden
            }
          })
        }
      }
    }
  })

  // Watch for activeOn changes to update active state and handle elements
  watch(activeOnValue, (newActiveOn) => {
    // When activeOn changes to 'none', ensure active state is true
    if (newActiveOn === 'none' && !isActive.value) {
      isActive.value = true
    }

    const el = toValue(target)
    if (el && (handleTypeValue.value === 'handles' || handleTypeValue.value === 'custom')) {
      setupHandleElements(el)
    }
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
  const throttledUpdateDragPosition = throttle(updateDragPosition, throttleDelayValue.value) as unknown as
    (((...args: Parameters<typeof updateDragPosition>) => ReturnType<typeof updateDragPosition> | void) & { cancel: () => void })

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

      // Get container bounds if specified
      let boundsRect: { left: number, top: number, right: number, bottom: number } | null = null
      if (containerElementValue.value && positionTypeValue.value === 'absolute') {
        const containerEl = containerElementValue.value
        if (containerEl) {
          const containerRect = getElementBounds(containerEl)
          boundsRect = {
            left: 0,
            top: 0,
            right: containerRect.right - containerRect.left,
            bottom: containerRect.bottom - containerRect.top,
          }
        }
      }

      // Determine size and position changes based on handle
      if (handle.includes('r') || handle === 'right') {
        newWidth = currentWidth + deltaX
        // Apply container bounds constraint for right handle
        if (boundsRect && newX + newWidth > boundsRect.right) {
          newWidth = boundsRect.right - newX
        }
      }
      else if (handle.includes('l') || handle === 'left') {
        const proposedX = startPosition.value.x + deltaX
        const proposedWidth = currentWidth - deltaX

        // Apply container bounds constraint for left handle
        if (boundsRect) {
          // Don't allow moving beyond left boundary
          if (proposedX < boundsRect.left) {
            const constrainedX = boundsRect.left
            const constrainedDeltaX = constrainedX - startPosition.value.x
            newWidth = currentWidth - constrainedDeltaX
            newX = constrainedX
          }
          else {
            newWidth = proposedWidth
            newX = proposedX
          }
        }
        else {
          newWidth = proposedWidth
          newX = proposedX
        }
      }

      if (handle.includes('b') || handle === 'bottom') {
        newHeight = currentHeight + deltaY
        // Apply container bounds constraint for bottom handle
        if (boundsRect && newY + newHeight > boundsRect.bottom) {
          newHeight = boundsRect.bottom - newY
        }
      }
      else if (handle.includes('t') || handle === 'top') {
        const proposedY = startPosition.value.y + deltaY
        const proposedHeight = currentHeight - deltaY

        // Apply container bounds constraint for top handle
        if (boundsRect) {
          // Don't allow moving beyond top boundary
          if (proposedY < boundsRect.top) {
            const constrainedY = boundsRect.top
            const constrainedDeltaY = constrainedY - startPosition.value.y
            newHeight = currentHeight - constrainedDeltaY
            newY = constrainedY
          }
          else {
            newHeight = proposedHeight
            newY = proposedY
          }
        }
        else {
          newHeight = proposedHeight
          newY = proposedY
        }
      }

      // Create the new size and position objects
      let newSize: Size = {
        width: Math.max(0, Math.round(newWidth)),
        height: Math.max(0, Math.round(newHeight)),
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

        // Re-apply container bounds after aspect ratio lock
        if (boundsRect && positionTypeValue.value === 'absolute') {
          const aspectWidth = typeof newSize.width === 'number' ? newSize.width : currentWidth
          const aspectHeight = typeof newSize.height === 'number' ? newSize.height : currentHeight

          // Check if the element exceeds the right boundary
          if (newPosition.x + aspectWidth > boundsRect.right) {
            if (handle.includes('r') || handle === 'right') {
              // Adjust width if right handle is active
              newSize.width = boundsRect.right - newPosition.x
              // Recalculate height to maintain aspect ratio
              if (typeof newSize.width === 'number') {
                newSize.height = newSize.width / (currentWidth / currentHeight)
              }
            }
          }

          // Check if the element exceeds the bottom boundary
          if (newPosition.y + aspectHeight > boundsRect.bottom) {
            if (handle.includes('b') || handle === 'bottom') {
              // Adjust height if bottom handle is active
              newSize.height = boundsRect.bottom - newPosition.y
              // Recalculate width to maintain aspect ratio
              if (typeof newSize.height === 'number') {
                newSize.width = newSize.height * (currentWidth / currentHeight)
              }
            }
          }
        }
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

        // Final bounds check to ensure element stays within container
        if (boundsRect) {
          const finalWidth = typeof newSize.width === 'number' ? newSize.width : currentWidth
          const finalHeight = typeof newSize.height === 'number' ? newSize.height : currentHeight

          // Ensure element doesn't exceed right boundary
          if (newPosition.x + finalWidth > boundsRect.right) {
            if (handle.includes('r') || handle === 'right') {
              // Adjust width if right handle is active
              if (typeof newSize.width === 'number') {
                newSize.width = boundsRect.right - newPosition.x
              }
            }
            else if (handle.includes('l') || handle === 'left') {
              // Adjust position if left handle is active
              newPosition.x = boundsRect.right - finalWidth
            }
          }

          // Ensure element doesn't exceed bottom boundary
          if (newPosition.y + finalHeight > boundsRect.bottom) {
            if (handle.includes('b') || handle === 'bottom') {
              // Adjust height if bottom handle is active
              if (typeof newSize.height === 'number') {
                newSize.height = boundsRect.bottom - newPosition.y
              }
            }
            else if (handle.includes('t') || handle === 'top') {
              // Adjust position if top handle is active
              newPosition.y = boundsRect.bottom - finalHeight
            }
          }

          // Ensure element doesn't exceed left boundary
          if (newPosition.x < boundsRect.left) {
            newPosition.x = boundsRect.left
            // Adjust width if left handle is active
            if ((handle.includes('l') || handle === 'left') && typeof newSize.width === 'number') {
              newSize.width = startPosition.value.x + currentWidth - boundsRect.left
            }
          }

          // Ensure element doesn't exceed top boundary
          if (newPosition.y < boundsRect.top) {
            newPosition.y = boundsRect.top
            // Adjust height if top handle is active
            if ((handle.includes('t') || handle === 'top') && typeof newSize.height === 'number') {
              newSize.height = startPosition.value.y + currentHeight - boundsRect.top
            }
          }
        }
      }

      return { newSize, newPosition }
    }

    const { newSize, newPosition } = calculateNewDimensions()

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
  const throttledUpdateSize = throttle(updateSize, throttleDelayValue.value) as unknown as
    (((...args: Parameters<typeof updateSize>) => ReturnType<typeof updateSize> | void) & { cancel: () => void })

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

    // Reset the active handle styles to default
    resetActiveHandle()

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

  /**
   * Compute the element style based on current state
   */
  const style = computed(() => {
    // Start with base styles
    const computedStyle: Record<string, string> = {
      position: positionTypeValue.value,
      zIndex: String(zIndexValue.value),
      ...BASE_STYLES,
      ...size.value
        ? {
            width: typeof size.value.width === 'number' ? `${size.value.width}px` : size.value.width,
            height: typeof size.value.height === 'number' ? `${size.value.height}px` : size.value.height,
          }
        : {},
    }

    // Add position styles for absolute positioning
    if (positionTypeValue.value === 'absolute' && position.value) {
      computedStyle.left = `${position.value.x}px`
      computedStyle.top = `${position.value.y}px`
    }

    // Apply state styles in order of priority (from lowest to highest)
    // 1. Active state (lowest priority)
    if (isActive.value) {
      Object.assign(computedStyle, mergedStateStyles.value.active)
    }
    // 2. Resizing state (medium priority)
    if (isResizing.value) {
      Object.assign(computedStyle, mergedStateStyles.value.resizing)
      // Increase z-index during resizing if not explicitly set to 'auto'
      if (zIndexValue.value === 'auto') {
        computedStyle.zIndex = '1'
      }
      // Add cursor style for active resize handle
      if (activeHandle.value) {
        computedStyle.cursor = getCursorForHandle(activeHandle.value)
      }
    }
    // 3. Dragging state (highest priority)
    if (isDragging.value) {
      Object.assign(computedStyle, mergedStateStyles.value.dragging)
      // Increase z-index during dragging if not explicitly set to 'auto'
      if (zIndexValue.value === 'auto') {
        computedStyle.zIndex = '1'
      }
    }
    // Handle cursor styles for different interaction modes
    if (!isDragging.value && !isResizing.value) {
      // Cursor for resize handles when hovering
      if (handleTypeValue.value === 'borders' && !disableResizeValue.value
        && (activeOnValue.value === 'none' || isActive.value)) {
        if (hoverHandle.value) {
          // Show resize cursor when hovering over a handle
          computedStyle.cursor = getCursorForHandle(hoverHandle.value)
        }

        // Add border style from state styles if available
        if (stateStylesValue.value?.active?.border) {
          computedStyle.border = String(stateStylesValue.value.active.border)
        }
      }

      // Default cursor for draggable elements
      if (!disableDragValue.value) {
        if (!computedStyle.cursor || computedStyle.cursor === 'auto') {
          computedStyle.cursor = CURSOR_STYLES.draggable
        }
      }
    }

    return computedStyle
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

    // Skip resize handle detection if resize is disabled, handle type is not borders, or element is not active
    if (disableResizeValue.value || handleTypeValue.value !== 'borders' || (activeOnValue.value !== 'none' && !isActive.value))
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

  const onPointerLeave = (event: PointerEvent) => {
    // Check if the pointer is moving to a child element
    const el = toValue(target)
    const relatedTarget = event.relatedTarget as Node | null

    // Only deactivate if the pointer is truly leaving the element and its children
    // and not just moving to a child element
    if (activeOnValue.value === 'hover' && !preventDeactivationValue.value) {
      // Only set active to false if the pointer is not moving to a child element
      if (el && relatedTarget && !el.contains(relatedTarget)) {
        setActive(false)
      }
    }

    // Clear hover handle when mouse leaves
    if (hoverHandle.value) {
      hoverHandle.value = null
    }
  }

  // Handle clicks outside the element
  const onDocumentPointerDown = (event: PointerEvent) => {
    // Only deactivate on click mode and when deactivation is not prevented
    // Never deactivate when activeOn is 'none'
    if (activeOnValue.value === 'click' && isActive.value && !preventDeactivationValue.value) {
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
        // Initial setup of handle elements if needed (e.g., if active from start)
        if ((handleTypeValue.value === 'handles' || handleTypeValue.value === 'custom') && (activeOnValue.value === 'none' || isActive.value)) {
          setupHandleElements(el)
        }
      }
    })

    // Add event listeners to the target element
    // Use useEventListener for automatic cleanup
    useEventListener(target, 'pointerdown', onPointerDown, getConfig.value)
    useEventListener(target, 'pointerenter', onPointerEnter, getConfig.value)
    useEventListener(target, 'pointerleave', onPointerLeave, getConfig.value)
    // mousemove on target is primarily for hover effects on handles or border detection
    useEventListener(target, 'mousemove', onMouseMove, getConfig.value)

    // Add document-level event listeners for pointer events during interaction
    // These are dynamically added/removed or managed by useEventListener with changing refs
    const draggingElementValue = computed(() => toValue(draggingElement) || defaultWindow)

    useEventListener(draggingElementValue, 'pointermove', onMouseMove, getConfig.value)
    useEventListener(draggingElementValue, 'pointerup', onPointerUp, getConfig.value)
    useEventListener(draggingElementValue, 'pointercancel', onPointerUp, getConfig.value) // Treat cancel as up
    useEventListener(defaultWindow?.document, 'pointerdown', onDocumentPointerDown, getConfig.value) // For deactivation
  }

  // Cleanup on unmount
  tryOnUnmounted(() => {
    cleanupHandles() // Cleanup for resize handles from useResizeHandles
    throttledUpdateDragPosition.cancel() // Cancel any pending throttled drag updates
    throttledUpdateSize.cancel() // Cancel any pending throttled resize updates

    // Reset state refs
    interactionMode.value = 'idle'
    startEvent.value = null
    // activeHandle is managed by useResizeHandles, cleanupHandles should cover it.
    // hoverHandle is also managed by useResizeHandles.

    // Reset styles on the target element
    const el = toValue(target)
    if (el) {
      // Remove all known state styles
      const stylesToRemove = [
        mergedStateStyles.value.active,
        mergedStateStyles.value.dragging,
        mergedStateStyles.value.resizing,
        mergedStateStyles.value.hover, // Hover styles are typically managed by CSS pseudo-classes or dynamic onPointerEnter/Leave
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
      // Re-apply base styles if they were part of the initial setup or options (if any)
      Object.keys(BASE_STYLES).forEach((key) => {
        try {
          (el as HTMLElement).style[key as any] = ''
        }
        catch { }
      })
    }
  })

  watch(handleTypeValue, (newHandleType) => {
    if ((newHandleType === 'handles' || newHandleType === 'custom') && (activeOnValue.value === 'none' || isActive.value)) {
      const el = toValue(target)
      if (el) {
        setupHandleElements(el)
      }
    }
    else {
      cleanupHandles()
    }
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
