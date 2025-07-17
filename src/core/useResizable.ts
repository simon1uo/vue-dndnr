import type { HandleStyles, InternalState, PointerType, Position, ResizeHandle, ResizeHandleType, Size } from '@/types'
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

const BASE_STYLES = {
  userSelect: 'none',
  touchAction: 'none',
  boxSizing: 'border-box',
}

const DEFAULT_STATE_STYLES = {
  active: {
    outline: '1px solid #aaaaaa',
  },
  resizing: {
    opacity: '0.8',
  },
}

export interface UseResizableOptions extends InternalState {
  /**
   * Initial size of the resizable element.
   * @default { width: 'auto', height: 'auto' }
   */
  initialSize?: Size

  /**
   * Initial position of the resizable element.
   * @default { x: 0, y: 0 }
   */
  initialPosition?: Position

  /**
   * Minimum width of the element.
   */
  minWidth?: MaybeRefOrGetter<number>

  /**
   * Minimum height of the element.
   */
  minHeight?: MaybeRefOrGetter<number>

  /**
   * Maximum width of the element.
   */
  maxWidth?: MaybeRefOrGetter<number>

  /**
   * Maximum height of the element.
   */
  maxHeight?: MaybeRefOrGetter<number>

  /**
   * Whether to lock the aspect ratio of the element when resizing.
   * @default false
   */
  lockAspectRatio?: MaybeRefOrGetter<boolean>

  /**
   * The type of resize handles to use.
   * @default 'borders'
   */
  handleType?: MaybeRefOrGetter<ResizeHandleType>

  /**
   * The handles to use for resizing.
   * @default ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']
   */
  handles?: MaybeRefOrGetter<ResizeHandle[]>

  /**
   * A set of custom elements to be used as resize handles.
   */
  customHandles?: MaybeRefOrGetter<Map<ResizeHandle, HTMLElement> | null | undefined>

  /**
   * The size of the resize handles.
   * @default 8
   */
  handlesSize?: MaybeRefOrGetter<number>

  /**
   * Styles to apply to the resize handles.
   */
  handleStyles?: MaybeRefOrGetter<Partial<HandleStyles>>

  /**
   * Callback function when resizing starts.
   */
  onResizeStart?: (size: Size, event: PointerEvent) => void | boolean

  /**
   * Callback function when resizing.
   * @returns {boolean|void} Return false to stop resizing
   */
  onResize?: (size: Size, event: PointerEvent) => void | boolean

  /**
   * Callback function when resizing ends.
   */
  onResizeEnd?: (size: Size, event: PointerEvent) => void | boolean
}

export function useResizable(target: MaybeRefOrGetter<HTMLElement | null | undefined>, options: UseResizableOptions = {}) {
  const publicState = usePublicState()

  const {
    initialSize = { width: 'auto', height: 'auto' },
    initialPosition = { x: 0, y: 0 },
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
    handleStyles = {},
    grid,
    containerElement,
    stateStyles = {},
    throttleDelay = 16,

    onResizeStart,
    onResize,
    onResizeEnd,
    elementId,
  } = options

  const {
    isActive,
    setActive,
    disabledValue,
    pointerTypesValue,
    preventDefaultValue,
    stopPropagationValue,
  } = useInteractive(target, { ...options, elementId })

  // --- Start of logic from useResizeHandles ---

  const HANDLE_STYLES = {
    // Base styles for all handles
    base: {
      position: 'absolute',
      zIndex: '10',
      borderRadius: '10%',
      boxSizing: 'border-box',
      transition: 'transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease',
    },
    // Default state
    default: {
      backgroundColor: '#cccccc',
      transform: '',
      border: '1px solid #aaaaaa',
      outline: '',
      boxShadow: '',
    },
    // Hover state
    hover: {
      backgroundColor: '#dddddd',
      transform: 'scale(1.1)',
      border: '1px solid #aaaaaa',
      outline: '',
      boxShadow: '',
    },
    // Active state (when being dragged)
    active: {
      backgroundColor: '#eeeeee',
      transform: 'scale(1.2)',
      border: '1px solid #aaaaaa',
      outline: '',
      boxShadow: '',
    },
  }

  const size = shallowRef<Size>({ ...initialSize })
  const position = shallowRef<Position>({ ...initialPosition })
  const startEvent = shallowRef<PointerEvent | null>(null)
  const startSize = shallowRef<Size>({ ...initialSize })
  const startPosition = shallowRef<Position>({ ...initialPosition })

  const activeHandle = shallowRef<ResizeHandle | null>(null)
  const hoverHandle = shallowRef<ResizeHandle | null>(null)
  const handleElements = shallowRef<Map<ResizeHandle, HTMLElement>>(new Map())
  const createdHandleElements = shallowRef<HTMLElement[]>([])
  const customHandleStopFunctions = new Map<ResizeHandle, () => void>()

  const isResizing = computed(() => publicState.state.isResizing && isActive.value)

  const handleTypeValue = computed(() => (disabledValue.value ? 'none' : toValue(handleType)))
  const handlesValue = computed(() => toValue(handles))
  const customHandlesValue = computed(() => toValue(customHandles))
  const handlesSizeValue = computed(() => toValue(handlesSize))
  const handleStylesValue = computed(() => toValue(handleStyles))
  const positionTypeValue = computed(() => toValue(positionType))
  const lockAspectRatioValue = computed(() => toValue(lockAspectRatio))
  const containerElementValue = computed(() => toValue(containerElement))
  const gridValue = computed(() => toValue(grid))
  const zIndexValue = computed(() => toValue(zIndex))
  const stateStylesValue = computed(() => toValue(stateStyles))

  const setActiveHandle = (handle: ResizeHandle | null) => {
    activeHandle.value = handle
    publicState.setActiveHandle(handle)
  }

  const setHoverHandle = (handle: ResizeHandle | null) => {
    hoverHandle.value = handle
    publicState.setHoverHandle(handle)
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

  const mergedStateStyles = computed(() => {
    const userStyles = stateStylesValue.value
    return {
      active: { ...DEFAULT_STATE_STYLES.active, ...(userStyles?.active || {}) },
      resizing: { ...DEFAULT_STATE_STYLES.resizing, ...(userStyles?.resizing || {}) },
    }
  })

  const mergedHandleStyles = computed(() => {
    const userStyles = handleStylesValue.value
    return {
      default: {
        ...HANDLE_STYLES.default,
        ...(userStyles?.default || {}),
      },
      hover: {
        ...HANDLE_STYLES.hover,
        ...(userStyles?.hover || {}),
      },
      active: {
        ...HANDLE_STYLES.active,
        ...(userStyles?.active || {}),
      },
    }
  })

  const minWidthValue = computed(() => toValue(minWidth) ?? 0)
  const minHeightValue = computed(() => toValue(minHeight) ?? 0)
  const maxWidthValue = computed(() => toValue(maxWidth) ?? Infinity)
  const maxHeightValue = computed(() => toValue(maxHeight) ?? Infinity)

  const filterEvent = (event: PointerEvent): boolean => {
    if (disabledValue.value)
      return false

    const types = pointerTypesValue.value
    if (types)
      return types.includes(event.pointerType as PointerType)

    return true
  }

  const getEventConfig = computed(() => ({
    capture: toValue(options.capture),
    passive: !preventDefaultValue.value,
  }))

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

  const getHandleBaseStyles = (): Record<string, string> => {
    const size = `${handlesSizeValue.value}px`

    const styles: Record<string, string> = {
      ...HANDLE_STYLES.base,
      width: size,
      height: size,
    }

    const userStyles = mergedHandleStyles.value.default
    Object.entries(userStyles).forEach(([prop, value]) => {
      styles[prop] = value || ''
    })

    if (disabledValue.value)
      styles.display = 'none'

    return styles
  }

  const createHandleElement = (handle: ResizeHandle, isCustom = false): HTMLElement => {
    const el = document.createElement('div')
    el.className = `resize-handle resize-handle-${handle}`
    if (isCustom)
      el.classList.add('resize-handle-custom')

    el.dataset.handle = handle

    if (isCustom) {
      el.style.position = 'absolute'
      el.style.cursor = getCursorForHandle(handle)
      const positionStyles = getHandlePositionStyles(handle)
      Object.entries(positionStyles).forEach(([prop, value]) => {
        el.style[prop as any] = value
      })
      const size = `${handlesSizeValue.value}px`
      el.style.width = size
      el.style.height = size
    }
    else {
      const baseStyles = getHandleBaseStyles()
      Object.entries(baseStyles).forEach(([prop, value]) => {
        el.style[prop as any] = value
      })
      el.style.cursor = getCursorForHandle(handle)
      const positionStyles = getHandlePositionStyles(handle)
      Object.entries(positionStyles).forEach(([prop, value]) => {
        el.style[prop as any] = value
      })
    }

    return el
  }

  const applyHandleStyles = (handleEl: HTMLElement, handle: ResizeHandle, isCustom = false) => {
    if (isCustom) {
      if (disabledValue.value) {
        handleEl.style.display = 'none'
        return
      }
      else {
        handleEl.style.display = ''
      }

      const computedStyle = window.getComputedStyle(handleEl)
      if (computedStyle.position !== 'absolute')
        handleEl.style.position = 'absolute'

      handleEl.style.cursor = getCursorForHandle(handle)
      const positionStyles = getHandlePositionStyles(handle)
      Object.entries(positionStyles).forEach(([prop, value]) => {
        handleEl.style[prop as any] = value
      })
      handleEl.classList.add('resize-handle-custom')
    }
    else {
      const baseStyles = getHandleBaseStyles()
      Object.entries(baseStyles).forEach(([prop, value]) => {
        handleEl.style[prop as any] = value
      })
      handleEl.style.cursor = getCursorForHandle(handle)
      const positionStyles = getHandlePositionStyles(handle)
      Object.entries(positionStyles).forEach(([prop, value]) => {
        handleEl.style[prop as any] = value
      })
    }

    handleEl.addEventListener('mouseenter', () => {
      setHoverHandle(handle)
      if (isCustom) {
        handleEl.classList.add('resize-handle-hover')
      }
      else {
        const hoverStyles = mergedHandleStyles.value.hover
        Object.entries(hoverStyles).forEach(([prop, value]) => {
          if (value)
            handleEl.style[prop as any] = value
        })
      }
    })

    handleEl.addEventListener('mouseleave', () => {
      if (activeHandle.value !== handle) {
        if (isCustom) {
          handleEl.classList.remove('resize-handle-hover')
        }
        else {
          const hoverStyles = mergedHandleStyles.value.hover
          Object.keys(hoverStyles).forEach((prop) => {
            if (prop in HANDLE_STYLES.default)
              handleEl.style[prop as any] = HANDLE_STYLES.default[prop as keyof typeof HANDLE_STYLES.default] || ''
          })

          const defaultStyles = mergedHandleStyles.value.default
          Object.entries(defaultStyles).forEach(([prop, value]) => {
            handleEl.style[prop as any] = value || ''
          })
        }
      }
      if (hoverHandle.value === handle)
        setHoverHandle(null)
    })
  }

  const resetActiveHandle = () => {
    if (activeHandle.value) {
      const activeEl = handleElements.value.get(activeHandle.value)
      if (activeEl) {
        const isCustom = activeEl.classList.contains('resize-handle-custom')

        if (isCustom) {
          activeEl.classList.remove('resize-handle-active')
          activeEl.classList.remove('resize-handle-hover')
        }
        else {
          const activeStyles = mergedHandleStyles.value.active
          Object.keys(activeStyles).forEach((prop) => {
            if (prop in HANDLE_STYLES.default)
              activeEl.style[prop as any] = HANDLE_STYLES.default[prop as keyof typeof HANDLE_STYLES.default] || ''
          })

          const defaultStyles = mergedHandleStyles.value.default
          Object.entries(defaultStyles).forEach(([prop, value]) => {
            activeEl.style[prop as any] = value || ''
          })
        }
      }
      setActiveHandle(null)
    }
  }

  const onHandlePointerDown = (event: PointerEvent, handle: ResizeHandle) => {
    if (!filterEvent(event))
      return

    const el = toValue(target)
    if (!el)
      return

    if (!handlesValue.value.includes(handle))
      return

    if (publicState.state.isDragging)
      return

    if (!isActive.value)
      setActive(true)

    startEvent.value = event
    startSize.value = size.value
    startPosition.value = position.value
    setActiveHandle(handle)

    const handleEl = handleElements.value.get(handle)
    if (handleEl) {
      const isCustom = handleEl.classList.contains('resize-handle-custom')
      if (isCustom) {
        handleEl.classList.add('resize-handle-active')
        handleEl.classList.remove('resize-handle-hover')
      }
      else {
        const activeStyles = mergedHandleStyles.value.active
        Object.entries(activeStyles).forEach(([prop, value]) => {
          if (value)
            handleEl.style[prop as any] = value
        })
      }
    }

    publicState.setResizing(true)

    if (onResizeStart?.(size.value, event) === false) {
      resetActiveHandle()
      startEvent.value = null
      publicState.setResizing(false)
      return
    }

    handleEvent(event)
  }

  const registerHandle = (handle: ResizeHandle, element: HTMLElement) => {
    const existingStop = customHandleStopFunctions.get(handle)
    if (existingStop)
      existingStop()

    const handleEventListener = (e: PointerEvent) => onHandlePointerDown(e, handle)
    const stop = useEventListener(element, 'pointerdown', handleEventListener, getEventConfig.value)
    customHandleStopFunctions.set(handle, stop)
    handleElements.value.set(handle, element)
  }

  const cleanupHandles = () => {
    handleElements.value.forEach((el) => {
      el.style.display = 'none'
    })

    customHandleStopFunctions.forEach(stop => stop())
    customHandleStopFunctions.clear()

    handleElements.value.clear()
    createdHandleElements.value = []
    setActiveHandle(null)
    setHoverHandle(null)
  }

  const detectBoundary = (event: PointerEvent, element: HTMLElement | SVGElement): ResizeHandle | null => {
    if (handleTypeValue.value === 'none' || disabledValue.value)
      return null

    const clientX = event.clientX ?? ((event as unknown as TouchEvent).touches?.[0]?.clientX ?? 0)
    const clientY = event.clientY ?? ((event as unknown as TouchEvent).touches?.[0]?.clientY ?? 0)
    const thresholdValue = handlesSizeValue.value

    if (handleTypeValue.value === 'handles' || handleTypeValue.value === 'custom') {
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

    if (!isWithinX || !isWithinY)
      return null

    if (distToTop <= thresholdValue && distToLeft <= thresholdValue)
      return 'tl'

    if (distToTop <= thresholdValue && distToRight <= thresholdValue)
      return 'tr'

    if (distToBottom <= thresholdValue && distToLeft <= thresholdValue)
      return 'bl'

    if (distToBottom <= thresholdValue && distToRight <= thresholdValue)
      return 'br'

    const edgeThreshold = thresholdValue * 0.8

    if (distToTop <= edgeThreshold && isWithinX)
      return 't'

    if (distToBottom <= edgeThreshold && isWithinX)
      return 'b'

    if (distToLeft <= edgeThreshold && isWithinY)
      return 'l'

    if (distToRight <= edgeThreshold && isWithinY)
      return 'r'

    return null
  }

  const setupHandleElements = (targetElement: HTMLElement | SVGElement) => {
    if (!targetElement)
      return

    cleanupHandles()

    if (handleTypeValue.value === 'borders' || handleTypeValue.value === 'none')
      return

    if (handleTypeValue.value === 'handles') {
      handlesValue.value.forEach((handle) => {
        const handleEl = createHandleElement(handle, false)
        targetElement.append(handleEl)
        createdHandleElements.value.push(handleEl)
        registerHandle(handle, handleEl)
      })
    }
    else if (handleTypeValue.value === 'custom') {
      if (customHandlesValue.value && customHandlesValue.value.size > 0) {
        customHandlesValue.value.forEach((handleEl, handle) => {
          if (handlesValue.value.includes(handle)) {
            applyHandleStyles(handleEl, handle, true)
            registerHandle(handle, handleEl)
          }
        })
      }
      else {
        const hasRegisteredHandles = handleElements.value.size > 0
        if (!hasRegisteredHandles) {
          handlesValue.value.forEach((handle) => {
            const handleEl = createHandleElement(handle, true)
            targetElement.append(handleEl)
            createdHandleElements.value.push(handleEl)
            applyHandleStyles(handleEl, handle, true)
            registerHandle(handle, handleEl)
          })
        }
      }
    }
  }
  // --- End of logic from useResizeHandles ---

  /**
   * Handle the start of a resize operation
   * @param event - The pointer event that triggered the resize start
   */
  const handleResizeStart = (event: PointerEvent) => {
    // For 'handles' or 'custom' type, resize is handled by the resize handles
    // so we only need to handle 'borders' type here
    if (handleTypeValue.value !== 'borders')
      return

    // Check if resize is disabled
    if (disabledValue.value)
      return

    if (publicState.state.isDragging)
      return

    const el = toValue(target)
    if (!el)
      return

    const handle = detectBoundary(event, el)
    const handlesValue = toValue(handles)

    if (!handle || !handlesValue || !handlesValue.includes(handle))
      return

    startEvent.value = event
    startSize.value = size.value
    startPosition.value = position.value
    setActiveHandle(handle)

    publicState.setResizing(true)

    if (onResizeStart?.(size.value, event) === false) {
      resetActiveHandle()
      startEvent.value = null
      publicState.setResizing(false)
      return
    }

    handleEvent(event)
  }

  /**
   * Update element size during resize
   * @param event - The pointer event containing new size information
   */
  const updateSize = (event: PointerEvent) => {
    if (!isResizing.value || !activeHandle.value || !startEvent.value)
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
        if (boundsRect && newX + newWidth > boundsRect.right)
          newWidth = boundsRect.right - newX
      }
      else if (handle.includes('l') || handle === 'left') {
        const proposedX = startPosition.value.x + deltaX
        const proposedWidth = currentWidth - deltaX

        if (boundsRect) {
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
        if (boundsRect && newY + newHeight > boundsRect.bottom)
          newHeight = boundsRect.bottom - newY
      }
      else if (handle.includes('t') || handle === 'top') {
        const proposedY = startPosition.value.y + deltaY
        const proposedHeight = currentHeight - deltaY

        if (boundsRect) {
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

      const newSize: Size = {
        width: Math.max(0, Math.round(newWidth)),
        height: Math.max(0, Math.round(newHeight)),
      }

      const newPosition: Position = {
        x: Math.round(newX),
        y: Math.round(newY),
      }

      if (lockAspectRatioValue.value) {
        const originalAspectRatio = currentWidth / currentHeight
        const newAspectRatio = (newSize.width as number) / (newSize.height as number)

        if (newAspectRatio > originalAspectRatio)
          newSize.height = (newSize.width as number) / originalAspectRatio
        else
          newSize.width = (newSize.height as number) * originalAspectRatio

        if (boundsRect && positionTypeValue.value === 'absolute') {
          const aspectWidth = typeof newSize.width === 'number' ? newSize.width : currentWidth
          const aspectHeight = typeof newSize.height === 'number' ? newSize.height : currentHeight

          if (newPosition.x + aspectWidth > boundsRect.right) {
            if (handle.includes('r') || handle === 'right') {
              newSize.width = boundsRect.right - newPosition.x
              if (typeof newSize.width === 'number')
                newSize.height = newSize.width / (currentWidth / currentHeight)
            }
          }

          if (newPosition.y + aspectHeight > boundsRect.bottom) {
            if (handle.includes('b') || handle === 'bottom') {
              newSize.height = boundsRect.bottom - newPosition.y
              if (typeof newSize.height === 'number')
                newSize.width = newSize.height * (currentWidth / currentHeight)
            }
          }
        }
      }

      if (typeof newSize.width === 'number')
        newSize.width = Math.max(minWidthValue.value, Math.min(maxWidthValue.value, newSize.width))

      if (typeof newSize.height === 'number')
        newSize.height = Math.max(minHeightValue.value, Math.min(maxHeightValue.value, newSize.height))

      if (gridValue.value) {
        if (typeof newSize.width === 'number')
          newSize.width = Math.round(newSize.width / gridValue.value[0]) * gridValue.value[0]
        if (typeof newSize.height === 'number')
          newSize.height = Math.round(newSize.height / gridValue.value[1]) * gridValue.value[1]
        newPosition.x = Math.round(newPosition.x / gridValue.value[0]) * gridValue.value[0]
        newPosition.y = Math.round(newPosition.y / gridValue.value[1]) * gridValue.value[1]
      }

      if (positionTypeValue.value === 'absolute') {
        if (typeof newSize.width === 'number' && (handle.includes('l') || handle === 'left'))
          newPosition.x = startPosition.value.x + (currentWidth - newSize.width)

        if (typeof newSize.height === 'number' && (handle.includes('t') || handle === 'top'))
          newPosition.y = startPosition.value.y + (currentHeight - newSize.height)

        if (boundsRect) {
          const finalWidth = typeof newSize.width === 'number' ? newSize.width : currentWidth
          const finalHeight = typeof newSize.height === 'number' ? newSize.height : currentHeight

          if (newPosition.x + finalWidth > boundsRect.right) {
            if (handle.includes('r') || handle === 'right') {
              if (typeof newSize.width === 'number')
                newSize.width = boundsRect.right - newPosition.x
            }
            else if (handle.includes('l') || handle === 'left') {
              newPosition.x = boundsRect.right - finalWidth
            }
          }

          if (newPosition.y + finalHeight > boundsRect.bottom) {
            if (handle.includes('b') || handle === 'bottom') {
              if (typeof newSize.height === 'number')
                newSize.height = boundsRect.bottom - newPosition.y
            }
            else if (handle.includes('t') || handle === 'top') {
              newPosition.y = boundsRect.bottom - finalHeight
            }
          }

          if (newPosition.x < boundsRect.left) {
            newPosition.x = boundsRect.left
            if ((handle.includes('l') || handle === 'left') && typeof newSize.width === 'number')
              newSize.width = startPosition.value.x + currentWidth - boundsRect.left
          }

          if (newPosition.y < boundsRect.top) {
            newPosition.y = boundsRect.top
            if ((handle.includes('t') || handle === 'top') && typeof newSize.height === 'number')
              newSize.height = startPosition.value.y + currentHeight - boundsRect.top
          }
        }
      }

      return { newSize, newPosition }
    }

    const { newSize, newPosition } = calculateNewDimensions()

    if (onResize?.(newSize, event) === false)
      return

    size.value = newSize
    if (positionTypeValue.value === 'absolute') {
      position.value = newPosition
      publicState.setPosition(newPosition)
    }

    // Update the global store
    publicState.setSize(newSize)
  }

  const throttledUpdateSize = useThrottleFn(updateSize, toValue(throttleDelay), true, true)

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
    if (!isResizing.value)
      return

    resetActiveHandle()
    startEvent.value = null

    publicState.setResizing(false)

    if (onResizeEnd?.(size.value, event) === false)
      return

    handleEvent(event)
  }

  watch(
    () => publicState.state.dragPosition,
    (storePosition) => {
      if (!isResizing.value && isActive.value)
        position.value = { ...storePosition }
    },
    { deep: true },
  )

  const onPointerDown = (event: PointerEvent) => {
    if (handleTypeValue.value !== 'borders' || disabledValue.value)
      return

    handleResizeStart(event)
    handleEvent(event)
  }

  const onMouseMove = (event: PointerEvent) => {
    if (isResizing.value)
      return

    if (disabledValue.value || handleTypeValue.value !== 'borders' || !isActive.value)
      return

    const el = toValue(target)
    if (!el)
      return

    const detectedHandle = detectBoundary(event, el)

    if (detectedHandle !== hoverHandle.value)
      setHoverHandle(detectedHandle)
  }

  const style = computed(() => {
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

    if (positionTypeValue.value === 'absolute' && position.value) {
      computedStyle.left = `${position.value.x}px`
      computedStyle.top = `${position.value.y}px`
    }

    if (isActive.value)
      Object.assign(computedStyle, mergedStateStyles.value.active)

    if (isResizing.value) {
      Object.assign(computedStyle, mergedStateStyles.value.resizing)
      if (zIndexValue.value === 'auto')
        computedStyle.zIndex = '1'
      if (activeHandle.value)
        computedStyle.cursor = getCursorForHandle(activeHandle.value)
    }

    if (!isResizing.value) {
      if (handleTypeValue.value === 'borders' && !disabledValue.value && isActive.value) {
        if (hoverHandle.value)
          computedStyle.cursor = getCursorForHandle(hoverHandle.value)
        if (stateStylesValue.value?.active?.border)
          computedStyle.border = String(stateStylesValue.value.active.border)
      }
    }

    return computedStyle
  })

  const setupElementSize = () => {
    const el = toValue(target)
    if (!el)
      return

    if (size.value.width === 'auto' || size.value.height === 'auto') {
      const { width, height } = getElementSize(el)
      size.value = {
        width: size.value.width === 'auto' ? width : size.value.width,
        height: size.value.height === 'auto' ? height : size.value.height,
      }
    }

    if (positionTypeValue.value === 'absolute' && (position.value.x === 0 && position.value.y === 0))
      position.value = getElementPosition(el)
  }

  const setSize = (newSize: Size) => {
    size.value = newSize
    publicState.setSize(newSize)
  }

  const setPosition = (newPosition: Position) => {
    position.value = newPosition
    publicState.setPosition(newPosition)
  }

  // Sync with global store
  watch(
    () => publicState.state.resizeSize,
    (storeSize) => {
      if (isResizing.value && isActive.value)
        size.value = { ...storeSize }
    },
  )

  if (isClient) {
    onMounted(() => {
      const el = toValue(target)
      if (el)
        setupElementSize()
    })

    watch(
      () => isActive.value,
      (newIsActive) => {
        const el = toValue(target)
        if (!el)
          return

        if (handleTypeValue.value === 'handles' || handleTypeValue.value === 'custom') {
          if (newIsActive)
            setupHandleElements(el)
          else
            cleanupHandles()
        }
      },
      { flush: 'post' },
    )

    watch(() => handleTypeValue.value, (newHandleType, oldHandleType) => {
      if (newHandleType !== oldHandleType) {
        const el = toValue(target)
        if (el)
          setupHandleElements(el)
      }
    }, {
      flush: 'post',
    })

    watch(handlesValue, (newHandles, oldHandles) => {
      if (JSON.stringify(newHandles) !== JSON.stringify(oldHandles)) {
        const el = toValue(target)
        if (el && (handleTypeValue.value === 'handles' || handleTypeValue.value === 'custom'))
          setupHandleElements(el)
      }
    }, { deep: true })

    watch(handlesSizeValue, (newSize, oldSize) => {
      if (newSize !== oldSize) {
        handleElements.value.forEach((handleEl, handle) => {
          const isCustom = handleEl.classList.contains('resize-handle-custom')
          if (!isCustom) {
            handleEl.style.width = `${newSize}px`
            handleEl.style.height = `${newSize}px`
          }
          const positionStyles = getHandlePositionStyles(handle)
          Object.entries(positionStyles).forEach(([prop, value]) => {
            handleEl.style[prop as any] = value
          })
        })
      }
    })

    watch(handleStylesValue, (newStyles, oldStyles) => {
      if (JSON.stringify(newStyles) !== JSON.stringify(oldStyles)) {
        handleElements.value.forEach((handleEl, handle) => {
          if (handleEl.classList.contains('resize-handle-custom'))
            return

          if (activeHandle.value !== handle && hoverHandle.value !== handle) {
            if (oldStyles?.default) {
              Object.keys(oldStyles.default).forEach((prop) => {
                if (prop in HANDLE_STYLES.default)
                  handleEl.style[prop as any] = HANDLE_STYLES.default[prop as keyof typeof HANDLE_STYLES.default] || ''
              })
            }

            const mergedStyles = {
              ...HANDLE_STYLES.default,
              ...(newStyles?.default || {}),
            }

            Object.entries(mergedStyles).forEach(([prop, value]) => {
              handleEl.style[prop as any] = value || ''
            })
          }
        })
      }
    }, { deep: true })

    const config = computed(() => ({
      capture: toValue(options.capture),
      passive: !preventDefaultValue.value,
    }))

    useEventListener(target, 'pointerdown', onPointerDown, config)
    useEventListener(target, 'mousemove', onMouseMove, config)
    useEventListener(defaultWindow, 'pointermove', handleResize, config)
    useEventListener(defaultWindow, 'pointerup', handleResizeEnd, config)
    useEventListener(defaultWindow, 'pointercancel', handleResizeEnd, config)
  }

  tryOnUnmounted(() => {
    cleanupHandles()
    startEvent.value = null

    // Reset global state if this element is active
    if (isActive.value) {
      publicState.setResizing(false)
      publicState.setActiveHandle(null)
      publicState.setHoverHandle(null)
    }

    const el = toValue(target)
    if (el) {
      const stylesToRemove = [
        mergedStateStyles.value.active,
        mergedStateStyles.value.resizing,
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

  return {
    x: computed(() => position.value.x),
    y: computed(() => position.value.y),
    width: computed(() => {
      const s = toValue(size)
      return typeof s.width === 'number' ? `${s.width}px` : s.width
    }),
    height: computed(() => {
      const s = toValue(size)
      return typeof s.height === 'number' ? `${s.height}px` : s.height
    }),
    size,
    position,
    isResizing,
    isActive,
    activeHandle,
    hoverHandle,
    style,
    setActive,
    setSize,
    setPosition,
  }
}
