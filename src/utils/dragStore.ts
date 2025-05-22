import type { ActiveDragContext } from '../types'

let currentDragContextInternal: ActiveDragContext | null = null

/**
 * Generate a unique ID for drag operations
 * @returns A unique string ID
 */
export const generateDragId = (): string => `drag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

const dragStore = {
  /**
   * Sets the currently active drag operation.
   * @param id The unique ID of the drag operation.
   * @param dragId The ID of the dragged item.
   * @param index The index of the dragged item.
   * @param type The type of the dragged item.
   * @param isFallback True if the drag is using fallback mode (pointer events).
   * @param sourceDropId Optional ID of the source drop zone.
   */
  setActiveDrag: (
    id: string,
    dragId: string,
    index: number,
    type: string,
    isFallback: boolean,
    sourceDropId?: string,
  ): void => {
    currentDragContextInternal = { id, dragId, index, type, isFallback, sourceDropId }
  },

  /**
   * Gets the currently active drag operation context.
   * @returns The active drag context or null if no drag is active.
   */
  getActiveDrag: (): ActiveDragContext | null => {
    return currentDragContextInternal
  },

  /**
   * Clears the currently active drag operation.
   * If an ID is provided, it only clears if the active drag's ID matches.
   * @param id Optional ID of the drag operation to clear.
   */
  clearActiveDrag: (id?: string): void => {
    if (currentDragContextInternal) {
      if (!id || currentDragContextInternal.id === id) {
        currentDragContextInternal = null
      }
    }
  },

  /**
   * Checks if drag data exists for a given ID.
   * @param id The ID to check.
   * @returns True if data exists for the ID, false otherwise.
   */
  hasDataById: (id: string): boolean => {
    return !!(currentDragContextInternal && currentDragContextInternal.id === id)
  },

  /**
   * Clears the active drag context.
   */
  clearAll: (): void => {
    currentDragContextInternal = null
  },
}

export default dragStore
