import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { UseSortableOptions } from './useSortable'
import { ChromeForAndroid, IOS } from '@/utils'
import { isClient } from '@vueuse/core'
import { computed, ref, shallowRef, toRaw, toValue } from 'vue'

/**
 * Sortable state interface defining all reactive state properties
 */
export interface SortableState {
  /** Reactive array of sortable node references */
  nodeList: ShallowRef<HTMLElement[]>
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
export interface SortableStateInternal<T = any> extends SortableState {
  /**
   * Get the index of an item by itemKey
   * @param item - The item to get the index of
   * @returns The index of the item
   */
  _getItemIndex: (item: T) => number | undefined

  /**
   * Get the key of an item by itemKey
   * @param item - The item to get the key of
   * @returns The key of the item
   */
  _getItemKey: (item: T) => string | number | undefined

  /**
   * Get an item by itemKey
   * @param key - The key of the item to get
   * @returns The item
   */
  _getItemByKey: (key: string | number) => T | undefined
  /** Set node reference list */
  _setNodeList: (refs: HTMLElement[]) => void
  /** Set dragging state */
  _setDragging: (value: boolean) => void
  /** Set drag element */
  _setDragElement: (element: HTMLElement | null) => void
  /** Set ghost element */
  _setGhostElement: (element: HTMLElement | null) => void
  /** Set current index */
  _setCurrentIndex: (index: number | null) => void
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
  /** Update node to model map */
  _updateModelMap: () => void
  /** Get model context for a node */
  _getModelContext: (node: HTMLElement) => SortableContext<T> | undefined
  /**
   * Update position of an item in the list
   * @param oldIndex - The original index of the item
   * @param newIndex - The new index for the item
   * @returns The updated list
   */
  _updatePosition: (oldIndex: number, newIndex: number) => T[]
  /**
   * Remove an item from the list
   * @param index - The index of the item to remove
   * @returns The removed item
   */
  _removeItem: (index: number) => T[]
  /**
   * Insert an item into the list
   * @param index - The index at which to insert the item
   * @param item - The item to insert
   * @returns The updated list
   */
  _insertItem: (index: number, item: T) => T[]
  /**
   * Clone an item
   * @param item - The item to clone
   * @returns The cloned item
   */
  _cloneItem: (index: number, item: T) => T[]
  /**
   * Find an item by its DOM node
   * @param node - The DOM node to find the item for
   * @returns The associated item and its index, or undefined if not found
   */
  _findItemByNode: (node: HTMLElement) => SortableContext<T> | undefined

  /**
   * Find a DOM node by item key
   * @param key - The key of the item to find
   * @returns The associated DOM node, or undefined if not found
   */
  _findNodeByKey: (key: string | number) => HTMLElement | undefined
}

/**
 * context for map of DOM elements to list items
 */
interface SortableContext<T = any> {
  /** The item in the list */
  item: T
  /** The index of the item in the list */
  index: number
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
export function useSortableState<T>(
  options: UseSortableOptions = {},
  list: Ref<T[]>,
): SortableStateInternal<T> {
  const {
    itemKey,
    disabled,
    forceFallback,
    cloneItem,
    onListUpdate,
  } = options

  const isDraggableSupported = computed(() => isClient && !(ChromeForAndroid) && !(IOS) && 'draggable' in document.createElement('div'))

  // Core drag state
  const isDragging = ref(false)
  const isActive = ref(false)
  const dragElement = shallowRef<HTMLElement | null>(null)
  const ghostElement = shallowRef<HTMLElement | null>(null)
  const currentIndex = ref<number | null>(null)

  // Items management
  const nodeList = shallowRef<HTMLElement[]>([])

  // Map of DOM elements to list items
  const modelMap = new WeakMap<HTMLElement, SortableContext<T>>()

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

  const _getItemIndex = (item: T) => {
    if (list.value && list.value.length > 0) {
      return list.value.indexOf(item)
    }
    return undefined
  }

  const _getItemKey = (item: T): string | number | undefined => {
    const itemKeyValue = toValue(itemKey)

    // Handle function type for itemKey
    if (itemKeyValue && typeof itemKeyValue === 'function') {
      const keyFn = itemKeyValue as (item: T) => string | number
      return keyFn(item)
    }

    // Handle string type for itemKey
    if (itemKeyValue && typeof itemKeyValue === 'string') {
      const key = itemKeyValue as keyof T
      const value = item[key]
      if (value !== undefined && (typeof value === 'string' || typeof value === 'number')) {
        return value
      }
    }

    return undefined
  }

  const _getItemByKey = (key: string | number): T | undefined => {
    if (list.value && list.value.length > 0) {
      return list.value.find(item => _getItemKey(item) === key)
    }
    return undefined
  }

  const _setNodeList = (nodes: HTMLElement[]) => {
    nodeList.value = nodes
  }

  const _afterModifyList = (newList: T[]) => {
    // list.value = newList

    if (onListUpdate) {
      onListUpdate(list.value, newList)
    }
    else {
      list.value = newList
    }
  }

  const _updatePosition = (oldIndex: number, newIndex: number) => {
    const newList = [...list.value]
    const movedItem = newList.splice(oldIndex, 1)[0]
    newList.splice(newIndex, 0, movedItem)

    _afterModifyList(newList)
    return newList
  }

  const _removeItem = (index: number) => {
    const newList = [...list.value]
    newList.splice(index, 1)
    _afterModifyList(newList)
    return newList
  }

  const _insertItem = (index: number, item: T) => {
    const newList = [...list.value]
    newList.splice(index, 0, item)
    _afterModifyList(newList)
    return newList
  }

  const _cloneDeep = (item: T) => {
    if (cloneItem) {
      return cloneItem(item)
    }

    if (typeof window.structuredClone === 'function') {
      try {
        return window.structuredClone(toRaw(item))
      }
      catch (e) {
        // DataCloneError fallback
        console.warn('[useSortableState] structuredClone failed, falling back to JSON clone:', e)
        return JSON.parse(JSON.stringify(item))
      }
    }

    return JSON.parse(JSON.stringify(item))
  }

  const _cloneItem = (index: number, item: T) => {
    const newList = [...list.value]
    const clonedItem = _cloneDeep(item)
    newList.splice(index, 0, clonedItem)
    _afterModifyList(newList)
    return newList
  }

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
    nodeList.value = []
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

  const _getModelContext = (node: HTMLElement): SortableContext<T> | undefined => {
    return modelMap.get(node)
  }

  const _findItemByNode = (node: HTMLElement): SortableContext<T> | undefined => {
    return modelMap.get(node)
  }

  const _findNodeByKey = (key: string | number): HTMLElement | undefined => {
    // Find the item by key first
    const item = _getItemByKey(key)
    if (!item)
      return undefined

    // WeakMap doesn't have entries() method, so we need to iterate through nodeList
    // and check each node individually
    for (const node of nodeList.value) {
      const context = modelMap.get(node)
      if (context && context.item === item) {
        return node
      }
    }

    return undefined
  }

  const _updateModelMap = (): void => {
    const currentNodeList = nodeList.value
    const currentList = list.value

    currentNodeList.forEach((node, index) => {
      if (node && index < currentList.length) {
        const item = currentList[index]
        modelMap.set(node, { item, index })
      }
    })
  }

  return {
    isSupported: isClient,
    isDragging,
    isActive,
    dragElement,
    ghostElement,
    currentIndex,
    nodeList,
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
    _setNodeList,
    _getItemIndex,
    _getItemKey,
    _getItemByKey,
    _setDragging,
    _setDragElement,
    _setGhostElement,
    _setCurrentIndex,
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
    _updateModelMap,
    _getModelContext,
    _updatePosition,
    _removeItem,
    _insertItem,
    _cloneItem,
    _findItemByNode,
    _findNodeByKey,
  }
}

export default useSortableState
