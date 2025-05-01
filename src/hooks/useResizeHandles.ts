import type { PointerType, ResizeHandle, ResizeHandlesOptions, ResizeHandlesResult } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'
import { getCursorStyle } from '@/utils/cursor'

/**
 * Hook that manages resize handles
 * @param target - Reference to the element to make resizable
 * @param options - Configuration options for resize handles
 * @returns Object containing resize handles state and methods
 */
export function useResizeHandles(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
  options: ResizeHandlesOptions = {},
): ResizeHandlesResult {
  const {
    handleType = 'borders',
    handles = ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'],
    customHandles,
    boundaryThreshold = 8,
    preventDefault = true,
    stopPropagation = false,
    capture = true,
    pointerTypes = ['mouse', 'touch', 'pen'],
    disabled = false,
    onResizeStart,
  } = options

  // Computed value for handle type
  const currentHandleType = computed(() => toValue(handleType))

  // State for handles
  const activeHandle = ref<ResizeHandle | null>(null)
  const hoverHandle = ref<ResizeHandle | null>(null)
  const handleElements = ref<Map<ResizeHandle, HTMLElement>>(new Map())
  const createdHandleElements = ref<HTMLElement[]>([])

  // Store event handlers for each handle to properly remove them later
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
    if (toValue(disabled))
      return false

    const types = toValue(pointerTypes)
    if (types)
      return types.includes(event.pointerType as PointerType)

    return true
  }

  /**
   * Handle event by preventing default and stopping propagation if configured
   * @param event - The pointer event to handle
   */
  const handleEvent = (event: PointerEvent) => {
    if (toValue(preventDefault))
      event.preventDefault()
    if (toValue(stopPropagation))
      event.stopPropagation()
  }

  /**
   * Get event listener configuration based on current options
   * @returns Event listener options object
   */
  const getConfig = () => ({
    capture: toValue(capture),
    passive: !toValue(preventDefault),
  })

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

    // Add base styles
    el.style.position = 'absolute'
    el.style.zIndex = '10'
    el.style.cursor = getCursorForHandle(handle)
    el.style.width = '10px'
    el.style.height = '10px'
    el.style.borderRadius = '50%'
    el.style.boxSizing = 'border-box'
    el.style.transition = 'transform 0.15s ease, background-color 0.15s ease'

    // Set visual appearance based on handle type
    if (isCustom) {
      el.style.backgroundColor = 'rgba(66, 153, 225, 0.6)'
      el.style.border = '1px solid rgba(43, 108, 176, 0.6)'
    }
    else {
      el.style.backgroundColor = '#4299e1'
      el.style.border = '1px solid #2b6cb0'
    }

    // Set position based on handle type
    const offset = isCustom ? -12 : -5

    switch (handle) {
      case 'tl':
      case 'top-left':
        el.style.top = `${offset}px`
        el.style.left = `${offset}px`
        break
      case 'tr':
      case 'top-right':
        el.style.top = `${offset}px`
        el.style.right = `${offset}px`
        break
      case 'bl':
      case 'bottom-left':
        el.style.bottom = `${offset}px`
        el.style.left = `${offset}px`
        break
      case 'br':
      case 'bottom-right':
        el.style.bottom = `${offset}px`
        el.style.right = `${offset}px`
        break
      case 't':
      case 'top':
        el.style.left = `calc(50% ${offset}px)`
        el.style.top = `${offset}px`
        break
      case 'b':
      case 'bottom':
        el.style.left = `calc(50% ${offset}px)`
        el.style.bottom = `${offset}px`
        break
      case 'l':
      case 'left':
        el.style.top = `calc(50% ${offset}px)`
        el.style.left = `${offset}px`
        break
      case 'r':
      case 'right':
        el.style.top = `calc(50% ${offset}px)`
        el.style.right = `${offset}px`
        break
    }

    return el
  }

  /**
   * Apply styles to a handle element based on its position
   * @param handleEl - The handle element to style
   * @param handle - The handle position
   * @param isCustom - Whether this is a custom handle
   */
  const applyHandleStyles = (handleEl: HTMLElement, handle: ResizeHandle, isCustom = false) => {
    // Set base styles
    handleEl.style.position = 'absolute'
    handleEl.style.zIndex = '10'
    handleEl.style.cursor = getCursorForHandle(handle)

    // Set position based on handle type
    const offset = isCustom ? -12 : -5

    switch (handle) {
      case 'tl':
      case 'top-left':
        handleEl.style.top = `${offset}px`
        handleEl.style.left = `${offset}px`
        break
      case 'tr':
      case 'top-right':
        handleEl.style.top = `${offset}px`
        handleEl.style.right = `${offset}px`
        break
      case 'bl':
      case 'bottom-left':
        handleEl.style.bottom = `${offset}px`
        handleEl.style.left = `${offset}px`
        break
      case 'br':
      case 'bottom-right':
        handleEl.style.bottom = `${offset}px`
        handleEl.style.right = `${offset}px`
        break
      case 't':
      case 'top':
        handleEl.style.left = `calc(50% + ${offset}px)`
        handleEl.style.top = `${offset}px`
        break
      case 'b':
      case 'bottom':
        handleEl.style.left = `calc(50% + ${offset}px)`
        handleEl.style.bottom = `${offset}px`
        break
      case 'l':
      case 'left':
        handleEl.style.top = `calc(50% + ${offset}px)`
        handleEl.style.left = `${offset}px`
        break
      case 'r':
      case 'right':
        handleEl.style.top = `calc(50% + ${offset}px)`
        handleEl.style.right = `${offset}px`
        break
    }

    // Add hover event listeners
    handleEl.addEventListener('mouseenter', () => {
      if (isCustom) {
        // For custom handles, just update hover state
        hoverHandle.value = handle
      }
      else {
        // For standard handles, also update visual style
        handleEl.style.backgroundColor = isCustom ? 'rgba(49, 130, 206, 0.8)' : '#3182ce'
        handleEl.style.transform = 'scale(1.1)'
        hoverHandle.value = handle
      }
    })

    handleEl.addEventListener('mouseleave', () => {
      if (activeHandle.value !== handle) {
        if (!isCustom) {
          // Reset style for standard handles
          handleEl.style.backgroundColor = isCustom ? 'rgba(66, 153, 225, 0.6)' : '#4299e1'
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

    const handlesValue = toValue(handles)
    if (!handlesValue || !handlesValue.includes(handle))
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
      element.removeEventListener('pointerdown', eventListener, getConfig())

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
    element.addEventListener('pointerdown', handleEventListener, getConfig())
  }

  /**
   * Clean up event listeners and remove created elements
   */
  const cleanup = () => {
    // Clean up all handle event listeners
    handleEventListeners.forEach((listener, handle) => {
      const element = handleElements.value.get(handle)
      if (element) {
        element.removeEventListener('pointerdown', listener, getConfig())
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
    const clientX = event.clientX ?? ((event as unknown as TouchEvent).touches?.[0]?.clientX ?? 0)
    const clientY = event.clientY ?? ((event as unknown as TouchEvent).touches?.[0]?.clientY ?? 0)
    const thresholdValue = toValue(boundaryThreshold)

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
   * Create and attach handle elements to the target element
   */
  const setupHandleElements = (targetElement: HTMLElement | SVGElement) => {
    if (!targetElement)
      return

    // Clean up existing handles first
    cleanup()

    // If borders type, just clean up and return
    if (currentHandleType.value === 'borders')
      return

    const handlesValue = toValue(handles)

    // Handle 'handles' type - create and attach visible handle elements
    if (currentHandleType.value === 'handles') {
      // Create and attach handle elements
      handlesValue.forEach((handle) => {
        const handleEl = createHandleElement(handle, false)
        targetElement.append(handleEl)
        createdHandleElements.value.push(handleEl)
        registerHandle(handle, handleEl)

        // Apply styles and event listeners
        applyHandleStyles(handleEl, handle)
      })
    }
    // Handle 'custom' type - use provided custom handles or create default ones
    else if (currentHandleType.value === 'custom') {
      const customHandlesValue = toValue(customHandles)
      // If custom handles are provided, register them
      if (customHandlesValue && customHandlesValue.size > 0) {
        // Register each custom handle
        customHandlesValue.forEach((handleEl, handle) => {
          if (handlesValue.includes(handle)) {
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
          handlesValue.forEach((handle) => {
            const handleEl = createHandleElement(handle, true)
            targetElement.append(handleEl)
            createdHandleElements.value.push(handleEl)
            registerHandle(handle, handleEl)

            // Apply styles and event listeners
            applyHandleStyles(handleEl, handle, true)
          })
        }
      }
    }
  }

  return {
    handleType: currentHandleType,
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
    getConfig,
  }
}

export default useResizeHandles
