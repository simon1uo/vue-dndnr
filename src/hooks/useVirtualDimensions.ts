import type { DragId, DropId } from '@/types/core'
import type { DragDimension } from '@/types/dimension'
import { shallowRef } from 'vue'

/**
 * Virtual dimension estimation options
 */
export interface VirtualDimensionOptions {
  /**
   * Default height for draggable items
   * @default 50
   */
  defaultItemHeight?: number

  /**
   * Default width for draggable items
   * @default 200
   */
  defaultItemWidth?: number

  /**
   * Whether to use dynamic item size based on actual rendered items
   * @default true
   */
  useDynamicSize?: boolean

  /**
   * Buffer size for pre-calculating dimensions
   * @default 5
   */
  bufferSize?: number
}

/**
 * Virtual dimension cache entry
 */
interface VirtualDimensionCache {
  height: number
  width: number
  lastUpdated: number
}

/**
 * Composable for managing virtual dimensions in a virtualized list context
 * @param options - Configuration options for virtual dimensions
 * @returns Object containing virtual dimension management methods
 */
export function useVirtualDimensions(options: VirtualDimensionOptions = {}) {
  const {
    defaultItemHeight = 50,
    defaultItemWidth = 200,
    useDynamicSize = true,
    bufferSize = 5,
  } = options

  // Cache for actual measured dimensions
  const dimensionCache = new Map<DragId, VirtualDimensionCache>()

  // Average dimensions based on measured items
  const averageHeight = shallowRef(defaultItemHeight)
  const averageWidth = shallowRef(defaultItemWidth)

  /**
   * Update the dimension cache with actual measurements
   * @param dragId - ID of the draggable item
   * @param dimension - Actual measured dimension
   */
  function updateCache(dragId: DragId, dimension: DragDimension) {
    const height = dimension.client.borderBox.height
    const width = dimension.client.borderBox.width

    dimensionCache.set(dragId, {
      height,
      width,
      lastUpdated: Date.now(),
    })

    if (useDynamicSize) {
      // Update average dimensions
      const entries = Array.from(dimensionCache.values())
      averageHeight.value = entries.reduce((sum, entry) => sum + entry.height, 0) / entries.length
      averageWidth.value = entries.reduce((sum, entry) => sum + entry.width, 0) / entries.length
    }
  }

  /**
   * Get estimated dimensions for a virtual item
   * @param dragId - ID of the draggable item
   * @param dropId - ID of the parent droppable container
   * @param index - Index of the item in the virtual list
   * @returns Estimated dimensions for the virtual item
   */
  function getVirtualDimension(dragId: DragId, dropId: DropId, index: number): DragDimension {
    // Check cache first
    const cached = dimensionCache.get(dragId)
    if (cached) {
      return createVirtualDimension(dragId, dropId, cached.height, cached.width, index)
    }

    // Use average or default dimensions
    return createVirtualDimension(
      dragId,
      dropId,
      averageHeight.value,
      averageWidth.value,
      index,
    )
  }

  /**
   * Create a virtual dimension object with estimated position
   */
  function createVirtualDimension(
    dragId: DragId,
    dropId: DropId,
    height: number,
    width: number,
    index: number,
  ): DragDimension {
    const top = index * height
    return {
      id: dragId,
      dropId,
      client: {
        marginBox: {
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          x: 0,
          y: top,
        },
        contentBox: {
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          x: 0,
          y: top,
        },
        borderBox: {
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          x: 0,
          y: top,
        },
        paddingBox: {
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          x: 0,
          y: top,
        },
      },
      page: {
        marginBox: {
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          x: 0,
          y: top,
        },
        contentBox: {
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          x: 0,
          y: top,
        },
        borderBox: {
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          x: 0,
          y: top,
        },
        paddingBox: {
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          x: 0,
          y: top,
        },
      },
      windowScroll: { x: 0, y: 0 },
    }
  }

  /**
   * Clear the dimension cache
   */
  function clearCache() {
    dimensionCache.clear()
    averageHeight.value = defaultItemHeight
    averageWidth.value = defaultItemWidth
  }

  /**
   * Get the estimated total height of a virtual list
   * @param totalItems - Total number of items in the list
   * @returns Estimated total height
   */
  function getEstimatedTotalHeight(totalItems: number): number {
    return totalItems * averageHeight.value
  }

  /**
   * Get the estimated range of visible items
   * @param scrollTop - Current scroll position
   * @param viewportHeight - Height of the viewport
   * @param totalItems - Total number of items
   * @returns Object containing start and end indices of visible items
   */
  function getVisibleRange(scrollTop: number, viewportHeight: number, totalItems: number) {
    const itemHeight = averageHeight.value
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
    const visibleItems = Math.ceil(viewportHeight / itemHeight)
    const end = Math.min(
      totalItems - 1,
      Math.floor(scrollTop / itemHeight) + visibleItems + bufferSize - 1,
    )
    return { start, end }
  }

  return {
    updateCache,
    getVirtualDimension,
    clearCache,
    getEstimatedTotalHeight,
    getVisibleRange,
    averageHeight,
    averageWidth,
  }
}
