import type { SortableEventCallbacks, SortableOptions } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { shallowRef } from 'vue'
import { SortableManager } from '@/core/sortable-manager'
import { tryOnUnmounted } from '@vueuse/core'
import { ref } from 'vue'

/**
 * Options for useSortable composable.
 * Extends SortableOptions with Vue3-specific configurations.
 */
export interface UseSortableOptions extends SortableOptions, SortableEventCallbacks {
  /**
   * Whether to return controls object instead of simple reactive state.
   * When true, returns an object with all state and methods.
   * When false, returns only the items array for simple usage.
   * @default false
   */
  controls?: boolean
  /**
   * Whether to initialize the sortable immediately.
   * @default true
   */
  immediate?: boolean
}

/**
 * Return type for useSortable when controls is false.
 * Simple usage returns only the items array.
 */
export type UseSortableReturn = ReturnType<typeof useSortable>

/**
 * Return type for useSortable when controls is true.
 * Advanced usage returns full control object.
 */
export interface UseSortableControls {
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
  /** Whether the sortable is supported in current environment */
  isSupported: ReturnType<typeof ref<boolean>>
  /** Start dragging programmatically */
  start: (element: HTMLElement) => void
  /** Stop dragging programmatically */
  stop: () => void
  /** Sort items programmatically */
  sort: (order: string[], useAnimation?: boolean) => void
  /** Update items list manually */
  updateItems: () => void
  /** Destroy the sortable instance */
  destroy: () => void
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
 *
 * Advanced usage with controls:
 * ```ts
 * const { items, isDragging, start, stop } = useSortable(containerRef, {
 *   controls: true,
 *   group: 'shared',
 *   animation: 150
 * })
 * ```
 */
export function useSortable(
  target: MaybeRefOrGetter<HTMLElement | string | null>,
  options: UseSortableOptions & { controls: true }
): UseSortableControls

export function useSortable(
  target: MaybeRefOrGetter<HTMLElement | string | null>,
  options?: UseSortableOptions & { controls?: false }
): ReturnType<typeof shallowRef<HTMLElement[]>>

export function useSortable(
  target: MaybeRefOrGetter<HTMLElement | string | null>,
  options: UseSortableOptions = {},
): UseSortableControls | ReturnType<typeof shallowRef<HTMLElement[]>> {
  const {
    controls = false,
    immediate = true,
    ...sortableOptions
  } = options

  // Check browser support
  const isSupported = ref(typeof window !== 'undefined' && 'document' in window)

  // Create sortable manager instance
  const manager = new SortableManager(target, sortableOptions)

  // Initialize if immediate is true
  if (immediate && isSupported.value) {
    manager.initialize()
  }

  // Cleanup on unmount
  tryOnUnmounted(() => {
    manager.cleanup()
  })

  // Control methods
  const start = (_element: HTMLElement) => {
    // TODO: Implement programmatic start
    // This will be implemented when we add programmatic control features
    // if (!isSupported.value)
    //   return
  }

  const stop = () => {
    // TODO: Implement programmatic stop
    // This will be implemented when we add programmatic control features
    // if (!isSupported.value)
    //   return
  }

  const sort = (order: string[], useAnimation = true) => {
    if (!isSupported.value)
      return
    manager.sort(order, useAnimation)
  }

  const updateItems = () => {
    if (!isSupported.value)
      return
    manager.updateItems()
  }

  const destroy = () => {
    manager.destroy()
  }

  // Return based on controls option
  if (controls) {
    return {
      items: manager.items,
      isDragging: manager.isDragging,
      dragElement: manager.dragElement,
      ghostElement: manager.ghostElement,
      currentIndex: manager.currentIndex,
      isSupported,
      start,
      stop,
      sort,
      updateItems,
      destroy,
    }
  }

  // Simple usage - return only items
  return manager.items
}

export default useSortable
