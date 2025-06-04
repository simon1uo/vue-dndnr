import type { DragId, DropId } from '@/types/core'
import type { DragDimension, DropDimension } from '@/types/dimension'
import type { DimensionObserverOptions } from './useDimensionObserver'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, shallowRef } from 'vue'
import useDimensionCollector from './useDimensionCollector'
import useDimensionObserver from './useDimensionObserver'

/**
 * Options for the dimension manager
 */
export interface DimensionManagerOptions extends DimensionObserverOptions {
  /**
   * Whether to enable automatic dimension updates
   * @default true
   */
  enableAutoUpdate?: boolean
}

/**
 * Composable function for managing dimensions of draggable and droppable elements
 * Acts as a high-level manager for dimension collection and observation
 * @param options - Configuration options
 * @returns Object containing dimension management methods and data
 */
export function useDimensionManager(options: DimensionManagerOptions = {}) {
  // Default options
  const {
    enableAutoUpdate = true,
    ...observerOptions
  } = options

  // Store registered elements
  const registeredDraggables = shallowRef<Map<DragId, HTMLElement>>(new Map())
  const registeredDroppables = shallowRef<Map<DropId, HTMLElement>>(new Map())

  // Current active element references
  const currentElement = shallowRef<HTMLElement | null>(null)
  const currentDragId = shallowRef<DragId | null>(null)
  const currentDropId = shallowRef<DropId | null>(null)

  // Create dimension collector
  const dimensionCollector = useDimensionCollector(currentElement)

  // Handle dimension updates
  const handleDimensionUpdate = (type: 'drag' | 'drop', id: DragId | DropId) => {
    if (type === 'drag' && currentDragId.value === id) {
      const dropId = findDropIdForDrag(id)
      if (dropId)
        dimensionCollector.collectDragDimensions(id, dropId)
    }
    else if (type === 'drop' && currentDropId.value === id) {
      dimensionCollector.collectDropDimensions(id)
    }
  }

  // Create dimension observer
  const dimensionObserver = useDimensionObserver(
    currentElement,
    handleDimensionUpdate,
    observerOptions,
  )

  /**
   * Find the drop ID for a given drag ID
   * @param dragId - ID of the draggable element
   * @returns The associated drop ID or null if not found
   */
  function findDropIdForDrag(dragId: DragId): DropId | null {
    const dragDimension = dimensionCollector.getDragDimensions(dragId)
    return dragDimension?.dropId || null
  }

  /**
   * Register a draggable element
   * @param dragId - ID of the draggable element
   * @param dropId - ID of the parent droppable container
   * @param element - The draggable HTML element
   */
  function registerDraggable(dragId: DragId, dropId: DropId, element: HTMLElement) {
    registeredDraggables.value.set(dragId, element)

    if (enableAutoUpdate) {
      // Set current element and collect dimensions
      currentElement.value = element
      currentDragId.value = dragId
      currentDropId.value = null

      // Collect initial dimensions
      dimensionCollector.collectDragDimensions(dragId, dropId)

      // Start observing dimension changes
      dimensionObserver.observe('drag', dragId)
    }
  }

  /**
   * Register a droppable element
   * @param dropId - ID of the droppable container
   * @param element - The droppable HTML element
   */
  function registerDroppable(dropId: DropId, element: HTMLElement) {
    registeredDroppables.value.set(dropId, element)

    if (enableAutoUpdate) {
      // Set current element and collect dimensions
      currentElement.value = element
      currentDragId.value = null
      currentDropId.value = dropId

      // Collect initial dimensions
      dimensionCollector.collectDropDimensions(dropId)

      // Start observing dimension changes
      dimensionObserver.observe('drop', dropId)
    }
  }

  /**
   * Unregister a draggable element
   * @param dragId - ID of the draggable element to unregister
   */
  function unregisterDraggable(dragId: DragId) {
    if (currentDragId.value === dragId) {
      dimensionObserver.disconnect()
      currentDragId.value = null
    }

    registeredDraggables.value.delete(dragId)
  }

  /**
   * Unregister a droppable element
   * @param dropId - ID of the droppable element to unregister
   */
  function unregisterDroppable(dropId: DropId) {
    if (currentDropId.value === dropId) {
      dimensionObserver.disconnect()
      currentDropId.value = null
    }

    registeredDroppables.value.delete(dropId)
  }

  /**
   * Get dimensions for a draggable element
   * @param dragId - ID of the draggable element
   * @param forceUpdate - Whether to force a fresh collection of dimensions
   * @returns The dimensions of the draggable element or null if not found
   */
  function getDragDimensions(dragId: DragId, forceUpdate = false): DragDimension | null {
    if (forceUpdate) {
      const element = registeredDraggables.value.get(dragId)
      if (!element)
        return null

      const dropId = findDropIdForDrag(dragId)
      if (!dropId)
        return null

      currentElement.value = element
      return dimensionCollector.collectDragDimensions(dragId, dropId)
    }

    return dimensionCollector.getDragDimensions(dragId)
  }

  /**
   * Get dimensions for a droppable element
   * @param dropId - ID of the droppable element
   * @param forceUpdate - Whether to force a fresh collection of dimensions
   * @returns The dimensions of the droppable element or null if not found
   */
  function getDropDimensions(dropId: DropId, forceUpdate = false): DropDimension | null {
    if (forceUpdate) {
      const element = registeredDroppables.value.get(dropId)
      if (!element)
        return null

      currentElement.value = element
      return dimensionCollector.collectDropDimensions(dropId)
    }

    return dimensionCollector.getDropDimensions(dropId)
  }

  /**
   * Update the dimensions of all registered elements
   */
  function updateAllDimensions() {
    // Update droppable dimensions first
    for (const [dropId, element] of registeredDroppables.value.entries()) {
      currentElement.value = element
      dimensionCollector.collectDropDimensions(dropId)
    }

    // Then update draggable dimensions
    for (const [dragId, element] of registeredDraggables.value.entries()) {
      const dropId = findDropIdForDrag(dragId)
      if (!dropId)
        continue

      currentElement.value = element
      dimensionCollector.collectDragDimensions(dragId, dropId)
    }
  }

  /**
   * Get all registered draggable IDs
   */
  const allDraggableIds = computed(() => Array.from(registeredDraggables.value.keys()))

  /**
   * Get all registered droppable IDs
   */
  const allDroppableIds = computed(() => Array.from(registeredDroppables.value.keys()))

  /**
   * Clear all dimension caches and registrations
   */
  function reset() {
    dimensionObserver.disconnect()
    dimensionCollector.clearCache()
    registeredDraggables.value.clear()
    registeredDroppables.value.clear()
    currentElement.value = null
    currentDragId.value = null
    currentDropId.value = null
  }

  // Clean up when component is unmounted
  tryOnUnmounted(() => {
    reset()
  })

  return {
    registerDraggable,
    registerDroppable,
    unregisterDraggable,
    unregisterDroppable,
    getDragDimensions,
    getDropDimensions,
    updateAllDimensions,
    reset,
    allDraggableIds,
    allDroppableIds,
  }
}

export default useDimensionManager
