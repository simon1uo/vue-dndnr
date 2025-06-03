import type { DragId, DropId } from '@/types/core'
import type { MaybeRefOrGetter } from 'vue'
import { tryOnUnmounted, useDebounceFn, useElementBounding, useElementSize, useScroll, useThrottleFn, useWindowScroll } from '@vueuse/core'

import { shallowRef, toValue, watch } from 'vue'

/**
 * Options for the dimension observer
 */
export interface DimensionObserverOptions {
  /**
   * Whether to observe window resize events
   * @default true
   */
  windowResize?: boolean

  /**
   * Whether to observe window scroll events
   * @default true
   */
  windowScroll?: boolean

  /**
   * Whether to observe element resize events
   * @default true
   */
  elementResize?: boolean

  /**
   * Whether to observe element scroll events
   * @default true
   */
  elementScroll?: boolean

  /**
   * Debounce delay for resize events in milliseconds
   * @default 16 (roughly one frame at 60fps)
   */
  resizeDebounce?: number

  /**
   * Throttle delay for scroll events in milliseconds
   * @default 16 (roughly one frame at 60fps)
   */
  scrollThrottle?: number

  /**
   * Whether to trigger update immediately on setup
   * @default true
   */
  immediate?: boolean
}

/**
 * Composable function for observing dimension changes of elements
 * @param target - Reference to the target element
 * @param onUpdate - Callback function called when dimensions need to be updated
 * @param options - Configuration options
 * @returns Object containing observer control methods
 */
export function useDimensionObserver(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
  onUpdate: (type: 'drag' | 'drop', id: DragId | DropId) => void,
  options: DimensionObserverOptions = {},
) {
  // Default options
  const {
    windowResize = true,
    windowScroll = true,
    elementResize = true,
    elementScroll = true,
    resizeDebounce = 16,
    scrollThrottle = 16,
    immediate = true,
  } = options

  // Store element ID for updates
  const elementId = shallowRef<DragId | DropId | null>(null)
  const elementType = shallowRef<'drag' | 'drop' | null>(null)

  // Track if observer is active
  const isActive = shallowRef(false)

  // Store cleanup functions
  const cleanupFunctions: (() => void)[] = []

  // Debounced update function for resize events
  const debouncedUpdate = useDebounceFn(() => {
    if (isActive.value && elementId.value && elementType.value)
      onUpdate(elementType.value, elementId.value)
  }, resizeDebounce)

  // Throttled update function for scroll events
  const throttledUpdate = useThrottleFn(() => {
    if (isActive.value && elementId.value && elementType.value)
      onUpdate(elementType.value, elementId.value)
  }, scrollThrottle)

  /**
   * Start observing dimension changes
   * @param type - Type of element (drag or drop)
   * @param id - ID of the element
   */
  function observe(type: 'drag' | 'drop', id: DragId | DropId) {
    // Store element info
    elementId.value = id
    elementType.value = type
    isActive.value = true

    const el = toValue(target)
    if (!el)
      return

    // Setup observers based on options
    if (elementResize) {
      // Element size observer using useElementSize
      const { width, height } = useElementSize(target)
      const stopElementResize = watch([width, height], () => {
        debouncedUpdate()
      }, { immediate })
      cleanupFunctions.push(stopElementResize)
    }

    if (elementScroll && type === 'drop') {
      // Element scroll observer using useScroll
      const { x, y } = useScroll(target)
      const stopElementScroll = watch([x, y], () => {
        throttledUpdate()
      }, { immediate })
      cleanupFunctions.push(stopElementScroll)
    }

    if (windowResize) {
      // Window resize observer using useElementBounding
      const { width, height } = useElementBounding(target, {
        windowResize: true,
        windowScroll: false,
      })
      const stopWindowResize = watch([width, height], () => {
        debouncedUpdate()
      }, { immediate })
      cleanupFunctions.push(stopWindowResize)
    }

    if (windowScroll) {
      // Window scroll observer using useWindowScroll
      const { x, y } = useWindowScroll()
      const stopWindowScroll = watch([x, y], () => {
        throttledUpdate()
      }, { immediate })
      cleanupFunctions.push(stopWindowScroll)
    }

    // Initial update if immediate is true
    if (immediate)
      debouncedUpdate()
  }

  /**
   * Stop observing dimension changes and clean up all resources
   */
  function disconnect() {
    isActive.value = false
    elementId.value = null
    elementType.value = null

    // Clean up all observers
    cleanupFunctions.forEach(cleanup => cleanup())
    cleanupFunctions.length = 0
  }

  /**
   * Update the element ID being observed
   * @param type - Type of element (drag or drop)
   * @param id - ID of the element
   */
  function updateElementId(type: 'drag' | 'drop', id: DragId | DropId) {
    elementId.value = id
    elementType.value = type
  }

  // Clean up when component is unmounted
  tryOnUnmounted(() => {
    disconnect()
  })

  return {
    observe,
    disconnect,
    updateElementId,
    isActive,
  }
}

export default useDimensionObserver
