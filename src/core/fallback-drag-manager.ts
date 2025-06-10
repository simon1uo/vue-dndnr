import type { SortableOptions } from '@/types'

/**
 * FallbackDragManager handles drag operations in fallback mode
 * Fallback implementation for touch devices and browsers without native drag support
 */
export class FallbackDragManager {
  private options: SortableOptions
  private container: HTMLElement
  private loopTimer?: NodeJS.Timeout
  private tapEvt?: { clientX: number, clientY: number }
  private ghostMatrix?: DOMMatrix
  private lastDx = 0
  private lastDy = 0
  private scaleX = 1
  private scaleY = 1

  // Ghost positioning variables
  private ghostRelativeParent?: HTMLElement
  private ghostRelativeParentInitialScroll: [number, number] = [0, 0]
  private positionGhostAbsolutely = false

  constructor(container: HTMLElement, options: SortableOptions) {
    this.container = container
    this.options = options
  }

  /**
   * Determine if fallback mode should be used.
   * @returns Whether to use fallback mode
   */
  shouldUseFallback(): boolean {
    const { forceFallback } = this.options

    // Force fallback if explicitly requested
    if (forceFallback) {
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
   * Start fallback mode for drag operation
   * @param dragEl - Element being dragged
   * @param tapEvt - Initial touch/click event
   */
  startFallbackMode(dragEl: HTMLElement, tapEvt: { clientX: number, clientY: number }): void {
    this.tapEvt = tapEvt
    this.lastDx = 0
    this.lastDy = 0

    try {
      this.ghostMatrix = new DOMMatrix()
    }
    catch {
      // Fallback for test environments - create a simple matrix-like object
      this.ghostMatrix = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
      } as DOMMatrix
    }

    // Calculate scale factors for accurate positioning
    this.calculateScaleFactors()

    this.positionGhostAbsolutely = this.shouldPositionGhostAbsolutely()

    if (this.positionGhostAbsolutely) {
      this.initializeGhostRelativeParent()
    }

    this.loopTimer = setInterval(() => {
      this.emulateDragOver()
    }, 50)
  }

  /**
   * Stop fallback mode and clean up resources
   */
  stopFallbackMode(): void {
    if (this.loopTimer) {
      clearInterval(this.loopTimer)
      this.loopTimer = undefined
    }
    this.tapEvt = undefined
    this.ghostMatrix = undefined
    this.lastDx = 0
    this.lastDy = 0
  }

  /**
   * Update ghost element position during drag
   * @param ghost - Ghost element to position
   * @param evt - Current mouse/touch event
   */
  updateGhostPosition(ghost: HTMLElement, evt: MouseEvent | TouchEvent): void {
    if (!this.tapEvt) {
      return
    }

    // Get current touch/mouse position
    const touch = 'touches' in evt ? evt.touches[0] : evt
    if (!touch) {
      return
    }

    // Calculate movement delta with fallback offset
    const { fallbackOffset = { x: 0, y: 0 } } = this.options

    // Recalculate scale factors to handle dynamic transforms
    this.calculateScaleFactors()

    // Calculate relative scroll offset if positioning absolutely
    const relativeScrollOffset = this.positionGhostAbsolutely && this.ghostRelativeParent
      ? this.getRelativeScrollOffset(this.ghostRelativeParent)
      : [0, 0]

    // Calculate absolute movement from initial tap position
    // Use absolute positioning instead of incremental to avoid cumulative errors
    const rawDx = (touch.clientX - this.tapEvt.clientX) + fallbackOffset.x
    const rawDy = (touch.clientY - this.tapEvt.clientY) + fallbackOffset.y

    // Apply scale factors
    const dx = rawDx / (this.scaleX || 1)
      + (relativeScrollOffset ? (relativeScrollOffset[0] - this.ghostRelativeParentInitialScroll[0]) : 0) / (this.scaleX || 1)
    const dy = rawDy / (this.scaleY || 1)
      + (relativeScrollOffset ? (relativeScrollOffset[1] - this.ghostRelativeParentInitialScroll[1]) : 0) / (this.scaleY || 1)

    // Use absolute matrix positioning instead of incremental updates to prevent drift
    // This ensures the ghost position always matches the cursor position exactly
    this.ghostMatrix = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: dx,
      f: dy,
    } as DOMMatrix

    // Apply the matrix transform
    const cssMatrix = `matrix(${this.ghostMatrix.a},${this.ghostMatrix.b},${this.ghostMatrix.c},${this.ghostMatrix.d},${this.ghostMatrix.e},${this.ghostMatrix.f})`

    // Set transform with vendor prefixes for better compatibility
    ghost.style.webkitTransform = cssMatrix
    ghost.style.transform = cssMatrix

    // Store current position for debugging/reference
    this.lastDx = dx
    this.lastDy = dy
  }

  /**
   * Emulate drag over events for fallback mode
   * This method is called periodically to trigger drag over logic
   */
  private emulateDragOver(): void {
    // This method will be integrated with the existing drag logic
    // For now, it serves as a placeholder for the periodic drag over simulation
    // The actual implementation will coordinate with CustomDragInstance
  }

  /**
   * Calculate scale factors for accurate positioning
   */
  private calculateScaleFactors(): void {
    // Get computed style to check for transforms
    const containerStyle = window.getComputedStyle(this.container)
    const transform = containerStyle.transform

    if (transform && transform !== 'none') {
      try {
        // Try to use DOMMatrix first
        const matrix = new DOMMatrix(transform)
        this.scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b)
        this.scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d)
      }
      catch {
        // Fallback for test environments - parse simple scale transforms
        const scaleFactors = this.parseScaleTransform(transform)
        this.scaleX = scaleFactors.scaleX
        this.scaleY = scaleFactors.scaleY
      }
    }
    else {
      this.scaleX = 1
      this.scaleY = 1
    }
  }

  /**
   * Get element's transform matrix
   * @param element - Element to get matrix for
   * @param selfOnly - Whether to only get element's own transform (not parents)
   * @returns Current transform matrix or null
   */
  private getElementMatrix(element: HTMLElement, selfOnly = false): DOMMatrix | null {
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
   * Get current tap event information
   * @returns Current tap event or undefined
   */
  getTapEvent(): { clientX: number, clientY: number } | undefined {
    return this.tapEvt
  }

  /**
   * Check if fallback mode is currently active
   * @returns Whether fallback mode is running
   */
  isActive(): boolean {
    return this.loopTimer !== undefined
  }

  /**
   * Initialize ghost relative parent for positioning calculations
   * Called during fallback mode initialization
   */
  private initializeGhostRelativeParent(): void {
    // Use the container as the initial relative parent
    this.ghostRelativeParent = this.container

    // Store initial scroll position
    this.ghostRelativeParentInitialScroll = this.getRelativeScrollOffset(this.ghostRelativeParent)
  }

  /**
   * Set ghost relative parent for absolute positioning
   * @param ghost - Ghost element
   * @param container - Container element
   */
  setGhostRelativeParent(ghost: HTMLElement, container: HTMLElement): void {
    if (!this.positionGhostAbsolutely) {
      return
    }

    // Find relatively positioned parent
    this.ghostRelativeParent = container

    while (
      this.getComputedStyle(this.ghostRelativeParent, 'position') === 'static'
      && this.getComputedStyle(this.ghostRelativeParent, 'transform') === 'none'
      && this.ghostRelativeParent !== document.documentElement
    ) {
      this.ghostRelativeParent = this.ghostRelativeParent.parentElement || document.documentElement
    }

    // Handle special cases
    if (this.ghostRelativeParent !== document.body && this.ghostRelativeParent !== document.documentElement) {
      if (this.ghostRelativeParent === document.documentElement) {
        this.ghostRelativeParent = this.getWindowScrollingElement()
      }
    }
    else {
      this.ghostRelativeParent = this.getWindowScrollingElement()
    }

    // Store initial scroll position
    this.ghostRelativeParentInitialScroll = this.getRelativeScrollOffset(this.ghostRelativeParent)
  }

  /**
   * Get relative scroll offset for an element
   * @param element - Element to get scroll offset for
   * @returns [left, top] scroll offsets
   */
  private getRelativeScrollOffset(element: HTMLElement): [number, number] {
    let offsetLeft = 0
    let offsetTop = 0
    const winScroller = this.getWindowScrollingElement()

    let current: HTMLElement | null = element
    while (current && current !== winScroller) {
      const elMatrix = this.getElementMatrix(current, false)
      const scaleX = elMatrix ? elMatrix.a : 1
      const scaleY = elMatrix ? elMatrix.d : 1

      offsetLeft += current.scrollLeft * scaleX
      offsetTop += current.scrollTop * scaleY

      current = current.parentElement
    }

    return [offsetLeft, offsetTop]
  }

  /**
   * Get window scrolling element
   * @returns Window scrolling element
   */
  private getWindowScrollingElement(): HTMLElement {
    return document.scrollingElement as HTMLElement || document.documentElement
  }

  /**
   * Get computed style property
   * @param element - Element to get style for
   * @param property - CSS property name
   * @returns Property value
   */
  private getComputedStyle(element: HTMLElement, property: string): string {
    try {
      return window.getComputedStyle(element)[property as any] || ''
    }
    catch {
      return ''
    }
  }

  /**
   * Determine if ghost should be positioned absolutely
   * @returns Whether to position ghost absolutely
   */
  private shouldPositionGhostAbsolutely(): boolean {
    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    return isIOS
  }

  /**
   * Parse scale transform when DOMMatrix is not available
   * Handles simple scale() transforms for test environments
   * @param transform - CSS transform string
   * @returns Scale factors
   */
  private parseScaleTransform(transform: string): { scaleX: number, scaleY: number } {
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

    let scaleX = 1
    let scaleY = 1

    if (scaleXMatch) {
      scaleX = Number.parseFloat(scaleXMatch[1])
    }
    if (scaleYMatch) {
      scaleY = Number.parseFloat(scaleYMatch[1])
    }

    // If we found individual scale functions, use them
    if (scaleXMatch || scaleYMatch) {
      return { scaleX, scaleY }
    }

    // Default to no scaling if we can't parse
    return { scaleX: 1, scaleY: 1 }
  }
}
