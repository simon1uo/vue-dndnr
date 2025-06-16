import type { EasingFunction, SortableDirectionFunction, SortableEventCallbacks, SortableFilterFunction, SortableGroup, SortDirection } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { ref, shallowRef } from 'vue'
import { globalGroupManager } from '@/utils/group-manager'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, nextTick, toValue, watch } from 'vue'
import { useEventDispatcher } from './useEventDispatcher'
import useSortableAnimation from './useSortableAnimation'
import useSortableDrag from './useSortableDrag'
import useSortableState from './useSortableState'

/**
 * Check if element matches selector with cross-browser support
 * Based on SortableJS matches function
 * @param el - The element to check
 * @param selector - The selector to check
 * @returns Whether the element matches the selector
 */
function matchesSelector(el: HTMLElement, selector: string): boolean {
  if (!selector)
    return true

  // Handle child selector
  if (selector.startsWith('>')) {
    selector = selector.substring(1).trim()
  }

  if (!el)
    return false

  try {
    if (el.matches) {
      return el.matches(selector)
    }
    else if ((el as any).msMatchesSelector) {
      return (el as any).msMatchesSelector(selector)
    }
    else if ((el as any).webkitMatchesSelector) {
      return (el as any).webkitMatchesSelector(selector)
    }
  }
  catch {
    return false
  }

  return false
}
/**
 * Get all draggable children from container
 * Based on SortableJS getChild logic
 * @param container - The parent container
 * @param selector - Selector for draggable elements (default: '> *')
 * @returns Array of draggable child elements
 */
export function getDraggableChildren(
  container: HTMLElement,
  selector = '> *',
): HTMLElement[] {
  if (!container)
    return []

  const children = Array.from(container.children) as HTMLElement[]

  return children.filter((child) => {
    // Skip hidden elements and templates
    if (
      child.style.display === 'none'
      || child.nodeName.toUpperCase() === 'TEMPLATE'
    ) {
      return false
    }

    // Apply selector filter
    return matchesSelector(child, selector)
  })
}

/**
 * Options for useSortable composable.
 * Extends SortableOptions with Vue3-specific configurations.
 */
export interface UseSortableOptions extends SortableEventCallbacks {
  /**
   * Group configuration with reactive support
   * @default undefined
   */
  group?: MaybeRefOrGetter<string | SortableGroup>
  /**
   * Sorting within list with reactive support
   * @default true
   */
  sort?: MaybeRefOrGetter<boolean>
  /**
   * Disabled state with reactive support
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>
  /**
   * Delay before drag starts with reactive support
   * @default 0
   */
  delay?: MaybeRefOrGetter<number>
  /**
   * Only delay on touch with reactive support
   * @default false
   */
  delayOnTouchOnly?: MaybeRefOrGetter<boolean>
  /**
   * Touch start threshold with reactive support
   * @default 0
   */
  touchStartThreshold?: MaybeRefOrGetter<number>
  /**
   * Draggable selector with reactive support
   * @default undefined
   */
  draggable?: MaybeRefOrGetter<string>
  /**
   * Handle selector with reactive support
   * @default undefined
   */
  handle?: MaybeRefOrGetter<string>
  /**
   * Filter selector or function with reactive support
   * @default undefined
   */
  filter?: MaybeRefOrGetter<string | SortableFilterFunction>
  /**
   * Prevent on filter with reactive support
   * @default true
   */
  preventOnFilter?: MaybeRefOrGetter<boolean>
  /**
   * Ghost class with reactive support
   * @default 'sortable-ghost'
   */
  ghostClass?: MaybeRefOrGetter<string>
  /**
   * Chosen class with reactive support
   * @default 'sortable-chosen'
   */
  chosenClass?: MaybeRefOrGetter<string>
  /**
   * Drag class with reactive support
   * @default 'sortable-drag'
   */
  dragClass?: MaybeRefOrGetter<string>
  /**
   * Invert swap with reactive support
   * @default false
   */
  invertSwap?: MaybeRefOrGetter<boolean>
  /**
   * Threshold of the inverted swap zone with reactive support
   * @default swapThreshold
   */
  invertedSwapThreshold?: MaybeRefOrGetter<number>
  /**
   * Animation duration with reactive support
   * @default 150
   */
  animation?: MaybeRefOrGetter<number>
  /**
   * Animation easing with reactive support
   * @default 'cubic-bezier(1, 0, 0, 1)'
   */
  easing?: MaybeRefOrGetter<EasingFunction>
  /**
   * Scroll configuration with reactive support
   * @default true
   */
  scroll?: MaybeRefOrGetter<boolean | HTMLElement>
  /**
   * Scroll sensitivity with reactive support
   * @default 30
   */
  scrollSensitivity?: MaybeRefOrGetter<number>
  /**
   * Scroll speed with reactive support
   * @default 10
   */
  scrollSpeed?: MaybeRefOrGetter<number>
  /**
   * Auto scroll with reactive support
   * @default true
   */
  autoScroll?: MaybeRefOrGetter<boolean>
  /**
   * Bubble scroll with reactive support
   * @default true
   */
  bubbleScroll?: MaybeRefOrGetter<boolean>
  /**
   * Swap threshold with reactive support
   * @default 1
   */
  swapThreshold?: MaybeRefOrGetter<number>
  /**
   * Sort direction with reactive support
   * @default 'vertical'
   */
  direction?: MaybeRefOrGetter<SortDirection | SortableDirectionFunction>
  /**
   * Data ID attribute with reactive support
   * @default 'data-id'
   */
  dataIdAttr?: MaybeRefOrGetter<string>
  /**
   * Ignore dragover events on non-draggable elements with reactive support
   * @default false
   */
  dragoverBubble?: MaybeRefOrGetter<boolean>
  /**
   * Remove clone from DOM when hiding with reactive support
   * @default true
   */
  removeCloneOnHide?: MaybeRefOrGetter<boolean>
  /**
   * Threshold for empty inserting with reactive support
   * @default 0
   */
  emptyInsertThreshold?: MaybeRefOrGetter<number>
  /**
   * Function to set custom data transfer with reactive support
   * @param dataTransfer The DataTransfer object
   * @param dragEl The dragged element
   */
  setData?: (dataTransfer: DataTransfer, dragEl: HTMLElement) => void

  /**
   * Force fallback mode with reactive support
   * @default false
   */
  forceFallback?: MaybeRefOrGetter<boolean>
  /**
   * Fallback class with reactive support
   * @default 'sortable-fallback'
   */
  fallbackClass?: MaybeRefOrGetter<string>
  /**
   * Fallback on body with reactive support
   * @default false
   */
  fallbackOnBody?: MaybeRefOrGetter<boolean>
  /**
   * Fallback tolerance with reactive support
   * @default 0
   */
  fallbackTolerance?: MaybeRefOrGetter<number>
  /**
   * Fallback offset with reactive support
   * @default { x: 0, y: 0 }
   */
  fallbackOffset?: MaybeRefOrGetter<{ x: number, y: number }>

  /**
   * Whether to return controls
   * @default false
   */
  controls?: boolean
  /**
   * Whether to update items immediately
   * @default true
   */
  immediate?: boolean
}

/**
 * Return type for useSortable when controls is true.
 * Advanced usage returns full control object.
 */
export interface UseSortableReturn {
  /** Reactive array of sortable items */
  items: ReturnType<typeof shallowRef<HTMLElement[]>>
  /** Whether dragging is currently active */
  isDragging: ReturnType<typeof ref<boolean>>
  /** Currently dragged element */
  dragElement: ReturnType<typeof shallowRef<HTMLElement | null>>
  /** Ghost element for visual feedback */
  ghostElement: ReturnType<typeof shallowRef<HTMLElement | null>>
  /** Current index of dragged element */
  currentIndex: ReturnType<typeof ref<number | null>>
  /** Whether animations are currently running */
  isAnimating: ReturnType<typeof ref<boolean>>
  /** Elements currently being animated */
  animatingElements: ReturnType<typeof shallowRef<HTMLElement[]>>
  /** Whether the sortable is supported in current environment */
  isSupported: boolean
  /** Whether fallback mode is currently active during drag */
  isFallbackActive: ReturnType<typeof ref<boolean>>
  /** Whether native draggable is being used (false means fallback mode) */
  nativeDraggable: ReturnType<typeof ref<boolean>>
  /** Whether the sortable is currently paused */
  isPaused: ReturnType<typeof ref<boolean>>
  /** Whether the sortable is currently disabled */
  isDisabled: ReturnType<typeof ref<boolean>>
  /** Start dragging programmatically */
  start: (element: HTMLElement) => void
  /** Stop dragging programmatically */
  stop: () => void
  /** Pause drag functionality (temporarily disable) */
  pause: () => void
  /** Resume drag functionality */
  resume: () => void
  /** Sort items programmatically */
  sort: (order: string[], useAnimation?: boolean) => void
  /** Update items list manually */
  updateItems: () => void
  /** Destroy the sortable instance */
  destroy: () => void
  /** Unified event dispatcher for programmatic event handling */
  eventDispatcher: ReturnType<typeof useEventDispatcher>
}

/**
 * Vue3 composable for sortable drag and drop functionality.
 * Based on SortableJS with Vue3 reactivity and @vueuse/core patterns.
 *
 * @param target - Target container element or selector
 * @param options - Sortable configuration options
 * @returns Reactive sortable state and controls
 *
 * @example
 * Simple usage:
 * ```ts
 * const items = useSortable(containerRef)
 * ```
 * Advanced usage with controls:
 * ```ts
 * const { items, isDragging, isFallbackActive, nativeDraggable, start, stop } = useSortable(containerRef, {
 *   controls: true,
 *   group: 'shared',
 *   animation: 150,
 *   forceFallback: false,
 *   fallbackClass: 'my-fallback-ghost',
 *   fallbackOnBody: true,
 *   fallbackOffset: { x: 10, y: 10 }
 * })
 * ```
 */
export function useSortable(
  target: MaybeRefOrGetter<HTMLElement | string | null>,
  options: UseSortableOptions & { controls: true }
): UseSortableReturn

export function useSortable(
  target: MaybeRefOrGetter<HTMLElement | string | null>,
  options?: UseSortableOptions & { controls?: false }
): ReturnType<typeof shallowRef<HTMLElement[]>>

export function useSortable(
  target: MaybeRefOrGetter<HTMLElement | string | null>,
  options: UseSortableOptions = {},
): UseSortableReturn | ReturnType<typeof shallowRef<HTMLElement[]>> {
  const {
    controls = false,
    immediate = true,
    dataIdAttr = 'data-id',
    draggable,
    group,
  } = options

  // Resolve target element
  const targetElement = computed(() => {
    const el = toValue(target)
    if (!el)
      return null
    return typeof el === 'string' ? document.querySelector(el) as HTMLElement : el
  })

  const state = useSortableState(options)

  // Initialize unified event dispatcher
  const eventDispatcher = useEventDispatcher(targetElement)

  // Initialize animation composable first
  const animation = useSortableAnimation(targetElement, options)

  // Items management
  const updateItems = () => {
    const el = toValue(targetElement)
    if (!el) {
      state._setItems([])
      return
    }

    const selector = toValue(draggable) || '> *'
    const items = getDraggableChildren(el, selector)
    state._setItems(items)
  }

  // Initialize core composable - sortableDrag provides unified state management
  const { startDrag, stopDrag, pause, resume, destroy } = useSortableDrag(targetElement, {
    ...options,
    state,
    // Integrate animation with drag events
    onStart: (evt) => {
      // Capture animation state before drag starts
      if (options.animation) {
        animation.captureAnimationState()
      }
      // Call original onStart if provided
      if (options.onStart) {
        options.onStart(evt)
      }
    },
    onEnd: (evt) => {
      // Trigger animation after drag ends
      if (options.animation) {
        animation.animateAll()
      }
      // Call original onEnd if provided
      if (options.onEnd) {
        options.onEnd(evt)
      }
    },
    onUpdate: (evt) => {
      // Update items and trigger animation for updates
      updateItems()
      if (options.animation) {
        animation.animateAll()
      }
      // Call original onUpdate if provided
      if (options.onUpdate) {
        options.onUpdate(evt)
      }
    },
    // Animation integration callbacks for drag operations
    onAnimationCapture: () => {
      // Capture animation state before DOM changes (like SortableJS capture())
      if (options.animation) {
        animation.captureAnimationState()
      }
    },
    onAnimationTrigger: () => {
      // Trigger animation after DOM changes (like SortableJS completed())
      if (options.animation) {
        animation.animateAll()
      }
    },
  })

  // Sync animation state with sortable state
  watch(animation.isAnimating, (isAnimating) => {
    if (typeof isAnimating !== 'undefined') {
      state._setAnimating(toValue(isAnimating))
    }
  }, { immediate: true })

  watch(animation.animatingElements, (elements) => {
    if (elements) {
      state._setAnimatingElements(toValue(elements))
    }
  }, { immediate: true })

  // Watch for target changes and update items
  watch(targetElement, async (newTarget, oldTarget) => {
    // Unregister old target from group manager
    if (oldTarget) {
      globalGroupManager.unregisterList(oldTarget)
    }

    if (newTarget) {
      // Register new target with group manager if group is specified
      const groupValue = toValue(group)
      if (groupValue) {
        globalGroupManager.registerList(newTarget, groupValue)
      }

      await nextTick()
      updateItems()
    }
    else {
      state._setItems([])
    }
  }, { immediate: true })

  const draggableValue = computed(() => draggable)
  const groupValue = computed(() => toValue(options.group))

  // Watch for options changes that affect items
  watch(draggableValue, () => {
    if (targetElement.value) {
      updateItems()
    }
  })

  // Watch for group changes and re-register
  watch(groupValue, (newGroup, oldGroup) => {
    const el = targetElement.value
    if (!el)
      return

    // Only re-register if group actually changed
    const newGroupValue = toValue(newGroup)
    const oldGroupValue = toValue(oldGroup)

    // Compare group values properly (handle both string and object cases)
    const newGroupName = typeof newGroupValue === 'string' ? newGroupValue : newGroupValue?.name
    const oldGroupName = typeof oldGroupValue === 'string' ? oldGroupValue : oldGroupValue?.name

    if (newGroupName !== oldGroupName) {
      if (newGroupValue) {
        globalGroupManager.registerList(el, newGroupValue)
      }
      else {
        globalGroupManager.unregisterList(el)
      }
    }
  }, { flush: 'sync' })

  // Initialize items immediately if target is available
  if (immediate && state.isSupported && targetElement.value) {
    updateItems()
  }

  // Control methods
  const start = (element: HTMLElement) => {
    if (!state.isSupported)
      return
    startDrag(element)
  }

  const stop = () => {
    if (!state.isSupported)
      return
    stopDrag()
  }

  const sort = (order: string[], useAnimation = true) => {
    if (!state.isSupported)
      return

    const el = targetElement.value
    if (!el)
      return

    const dataIdAttrValue = toValue(dataIdAttr)

    // Create mapping of IDs to elements
    const items: Record<string, HTMLElement> = {}
    state.items.value?.forEach((item) => {
      const id = item.getAttribute(dataIdAttrValue)
      if (id) {
        items[id] = item
      }
    })

    // Capture animation state before DOM changes
    if (useAnimation && options.animation) {
      animation.captureAnimationState()
    }

    // Reorder elements according to the order array
    order.forEach((id) => {
      if (items[id]) {
        el.removeChild(items[id])
        el.appendChild(items[id])
      }
    })

    // Update items after reordering
    updateItems()

    // Trigger animation after DOM changes
    if (useAnimation && options.animation) {
      animation.animateAll()
    }
  }

  // Enhanced destroy method with animation cleanup
  const enhancedDestroy = () => {
    // Unregister from group manager
    const el = targetElement.value
    if (el) {
      globalGroupManager.unregisterList(el)
    }

    // Cancel any ongoing animations
    animation.cancelAnimations()
    // Call original destroy
    destroy()
  }

  // Cleanup on unmount
  tryOnUnmounted(() => {
    enhancedDestroy()
  })

  // Return based on controls option
  if (controls) {
    return {
      items: state.items,
      isDragging: state.isDragging,
      dragElement: state.dragElement,
      ghostElement: state.ghostElement,
      currentIndex: state.currentIndex,
      isAnimating: state.isAnimating,
      animatingElements: state.animatingElements,
      isSupported: state.isSupported,
      isFallbackActive: state.isFallbackActive,
      nativeDraggable: state.nativeDraggable,
      isPaused: state.isPaused,
      isDisabled: state.isDisabled,
      start,
      stop,
      pause,
      resume,
      sort,
      updateItems,
      destroy: enhancedDestroy,
      eventDispatcher,
    }
  }

  // Simple usage - return only items
  return state.items
}

export default useSortable
