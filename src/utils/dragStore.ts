import type { ComputedRef, type DeepReadonly, ShallowRef } from 'vue'
import type { ActiveDragContext, DragMode } from '../types'
import type { Position } from '../types/common'
import { computed, readonly, shallowRef } from 'vue'

const currentDragContextInternal = shallowRef<ActiveDragContext | null>(null)
const initialScrollPosition = shallowRef<Position | null>(null)

/**
 * Generate a unique ID for drag operations
 * @returns A unique string ID
 */
export const generateDragId = (): string => `drag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

/**
 * Interface for setActiveDrag parameters
 */
/**
 * Parameters for setting an active drag operation
 */
export interface ActiveDragParams {
  /**
   * The unique ID of the drag operation
   */
  id: string

  /**
   * The ID of the dragged item
   */
  dragId: string

  /**
   * The index of the dragged item
   */
  index: number

  /**
   * The type of the dragged item
   */
  type: string

  /**
   * The drag mode being used (native or pointer)
   */
  dragMode: DragMode

  /**
   * Optional ID of the source drop zone
   * @type {string}
   * @optional
   */
  sourceDropId?: string

  /**
   * Optional initial position of the drag operation
   * @type {Position}
   * @optional
   */
  initialPosition?: Position

  /**
   * Optional source HTML element from which the drag originated
   * @type {HTMLElement}
   * @optional
   */
  sourceNode?: HTMLElement

  /**
   * Optional initial pointer position when the drag operation started
   * @type {Position}
   * @optional
   */
  initialPointerPosition?: Position
}

/**
 * Get current window scroll position
 */
function getScrollPosition(): Position {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }

  return {
    x: window.scrollX || window.pageXOffset,
    y: window.scrollY || window.pageYOffset,
  }
}

const dragStore = {
  /**
   * Sets the currently active drag operation.
   * @param params Object containing drag operation parameters
   */
  setActiveDrag: (params: ActiveDragParams): void => {
    const { id, dragId, index, type, dragMode, sourceDropId, initialPosition, sourceNode, initialPointerPosition } = params

    const newContext: ActiveDragContext = {
      id,
      dragId,
      index,
      type,
      dragMode,
      sourceDropId,
      sourceNode,
      initialPointerPosition,
    }

    // Store initial scroll position
    initialScrollPosition.value = getScrollPosition()

    // If initial position is provided, update it
    if (initialPosition) {
      newContext.currentPosition = initialPosition
    }
    currentDragContextInternal.value = newContext
  },

  /**
   * Gets the currently active drag operation context.
   * Returns a readonly version of the shallow ref.
   * @returns A readonly shallow ref to the active drag context.
   */
  getActiveDrag: (): DeepReadonly<ShallowRef<ActiveDragContext | null>> => {
    return readonly(currentDragContextInternal)
  },

  /**
   * Clears the currently active drag operation.
   * If an ID is provided, it only clears if the active drag's ID matches.
   * @param id Optional ID of the drag operation to clear.
   */
  clearActiveDrag: (id?: string): void => {
    if (!currentDragContextInternal.value)
      return

    if (!id || currentDragContextInternal.value.id === id) {
      currentDragContextInternal.value = null
      initialScrollPosition.value = null
    }
  },

  /**
   * Checks if drag data exists for a given ID.
   * @param id The ID to check.
   * @returns True if data exists for the ID, false otherwise.
   */
  hasDataById: (id: string): boolean => {
    return !!(currentDragContextInternal.value && currentDragContextInternal.value.id === id)
  },

  /**
   * Clears the active drag context.
   */
  clearAll: (): void => {
    currentDragContextInternal.value = null
    initialScrollPosition.value = null
  },

  /**
   * update current drag pointer position
   * @param position current pointer position
   */
  updatePosition: (position: Position): void => {
    if (!currentDragContextInternal.value)
      return

    // To ensure reactivity, we need to assign a new object or update a reactive property.
    // If currentPosition is meant to be reactive itself, it should be a ref inside ActiveDragContext.
    // For now, creating a new context object to ensure the shallowRef updates.
    currentDragContextInternal.value = {
      ...currentDragContextInternal.value,
      currentPosition: position,
    }
  },

  /**
   * get current drag pointer position
   * Returns a readonly computed ref to the current position.
   * @returns readonly computed position ref, or ref to undefined if no active drag or no position.
   */
  getPosition: (): Readonly<ComputedRef<Position | undefined>> => {
    return computed(() => currentDragContextInternal.value?.currentPosition)
  },

  /**
   * Get initial scroll position when drag started
   * Returns a readonly version of the shallow ref.
   * @returns A readonly shallow ref to the initial scroll position.
   */
  getInitialScrollPosition: (): DeepReadonly<ShallowRef<Position | null>> => {
    return readonly(initialScrollPosition)
  },
}

export default dragStore
