import type { MaybeRefOrGetter } from 'vue'
import type { ResizableOptions, ResizeHandle, Size } from '../types'
import { onMounted, ref, toValue, watch } from 'vue'
import {
  applyAspectRatioLock,
  applyGrid,
  applyMinMaxConstraints,
  getElementSize,
  getElementBounds,
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
    boundaryThreshold = 8, // New option for boundary detection threshold
    onResizeStart: onResizeStartCallback,
    onResize: onResizeCallback,
    onResizeEnd: onResizeEndCallback,
  } = options

  // State
  const size = ref<Size>({ ...initialSize })
  const isResizing = ref(false)
  const activeHandle = ref<ResizeHandle | null>(null)
  const startEvent = ref<MouseEvent | TouchEvent | null>(null)
  const hoverHandle = ref<ResizeHandle | null>(null) // Track which boundary is being hovered

  // Internal state
  const startSize = ref<Size>({ ...initialSize })

  // Helper function to get cursor style for a handle
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

  // Apply styles directly to the target element
  const applyStyles = () => {
    const el = toValue(target)
    if (!el)
      return

    const cursorStyle = hoverHandle.value ? getCursorForHandle(hoverHandle.value) : 'default'

    el.style.position = 'relative'
    el.style.width = typeof size.value.width === 'number' ? `${size.value.width}px` : size.value.width
    el.style.height = typeof size.value.height === 'number' ? `${size.value.height}px` : size.value.height
    el.style.userSelect = 'none'
    el.style.cursor = isResizing.value && activeHandle.value ? getCursorForHandle(activeHandle.value) : cursorStyle
  }

  // Filter events based on options
  const filterEvent = (event: MouseEvent | TouchEvent): boolean => {
    // Check if resizing is disabled
    if (disabled)
      return false

    // Check pointer type
    if (event instanceof MouseEvent) {
      if (!pointerTypes.includes('mouse'))
        return false
    }
    else if (event instanceof TouchEvent) {
      if (!pointerTypes.includes('touch'))
        return false
    }

    return true
  }

  // Handle event options
  const handleEvent = (event: MouseEvent | TouchEvent) => {
    if (preventDefault)
      event.preventDefault()
    if (stopPropagation)
      event.stopPropagation()
  }

  // Detect which boundary the cursor is near
  const detectBoundary = (event: MouseEvent | TouchEvent, element: HTMLElement | SVGElement): ResizeHandle | null => {
    const rect = element.getBoundingClientRect()
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY

    // Calculate distances to each edge
    const distToTop = Math.abs(clientY - rect.top)
    const distToBottom = Math.abs(clientY - rect.bottom)
    const distToLeft = Math.abs(clientX - rect.left)
    const distToRight = Math.abs(clientX - rect.right)

    // Check if cursor is within the element bounds plus threshold
    const isWithinX = clientX >= rect.left - boundaryThreshold && clientX <= rect.right + boundaryThreshold
    const isWithinY = clientY >= rect.top - boundaryThreshold && clientY <= rect.bottom + boundaryThreshold

    if (!isWithinX || !isWithinY) {
      return null
    }

    // Check corners first (they have priority)
    if (distToTop <= boundaryThreshold && distToLeft <= boundaryThreshold) {
      return 'tl'
    }
    if (distToTop <= boundaryThreshold && distToRight <= boundaryThreshold) {
      return 'tr'
    }
    if (distToBottom <= boundaryThreshold && distToLeft <= boundaryThreshold) {
      return 'bl'
    }
    if (distToBottom <= boundaryThreshold && distToRight <= boundaryThreshold) {
      return 'br'
    }

    // Then check edges
    if (distToTop <= boundaryThreshold && isWithinX) {
      return 't'
    }
    if (distToBottom <= boundaryThreshold && isWithinX) {
      return 'b'
    }
    if (distToLeft <= boundaryThreshold && isWithinY) {
      return 'l'
    }
    if (distToRight <= boundaryThreshold && isWithinY) {
      return 'r'
    }

    return null
  }

  // Handle mouse move to detect boundaries
  const onMouseMove = (event: MouseEvent | TouchEvent) => {
    if (isResizing.value || !filterEvent(event)) {
      return
    }

    const el = toValue(target)
    if (!el) {
      return
    }

    const detectedHandle = detectBoundary(event, el)

    // Only update if the handle has changed to avoid unnecessary renders
    if (detectedHandle !== hoverHandle.value) {
      hoverHandle.value = detectedHandle
    }
  }

  // Event handlers
  const onResizeStart = (event: MouseEvent | TouchEvent) => {
    const el = toValue(target)
    if (!filterEvent(event) || !el)
      return

    // Detect which boundary we're near
    const handle = detectBoundary(event, el)

    if (!handle || !handles.includes(handle))
      return

    // Store the start event and size
    startEvent.value = event
    startSize.value = { ...size.value }
    isResizing.value = true
    activeHandle.value = handle

    // Call the callback if provided
    if (onResizeStartCallback)
      onResizeStartCallback(size.value, event)

    // Handle the event
    handleEvent(event)
  }

  const onResize = (event: MouseEvent | TouchEvent) => {
    const el = toValue(target)
    if (!isResizing.value || !activeHandle.value || !startEvent.value || !el)
      return

    // Calculate the new size
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY
    const startClientX = startEvent.value instanceof MouseEvent ? startEvent.value.clientX : (startEvent.value as TouchEvent).touches[0].clientX
    const startClientY = startEvent.value instanceof MouseEvent ? startEvent.value.clientY : (startEvent.value as TouchEvent).touches[0].clientY

    const deltaX = clientX - startClientX
    const deltaY = clientY - startClientY

    let newSize: Size = { ...startSize.value }
    let width = Number(startSize.value.width)
    let height = Number(startSize.value.height)

    // Handle different resize directions
    switch (activeHandle.value) {
      case 'r':
      case 'right':
        width = width + deltaX
        break
      case 'l':
      case 'left':
        width = width - deltaX
        break
      case 'b':
      case 'bottom':
        height = height + deltaY
        break
      case 't':
      case 'top':
        height = height - deltaY
        break
      case 'tr':
      case 'top-right':
        width = width + deltaX
        height = height - deltaY
        break
      case 'tl':
      case 'top-left':
        width = width - deltaX
        height = height - deltaY
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
        break
    }

    newSize = { width, height }

    // Apply grid snapping if specified
    let snappedSize = newSize
    if (grid) {
      snappedSize = {
        width: typeof newSize.width === 'number' ? applyGrid({ x: newSize.width, y: 0 }, grid).x : newSize.width,
        height: typeof newSize.height === 'number' ? applyGrid({ x: 0, y: newSize.height }, grid).y : newSize.height,
      }
    }

    // Apply min/max constraints
    let constrainedSize = applyMinMaxConstraints(
      snappedSize,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
    )

    // Apply aspect ratio lock if specified
    if (lockAspectRatio) {
      constrainedSize = applyAspectRatioLock(
        constrainedSize,
        startSize.value,
        lockAspectRatio,
      )
    }

    // Apply bounds constraints if specified
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

        // Calculate max width and height based on bounds
        const maxBoundWidth = boundingRect.right - boundingRect.left - targetPos.x
        const maxBoundHeight = boundingRect.bottom - boundingRect.top - targetPos.y

        // Apply bounds constraints
        if (typeof constrainedSize.width === 'number') {
          constrainedSize.width = Math.min(constrainedSize.width, maxBoundWidth)
        }
        if (typeof constrainedSize.height === 'number') {
          constrainedSize.height = Math.min(constrainedSize.height, maxBoundHeight)
        }
      }
    }

    // Update the size
    size.value = constrainedSize

    // Apply the updated styles
    applyStyles()

    // Call the callback if provided
    if (onResizeCallback)
      onResizeCallback(size.value, event)

    // Handle the event
    handleEvent(event)
  }

  const onResizeEnd = (event: MouseEvent | TouchEvent) => {
    if (!isResizing.value)
      return

    isResizing.value = false
    activeHandle.value = null
    startEvent.value = null

    // Call the callback if provided
    if (onResizeEndCallback)
      onResizeEndCallback(size.value, event)

    // Handle the event
    handleEvent(event)
  }

  // Set up event listeners
  const setupElementSize = () => {
    const el = toValue(target)
    if (el) {
      // Initialize size if set to auto
      if (size.value.width === 'auto' || size.value.height === 'auto') {
        const elementSize = getElementSize(el)
        size.value = {
          width: size.value.width === 'auto' ? elementSize.width : size.value.width,
          height: size.value.height === 'auto' ? elementSize.height : size.value.height,
        }
      }

      // Apply initial styles
      applyStyles()

      // Add mouse move listener to the element for boundary detection
      useEventListener(el, 'mousemove', onMouseMove, {
        passive: !preventDefault,
      })

      // Add mousedown listener to start resizing
      useEventListener(el, 'mousedown', onResizeStart, {
        passive: !preventDefault,
      })

      // Add touch events for mobile
      useEventListener(el, 'touchmove', onMouseMove, {
        passive: !preventDefault,
      })

      useEventListener(el, 'touchstart', onResizeStart, {
        passive: !preventDefault,
      })

      // Add mouseleave listener to reset hover state
      useEventListener(el, 'mouseleave', () => {
        hoverHandle.value = null
      }, {
        passive: true,
      })
    }
  }

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

  // Watch for changes to size or handle state to update styles
  watch([size, hoverHandle, isResizing, activeHandle], () => {
    applyStyles()
  }, { deep: true })

  // Public methods
  const setSize = (newSize: Size) => {
    size.value = { ...newSize }
    applyStyles()
  }

  useEventListener(window, 'pointermove', onResize, {
    passive: !preventDefault,
  })
  useEventListener(window, 'pointerup', onResizeEnd, {
    passive: !preventDefault,
  })

  // Return values and methods
  return {
    size,
    isResizing,
    activeHandle,
    hoverHandle,
    setSize,
    onResizeStart,
    onResize,
    onResizeEnd,
    detectBoundary,
  }
}

export default useResizable
