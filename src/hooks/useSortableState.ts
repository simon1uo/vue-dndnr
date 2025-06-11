import type { MaybeRefOrGetter } from '@vueuse/core'
import { ref, shallowRef, toValue } from 'vue'

/**
 * Sortable state interface defining all reactive state properties
 */
export interface SortableState {
  /** Whether dragging is currently active */
  isDragging: ReturnType<typeof ref<boolean>>
  /** Currently dragged element */
  dragElement: ReturnType<typeof shallowRef<HTMLElement | null>>
  /** Ghost element for visual feedback */
  ghostElement: ReturnType<typeof shallowRef<HTMLElement | null>>
  /** Current index of dragged element */
  currentIndex: ReturnType<typeof ref<number | null>>
  /** Reactive array of sortable items */
  items: ReturnType<typeof shallowRef<HTMLElement[]>>
  /** Whether animations are currently running */
  isAnimating: ReturnType<typeof ref<boolean>>
  /** Elements currently being animated */
  animatingElements: ReturnType<typeof shallowRef<HTMLElement[]>>
  /** Whether fallback mode is currently active during drag */
  isFallbackActive: ReturnType<typeof ref<boolean>>
  /** Whether native draggable is being used (false means fallback mode) */
  nativeDraggable: ReturnType<typeof ref<boolean>>
  /** Whether the sortable is supported in current environment */
  isSupported: ReturnType<typeof ref<boolean>>
}

/**
 * Internal state management interface with mutation methods
 */
export interface SortableStateInternal extends SortableState {
  /** Set dragging state */
  _setDragging: (value: boolean) => void
  /** Set drag element */
  _setDragElement: (element: HTMLElement | null) => void
  /** Set ghost element */
  _setGhostElement: (element: HTMLElement | null) => void
  /** Set current index */
  _setCurrentIndex: (index: number | null) => void
  /** Set items array */
  _setItems: (items: HTMLElement[]) => void
  /** Set animation state */
  _setAnimating: (value: boolean) => void
  /** Set animating elements */
  _setAnimatingElements: (elements: HTMLElement[]) => void
  /** Set fallback active state */
  _setFallbackActive: (value: boolean) => void
  /** Set native draggable state */
  _setNativeDraggable: (value: boolean) => void
  /** Set supported state */
  _setSupported: (value: boolean) => void
  /** Reset all state to initial values */
  _resetState: () => void
}

/**
 * Options for useSortableState composable
 */
export interface UseSortableStateOptions {
  /** Initial supported state */
  initialSupported?: MaybeRefOrGetter<boolean>
  /** Initial native draggable state */
  initialNativeDraggable?: MaybeRefOrGetter<boolean>
}

/**
 * Unified state management composable for sortable functionality.
 * Replaces scattered state management across multiple classes.
 *
 * This composable provides:
 * - Centralized reactive state management
 * - Direct access to reactive state
 * - Internal mutation methods for controlled updates
 * - Proper initial state handling
 * - State reset functionality
 *
 * @param options - Configuration options for state initialization
 * @returns State object with reactive state and internal mutation methods
 */
export function useSortableState(
  options: UseSortableStateOptions = {},
): SortableStateInternal {
  const {
    initialSupported = typeof window !== 'undefined' && 'document' in window,
    initialNativeDraggable = true,
  } = options

  // Core drag state
  const isDragging = ref(false)
  const dragElement = shallowRef<HTMLElement | null>(null)
  const ghostElement = shallowRef<HTMLElement | null>(null)
  const currentIndex = ref<number | null>(null)

  // Items management
  const items = shallowRef<HTMLElement[]>([])

  // Animation state
  const isAnimating = ref(false)
  const animatingElements = shallowRef<HTMLElement[]>([])

  // Fallback and support state
  const isFallbackActive = ref(false)
  const nativeDraggable = ref(toValue(initialNativeDraggable))
  const isSupported = ref(toValue(initialSupported))

  // Internal mutation methods
  const _setDragging = (value: boolean) => {
    isDragging.value = value
  }

  const _setDragElement = (element: HTMLElement | null) => {
    dragElement.value = element
  }

  const _setGhostElement = (element: HTMLElement | null) => {
    ghostElement.value = element
  }

  const _setCurrentIndex = (index: number | null) => {
    currentIndex.value = index
  }

  const _setItems = (newItems: HTMLElement[]) => {
    items.value = newItems
  }

  const _setAnimating = (value: boolean) => {
    isAnimating.value = value
  }

  const _setAnimatingElements = (elements: HTMLElement[]) => {
    animatingElements.value = elements
  }

  const _setFallbackActive = (value: boolean) => {
    isFallbackActive.value = value
  }

  const _setNativeDraggable = (value: boolean) => {
    nativeDraggable.value = value
  }

  const _setSupported = (value: boolean) => {
    isSupported.value = value
  }

  /**
   * Reset all state to initial values.
   * Useful for cleanup and reinitialization.
   */
  const _resetState = () => {
    isDragging.value = false
    dragElement.value = null
    ghostElement.value = null
    currentIndex.value = null
    items.value = []
    isAnimating.value = false
    animatingElements.value = []
    isFallbackActive.value = false
    nativeDraggable.value = toValue(initialNativeDraggable)
    isSupported.value = toValue(initialSupported)
  }

  return {
    isDragging,
    dragElement,
    ghostElement,
    currentIndex,
    items,
    isAnimating,
    animatingElements,
    isFallbackActive,
    nativeDraggable,
    isSupported,
    _setDragging,
    _setDragElement,
    _setGhostElement,
    _setCurrentIndex,
    _setItems,
    _setAnimating,
    _setAnimatingElements,
    _setFallbackActive,
    _setNativeDraggable,
    _setSupported,
    _resetState,
  }
}

export default useSortableState
