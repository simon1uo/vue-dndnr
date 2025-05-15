import type { DragData } from '@/types'

/**
 * Global drag store for sharing drag data between components
 * This helps overcome limitations with dataTransfer in dragenter/dragover events
 */
export interface ActiveDragContext<T = unknown> {
  id: string
  data: DragData<T>
  isFallback: boolean
  // sourceElement?: HTMLElement | SVGElement | null; // Future consideration
}

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
   * @param data The data associated with the drag.
   * @param isFallback True if the drag is using fallback mode (pointer events).
   */
  setActiveDrag: <T>(id: string, data: DragData<T>, isFallback: boolean): void => {
    currentDragContextInternal = { id, data, isFallback }
  },

  /**
   * Gets the currently active drag operation context.
   * @returns The active drag context or null if no drag is active.
   */
  getActiveDrag: <T = unknown>(): ActiveDragContext<T> | null => {
    return currentDragContextInternal as ActiveDragContext<T> | null
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
   * Retrieves drag data by its ID.
   * @param id The ID of the drag data to retrieve.
   * @returns The drag data or null if not found.
   */
  getDataById: <T>(id: string): DragData<T> | null => {
    if (currentDragContextInternal && currentDragContextInternal.id === id) {
      return currentDragContextInternal.data as DragData<T>
    }
    return null
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
