import type { DragId, DropId } from '@/types/core'
import type { DragDimension, DropDimension } from '@/types/dimension'
import type { MaybeRefOrGetter } from 'vue'
import type { DimensionObserverOptions } from './useDimensionObserver'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, shallowRef, toValue } from 'vue'
import { useDimensionCollector } from './useDimensionCollector'
import { useDimensionObserver } from './useDimensionObserver'

/**
 * Options for the dimension manager
 */
export interface DimensionManagerOptions {
  /**
   * Options for the dimension observer
   */
  observerOptions?: DimensionObserverOptions
}

/**
 * Composable function for managing dimensions of draggable and droppable elements
 * @param options - Configuration options
 * @returns Object containing dimension management methods and data
 */
export function useDimensionManager(options: DimensionManagerOptions = {}) {
  // Registry of elements
  const dragElements = new Map<DragId, {
    element: HTMLElement | SVGElement
    dropId: DropId
  }>()

  const dropElements = new Map<DropId, HTMLElement | SVGElement>()

  // Store for dimensions
  const dragDimensions = shallowRef<Map<DragId, DragDimension>>(new Map())
  const dropDimensions = shallowRef<Map<DropId, DropDimension>>(new Map())

  // Current active element for observer
  const currentElement = shallowRef<HTMLElement | SVGElement | null>(null)

  // Create dimension collector
  const dimensionCollector = useDimensionCollector(currentElement)

  // Handle dimension updates
  const handleDimensionUpdate = (type: 'drag' | 'drop', id: DragId | DropId) => {
    if (type === 'drag') {
      const dragId = id as DragId
      const dragInfo = dragElements.get(dragId)

      if (dragInfo) {
        currentElement.value = dragInfo.element
        const dimension = dimensionCollector.collectDragDimensions(dragId, dragInfo.dropId)

        if (dimension) {
          const newDragDimensions = new Map(dragDimensions.value)
          newDragDimensions.set(dragId, dimension)
          dragDimensions.value = newDragDimensions

          // Update the activities array in the parent droppable
          updateDroppableActivities(dragInfo.dropId)
        }
      }
    }
    else {
      const dropId = id as DropId
      const element = dropElements.get(dropId)

      if (element) {
        currentElement.value = element
        const dimension = dimensionCollector.collectDropDimensions(dropId)

        if (dimension) {
          const newDropDimensions = new Map(dropDimensions.value)
          newDropDimensions.set(dropId, dimension)
          dropDimensions.value = newDropDimensions
        }
      }
    }
  }

  // Create dimension observer
  const dimensionObserver = useDimensionObserver(currentElement, handleDimensionUpdate, options.observerOptions)

  /**
   * Update the activities array in a droppable's dimensions
   * @param dropId - ID of the droppable to update
   */
  function updateDroppableActivities(dropId: DropId) {
    const dropDimension = dropDimensions.value.get(dropId)
    if (!dropDimension)
      return

    // Collect all draggables that belong to this droppable
    const activities: DragDimension[] = []
    dragDimensions.value.forEach((dragDimension) => {
      if (dragDimension.dropId === dropId) {
        activities.push(dragDimension)
      }
    })

    // Create a new drop dimension with updated activities
    const updatedDropDimension: DropDimension = {
      ...dropDimension,
      subject: {
        ...dropDimension.subject,
        activities,
      },
    }

    // Update the drop dimensions map
    const newDropDimensions = new Map(dropDimensions.value)
    newDropDimensions.set(dropId, updatedDropDimension)
    dropDimensions.value = newDropDimensions
  }

  /**
   * Register a draggable element
   * @param dragId - ID of the draggable element
   * @param element - The draggable element
   * @param dropId - ID of the parent droppable container
   */
  function registerDraggable(dragId: DragId, element: MaybeRefOrGetter<HTMLElement | SVGElement>, dropId: DropId) {
    const el = toValue(element)
    if (!el)
      return

    // Store the element in the registry
    dragElements.set(dragId, { element: el, dropId })

    // Set as current element and collect dimensions
    currentElement.value = el
    const dimension = dimensionCollector.collectDragDimensions(dragId, dropId)

    if (dimension) {
      const newDragDimensions = new Map(dragDimensions.value)
      newDragDimensions.set(dragId, dimension)
      dragDimensions.value = newDragDimensions

      // Start observing
      dimensionObserver.observe('drag', dragId)

      // Update the activities array in the parent droppable
      updateDroppableActivities(dropId)
    }
  }

  /**
   * Register a droppable element
   * @param dropId - ID of the droppable container
   * @param element - The droppable element
   */
  function registerDroppable(dropId: DropId, element: MaybeRefOrGetter<HTMLElement | SVGElement>) {
    const el = toValue(element)
    if (!el)
      return

    // Store the element in the registry
    dropElements.set(dropId, el)

    // Set as current element and collect dimensions
    currentElement.value = el
    const dimension = dimensionCollector.collectDropDimensions(dropId)

    if (dimension) {
      const newDropDimensions = new Map(dropDimensions.value)
      newDropDimensions.set(dropId, dimension)
      dropDimensions.value = newDropDimensions

      // Start observing
      dimensionObserver.observe('drop', dropId)
    }
  }

  /**
   * Unregister a draggable element
   * @param dragId - ID of the draggable element to unregister
   */
  function unregisterDraggable(dragId: DragId) {
    const dragInfo = dragElements.get(dragId)

    if (dragInfo) {
      // Stop observing
      dimensionObserver.disconnect()

      // Remove from registry
      dragElements.delete(dragId)

      // Remove from dimensions
      const newDragDimensions = new Map(dragDimensions.value)
      newDragDimensions.delete(dragId)
      dragDimensions.value = newDragDimensions

      // Update the activities array in the parent droppable
      updateDroppableActivities(dragInfo.dropId)
    }
  }

  /**
   * Unregister a droppable element
   * @param dropId - ID of the droppable container to unregister
   */
  function unregisterDroppable(dropId: DropId) {
    if (dropElements.has(dropId)) {
      // Stop observing
      dimensionObserver.disconnect()

      // Remove from registry
      dropElements.delete(dropId)

      // Remove from dimensions
      const newDropDimensions = new Map(dropDimensions.value)
      newDropDimensions.delete(dropId)
      dropDimensions.value = newDropDimensions

      // Remove all draggables that belong to this droppable
      const dragsToRemove: DragId[] = []
      dragElements.forEach((info, dragId) => {
        if (info.dropId === dropId) {
          dragsToRemove.push(dragId)
        }
      })

      dragsToRemove.forEach(unregisterDraggable)
    }
  }

  /**
   * Force refresh dimensions for all elements or a specific element
   * @param type - Type of element to refresh ('drag', 'drop', or undefined for all)
   * @param id - ID of the element to refresh (or undefined for all of the specified type)
   */
  function refreshDimensions(type?: 'drag' | 'drop', id?: DragId | DropId) {
    if (!type) {
      // Refresh all elements
      dragElements.forEach((info, dragId) => {
        currentElement.value = info.element
        const dimension = dimensionCollector.collectDragDimensions(dragId, info.dropId)
        if (dimension) {
          const newDragDimensions = new Map(dragDimensions.value)
          newDragDimensions.set(dragId, dimension)
          dragDimensions.value = newDragDimensions
        }
      })

      dropElements.forEach((element, dropId) => {
        currentElement.value = element
        const dimension = dimensionCollector.collectDropDimensions(dropId)
        if (dimension) {
          const newDropDimensions = new Map(dropDimensions.value)
          newDropDimensions.set(dropId, dimension)
          dropDimensions.value = newDropDimensions
        }
      })

      // Update all droppable activities
      dropElements.forEach((_, dropId) => {
        updateDroppableActivities(dropId)
      })
    }
    else if (type === 'drag' && id) {
      const dragId = id as DragId
      const dragInfo = dragElements.get(dragId)

      if (dragInfo) {
        currentElement.value = dragInfo.element
        const dimension = dimensionCollector.collectDragDimensions(dragId, dragInfo.dropId)
        if (dimension) {
          const newDragDimensions = new Map(dragDimensions.value)
          newDragDimensions.set(dragId, dimension)
          dragDimensions.value = newDragDimensions
          updateDroppableActivities(dragInfo.dropId)
        }
      }
    }
    else if (type === 'drop' && id) {
      const dropId = id as DropId
      const element = dropElements.get(dropId)

      if (element) {
        currentElement.value = element
        const dimension = dimensionCollector.collectDropDimensions(dropId)
        if (dimension) {
          const newDropDimensions = new Map(dropDimensions.value)
          newDropDimensions.set(dropId, dimension)
          dropDimensions.value = newDropDimensions
          updateDroppableActivities(dropId)
        }
      }
    }
  }

  /**
   * Get a draggable element's dimensions
   * @param dragId - ID of the draggable element
   * @returns The draggable element's dimensions or null if not found
   */
  function getDraggableDimension(dragId: DragId): DragDimension | null {
    return dragDimensions.value.get(dragId) || null
  }

  /**
   * Get a droppable container's dimensions
   * @param dropId - ID of the droppable container
   * @returns The droppable container's dimensions or null if not found
   */
  function getDroppableDimension(dropId: DropId): DropDimension | null {
    return dropDimensions.value.get(dropId) || null
  }

  // Computed properties for reactive access
  const allDragDimensions = computed(() => Array.from(dragDimensions.value.values()))
  const allDropDimensions = computed(() => Array.from(dropDimensions.value.values()))

  // Clean up when component is unmounted
  tryOnUnmounted(() => {
    dimensionObserver.disconnect()
    dimensionCollector.clearCache()
    dragElements.clear()
    dropElements.clear()
    dragDimensions.value.clear()
    dropDimensions.value.clear()
  })

  return {
    registerDraggable,
    registerDroppable,
    unregisterDraggable,
    unregisterDroppable,
    refreshDimensions,
    getDraggableDimension,
    getDroppableDimension,
    allDragDimensions,
    allDropDimensions,
  }
}

export default useDimensionManager
