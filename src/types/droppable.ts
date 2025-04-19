/**
 * Types for the droppable component
 */

export interface DroppableOptions {
  /**
   * Selector or function to determine which draggable elements can be dropped
   */
  accept?: string | ((draggedElement: HTMLElement) => boolean)

  /**
   * Whether the droppable is disabled
   */
  disabled?: boolean

  /**
   * Whether the droppable should prevent event propagation to nested droppables
   */
  greedy?: boolean
}

export interface DroppableEvents {
  /**
   * Emitted when a draggable enters the droppable
   */
  onDropEnter?: (event: DragEvent) => void

  /**
   * Emitted when a draggable is over the droppable
   */
  onDropOver?: (event: DragEvent) => void

  /**
   * Emitted when a draggable leaves the droppable
   */
  onDropLeave?: (event: DragEvent) => void

  /**
   * Emitted when a draggable is dropped on the droppable
   */
  onDrop?: (event: DragEvent) => void
}

export interface DroppableElement {
  id: string
  element: HTMLElement
  options: DroppableOptions
}
