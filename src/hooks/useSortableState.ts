import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { UseSortableOptions } from './useSortable'
import { ChromeForAndroid, IOS } from '@/utils'
import { isClient } from '@vueuse/core'
import { computed, ref, shallowRef, toValue } from 'vue'

/**
 * Sortable state interface defining all reactive state properties
 */
export interface SortableState {
  /** Whether the sortable is supported in current environment */
  isSupported: boolean
  /** Whether dragging is currently active */
  isDragging: Ref<boolean>
  /** Currently dragged element */
  dragElement: Ref<HTMLElement | null>
  /** Ghost element for visual feedback */
  ghostElement: ShallowRef<HTMLElement | null>
  /** Current index of dragged element */
  currentIndex: Ref<number | null>
  /** Reactive array of sortable items */
  items: ShallowRef<HTMLElement[]>
  /** Whether animations are currently running */
  isAnimating: Ref<boolean>
  /** Elements currently being animated */
  animatingElements: ShallowRef<HTMLElement[]>
  /** Whether fallback mode is currently active during drag */
  isFallbackActive: Ref<boolean>
  /** Whether native draggable is being used (false means fallback mode) */
  nativeDraggable: ComputedRef<boolean>
  /** Whether the sortable is currently paused */
  isPaused: Ref<boolean>
  /** Whether the sortable is currently disabled */
  isDisabled: Ref<boolean>
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
  /** Set paused state */
  _setPaused: (value: boolean) => void
  /** Set disabled state */
  _setDisabled: (value: boolean) => void
  /** Reset all state to initial values */
  _resetState: () => void
  /** Validate state consistency */
  _validateState: () => boolean
  /** Check if operation is allowed in current state */
  _canPerformOperation: (operation: string) => boolean
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
 * - Enhanced pause/resume functionality
 * - Automatic native draggable detection
 * - State validation and consistency checks
 *
 * @param options - Configuration options for state initialization
 * @returns State object with reactive state and internal mutation methods
 */
export function useSortableState(
  options: UseSortableOptions = {},
): SortableStateInternal {
  const {
    disabled,
    forceFallback,
  } = options

  const isDraggableSupported = computed(() => isClient && !(ChromeForAndroid) && !(IOS) && 'draggable' in document.createElement('div'))

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

  // Control state
  const isPaused = ref(false)
  const isDisabled = ref(toValue(disabled) ?? false)

  // Fallback and support state
  const isFallbackActive = ref(false)

  // Native draggable detection with auto-detection
  const nativeDraggable = computed(() => isClient && !toValue(forceFallback) && isDraggableSupported.value)

  // State validation and operation control
  const _validateState = (): boolean => {
    // Check for inconsistent states
    if (isDragging.value && !dragElement.value) {
      console.warn('[useSortableState] Inconsistent state: dragging is true but dragElement is null')
      return false
    }

    if (dragElement.value && !isDragging.value) {
      console.warn('[useSortableState] Inconsistent state: dragElement exists but dragging is false')
      return false
    }

    if (isAnimating.value && animatingElements.value.length === 0) {
      console.warn('[useSortableState] Inconsistent state: animating is true but no animating elements')
      return false
    }

    return true
  }

  const _canPerformOperation = (operation: string): boolean => {
    if (isDisabled.value) {
      console.warn(`[useSortableState] Operation '${operation}' blocked: sortable is disabled`)
      return false
    }

    if (isPaused.value && operation !== 'resume') {
      console.warn(`[useSortableState] Operation '${operation}' blocked: sortable is paused`)
      return false
    }

    if (!isClient) {
      console.warn(`[useSortableState] Operation '${operation}' blocked: sortable is not supported in non-client environment`)
      return false
    }

    return true
  }

  // Internal mutation methods with validation
  const _setDragging = (value: boolean) => {
    if (value && !_canPerformOperation('startDrag'))
      return
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

  const _setPaused = (value: boolean) => {
    isPaused.value = value

    // If unpausing, validate current state
    if (!value) {
      _validateState()
    }
  }

  const _setDisabled = (value: boolean) => {
    isDisabled.value = value

    // If disabling while dragging, stop the drag
    if (value && isDragging.value) {
      isDragging.value = false
      dragElement.value = null
      currentIndex.value = null
    }
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
    isPaused.value = false
    isDisabled.value = toValue(disabled) ?? false
  }

  return {
    // Reactive state
    isSupported: isClient,
    isDragging,
    dragElement,
    ghostElement,
    currentIndex,
    items,
    isAnimating,
    animatingElements,
    isFallbackActive,
    nativeDraggable,
    isPaused,
    isDisabled,

    // Internal mutation methods
    _setDragging,
    _setDragElement,
    _setGhostElement,
    _setCurrentIndex,
    _setItems,
    _setAnimating,
    _setAnimatingElements,
    _setFallbackActive,
    _setPaused,
    _setDisabled,
    _resetState,
    _validateState,
    _canPerformOperation,
  }
}

export default useSortableState
