import type { AnimationEvent, EasingFunction, Rect } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import { ref, shallowRef, toValue } from 'vue'

/**
 * Animation state for a single element
 * Contains position information and animation metadata
 */
interface AnimationState {
  /** Target element being animated */
  target: HTMLElement
  /** Element's rectangle before animation */
  rect: Rect
  /** Element's starting position for animation */
  fromRect?: Rect
  /** Element's target position for animation */
  toRect?: Rect
  /** Previous starting position (for chained animations) */
  prevFromRect?: Rect
  /** Previous target position (for chained animations) */
  prevToRect?: Rect
  /** Current animation duration */
  thisAnimationDuration?: number
  /** Animation reset timer ID */
  animationResetTimer?: number
  /** Whether element is animating on X axis */
  animatingX?: boolean
  /** Whether element is animating on Y axis */
  animatingY?: boolean
  /** Animation completion timer ID */
  animated?: number
}

/**
 * Animation configuration options
 * Defines how animations should be performed
 */
export interface AnimationOptions {
  /** Animation duration in milliseconds */
  animation?: number
  /** Easing function for animations */
  easing?: EasingFunction
  /** Whether animations are enabled */
  disabled?: boolean
}

/**
 * Animation manager class based on SortableJS AnimationStateManager.
 * Manages smooth animations during drag and drop operations.
 *
 * Features:
 * - Element position capture and animation
 * - CSS transform-based animations for performance
 * - Support for custom duration and easing
 * - Animation cancellation and cleanup
 * - Vue3 reactive state management
 */
export class AnimationManager {
  // Reactive state
  public readonly isAnimating = ref(false)
  public readonly animatingElements = shallowRef<HTMLElement[]>([])

  // Internal state
  private animationStates: AnimationState[] = []
  private animationCallbackTimer?: NodeJS.Timeout
  private options: MaybeRefOrGetter<AnimationOptions>
  private containerElement: HTMLElement | null = null

  /**
   * Create a new AnimationManager instance.
   *
   * @param container - Container element for animations
   * @param options - Animation configuration options
   */
  constructor(
    container: HTMLElement | null = null,
    options: MaybeRefOrGetter<AnimationOptions> = {},
  ) {
    this.containerElement = container
    this.options = options
  }

  /**
   * Update the container element.
   *
   * @param container - New container element
   */
  setContainer(container: HTMLElement | null): void {
    this.containerElement = container
  }

  /**
   * Update animation options.
   *
   * @param options - New animation options
   */
  updateOptions(options: MaybeRefOrGetter<AnimationOptions>): void {
    this.options = options
  }

  /**
   * Capture the current state of all child elements.
   * This should be called before DOM changes that need animation.
   */
  captureAnimationState(): void {
    this.animationStates = []

    const resolvedOptions = this.resolveOptions()
    if (!resolvedOptions.animation || resolvedOptions.disabled || !this.containerElement) {
      return
    }

    const children = Array.from(this.containerElement.children) as HTMLElement[]

    children.forEach((child) => {
      // Skip hidden elements and ghost elements
      if (this.getComputedStyle(child, 'display') === 'none'
        || child.classList.contains('sortable-ghost')) {
        return
      }

      const rect = this.getElementRect(child)
      this.animationStates.push({
        target: child,
        rect: { ...rect },
      })

      const fromRect = { ...rect }

      // If element is currently animating, compensate for current animation
      if (child.thisAnimationDuration) {
        const matrix = this.getTransformMatrix(child)
        if (matrix) {
          fromRect.top -= matrix.f
          fromRect.left -= matrix.e
        }
      }

      // Store the starting position on the element
      child.fromRect = fromRect
    })
  }

  /**
   * Add an animation state for an element.
   *
   * @param state - Animation state to add
   */
  addAnimationState(state: AnimationState): void {
    this.animationStates.push(state)
  }

  /**
   * Remove animation state for a specific element.
   *
   * @param target - Element to remove animation state for
   */
  removeAnimationState(target: HTMLElement): void {
    const index = this.animationStates.findIndex(state => state.target === target)
    if (index !== -1) {
      this.animationStates.splice(index, 1)
    }
  }

  /**
   * Animate all elements to their new positions.
   * This should be called after DOM changes to animate elements smoothly.
   *
   * @param callback - Optional callback to execute when animations complete
   */
  animateAll(callback?: () => void): void {
    const resolvedOptions = this.resolveOptions()

    if (!resolvedOptions.animation || resolvedOptions.disabled) {
      clearTimeout(this.animationCallbackTimer)
      if (typeof callback === 'function') {
        callback()
      }
      return
    }

    let animating = false
    let animationTime = 0
    const animatingElements: HTMLElement[] = []

    this.animationStates.forEach((state) => {
      let time = 0
      const target = state.target
      const fromRect = target.fromRect
      const toRect = this.getElementRect(target)
      const prevFromRect = target.prevFromRect
      const prevToRect = target.prevToRect
      const animatingRect = state.rect

      // Compensate for current transform if element has matrix
      const targetMatrix = this.getTransformMatrix(target)
      if (targetMatrix) {
        toRect.top -= targetMatrix.f
        toRect.left -= targetMatrix.e
      }

      target.toRect = toRect

      // Handle chained animations
      if (target.thisAnimationDuration) {
        if (this.isRectEqual(prevFromRect, toRect)
          && !this.isRectEqual(fromRect, toRect)
          && this.isOnSameLine(animatingRect, toRect, fromRect)) {
          // Calculate real time for smooth transition
          time = this.calculateRealTime(animatingRect, prevFromRect, prevToRect, resolvedOptions)
        }
      }

      // Only animate if positions are different
      if (!this.isRectEqual(toRect, fromRect)) {
        target.prevFromRect = fromRect
        target.prevToRect = toRect

        if (!time) {
          time = resolvedOptions.animation || 150
        }

        this.animate(target, animatingRect, toRect, time)
        animatingElements.push(target)
      }

      if (time) {
        animating = true
        animationTime = Math.max(animationTime, time)

        // Clear existing timer
        clearTimeout(target.animationResetTimer)

        // Set reset timer
        target.animationResetTimer = setTimeout(() => {
          target.animationTime = 0
          target.prevFromRect = null
          target.fromRect = null
          target.prevToRect = null
          target.thisAnimationDuration = null
        }, time)

        target.thisAnimationDuration = time
      }
    })

    // Update reactive state
    this.isAnimating.value = animating
    this.animatingElements.value = animatingElements

    // Handle animation completion
    clearTimeout(this.animationCallbackTimer)
    if (!animating) {
      if (typeof callback === 'function') {
        callback()
      }
    }
    else {
      this.animationCallbackTimer = setTimeout(() => {
        this.isAnimating.value = false
        this.animatingElements.value = []
        if (typeof callback === 'function') {
          callback()
        }
      }, animationTime)
    }

    // Clear animation states
    this.animationStates = []
  }

  /**
   * Animate a single element from current position to target position.
   * Uses CSS transforms for optimal performance.
   *
   * @param target - Element to animate
   * @param currentRect - Current position rectangle
   * @param toRect - Target position rectangle
   * @param duration - Animation duration in milliseconds
   */
  animate(target: HTMLElement, currentRect: Rect, toRect: Rect, duration: number): void {
    if (!duration)
      return

    const resolvedOptions = this.resolveOptions()

    // Clear any existing transitions and transforms
    this.setElementStyle(target, 'transition', '')
    this.setElementStyle(target, 'transform', '')

    // Get container transform matrix for scaling compensation
    const containerMatrix = this.containerElement ? this.getTransformMatrix(this.containerElement) : null
    const scaleX = containerMatrix?.a || 1
    const scaleY = containerMatrix?.d || 1

    // Calculate translation distances
    const translateX = (currentRect.left - toRect.left) / scaleX
    const translateY = (currentRect.top - toRect.top) / scaleY

    // Track animation axes
    target.animatingX = !!translateX
    target.animatingY = !!translateY

    // Apply initial transform to move element to starting position
    this.setElementStyle(target, 'transform', `translate3d(${translateX}px,${translateY}px,0)`)

    // Force repaint to ensure transform is applied
    this.forceRepaint(target)

    // Apply transition and animate to final position
    const easing = resolvedOptions.easing || 'ease'
    this.setElementStyle(target, 'transition', `transform ${duration}ms ${easing}`)
    this.setElementStyle(target, 'transform', 'translate3d(0,0,0)')

    // Dispatch animation start event
    this.dispatchAnimationEvent('start', target, duration, easing)

    // Clear animation after completion
    if (target.animated) {
      clearTimeout(target.animated)
    }
    target.animated = setTimeout(() => {
      this.setElementStyle(target, 'transition', '')
      this.setElementStyle(target, 'transform', '')
      target.animated = false
      target.animatingX = false
      target.animatingY = false

      // Dispatch animation end event
      this.dispatchAnimationEvent('end', target, duration, easing)
    }, duration)
  }

  /**
   * Cancel all ongoing animations.
   * Immediately stops all animations and cleans up state.
   */
  cancelAnimations(): void {
    // Cancel global animation callback
    clearTimeout(this.animationCallbackTimer)

    // Cancel individual element animations
    this.animatingElements.value.forEach((element) => {
      if (element.animated) {
        clearTimeout(element.animated)
      }
      if (element.animationResetTimer) {
        clearTimeout(element.animationResetTimer)
      }

      // Clear styles
      this.setElementStyle(element, 'transition', '')
      this.setElementStyle(element, 'transform', '')

      // Reset animation properties
      element.animated = false
      element.animatingX = false
      element.animatingY = false
      element.thisAnimationDuration = null
      element.fromRect = null
      element.toRect = null
      element.prevFromRect = null
      element.prevToRect = null

      // Dispatch cancel event
      this.dispatchAnimationEvent('cancel', element)
    })

    // Reset reactive state
    this.isAnimating.value = false
    this.animatingElements.value = []
    this.animationStates = []
  }

  /**
   * Destroy the animation manager and clean up all resources.
   */
  destroy(): void {
    this.cancelAnimations()
    this.containerElement = null
  }

  // Private utility methods

  /**
   * Resolve current animation options from reactive reference.
   */
  private resolveOptions(): AnimationOptions {
    return toValue(this.options)
  }

  /**
   * Get element's bounding rectangle.
   *
   * @param element - Element to get rectangle for
   * @returns Element's bounding rectangle
   */
  private getElementRect(element: HTMLElement): Rect {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    }
  }

  /**
   * Get computed style property for an element.
   *
   * @param element - Element to get style for
   * @param property - CSS property name
   * @returns Computed style value
   */
  private getComputedStyle(element: HTMLElement, property: string): string {
    return window.getComputedStyle(element).getPropertyValue(property)
  }

  /**
   * Set CSS style property on an element.
   *
   * @param element - Element to set style on
   * @param property - CSS property name
   * @param value - CSS property value
   */
  private setElementStyle(element: HTMLElement, property: string, value: string): void {
    element.style.setProperty(property, value)
  }

  /**
   * Get transform matrix for an element.
   *
   * @param element - Element to get matrix for
   * @param includeParents - Whether to include parent transforms
   * @returns Transform matrix or null
   */
  private getTransformMatrix(element: HTMLElement, _includeParents = false): DOMMatrix | null {
    try {
      const transform = this.getComputedStyle(element, 'transform')
      if (transform && transform !== 'none') {
        return new DOMMatrix(transform)
      }
    }
    catch {
      // Fallback for browsers without DOMMatrix support
      console.warn('DOMMatrix not supported, animations may be less accurate')
    }
    return null
  }

  /**
   * Force a repaint of an element.
   *
   * @param element - Element to repaint
   * @returns Element's offset width (triggers repaint)
   */
  private forceRepaint(element: HTMLElement): number {
    return element.offsetWidth
  }

  /**
   * Check if two rectangles are equal.
   *
   * @param rect1 - First rectangle
   * @param rect2 - Second rectangle
   * @returns Whether rectangles are equal
   */
  private isRectEqual(rect1: Rect | null | undefined, rect2: Rect | null | undefined): boolean {
    if (!rect1 || !rect2)
      return false

    return Math.abs(rect1.top - rect2.top) < 1
      && Math.abs(rect1.left - rect2.left) < 1
      && Math.abs(rect1.width - rect2.width) < 1
      && Math.abs(rect1.height - rect2.height) < 1
  }

  /**
   * Check if three points are on the same line (for smooth animation transitions).
   *
   * @param animatingRect - Current animating position
   * @param toRect - Target position
   * @param fromRect - Starting position
   * @returns Whether points are on the same line
   */
  private isOnSameLine(animatingRect: Rect, toRect: Rect, fromRect: Rect | null | undefined): boolean {
    if (!fromRect)
      return false

    // Calculate slopes to determine if points are collinear
    const slope1 = (animatingRect.top - toRect.top) / (animatingRect.left - toRect.left)
    const slope2 = (fromRect.top - toRect.top) / (fromRect.left - toRect.left)

    return Math.abs(slope1 - slope2) < 0.1 // Allow small tolerance for floating point errors
  }

  /**
   * Calculate real animation time for smooth transitions.
   * Based on SortableJS calculateRealTime function.
   *
   * @param animatingRect - Current animating position
   * @param fromRect - Starting position
   * @param toRect - Target position
   * @param options - Animation options
   * @returns Calculated animation time
   */
  private calculateRealTime(
    animatingRect: Rect,
    fromRect: Rect | null | undefined,
    toRect: Rect | null | undefined,
    options: AnimationOptions,
  ): number {
    if (!fromRect || !toRect || !options.animation) {
      return options.animation || 150
    }

    // Calculate distance ratios for smooth transition
    const currentDistance = Math.sqrt(
      (fromRect.top - animatingRect.top) ** 2
      + (fromRect.left - animatingRect.left) ** 2,
    )

    const totalDistance = Math.sqrt(
      (fromRect.top - toRect.top) ** 2
      + (fromRect.left - toRect.left) ** 2,
    )

    if (totalDistance === 0)
      return 0

    return (currentDistance / totalDistance) * options.animation
  }

  /**
   * Dispatch animation event.
   *
   * @param type - Event type
   * @param target - Target element
   * @param duration - Animation duration
   * @param easing - Animation easing
   */
  private dispatchAnimationEvent(
    type: 'start' | 'end' | 'cancel',
    target: HTMLElement,
    duration?: number,
    easing?: string,
  ): void {
    const event: AnimationEvent = {
      type,
      target,
      duration,
      easing,
      properties: {
        transform: this.getComputedStyle(target, 'transform'),
        transition: this.getComputedStyle(target, 'transition'),
      },
    }

    // Dispatch custom event on the target element
    const customEvent = new CustomEvent(`sortable:animation:${type}`, {
      detail: event,
      bubbles: true,
      cancelable: true,
    })

    target.dispatchEvent(customEvent)
  }
}

// Extend HTMLElement interface to include animation properties
declare global {
  interface HTMLElement {
    fromRect?: Rect | null
    toRect?: Rect | null
    prevFromRect?: Rect | null
    prevToRect?: Rect | null
    thisAnimationDuration?: number | null
    animationResetTimer?: NodeJS.Timeout
    animatingX?: boolean
    animatingY?: boolean
    animated?: NodeJS.Timeout | false
    animationTime?: number
  }
}
