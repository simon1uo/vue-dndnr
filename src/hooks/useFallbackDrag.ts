import type { MaybeRefOrGetter } from '@vueuse/core'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, ref, toValue } from 'vue'

/**
 * Fallback drag configuration options
 */
export interface UseFallbackDragOptions {
  /** Force fallback mode even if native drag is supported */
  forceFallback?: MaybeRefOrGetter<boolean>
  /** Fallback offset for ghost positioning */
  fallbackOffset?: MaybeRefOrGetter<{ x: number, y: number }>
}

/**
 * Return type for useFallbackDrag composable
 */
export interface UseFallbackDragReturn {
  /** Whether fallback mode should be used */
  shouldUseFallback: () => boolean
  /** Whether fallback mode is currently active */
  isActive: ReturnType<typeof ref<boolean>>
  /** Start fallback mode for drag operation */
  startFallbackMode: (dragEl: HTMLElement, tapEvt: { clientX: number, clientY: number }) => void
  /** Stop fallback mode and clean up resources */
  stopFallbackMode: () => void
  /** Update ghost element position during drag */
  updateGhostPosition: (ghost: HTMLElement, evt: MouseEvent | TouchEvent) => void
  /** Set ghost relative parent for absolute positioning */
  setGhostRelativeParent: (ghost: HTMLElement, container: HTMLElement) => void
  /** Get current tap event information */
  getTapEvent: () => { clientX: number, clientY: number } | undefined
  /** Update options */
  updateOptions: (options: Partial<UseFallbackDragOptions>) => void
}

/**
 * Fallback drag composable.
 * Replaces FallbackDragManager class with Vue 3 Composition API.
 *
 * This composable provides:
 * - Fallback implementation for touch devices and browsers without native drag support
 * - Ghost element positioning with accurate scaling and transforms
 * - Cross-browser compatibility for drag operations
 * - Integration with Vue 3 reactive state management
 * - Automatic cleanup and memory management
 *
 * @param target - Target container element
 * @param options - Fallback drag configuration options
 * @returns Fallback drag functionality and state
 *
 * @example
 * ```ts
 * // Basic usage
 * const fallback = useFallbackDrag(containerRef, {
 *   fallbackOffset: { x: 10, y: 10 }
 * })
 *
 * // Check if fallback should be used
 * if (fallback.shouldUseFallback()) {
 *   fallback.startFallbackMode(element, tapEvent)
 * }
 *
 * // Update ghost position during drag
 * fallback.updateGhostPosition(ghostElement, moveEvent)
 * ```
 */
export function useFallbackDrag(
  target: MaybeRefOrGetter<HTMLElement | null>,
  options: MaybeRefOrGetter<UseFallbackDragOptions> = {},
): UseFallbackDragReturn {
  // Reactive state
  const isActive = ref(false)

  // Internal state
  const loopTimer = ref<NodeJS.Timeout | undefined>()
  const tapEvt = ref<{ clientX: number, clientY: number } | undefined>()
  const ghostMatrix = ref<DOMMatrix | undefined>()
  const lastDx = ref(0)
  const lastDy = ref(0)
  const scaleX = ref(1)
  const scaleY = ref(1)

  // Ghost positioning variables
  const ghostRelativeParent = ref<HTMLElement | undefined>()
  const ghostRelativeParentInitialScroll = ref<[number, number]>([0, 0])
  const positionGhostAbsolutely = ref(false)

  // Computed target element
  const targetElement = computed(() => toValue(target))

  // Computed options with defaults
  const resolvedOptions = computed(() => {
    const opts = toValue(options)
    return {
      forceFallback: toValue(opts.forceFallback) ?? false,
      fallbackOffset: toValue(opts.fallbackOffset) ?? { x: 0, y: 0 },
    }
  })

  /**
   * Parse scale transform when DOMMatrix is not available
   * Handles simple scale() transforms for test environments
   * @param transform - CSS transform string
   * @returns Scale factors
   */
  const parseScaleTransform = (transform: string): { scaleX: number, scaleY: number } => {
    // Handle scale(x) and scale(x, y) patterns
    const scaleMatch = transform.match(/scale\(([^)]+)\)/)
    if (scaleMatch) {
      const values = scaleMatch[1].split(',').map(v => Number.parseFloat(v.trim()))
      if (values.length === 1) {
        // scale(x) - uniform scaling
        return { scaleX: values[0], scaleY: values[0] }
      }
      else if (values.length === 2) {
        // scale(x, y) - non-uniform scaling
        return { scaleX: values[0], scaleY: values[1] }
      }
    }

    // Handle scaleX() and scaleY() patterns
    const scaleXMatch = transform.match(/scaleX\(([^)]+)\)/)
    const scaleYMatch = transform.match(/scaleY\(([^)]+)\)/)

    let scaleXValue = 1
    let scaleYValue = 1

    if (scaleXMatch) {
      scaleXValue = Number.parseFloat(scaleXMatch[1])
    }
    if (scaleYMatch) {
      scaleYValue = Number.parseFloat(scaleYMatch[1])
    }

    // If we found individual scale functions, use them
    if (scaleXMatch || scaleYMatch) {
      return { scaleX: scaleXValue, scaleY: scaleYValue }
    }

    // Default to no scaling if we can't parse
    return { scaleX: 1, scaleY: 1 }
  }

  /**
   * Get window scrolling element
   * @returns Window scrolling element
   */
  const getWindowScrollingElement = (): HTMLElement => {
    return document.scrollingElement as HTMLElement || document.documentElement
  }

  /**
   * Get computed style property
   * @param element - Element to get style for
   * @param property - CSS property name
   * @returns Property value
   */
  const getComputedStyleProperty = (element: HTMLElement, property: string): string => {
    try {
      return window.getComputedStyle(element)[property as any] || ''
    }
    catch {
      return ''
    }
  }

  /**
   * Get element's transform matrix
   * @param element - Element to get matrix for
   * @param selfOnly - Whether to only get element's own transform (not parents)
   * @returns Current transform matrix or null
   */
  const getElementMatrix = (element: HTMLElement, selfOnly = false): DOMMatrix | null => {
    try {
      let appliedTransforms = ''

      if (selfOnly) {
        // Only get the element's own transform
        const computedStyle = window.getComputedStyle(element)
        const transform = computedStyle.transform
        if (transform && transform !== 'none') {
          appliedTransforms = transform
        }
      }
      else {
        // Get all transforms up the parent chain
        let current: HTMLElement | null = element
        while (current) {
          const computedStyle = window.getComputedStyle(current)
          const transform = computedStyle.transform
          if (transform && transform !== 'none') {
            appliedTransforms = `${transform} ${appliedTransforms}`
          }
          current = current.parentElement
        }
      }

      if (appliedTransforms) {
        const MatrixFn = window.DOMMatrix || (window as any).WebKitCSSMatrix || (window as any).CSSMatrix || (window as any).MSCSSMatrix
        return MatrixFn ? new MatrixFn(appliedTransforms) : null
      }
    }
    catch {}
    return null
  }

  /**
   * Get relative scroll offset for an element
   * @param element - Element to get scroll offset for
   * @returns [left, top] scroll offsets
   */
  const getRelativeScrollOffset = (element: HTMLElement): [number, number] => {
    let offsetLeft = 0
    let offsetTop = 0
    const winScroller = getWindowScrollingElement()

    let current: HTMLElement | null = element
    while (current && current !== winScroller) {
      const elMatrix = getElementMatrix(current, false)
      const scaleXValue = elMatrix ? elMatrix.a : 1
      const scaleYValue = elMatrix ? elMatrix.d : 1

      offsetLeft += current.scrollLeft * scaleXValue
      offsetTop += current.scrollTop * scaleYValue

      current = current.parentElement
    }

    return [offsetLeft, offsetTop]
  }

  /**
   * Calculate scale factors for accurate positioning
   */
  const calculateScaleFactors = (): void => {
    const containerElement = targetElement.value
    if (!containerElement)
      return

    try {
      // Get computed style to check for transforms
      const containerStyle = window.getComputedStyle(containerElement)
      const transform = containerStyle.transform

      if (transform && transform !== 'none') {
        try {
          // Try to use DOMMatrix first
          const matrix = new DOMMatrix(transform)
          scaleX.value = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b)
          scaleY.value = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d)
        }
        catch {
          // Fallback for test environments - parse simple scale transforms
          const scaleFactors = parseScaleTransform(transform)
          scaleX.value = scaleFactors.scaleX
          scaleY.value = scaleFactors.scaleY
        }
      }
      else {
        scaleX.value = 1
        scaleY.value = 1
      }
    }
    catch {
      // Handle getComputedStyle errors gracefully
      scaleX.value = 1
      scaleY.value = 1
    }
  }

  /**
   * Initialize ghost relative parent for positioning calculations
   * Called during fallback mode initialization
   */
  const initializeGhostRelativeParent = (): void => {
    const containerElement = targetElement.value
    if (!containerElement)
      return

    // Use the container as the initial relative parent
    ghostRelativeParent.value = containerElement

    // Store initial scroll position
    ghostRelativeParentInitialScroll.value = getRelativeScrollOffset(ghostRelativeParent.value)
  }

  /**
   * Determine if fallback mode should be used.
   * @returns Whether to use fallback mode
   */
  const shouldUseFallback = (): boolean => {
    const opts = resolvedOptions.value

    // Force fallback if explicitly requested
    if (opts.forceFallback) {
      return true
    }

    // Check for touch device
    const isTouchDevice = ('ontouchstart' in window)
      || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)

    // Check for native draggable support
    const testDiv = document.createElement('div')
    const supportsDraggable = 'draggable' in testDiv

    // Use fallback for touch devices or browsers without native drag support
    return isTouchDevice || !supportsDraggable
  }

  /**
   * Emulate drag over events for fallback mode
   * This method is called periodically to trigger drag over logic
   */
  const emulateDragOver = (): void => {
    // This method will be integrated with the existing drag logic
    // For now, it serves as a placeholder for the periodic drag over simulation
    // The actual implementation will coordinate with the drag core system
  }

  /**
   * Determine if ghost should be positioned absolutely
   * @returns Whether to position ghost absolutely
   */
  const shouldPositionGhostAbsolutely = (): boolean => /iPad|iPhone|iPod/.test(navigator.userAgent)

  /**
   * Start fallback mode for drag operation
   * @param dragEl - Element being dragged
   * @param tapEvent - Initial touch/click event
   * @param tapEvent.clientX - X coordinate of the initial touch/click
   * @param tapEvent.clientY - Y coordinate of the initial touch/click
   */
  const startFallbackMode = (dragEl: HTMLElement, tapEvent: { clientX: number, clientY: number }): void => {
    tapEvt.value = tapEvent
    lastDx.value = 0
    lastDy.value = 0

    try {
      ghostMatrix.value = new DOMMatrix()
    }
    catch {
      // Fallback for test environments - create a simple matrix-like object
      ghostMatrix.value = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
      } as DOMMatrix
    }

    // Calculate scale factors for accurate positioning
    calculateScaleFactors()

    positionGhostAbsolutely.value = shouldPositionGhostAbsolutely()

    if (positionGhostAbsolutely.value) {
      initializeGhostRelativeParent()
    }

    // Set active state
    isActive.value = true

    // Start periodic drag over emulation
    loopTimer.value = setInterval(() => {
      emulateDragOver()
    }, 50)
  }

  /**
   * Stop fallback mode and clean up resources
   */
  const stopFallbackMode = (): void => {
    if (loopTimer.value) {
      clearInterval(loopTimer.value)
      loopTimer.value = undefined
    }
    tapEvt.value = undefined
    ghostMatrix.value = undefined
    lastDx.value = 0
    lastDy.value = 0
    isActive.value = false
  }

  /**
   * Update ghost element position during drag
   * @param ghost - Ghost element to position
   * @param evt - Current mouse/touch event
   */
  const updateGhostPosition = (ghost: HTMLElement, evt: MouseEvent | TouchEvent): void => {
    if (!tapEvt.value) {
      return
    }

    // Get current touch/mouse position
    const touch = 'touches' in evt ? evt.touches[0] : evt
    if (!touch) {
      return
    }

    // Calculate movement delta with fallback offset
    const opts = resolvedOptions.value
    const fallbackOffset = opts.fallbackOffset

    // Recalculate scale factors to handle dynamic transforms
    calculateScaleFactors()

    // Calculate relative scroll offset if positioning absolutely
    const relativeScrollOffset = positionGhostAbsolutely.value && ghostRelativeParent.value
      ? getRelativeScrollOffset(ghostRelativeParent.value)
      : [0, 0]

    // Calculate absolute movement from initial tap position
    // Use absolute positioning instead of incremental to avoid cumulative errors
    const rawDx = (touch.clientX - tapEvt.value.clientX) + fallbackOffset.x
    const rawDy = (touch.clientY - tapEvt.value.clientY) + fallbackOffset.y

    // Apply scale factors
    const dx = rawDx / (scaleX.value || 1)
      + (relativeScrollOffset ? (relativeScrollOffset[0] - ghostRelativeParentInitialScroll.value[0]) : 0) / (scaleX.value || 1)
    const dy = rawDy / (scaleY.value || 1)
      + (relativeScrollOffset ? (relativeScrollOffset[1] - ghostRelativeParentInitialScroll.value[1]) : 0) / (scaleY.value || 1)

    // Use absolute matrix positioning instead of incremental updates to prevent drift
    // This ensures the ghost position always matches the cursor position exactly
    ghostMatrix.value = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: dx,
      f: dy,
    } as DOMMatrix

    // Apply the matrix transform
    const cssMatrix = `matrix(${ghostMatrix.value.a},${ghostMatrix.value.b},${ghostMatrix.value.c},${ghostMatrix.value.d},${ghostMatrix.value.e},${ghostMatrix.value.f})`

    // Set transform with vendor prefixes for better compatibility
    ghost.style.webkitTransform = cssMatrix
    ghost.style.transform = cssMatrix

    // Store current position for debugging/reference
    lastDx.value = dx
    lastDy.value = dy
  }

  /**
   * Set ghost relative parent for absolute positioning
   * @param ghost - Ghost element
   * @param container - Container element
   */
  const setGhostRelativeParent = (ghost: HTMLElement, container: HTMLElement): void => {
    if (!positionGhostAbsolutely.value) {
      return
    }

    // Find relatively positioned parent
    ghostRelativeParent.value = container

    while (
      getComputedStyleProperty(ghostRelativeParent.value, 'position') === 'static'
      && getComputedStyleProperty(ghostRelativeParent.value, 'transform') === 'none'
      && ghostRelativeParent.value !== document.documentElement
    ) {
      ghostRelativeParent.value = ghostRelativeParent.value.parentElement || document.documentElement
    }

    // Handle special cases
    if (ghostRelativeParent.value !== document.body && ghostRelativeParent.value !== document.documentElement) {
      if (ghostRelativeParent.value === document.documentElement) {
        ghostRelativeParent.value = getWindowScrollingElement()
      }
    }
    else {
      ghostRelativeParent.value = getWindowScrollingElement()
    }

    // Store initial scroll position
    ghostRelativeParentInitialScroll.value = getRelativeScrollOffset(ghostRelativeParent.value)
  }

  /**
   * Get current tap event information
   * @returns Current tap event or undefined
   */
  const getTapEvent = (): { clientX: number, clientY: number } | undefined => {
    return tapEvt.value
  }

  /**
   * Update options
   * @param newOptions - New options to merge
   */
  const updateOptions = (newOptions: Partial<UseFallbackDragOptions>): void => {
    // For MaybeRefOrGetter, we need to handle the update differently
    // This is a simplified approach - in practice, you might want to use a ref for options
    if (typeof options === 'object' && options !== null) {
      Object.assign(options, newOptions)
    }
  }

  // Cleanup on unmount
  tryOnUnmounted(() => {
    stopFallbackMode()
  })

  return {
    shouldUseFallback,
    isActive,
    startFallbackMode,
    stopFallbackMode,
    updateGhostPosition,
    setGhostRelativeParent,
    getTapEvent,
    updateOptions,
  }
}

export default useFallbackDrag
