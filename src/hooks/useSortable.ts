import type { CloneItemFn, EasingFunction, SortableDirectionFunction, SortableEventCallbacks, SortableFilterFunction, SortableGroup, SortDirection } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { Ref, ShallowRef } from 'vue'
import { findClosestElementBySelector, getElementStyleValue } from '@/utils'
import { globalGroupManager } from '@/utils/group-manager'
import { tryOnMounted, tryOnUnmounted } from '@vueuse/core'
import { computed, nextTick, toValue, watch } from 'vue'
import useSortableAnimation from './useSortableAnimation'
import useSortableDrag from './useSortableDrag'
import useSortableState from './useSortableState'

/**
 * Options for useSortable composable.
 * Extends SortableOptions with Vue3-specific configurations.
 */
export interface UseSortableOptions<T = any> extends SortableEventCallbacks {
  /**
   * Item key with reactive support
   * @default 'id'
   */
  itemKey?: MaybeRefOrGetter<string | ((item: T) => string | number)>

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
   * Revert dragged element to original position when spilled (dropped outside valid containers)
   * @default false
   */
  revertOnSpill?: MaybeRefOrGetter<boolean>
  /**
   * Remove dragged element from DOM when spilled (dropped outside valid containers)
   * @default false
   */
  removeOnSpill?: MaybeRefOrGetter<boolean>
  /**
   * Custom function to clone items when using pull: 'clone'
   * By default structuredClone or JSON.parse(JSON.stringify()) will be used
   * Provide this function for better control over the cloning process
   * @param item - The item to clone
   * @returns A deep copy of the item
   * @default undefined
   */
  cloneItem?: CloneItemFn<T>
  /**
   * Whether to return controls
   * @default false
   */
  controls?: boolean
}

/**
 * Return type for useSortable composable when controls option is true.
 * Provides full access to sortable state and methods.
 */
export interface UseSortableReturn<T> {
  /** Reactive array of sortable items */
  items: Ref<T[]>
  /** Whether dragging is currently active */
  isDragging: Ref<boolean>
  /** Whether this sortable instance is currently active (Sortable.active equivalent) */
  isActive: Ref<boolean>
  /** Currently dragged element */
  dragElement: ShallowRef<HTMLElement | null>
  /** Ghost element for visual feedback */
  ghostElement: ShallowRef<HTMLElement | null>
  /** Current index of dragged element */
  currentIndex: Ref<number | null>
  /** Whether animations are currently running */
  isAnimating: Ref<boolean>
  /** Elements currently being animated */
  animatingElements: ShallowRef<HTMLElement[]>
  /** Whether the sortable is supported in current environment */
  isSupported: boolean
  /** Whether fallback mode is currently active during drag */
  isFallbackActive: Ref<boolean>
  /** Whether native draggable is being used (false means fallback mode) */
  nativeDraggable: Ref<boolean>
  /** Whether the sortable is currently paused */
  isPaused: Ref<boolean>
  /** Whether the sortable is currently disabled */
  isDisabled: Ref<boolean>
  /** Current target container for cross-list dragging (putSortable equivalent) */
  putSortable: Ref<HTMLElement | null>
  /** Active group name for cross-list operations */
  activeGroup: Ref<string | null>
  /** Last put mode used in cross-list operations */
  lastPutMode: Ref<'clone' | boolean | null>
  /** Original parent container of the dragged element (parentEl equivalent) */
  parentEl: Ref<HTMLElement | null>
  /** Root container element for current drag operation (rootEl equivalent) */
  rootEl: Ref<HTMLElement | null>
  /** Next sibling element of the dragged element for position restoration (nextEl equivalent) */
  nextEl: Ref<HTMLElement | null>
  /** Clone element for clone mode operations (cloneEl equivalent) */
  cloneEl: Ref<HTMLElement | null>
  /** Whether the clone element is currently hidden (cloneHidden equivalent) */
  cloneHidden: Ref<boolean>
  /** Whether current operation is within the same container (isOwner equivalent) */
  isOwner: Ref<boolean>
  /** Whether the drag should revert to original position (revert equivalent) */
  revert: Ref<boolean>
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
  /** Destroy the sortable instance */
  destroy: () => void
}

/**
 * Vue3 composable for sortable drag and drop functionality.
 * Data-driven implementation based on SortableJS with Vue3 reactivity.
 *
 * @param target - Target container element or selector
 * @param list - Reactive array of sortable items
 * @param options - Sortable configuration options
 * @returns Reactive sortable state and controls
 *
 * @example
 * Simple usage:
 * ```ts
 * const items = ref([{ id: 1, text: 'Item 1' }, { id: 2, text: 'Item 2' }])
 * useSortable(containerRef, items)
 * ```
 * Advanced usage with controls:
 * ```ts
 * const items = ref([{ id: 1, text: 'Item 1' }, { id: 2, text: 'Item 2' }])
 * const { isDragging, isFallbackActive, start, stop } = useSortable(containerRef, items, {
 *   controls: true,
 *   group: 'shared',
 *   animation: 150,
 * })
 * ```
 */
export function useSortable<T>(
  target: MaybeRefOrGetter<HTMLElement | null>,
  list: Ref<T[]>,
  options: UseSortableOptions & { controls: true }
): UseSortableReturn<T>

export function useSortable<T>(
  target: MaybeRefOrGetter<HTMLElement | null>,
  list: Ref<T[]>,
  options?: UseSortableOptions & { controls?: false }
): Ref<T[]>

export function useSortable<T>(
  target: MaybeRefOrGetter<HTMLElement | null>,
  list: Ref<T[]>,
  options: UseSortableOptions = {},
): UseSortableReturn<T> | Ref<T[]> {
  const {
    controls = false,
    group,
    dataIdAttr = 'data-id',
    draggable = '>*',
  } = options

  // Resolve target element
  const targetElement = computed(() => {
    const el = toValue(target)
    if (!el)
      return null
    return typeof el === 'string' ? document.querySelector(el) as HTMLElement | null : el
  })

  // Initialize state
  const state = useSortableState<T>(options, list)

  // Initialize animation composable first
  const animation = useSortableAnimation(targetElement, options)

  function getDraggableChildren(
    container: HTMLElement,
    selector: string,
  ): HTMLElement[] {
    if (!container)
      return []

    const children = Array.from(container.children) as HTMLElement[]

    return children.filter((child) => {
      // Skip hidden elements and templates
      if (
        getElementStyleValue(child, 'display') === 'none'
        || child === state.ghostElement.value
        || child.nodeName.toUpperCase() === 'TEMPLATE'
      ) {
        return false
      }

      // Apply selector filter
      return findClosestElementBySelector(child, selector)
    })
  }

  function updateNodeList() {
    const el = toValue(targetElement)
    if (!el) {
      state._setNodeList([])
      return
    }

    // update node list
    const draggableSelector = toValue(draggable)
    const items = getDraggableChildren(el, draggableSelector)
    state._setNodeList(items)
  }

  // Initialize core composable - sortableDrag provides unified state management
  const { startDrag, stopDrag, pause, resume, destroy } = useSortableDrag(targetElement, {
    ...options,
    state,
    // Integrate animation with drag events
    onStart: (event, sortableData) => {
      // Capture animation state before drag starts
      if (options.animation) {
        animation.captureAnimationState()
      }
      // Call original onStart if provided
      if (options.onStart) {
        options.onStart(event, sortableData)
      }
    },
    onEnd: (event, sortableData) => {
      // Trigger animation after drag ends
      if (options.animation) {
        animation.animateAll()
      }
      // Call original onEnd if provided
      if (options.onEnd) {
        options.onEnd(event, sortableData)
      }
    },
    onAdd: (event, sortableData) => {
      if (options.animation) {
        animation.captureAnimationState()
      }

      const { to, oldIndex, newIndex, item, pullMode } = sortableData
      const ifCrossList = to && to !== targetElement.value
      if (ifCrossList && to && item) {
        const targetState = globalGroupManager.getState(to)
        if (targetState) {
          const sourceItem = oldIndex !== undefined && oldIndex >= 0 && oldIndex < list.value.length
            ? list.value[oldIndex]
            : undefined

          if (sourceItem && newIndex !== undefined) {
            if (typeof pullMode === 'string' && pullMode === 'clone') {
              targetState._cloneItem(newIndex, sourceItem)
            }
            else {
              targetState._insertItem(newIndex, sourceItem)
            }
          }
        }
      }

      if (options.animation) {
        nextTick(() => {
          animation.animateAll()
        })
      }

      if (options.onAdd) {
        options.onAdd(event, sortableData)
      }
    },
    onClone: (event, sortableData) => {
      const { clone } = sortableData
      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone)
      }

      if (options.onClone) {
        options.onClone(event, sortableData)
      }
    },
    onRemove: (event, sortableData) => {
      const { oldIndex } = sortableData

      // Handle removal from source list (original behavior)
      if (oldIndex !== undefined) {
        state._removeItem(oldIndex)
      }

      if (options.animation) {
        animation.animateAll()
      }

      // Call original onRemove if provided
      if (options.onRemove) {
        options.onRemove(event, sortableData)
      }
    },
    onUpdate: (event, sortableData) => {
      if (options.animation) {
        animation.animateAll()
      }

      const { oldIndex, newIndex } = sortableData
      if (oldIndex !== undefined && newIndex !== undefined) {
        state._updatePosition(oldIndex, newIndex)
      }

      // Call original onUpdate if provided
      if (options.onUpdate) {
        options.onUpdate(event, sortableData)
      }
    },
    onSort: (event, sortableData) => {
      if (options.animation) {
        animation.animateAll()
      }

      // Call original onSort if provided
      if (options.onSort) {
        options.onSort(event, sortableData)
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
        globalGroupManager.registerList(newTarget, groupValue, state, animation)
      }

      await nextTick()
    }
  }, { immediate: true })

  // Watch for data changes and update DOM
  watch(() => [list, targetElement, draggable, dataIdAttr], () => {
    if (targetElement.value) {
      updateNodeList()
    }
  }, { deep: true, flush: 'post' })

  // Watch for group changes and re-register
  watch(() => toValue(group), (newGroup, oldGroup) => {
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
        globalGroupManager.registerList(el, newGroupValue, state, animation)
      }
      else {
        globalGroupManager.unregisterList(el)
      }
    }
  }, { flush: 'sync' })

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
    state.nodeList.value?.forEach((item) => {
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

    updateNodeList()

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

  tryOnMounted(() => {
    // Initialize items immediately if target is available
    if (state.isSupported && targetElement.value) {
      updateNodeList()
    }
  })

  // Cleanup on unmount
  tryOnUnmounted(() => {
    enhancedDestroy()
  })

  // Return based on controls option
  if (controls) {
    return {
      items: list,
      isDragging: state.isDragging,
      isActive: state.isActive,
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
      putSortable: state.putSortable,
      activeGroup: state.activeGroup,
      lastPutMode: state.lastPutMode,
      parentEl: state.parentEl,
      rootEl: state.rootEl,
      nextEl: state.nextEl,
      cloneEl: state.cloneEl,
      cloneHidden: state.cloneHidden,
      isOwner: state.isOwner,
      revert: state.revert,
      start,
      stop,
      pause,
      resume,
      sort,
      destroy: enhancedDestroy,
    }
  }

  // Simple usage - return only items
  return list
}

export default useSortable
