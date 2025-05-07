import type { PointerType, ResizeHandle, ResizeHandlesOptions } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { getCursorStyle } from '@/utils/cursor'
import { computed, onUnmounted, shallowRef, toValue } from 'vue'

/**
 * Hook that manages resize handles
 * @param target - Reference to the element to make resizable
 * @param options - Configuration options for resize handles
 * @returns Object containing resize handles state and methods
 */
export function useResizeHandles(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
  options: ResizeHandlesOptions = {},
) {
  const {
    handleType = 'borders',
    handles = ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'],
    customHandles,
    handlesSize = 8,
    handleBorderStyle = 'none',
    preventDefault = true,
    stopPropagation = false,
    capture = true,
    pointerTypes = ['mouse', 'touch', 'pen'],
    disabled = false,
    onResizeStart,
  } = options

  const currentHandleType = computed(() => toValue(handleType))
  const handlesSizeValue = computed(() => toValue(handlesSize))
  const handlesValue = computed(() => toValue(handles))
  const handleBorderStyleValue = computed(() => toValue(handleBorderStyle))
  const disabledValue = computed(() => toValue(disabled))
  const pointerTypesValue = computed(() => toValue(pointerTypes))
  const preventDefaultValue = computed(() => toValue(preventDefault))
  const stopPropagationValue = computed(() => toValue(stopPropagation))
  const captureValue = computed(() => toValue(capture))

  const activeHandle = shallowRef<ResizeHandle | null>(null)
  const hoverHandle = shallowRef<ResizeHandle | null>(null)
  const handleElements = shallowRef<Map<ResizeHandle, HTMLElement>>(new Map())
  const createdHandleElements = shallowRef<HTMLElement[]>([])

  const handleEventListeners = new Map<ResizeHandle, (e: PointerEvent) => void>()

  /**
   * Get the appropriate cursor style for a resize handle
   * @param handle - The resize handle position
   * @returns The CSS cursor style for the handle
   */
  const getCursorForHandle = (handle: ResizeHandle): string => {
    return getCursorStyle(handle)
  }

  /**
   * Filter event based on pointer type and disabled state
   * @param event - The pointer event to filter
   * @returns Whether the event should be processed
   */
  const filterEvent = (event: PointerEvent): boolean => {
    if (disabledValue.value)
      return false

    const types = pointerTypesValue.value
    if (types)
      return types.includes(event.pointerType as PointerType)

    return true
  }

  /**
   * Handle event by preventing default and stopping propagation if configured
   * @param event - The pointer event to handle
   */
  const handleEvent = (event: PointerEvent) => {
    if (preventDefaultValue.value)
      event.preventDefault()
    if (stopPropagationValue.value)
      event.stopPropagation()
  }

  /**
   * Get event listener configuration based on current options
   * @returns Event listener options object
   */
  const getEventConfig = computed(() => ({
    capture: captureValue.value,
    passive: !preventDefaultValue.value,
  }))

  /**
   * Calculate handle positions based on the handle type
   * @param handle - The handle position
   * @returns The position CSS styles for the handle
   */
  const getHandlePositionStyles = (handle: ResizeHandle): Record<string, string> => {
    const offset = -handlesSizeValue.value / 2
    const styles: Record<string, string> = {}

    switch (handle) {
      case 'tl':
      case 'top-left':
        styles.top = `${offset}px`
        styles.left = `${offset}px`
        break
      case 'tr':
      case 'top-right':
        styles.top = `${offset}px`
        styles.right = `${offset}px`
        break
      case 'bl':
      case 'bottom-left':
        styles.bottom = `${offset}px`
        styles.left = `${offset}px`
        break
      case 'br':
      case 'bottom-right':
        styles.bottom = `${offset}px`
        styles.right = `${offset}px`
        break
      case 't':
      case 'top':
        styles.left = `calc(50% + ${offset}px)`
        styles.top = `${offset}px`
        break
      case 'b':
      case 'bottom':
        styles.left = `calc(50% + ${offset}px)`
        styles.bottom = `${offset}px`
        break
      case 'l':
      case 'left':
        styles.top = `calc(50% + ${offset}px)`
        styles.left = `${offset}px`
        break
      case 'r':
      case 'right':
        styles.top = `calc(50% + ${offset}px)`
        styles.right = `${offset}px`
        break
    }

    return styles
  }

  /**
   * Get base styles for handle elements
   * @param isCustom - Whether this is a custom handle
   * @returns The base CSS styles for the handle
   */
  const getHandleBaseStyles = (isCustom = false): Record<string, string> => {
    const size = `${handlesSizeValue.value}px`
    const borderStyle = handleBorderStyleValue.value !== 'none'
      ? handleBorderStyleValue.value
      : (isCustom ? '1px solid rgba(43, 108, 176, 0.6)' : '1px solid #2b6cb0')

    return {
      position: 'absolute',
      zIndex: '10',
      width: size,
      height: size,
      borderRadius: '50%',
      boxSizing: 'border-box',
      transition: 'transform 0.15s ease, background-color 0.15s ease',
      backgroundColor: isCustom ? 'rgba(66, 153, 225, 0.6)' : '#4299e1',
      border: borderStyle,
    }
  }

  /**
   * Create a handle element
   * @param handle - The handle position
   * @param isCustom - Whether this is a custom handle
   * @returns The created handle element
   */
  const createHandleElement = (handle: ResizeHandle, isCustom = false): HTMLElement => {
    const el = document.createElement('div')
    el.className = `resize-handle resize-handle-${handle}`
    if (isCustom) {
      el.classList.add('resize-handle-custom')
    }
    el.dataset.handle = handle

    // Apply base styles
    const baseStyles = getHandleBaseStyles(isCustom)
    Object.entries(baseStyles).forEach(([prop, value]) => {
      el.style[prop as any] = value
    })

    // Apply cursor style
    el.style.cursor = getCursorForHandle(handle)

    // Apply position styles
    const positionStyles = getHandlePositionStyles(handle)
    Object.entries(positionStyles).forEach(([prop, value]) => {
      el.style[prop as any] = value
    })

    return el
  }

  /**
   * Apply styles to a handle element based on its position
   * @param handleEl - The handle element to style
   * @param handle - The handle position
   * @param isCustom - Whether this is a custom handle
   */
  const applyHandleStyles = (handleEl: HTMLElement, handle: ResizeHandle, isCustom = false) => {
    // Apply base styles
    const baseStyles = getHandleBaseStyles(isCustom)
    Object.entries(baseStyles).forEach(([prop, value]) => {
      handleEl.style[prop as any] = value
    })

    // Apply cursor style
    handleEl.style.cursor = getCursorForHandle(handle)

    // Apply position styles
    const positionStyles = getHandlePositionStyles(handle)
    Object.entries(positionStyles).forEach(([prop, value]) => {
      handleEl.style[prop as any] = value
    })

    // Add hover event listeners
    handleEl.addEventListener('mouseenter', () => {
      hoverHandle.value = handle

      if (!isCustom) {
        handleEl.style.backgroundColor = '#3182ce'
        handleEl.style.transform = 'scale(1.1)'
      }
    })

    handleEl.addEventListener('mouseleave', () => {
      if (activeHandle.value !== handle) {
        if (!isCustom) {
          handleEl.style.backgroundColor = '#4299e1'
          handleEl.style.transform = ''
        }
      }

      if (hoverHandle.value === handle) {
        hoverHandle.value = null
      }
    })
  }

  /**
   * Handle pointerdown event on a specific resize handle
   * @param event - The pointer event
   * @param handle - The handle that was clicked
   */
  const onHandlePointerDown = (event: PointerEvent, handle: ResizeHandle) => {
    if (!filterEvent(event))
      return

    const el = toValue(target)
    if (!el)
      return

    if (!handlesValue.value.includes(handle))
      return

    // Set the active handle
    activeHandle.value = handle

    // Call the onResizeStart callback if provided
    if (onResizeStart) {
      onResizeStart(event, handle)
    }

    handleEvent(event)
  }

  /**
   * Unregister a handle element
   * @param handle - The handle position to unregister
   */
  const unregisterHandle = (handle: ResizeHandle) => {
    const element = handleElements.value.get(handle)
    const eventListener = handleEventListeners.get(handle)

    if (element && eventListener) {
      // Remove event listener
      element.removeEventListener('pointerdown', eventListener, getEventConfig.value)

      // Remove from maps
      handleElements.value.delete(handle)
      handleEventListeners.delete(handle)

      // Remove element from DOM if it's one we created
      if (createdHandleElements.value.includes(element)) {
        element.parentNode?.removeChild(element)
        createdHandleElements.value = createdHandleElements.value.filter(el => el !== element)
      }
    }
  }

  /**
   * Register a handle element for 'handles' or 'custom' mode
   * @param handle - The handle position
   * @param element - The handle element
   */
  const registerHandle = (handle: ResizeHandle, element: HTMLElement) => {
    // Remove any existing event listeners before adding new ones
    unregisterHandle(handle)

    // Create a new event handler for this handle
    const handleEventListener = (e: PointerEvent) => onHandlePointerDown(e, handle)

    // Store the event listener for later removal
    handleEventListeners.set(handle, handleEventListener)

    // Add the element to the map
    handleElements.value.set(handle, element)

    // Add pointerdown event listener to the handle element
    element.addEventListener('pointerdown', handleEventListener, getEventConfig.value)
  }

  /**
   * Clean up event listeners and remove created elements
   */
  const cleanup = () => {
    // Clean up all handle event listeners
    handleEventListeners.forEach((listener, handle) => {
      const element = handleElements.value.get(handle)
      if (element) {
        element.removeEventListener('pointerdown', listener, getEventConfig.value)
      }
    })

    // Remove all created elements from DOM
    createdHandleElements.value.forEach((el) => {
      el.parentNode?.removeChild(el)
    })

    // Clear all references
    createdHandleElements.value = []
    handleEventListeners.clear()
    handleElements.value.clear()
  }

  /**
   * Detect which resize handle is under the pointer
   * @param event - The pointer event
   * @param element - The target element
   * @returns The detected resize handle or null
   */
  const detectBoundary = (event: PointerEvent, element: HTMLElement | SVGElement): ResizeHandle | null => {
    // If handle type is 'none', always return null
    if (currentHandleType.value === 'none') {
      return null
    }

    const clientX = event.clientX ?? ((event as unknown as TouchEvent).touches?.[0]?.clientX ?? 0)
    const clientY = event.clientY ?? ((event as unknown as TouchEvent).touches?.[0]?.clientY ?? 0)
    const thresholdValue = handlesSizeValue.value

    // For 'handles' or 'custom' type, check if the pointer is over any handle element
    if (currentHandleType.value === 'handles' || currentHandleType.value === 'custom') {
      // Check if the pointer is over any of the handle elements
      for (const [handle, handleEl] of handleElements.value.entries()) {
        const handleRect = handleEl.getBoundingClientRect()
        if (
          clientX >= handleRect.left
          && clientX <= handleRect.right
          && clientY >= handleRect.top
          && clientY <= handleRect.bottom
        ) {
          return handle
        }
      }
      return null
    }

    // For 'borders' type (default behavior), detect borders
    const rect = element.getBoundingClientRect()
    const distToTop = Math.abs(clientY - rect.top)
    const distToBottom = Math.abs(clientY - rect.bottom)
    const distToLeft = Math.abs(clientX - rect.left)
    const distToRight = Math.abs(clientX - rect.right)

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
   * Set up handle elements and apply border style for borders type
   */
  const setupHandleElements = (targetElement: HTMLElement | SVGElement) => {
    if (!targetElement)
      return

    // Clean up existing handles first
    cleanup()

    // If borders type or none type, just clean up and return
    if (currentHandleType.value === 'borders' || currentHandleType.value === 'none')
      return

    // Handle 'handles' type - create and attach visible handle elements
    if (currentHandleType.value === 'handles') {
      // Create and attach handle elements
      handlesValue.value.forEach((handle) => {
        const handleEl = createHandleElement(handle, false)
        targetElement.append(handleEl)
        createdHandleElements.value.push(handleEl)
        registerHandle(handle, handleEl)
      })
    }
    // Handle 'custom' type - use provided custom handles or create default ones
    else if (currentHandleType.value === 'custom') {
      const customHandlesValue = toValue(customHandles)
      // If custom handles are provided, register them
      if (customHandlesValue && customHandlesValue.size > 0) {
        // Register each custom handle
        customHandlesValue.forEach((handleEl, handle) => {
          if (handlesValue.value.includes(handle)) {
            // Apply styles and register the handle
            applyHandleStyles(handleEl, handle, true)
            registerHandle(handle, handleEl)
          }
        })
      }
      // If no custom handles are provided, check if we need to create default ones
      else {
        // Check if we already have handles registered (from slots in Resizable.vue)
        // This prevents duplicate handle creation when both the component and hook
        // try to create default handles
        const hasRegisteredHandles = handleElements.value.size > 0

        // Only create default handles if none are registered
        // This serves as a fallback when using the hook directly without the component
        if (!hasRegisteredHandles) {
          // Create and attach default handle elements for custom type
          handlesValue.value.forEach((handle) => {
            const handleEl = createHandleElement(handle, true)
            targetElement.append(handleEl)
            createdHandleElements.value.push(handleEl)
            registerHandle(handle, handleEl)
          })
        }
      }
    }
  }

  // Clean up on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    activeHandle,
    hoverHandle,
    handleElements,
    createdHandleElements,
    getCursorForHandle,
    createHandleElement,
    applyHandleStyles,
    registerHandle,
    unregisterHandle,
    setupHandleElements,
    cleanup,
    detectBoundary,
    onHandlePointerDown,
  }
}

export default useResizeHandles
