import type { MaybeRefOrGetter } from '@vueuse/core'
import type { Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue } from 'vue'

/**
 * Sortable state interface defining all reactive state properties
 */
export interface SortableState {
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
  nativeDraggable: Ref<boolean>
  /** Whether the sortable is supported in current environment */
  isSupported: Ref<boolean>
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
  /** Set native draggable state */
  _setNativeDraggable: (value: boolean) => void
  /** Set supported state */
  _setSupported: (value: boolean) => void
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
 * Options for useSortableState composable
 */
export interface UseSortableStateOptions {
  /** Initial supported state */
  initialSupported?: MaybeRefOrGetter<boolean>
  /** Initial native draggable state */
  initialNativeDraggable?: MaybeRefOrGetter<boolean>
  /** Initial disabled state */
  initialDisabled?: MaybeRefOrGetter<boolean>
  /** Enable automatic native draggable detection */
  autoDetectNative?: boolean
  /** Enable state validation */
  enableValidation?: boolean
  /** Custom native draggable detection function */
  detectNativeDraggable?: () => boolean
}

/**
 * Detects native draggable support in current environment
 */
function detectNativeDraggableSupport(): boolean {
  if (typeof window === 'undefined')
    return false

  // Check for basic drag and drop API support
  const hasBasicSupport = 'draggable' in document.createElement('div')
    && 'ondragstart' in window
    && 'ondrop' in window

  // Check for DataTransfer API
  const hasDataTransfer = typeof DataTransfer !== 'undefined'

  // Check for touch device (usually needs fallback)
  const isTouchDevice = 'ontouchstart' in window
    || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)

  return hasBasicSupport && hasDataTransfer && !isTouchDevice
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
  options: UseSortableStateOptions = {},
): SortableStateInternal {
  const {
    initialSupported = typeof window !== 'undefined' && 'document' in window,
    initialNativeDraggable = true,
    initialDisabled = false,
    autoDetectNative = true,
    enableValidation = true,
    detectNativeDraggable = detectNativeDraggableSupport,
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

  // Control state
  const isPaused = ref(false)
  const isDisabled = ref(toValue(initialDisabled))

  // Fallback and support state
  const isFallbackActive = ref(false)
  const isSupported = ref(toValue(initialSupported))

  // Native draggable detection with auto-detection
  const nativeDraggable = ref(
    autoDetectNative ? detectNativeDraggable() : toValue(initialNativeDraggable),
  )

  // State validation and operation control
  const _validateState = (): boolean => {
    if (!enableValidation)
      return true

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

    if (!isSupported.value) {
      console.warn(`[useSortableState] Operation '${operation}' blocked: sortable is not supported`)
      return false
    }

    return true
  }

  // Internal mutation methods with validation
  const _setDragging = (value: boolean) => {
    if (value && !_canPerformOperation('startDrag'))
      return
    isDragging.value = value
    if (enableValidation)
      _validateState()
  }

  const _setDragElement = (element: HTMLElement | null) => {
    dragElement.value = element
    if (enableValidation)
      _validateState()
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
    if (enableValidation)
      _validateState()
  }

  const _setAnimatingElements = (elements: HTMLElement[]) => {
    animatingElements.value = elements
    if (enableValidation)
      _validateState()
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

  const _setPaused = (value: boolean) => {
    isPaused.value = value

    // If unpausing, validate current state
    if (!value && enableValidation) {
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
    isDisabled.value = toValue(initialDisabled)
    nativeDraggable.value = autoDetectNative ? detectNativeDraggable() : toValue(initialNativeDraggable)
    isSupported.value = toValue(initialSupported)
  }

  // Watch for environment changes and update native draggable detection
  if (autoDetectNative && typeof window !== 'undefined') {
    // Re-detect on window resize (might indicate device orientation change)
    let resizeTimeout: number
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const newNativeSupport = detectNativeDraggable()
        if (newNativeSupport !== nativeDraggable.value) {
          nativeDraggable.value = newNativeSupport
        }
      }, 100)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup on unmount would be handled by the consuming component
  }

  return {
    // Reactive state
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
    _setNativeDraggable,
    _setSupported,
    _setPaused,
    _setDisabled,
    _resetState,
    _validateState,
    _canPerformOperation,
  }
}

export default useSortableState
