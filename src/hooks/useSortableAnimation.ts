import type { AnimationEvent, EasingFunction, Rect } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, ref, shallowRef, toValue, watch } from 'vue'

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
export interface UseSortableAnimationOptions {
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
  isAnimating: ReturnType<typeof ref<boolean>>
  /** Elements currently being animated */
  animatingElements: ReturnType<typeof shallowRef<HTMLElement[]>>
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

  // Computed options with defaults
  const resolvedOptions = computed(() => {
    const opts = toValue(options)
    return {
      animation: toValue(opts.animation) ?? 150,
      easing: toValue(opts.easing) ?? 'ease',
      disabled: toValue(opts.disabled) ?? false,
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
   * Dispatch animation event
   */
  const dispatchAnimationEvent = (
    type: 'start' | 'end' | 'cancel',
    target: HTMLElement,
    duration?: number,
    easing?: string,
  ): void => {
    const event: AnimationEvent = {
      type,
      target,
      duration,
      easing,
      properties: {
        transform: getComputedStyle(target, 'transform'),
        transition: getComputedStyle(target, 'transition'),
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

    // Clear existing transitions and transforms
    target.style.transition = ''
    target.style.transform = ''

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

    // Apply initial transform
    target.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`

    // Store animation duration on element
    target.thisAnimationDuration = animationDuration

    // Dispatch animation start event
    dispatchAnimationEvent('start', target, animationDuration, opts.easing)

    // Apply transition and animate to final position
    target.style.transition = `transform ${animationDuration}ms ${opts.easing}`
    target.style.transform = 'translate3d(0, 0, 0)'

    // Set up animation completion cleanup
    target.animationResetTimer = setTimeout(() => {
      // Clean up animation properties
      target.style.transition = ''
      target.style.transform = ''
      target.thisAnimationDuration = undefined
      target.animatingX = false
      target.animatingY = false
      target.fromRect = undefined
      target.toRect = undefined

      // Dispatch animation end event
      dispatchAnimationEvent('end', target, animationDuration, opts.easing)
    }, animationDuration)
  }

  /**
   * Animate all elements to their new positions
   */
  const animateAll = (callback?: () => void): void => {
    const opts = resolvedOptions.value

    // Skip if animations are disabled
    if (opts.disabled || animationStates.value.length === 0) {
      if (callback)
        callback()
      return
    }

    // Clear any existing animation timer
    if (animationCallbackTimer.value) {
      clearTimeout(animationCallbackTimer.value)
      animationCallbackTimer.value = null
    }

    const elementsToAnimate: HTMLElement[] = []

    // Process each animation state
    animationStates.value.forEach((state) => {
      const { target } = state
      const currentRect = getElementRect(target)
      const fromRect = target.fromRect

      if (!fromRect)
        return

      // Calculate if animation is needed
      const dx = fromRect.left - currentRect.left
      const dy = fromRect.top - currentRect.top

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        // Only add to animating elements if animation duration > 0
        if (opts.animation && opts.animation > 0) {
          elementsToAnimate.push(target)
          animate(target, fromRect, currentRect, opts.animation)
        }
      }
    })

    // Update animating elements
    animatingElements.value = elementsToAnimate

    // Set up completion callback
    const animationTime = opts.animation || 150
    if (animationTime > 0 && elementsToAnimate.length > 0) {
      // Only set animating state if we have elements to animate and duration > 0
      isAnimating.value = true
      animationCallbackTimer.value = setTimeout(() => {
        isAnimating.value = false
        animatingElements.value = []
        if (typeof callback === 'function') {
          callback()
        }
      }, animationTime)
    }
    else {
      // No animation needed or zero duration
      isAnimating.value = false
      animatingElements.value = []
      if (typeof callback === 'function') {
        callback()
      }
    }

    // Clear animation states
    animationStates.value = []
  }

  /**
   * Cancel all ongoing animations
   */
  const cancelAnimations = (): void => {
    // Clear animation timer
    if (animationCallbackTimer.value) {
      clearTimeout(animationCallbackTimer.value)
      animationCallbackTimer.value = null
    }

    // Cancel animations for all animating elements
    animatingElements.value.forEach((element) => {
      // Clear animation properties
      element.style.transition = ''
      element.style.transform = ''
      element.thisAnimationDuration = undefined
      element.animatingX = false
      element.animatingY = false
      element.fromRect = undefined
      element.toRect = undefined

      // Clear animation reset timer
      if (element.animationResetTimer) {
        clearTimeout(element.animationResetTimer)
        element.animationResetTimer = undefined
      }

      // Dispatch animation cancel event
      dispatchAnimationEvent('cancel', element)
    })

    // Reset state
    isAnimating.value = false
    animatingElements.value = []
    animationStates.value = []
  }

  const clearAnimationStates = () => {
    animationStates.value = []
  }

  const updateOptions = (newOptions: Partial<UseSortableAnimationOptions>) => {
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
    updateOptions,
  }
}

export default useSortableAnimation
