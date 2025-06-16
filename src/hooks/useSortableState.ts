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
  /** Whether this sortable instance is currently active */
  isActive: Ref<boolean>
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
  /** Set put sortable container */
  _setPutSortable: (container: HTMLElement | null) => void
  /** Set active group */
  _setActiveGroup: (group: string | null) => void
  /** Set last put mode */
  _setLastPutMode: (mode: 'clone' | boolean | null) => void
  /** Set parent element */
  _setParentEl: (element: HTMLElement | null) => void
  /** Set root element */
  _setRootEl: (element: HTMLElement | null) => void
  /** Set next element */
  _setNextEl: (element: HTMLElement | null) => void
  /** Set clone element */
  _setCloneEl: (element: HTMLElement | null) => void
  /** Set clone hidden state */
  _setCloneHidden: (hidden: boolean) => void
  /** Set is owner state */
  _setIsOwner: (isOwner: boolean) => void
  /** Set revert state */
  _setRevert: (revert: boolean) => void
  /** Set active state */
  _setIsActive: (active: boolean) => void
  /** Update putSortable state with SortableJS logic */
  _updatePutSortable: (targetContainer: HTMLElement | null, currentContainer?: HTMLElement | null) => void
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
  const isActive = ref(false)
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

  // Cross-list drag state
  const putSortable = ref<HTMLElement | null>(null)
  const activeGroup = ref<string | null>(null)
  const lastPutMode = ref<'clone' | boolean | null>(null)

  // Position and container tracking state
  const parentEl = ref<HTMLElement | null>(null)
  const rootEl = ref<HTMLElement | null>(null)
  const nextEl = ref<HTMLElement | null>(null)

  // Clone mode state
  const cloneEl = ref<HTMLElement | null>(null)
  const cloneHidden = ref<boolean>(false)

  // Operation state
  const isOwner = ref<boolean>(false)
  const revert = ref<boolean>(false)

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

    // Validate cross-list state consistency
    if (isDragging.value && dragElement.value) {
      // If we have a dragElement, we should have parentEl and rootEl
      if (!parentEl.value) {
        console.warn('[useSortableState] Inconsistent state: dragElement exists but parentEl is null')
        return false
      }

      if (!rootEl.value) {
        console.warn('[useSortableState] Inconsistent state: dragElement exists but rootEl is null')
        return false
      }

      // If we have a clone element, cloneHidden should be properly set
      if (cloneEl.value && cloneHidden.value === undefined) {
        console.warn('[useSortableState] Inconsistent state: cloneEl exists but cloneHidden is undefined')
        return false
      }
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

    // Automatically set related state when drag element is set
    if (element) {
      // Set parent element (original container)
      parentEl.value = element.parentElement

      // Set next sibling for position restoration
      nextEl.value = element.nextElementSibling as HTMLElement | null
    }
    else {
      // Clear related state when drag element is cleared
      parentEl.value = null
      nextEl.value = null
    }
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

    // If disabling while dragging, stop the drag and clear all related state
    if (value && isDragging.value) {
      isDragging.value = false
      dragElement.value = null
      currentIndex.value = null
      parentEl.value = null
      rootEl.value = null
      nextEl.value = null
      cloneEl.value = null
      cloneHidden.value = false
      isOwner.value = false
      revert.value = false
      putSortable.value = null
      activeGroup.value = null
      lastPutMode.value = null
      isActive.value = false
    }
  }

  const _setPutSortable = (container: HTMLElement | null) => {
    putSortable.value = container
  }

  /**
   * Update putSortable state following SortableJS logic
   * Based on SortableJS _onDragOver implementation (lines 1076-1080)
   * @param targetContainer - The target container being dragged over
   * @param currentContainer - The current sortable container
   */
  const _updatePutSortable = (targetContainer: HTMLElement | null, currentContainer?: HTMLElement | null) => {
    if (!targetContainer) {
      putSortable.value = null
      return
    }

    const isCurrentActive = currentContainer && isActive.value
    if (putSortable.value !== targetContainer && !isCurrentActive) {
      putSortable.value = targetContainer
    }
    else if (isCurrentActive && putSortable.value) {
      putSortable.value = null
    }
  }

  const _setActiveGroup = (group: string | null) => {
    activeGroup.value = group
  }

  const _setLastPutMode = (mode: 'clone' | boolean | null) => {
    lastPutMode.value = mode
  }

  const _setParentEl = (element: HTMLElement | null) => {
    parentEl.value = element
  }

  const _setRootEl = (element: HTMLElement | null) => {
    rootEl.value = element
  }

  const _setNextEl = (element: HTMLElement | null) => {
    nextEl.value = element
  }

  const _setCloneEl = (element: HTMLElement | null) => {
    cloneEl.value = element
  }

  const _setCloneHidden = (hidden: boolean) => {
    cloneHidden.value = hidden
  }

  const _setIsOwner = (owner: boolean) => {
    isOwner.value = owner
  }

  const _setRevert = (shouldRevert: boolean) => {
    revert.value = shouldRevert
  }

  const _setIsActive = (active: boolean) => {
    isActive.value = active
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
    putSortable.value = null
    activeGroup.value = null
    lastPutMode.value = null
    parentEl.value = null
    rootEl.value = null
    nextEl.value = null
    cloneEl.value = null
    cloneHidden.value = false
    isOwner.value = false
    revert.value = false
    isActive.value = false
  }

  return {
    // Reactive state
    isSupported: isClient,
    isDragging,
    isActive,
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
    putSortable,
    activeGroup,
    lastPutMode,
    parentEl,
    rootEl,
    nextEl,
    cloneEl,
    cloneHidden,
    isOwner,
    revert,

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
    _setPutSortable,
    _setActiveGroup,
    _setLastPutMode,
    _setParentEl,
    _setRootEl,
    _setNextEl,
    _setCloneEl,
    _setCloneHidden,
    _setIsOwner,
    _setRevert,
    _setIsActive,
    _updatePutSortable,
    _resetState,
    _validateState,
    _canPerformOperation,
  }
}

export default useSortableState
