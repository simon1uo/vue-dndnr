import type { AnimationEvent, AnimationEventCallbacks, EasingFunction, Rect } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { Ref, ShallowRef } from 'vue'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, ref, shallowRef, toValue, watch } from 'vue'
import { useEventDispatcher } from './useEventDispatcher'

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
  animated?: NodeJS.Timeout | false
  /** Animation time for calculations */
  animationTime?: number
}

/**
 * Animation configuration options
 * Defines how animations should be performed
 */
export interface UseSortableAnimationOptions extends AnimationEventCallbacks {
  /** Animation duration in milliseconds */
  animation?: MaybeRefOrGetter<number>
  /** Easing function for animations */
  easing?: MaybeRefOrGetter<EasingFunction>
  /** Whether animations are disabled */
  disabled?: MaybeRefOrGetter<boolean>
}

/**
 * Return type for useSortableAnimation composable
 */
export interface UseSortableAnimationReturn {
  /** Whether animations are currently running */
  isAnimating: Ref<boolean>
  /** Elements currently being animated */
  animatingElements: ShallowRef<HTMLElement[]>
  /** Capture current state of all elements for animation */
  captureAnimationState: () => void
  /** Animate all elements to their new positions */
  animateAll: (callback?: () => void) => void
  /** Animate a single element */
  animate: (target: HTMLElement, currentRect: Rect, toRect: Rect, duration?: number) => void
  /** Cancel all ongoing animations */
  cancelAnimations: () => void
  /** Clear animation states */
  clearAnimationStates: () => void
  /** Add an animation state for an element */
  addAnimationState: (state: AnimationState) => void
  /** Remove animation state for a specific element */
  removeAnimationState: (target: HTMLElement) => void
  /** Update options */
  updateOptions: (options: Partial<UseSortableAnimationOptions>) => void
}

/**
 * Sortable animation composable.
 * Replaces AnimationManager class with Vue 3 Composition API.
 *
 * This composable provides:
 * - Element position capture and animation
 * - CSS transform-based animations for performance
 * - Support for custom duration and easing
 * - Animation cancellation and cleanup
 * - Vue 3 reactive state management
 * - Integration with existing sortable state
 *
 * @param target - Target container element
 * @param options - Animation configuration options
 * @returns Animation functionality and state
 */
export function useSortableAnimation(
  target: MaybeRefOrGetter<HTMLElement | null>,
  options: MaybeRefOrGetter<UseSortableAnimationOptions> = {},
): UseSortableAnimationReturn {
  // Reactive state
  const isAnimating = ref(false)
  const animatingElements = shallowRef<HTMLElement[]>([])

  // Internal state
  const animationStates = ref<AnimationState[]>([])
  const animationCallbackTimer = ref<NodeJS.Timeout | null>(null)

  // Computed target element
  const targetElement = computed(() => toValue(target))

  // Initialize unified event dispatcher for animation events
  const eventDispatcher = useEventDispatcher(target, {
    eventPrefix: 'sortable',
  })

  // Computed options with defaults
  const resolvedOptions = computed(() => {
    const opts = toValue(options)
    return {
      animation: toValue(opts.animation) ?? 150,
      easing: toValue(opts.easing) ?? 'ease',
      disabled: toValue(opts.disabled) ?? false,
      onAnimationStart: opts.onAnimationStart,
      onAnimationEnd: opts.onAnimationEnd,
      onAnimationCancel: opts.onAnimationCancel,
    }
  })

  /**
   * Get computed style value for an element
   */
  const getComputedStyle = (element: HTMLElement, property: string): string => {
    return window.getComputedStyle(element).getPropertyValue(property)
  }

  /**
   * Get element's bounding rectangle
   */
  const getElementRect = (element: HTMLElement): Rect => {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    }
  }

  /**
   * Get CSS transform matrix for an element
   */
  const getTransformMatrix = (element: HTMLElement): DOMMatrix | null => {
    const transform = getComputedStyle(element, 'transform')
    if (transform === 'none')
      return null

    try {
      return new DOMMatrix(transform)
    }
    catch {
      return null
    }
  }

  /**
   * Set CSS style property on an element with !important to override any CSS classes
   */
  const setElementStyle = (element: HTMLElement, property: string, value: string): void => {
    if (value === '') {
      // Remove the property entirely
      element.style.removeProperty(property)
    }
    else {
      // Set with !important to override CSS classes like transition-all
      element.style.setProperty(property, value, 'important')
    }
  }

  /**
   * Force a repaint of an element
   */
  const forceRepaint = (element: HTMLElement): number => {
    return element.offsetWidth
  }

  /**
   * Check if two rectangles are equal within tolerance
   */
  const isRectEqual = (rect1: Rect | null | undefined, rect2: Rect | null | undefined): boolean => {
    if (!rect1 || !rect2)
      return false

    return Math.abs(rect1.top - rect2.top) < 1
      && Math.abs(rect1.left - rect2.left) < 1
      && Math.abs(rect1.width - rect2.width) < 1
      && Math.abs(rect1.height - rect2.height) < 1
  }

  /**
   * Check if three points are on the same line (for smooth animation transitions)
   */
  const isOnSameLine = (animatingRect: Rect, toRect: Rect, fromRect: Rect | null | undefined): boolean => {
    if (!fromRect)
      return false

    // Calculate slopes to determine if points are collinear
    const slope1 = (animatingRect.top - toRect.top) / (animatingRect.left - toRect.left)
    const slope2 = (fromRect.top - toRect.top) / (fromRect.left - toRect.left)

    return Math.abs(slope1 - slope2) < 0.1 // Allow small tolerance for floating point errors
  }

  /**
   * Calculate real animation time for smooth transitions
   * Based on SortableJS calculateRealTime function
   */
  const calculateRealTime = (
    animatingRect: Rect,
    fromRect: Rect | null | undefined,
    toRect: Rect | null | undefined,
    animationDuration: number,
  ): number => {
    if (!fromRect || !toRect || !animationDuration) {
      return animationDuration || 150
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

    return (currentDistance / totalDistance) * animationDuration
  }

  /**
   * Dispatch animation event using unified event dispatcher
   */
  const dispatchAnimationEvent = (
    type: 'start' | 'end' | 'cancel',
    target: HTMLElement,
    duration?: number,
    easing?: string,
  ): void => {
    const opts = resolvedOptions.value

    // Get appropriate callback based on event type
    let callback: ((event: AnimationEvent) => void) | undefined
    if (type === 'start' && opts.onAnimationStart) {
      callback = opts.onAnimationStart
    }
    else if (type === 'end' && opts.onAnimationEnd) {
      callback = opts.onAnimationEnd
    }
    else if (type === 'cancel' && opts.onAnimationCancel) {
      callback = opts.onAnimationCancel
    }

    // Dispatch animation event using unified event dispatcher
    eventDispatcher.dispatchAnimation(type, target, duration, easing, callback)
  }

  /**
   * Capture current state of all elements for animation
   */
  const captureAnimationState = (): void => {
    const opts = resolvedOptions.value
    const containerElement = targetElement.value

    // Clear previous states
    animationStates.value = []

    // Skip if animations are disabled or no container
    if (opts.disabled || !containerElement)
      return

    const children = Array.from(containerElement.children) as HTMLElement[]

    children.forEach((child) => {
      // Skip hidden elements and ghost elements
      if (getComputedStyle(child, 'display') === 'none'
        || child.classList.contains('sortable-ghost')) {
        return
      }

      const rect = getElementRect(child)
      animationStates.value.push({
        target: child,
        rect: { ...rect },
      })

      const fromRect = { ...rect }

      // If element is currently animating, compensate for current animation
      if (child.thisAnimationDuration) {
        const matrix = getTransformMatrix(child)
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
   * Animate a single element from current position to target position.
   * Uses CSS transforms for optimal performance.
   */
  const animate = (target: HTMLElement, currentRect: Rect, toRect: Rect, duration?: number): void => {
    const opts = resolvedOptions.value
    const animationDuration = duration ?? opts.animation

    if (!animationDuration)
      return

    // Clear existing transitions and transforms completely
    setElementStyle(target, 'transition', '')
    setElementStyle(target, 'transition-property', '')
    setElementStyle(target, 'transition-duration', '')
    setElementStyle(target, 'transition-timing-function', '')
    setElementStyle(target, 'transform', '')

    // Get container matrix for scaling calculations
    const containerElement = targetElement.value
    let scaleX = 1
    let scaleY = 1

    if (containerElement) {
      const containerMatrix = getTransformMatrix(containerElement)
      if (containerMatrix) {
        scaleX = containerMatrix.a || 1
        scaleY = containerMatrix.d || 1
      }
    }

    // Calculate translation values
    const translateX = (currentRect.left - toRect.left) / scaleX
    const translateY = (currentRect.top - toRect.top) / scaleY

    // Set animation flags
    target.animatingX = !!translateX
    target.animatingY = !!translateY

    // Apply initial transform to move element to starting position
    const initialTransform = `translate3d(${translateX}px, ${translateY}px, 0)`
    setElementStyle(target, 'transform', initialTransform)

    // Force repaint to ensure transform is applied
    forceRepaint(target)

    // Store animation duration on element
    target.thisAnimationDuration = animationDuration

    // Use requestAnimationFrame to ensure styles are applied before starting animation
    requestAnimationFrame(() => {
      // Apply transition and animate to final position
      const easing = opts.easing || 'ease'
      const transition = `transform ${animationDuration}ms ${easing}`
      setElementStyle(target, 'transition', transition)
      setElementStyle(target, 'transform', 'translate3d(0, 0, 0)')

      // Dispatch animation start event
      dispatchAnimationEvent('start', target, animationDuration, easing)

      // Clear animation after completion
      if (target.animated) {
        clearTimeout(target.animated)
      }
      target.animated = setTimeout(() => {
        setElementStyle(target, 'transition', '')
        setElementStyle(target, 'transform', '')
        target.animated = false
        target.animatingX = false
        target.animatingY = false

        // Dispatch animation end event
        dispatchAnimationEvent('end', target, animationDuration, easing)
      }, animationDuration)
    })
  }

  /**
   * Animate all elements to their new positions
   */
  const animateAll = (callback?: () => void): void => {
    const opts = resolvedOptions.value

    // Skip if animations are disabled
    if (opts.disabled || !opts.animation) {
      // Clear any existing animation timer
      if (animationCallbackTimer.value) {
        clearTimeout(animationCallbackTimer.value)
        animationCallbackTimer.value = null
      }
      if (typeof callback === 'function') {
        callback()
      }
      return
    }

    let animating = false
    let animationTime = 0
    const elementsToAnimate: HTMLElement[] = []

    // Process each animation state
    animationStates.value.forEach((state) => {
      let time = 0
      const target = state.target
      const fromRect = target.fromRect
      const toRect = getElementRect(target)
      const prevFromRect = target.prevFromRect
      const prevToRect = target.prevToRect
      const animatingRect = state.rect

      // Compensate for current transform if element has matrix
      const targetMatrix = getTransformMatrix(target)
      if (targetMatrix) {
        toRect.top -= targetMatrix.f
        toRect.left -= targetMatrix.e
      }

      target.toRect = toRect

      // Handle chained animations
      if (target.thisAnimationDuration) {
        if (isRectEqual(prevFromRect, toRect)
          && !isRectEqual(fromRect, toRect)
          && isOnSameLine(animatingRect, toRect, fromRect)) {
          // Calculate real time for smooth transition
          time = calculateRealTime(animatingRect, prevFromRect, prevToRect, opts.animation)
        }
      }

      // Only animate if positions are different
      if (!isRectEqual(toRect, fromRect)) {
        target.prevFromRect = fromRect
        target.prevToRect = toRect

        if (!time) {
          time = opts.animation || 150
        }

        animate(target, animatingRect, toRect, time)
        elementsToAnimate.push(target)
      }

      if (time) {
        animating = true
        animationTime = Math.max(animationTime, time)

        // Clear existing timer
        if (target.animationResetTimer) {
          clearTimeout(target.animationResetTimer)
        }

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
    isAnimating.value = animating
    animatingElements.value = elementsToAnimate

    // Handle animation completion
    if (animationCallbackTimer.value) {
      clearTimeout(animationCallbackTimer.value)
      animationCallbackTimer.value = null
    }

    if (!animating) {
      if (typeof callback === 'function') {
        callback()
      }
    }
    else {
      animationCallbackTimer.value = setTimeout(() => {
        isAnimating.value = false
        animatingElements.value = []
        if (typeof callback === 'function') {
          callback()
        }
      }, animationTime)
    }

    // Clear animation states
    animationStates.value = []
  }

  /**
   * Cancel all ongoing animations
   */
  const cancelAnimations = (): void => {
    // Clear global animation callback
    if (animationCallbackTimer.value) {
      clearTimeout(animationCallbackTimer.value)
      animationCallbackTimer.value = null
    }

    // Cancel individual element animations
    animatingElements.value.forEach((element) => {
      if (element.animated) {
        clearTimeout(element.animated)
      }
      if (element.animationResetTimer) {
        clearTimeout(element.animationResetTimer)
      }

      // Clear styles using utility method
      setElementStyle(element, 'transition', '')
      setElementStyle(element, 'transform', '')

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
      dispatchAnimationEvent('cancel', element)
    })

    // Reset reactive state
    isAnimating.value = false
    animatingElements.value = []
    animationStates.value = []
  }

  /**
   * Clear all animation states
   */
  const clearAnimationStates = (): void => {
    animationStates.value = []
  }

  /**
   * Add an animation state for an element
   */
  const addAnimationState = (state: AnimationState): void => {
    animationStates.value.push(state)
  }

  /**
   * Remove animation state for a specific element
   */
  const removeAnimationState = (target: HTMLElement): void => {
    const index = animationStates.value.findIndex(state => state.target === target)
    if (index !== -1) {
      animationStates.value.splice(index, 1)
    }
  }

  /**
   * Update animation options
   */
  const updateOptions = (newOptions: Partial<UseSortableAnimationOptions>): void => {
    // For MaybeRefOrGetter, we need to handle the update differently
    // This is a simplified approach - in practice, you might want to use a ref for options
    if (typeof options === 'object' && options !== null) {
      Object.assign(options, newOptions)
    }
  }

  // Cleanup on unmount
  tryOnUnmounted(() => {
    cancelAnimations()
  })

  // Watch for container changes to clear states
  watch(
    targetElement,
    () => {
      // Clear animation states when container changes
      clearAnimationStates()
    },
  )

  return {
    isAnimating,
    animatingElements,
    captureAnimationState,
    animateAll,
    animate,
    cancelAnimations,
    clearAnimationStates,
    addAnimationState,
    removeAnimationState,
    updateOptions,
  }
}

export default useSortableAnimation
