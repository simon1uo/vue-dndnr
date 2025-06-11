import type { SortableEventCallbacks, SortableOptions } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { ref, shallowRef } from 'vue'
import { getDraggableChildren } from '@/utils/sortable-dom'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, nextTick, toValue, watch } from 'vue'
import { useDragCore } from './useDragCore'
import { useSortableAnimation } from './useSortableAnimation'

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
  isSupported: ReturnType<typeof ref<boolean>>
  /** Whether fallback mode is currently active during drag */
  isFallbackActive: ReturnType<typeof ref<boolean>>
  /** Whether native draggable is being used (false means fallback mode) */
  nativeDraggable: ReturnType<typeof ref<boolean>>
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
  } = options

  // Resolve target element
  const targetElement = computed(() => {
    const el = toValue(target)
    if (!el)
      return null
    return typeof el === 'string' ? document.querySelector(el) as HTMLElement : el
  })

  // Initialize core composables - dragCore provides unified state management
  const dragCore = useDragCore(targetElement, {
    ...options,
  })

  const animation = useSortableAnimation(targetElement, options)
  const state = dragCore.state

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

  dragCore.updateOptions({
    onItemsUpdate: () => {
      updateItems()
    },
  })

  // Watch for target changes and update items
  watch(targetElement, async (newTarget) => {
    if (newTarget) {
      await nextTick()
      updateItems()
    }
    else {
      state._setItems([])
    }
  }, { immediate: true })

  const draggableValue = computed(() => draggable)
  // Watch for options changes that affect items
  watch(draggableValue, () => {
    if (targetElement.value) {
      updateItems()
    }
  })

  // Initialize items immediately if target is available
  if (immediate && state.isSupported.value && targetElement.value) {
    updateItems()
  }

  // Control methods
  const start = (element: HTMLElement) => {
    if (!state.isSupported.value)
      return
    dragCore.startDrag(element)
  }

  const stop = () => {
    if (!state.isSupported.value)
      return
    dragCore.stopDrag()
  }

  const sort = (order: string[], useAnimation = true) => {
    if (!state.isSupported.value)
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

  const destroy = () => {
    // Destroy drag core and reset state
    dragCore.destroy()
  }

  // Cleanup on unmount
  tryOnUnmounted(() => {
    destroy()
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
      start,
      stop,
      sort,
      updateItems,
      destroy,
    }
  }

  // Simple usage - return only items
  return state.items
}

export default useSortable
