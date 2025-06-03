import type { Position } from '@/types/common'
import type { DragDimension, DropDimension } from '@/types/dimension'
import type { MaybeRefOrGetter } from 'vue'
import { calculateDetailedBoxModel, transformBoxToPageCoordinates } from '@/utils/dimension'
import { useElementBounding, useElementSize, useScroll, useWindowScroll } from '@vueuse/core'
import { shallowRef, toValue, watch } from 'vue'

/**
 * Composable function for collecting and managing element dimensions
 * @param target - Reference to the target element
 * @returns Object containing dimension collection methods and data
 */
export function useDimensionCollector(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
) {
  // Cache for collected dimensions
  const dragDimensionsCache = new Map<string, DragDimension>()
  const dropDimensionsCache = new Map<string, DropDimension>()

  // Initialize VueUse hooks
  const { x: windowScrollX, y: windowScrollY } = useWindowScroll()
  const elementBounding = useElementBounding(target)
  const elementSize = useElementSize(target)

  // Current window scroll position
  const windowScroll = shallowRef<Position>({ x: 0, y: 0 })

  // Update window scroll position when it changes
  watch([windowScrollX, windowScrollY], ([newX, newY]: [number, number]) => {
    windowScroll.value = { x: newX, y: newY }
  }, { immediate: true })

  /**
   * Collect dimensions for a draggable element
   * @param dragId - ID of the draggable element
   * @param dropId - ID of the parent droppable container
   * @returns Collected drag dimensions
   */
  function collectDragDimensions(dragId: string, dropId: string): DragDimension | null {
    const el = toValue(target)
    if (!el)
      return null

    // In test environments, we may have a mock element that's not a real HTMLElement
    // but has all the required properties and methods
    const isHTMLElementLike = el instanceof HTMLElement
      || (typeof el === 'object' && el !== null && 'nodeType' in el)

    if (!isHTMLElementLike)
      return null

    // Get current measurements
    const clientBox = calculateDetailedBoxModel(
      el as HTMLElement,
      {
        top: elementBounding.top.value,
        right: elementBounding.right.value,
        bottom: elementBounding.bottom.value,
        left: elementBounding.left.value,
        width: elementBounding.width.value,
        height: elementBounding.height.value,
        x: elementBounding.x.value,
        y: elementBounding.y.value,
      },
      {
        width: elementSize.width.value,
        height: elementSize.height.value,
      },
    )

    // Transform to page coordinates
    const pageBox = transformBoxToPageCoordinates(clientBox, windowScroll.value)

    // Create drag dimension object
    const dragDimension: DragDimension = {
      id: dragId,
      dropId,
      client: clientBox,
      page: pageBox,
      windowScroll: { ...windowScroll.value },
    }

    // Cache the dimensions
    dragDimensionsCache.set(dragId, dragDimension)

    return dragDimension
  }

  /**
   * Collect dimensions for a droppable container
   * @param dropId - ID of the droppable container
   * @returns Collected drop dimensions
   */
  function collectDropDimensions(dropId: string): DropDimension | null {
    const el = toValue(target)
    if (!el)
      return null

    // In test environments, we may have a mock element that's not a real HTMLElement
    // but has all the required properties and methods
    const isHTMLElementLike = el instanceof HTMLElement
      || (typeof el === 'object' && el !== null && 'nodeType' in el)

    if (!isHTMLElementLike)
      return null

    // Get current measurements
    const clientBox = calculateDetailedBoxModel(
      el as HTMLElement,
      {
        top: elementBounding.top.value,
        right: elementBounding.right.value,
        bottom: elementBounding.bottom.value,
        left: elementBounding.left.value,
        width: elementBounding.width.value,
        height: elementBounding.height.value,
        x: elementBounding.x.value,
        y: elementBounding.y.value,
      },
      {
        width: elementSize.width.value,
        height: elementSize.height.value,
      },
    )

    // Transform to page coordinates
    const pageBox = transformBoxToPageCoordinates(clientBox, windowScroll.value)

    // Check if the element is scrollable
    const { isScrollable, scroll, scrollSize } = (() => {
      const { x, y } = useScroll(el)
      return {
        isScrollable: el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth,
        scroll: { x: x.value, y: y.value },
        scrollSize: {
          x: el.scrollWidth,
          y: el.scrollHeight,
        },
      }
    })()

    // Create drop dimension object
    const dropDimension: DropDimension = {
      id: dropId,
      client: clientBox,
      page: pageBox,
      windowScroll: { ...windowScroll.value },
      ...(isScrollable && {
        frame: {
          scroll,
          scrollSize,
          clientHeight: el.clientHeight,
          clientWidth: el.clientWidth,
        },
      }),
      subject: {
        page: pageBox,
        withDroppableDisplacement: pageBox,
        activities: [],
      },
    }

    // Cache the dimensions
    dropDimensionsCache.set(dropId, dropDimension)

    return dropDimension
  }

  /**
   * Get cached drag dimensions
   * @param dragId - ID of the draggable element
   * @returns Cached drag dimensions or null if not found
   */
  function getDragDimensions(dragId: string): DragDimension | null {
    return dragDimensionsCache.get(dragId) || null
  }

  /**
   * Get cached drop dimensions
   * @param dropId - ID of the droppable container
   * @returns Cached drop dimensions or null if not found
   */
  function getDropDimensions(dropId: string): DropDimension | null {
    return dropDimensionsCache.get(dropId) || null
  }

  /**
   * Clear dimension caches
   */
  function clearCache() {
    dragDimensionsCache.clear()
    dropDimensionsCache.clear()
  }

  return {
    collectDragDimensions,
    collectDropDimensions,
    getDragDimensions,
    getDropDimensions,
    clearCache,
  }
}

export default useDimensionCollector
