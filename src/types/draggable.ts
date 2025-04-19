/**
 * Types for the draggable component
 */

export interface Position {
  x: number
  y: number
}

export interface DraggableOptions {
  /**
   * Initial position of the draggable element
   */
  initialPosition?: Position

  /**
   * Bounds for the draggable element
   * Can be an HTMLElement, 'parent', or an object with left, top, right, bottom values
   */
  bounds?: HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number }

  /**
   * Grid to snap to during dragging [x, y]
   */
  grid?: [number, number]

  /**
   * Axis constraint for dragging: 'x', 'y', or 'both'
   */
  axis?: 'x' | 'y' | 'both'

  /**
   * CSS selector for the drag handle
   */
  handle?: string

  /**
   * CSS selector for elements that should cancel dragging
   */
  cancel?: string

  /**
   * Scale factor for nested transformations
   */
  scale?: number

  /**
   * Whether dragging is disabled
   */
  disabled?: boolean
}

export interface DraggableEvents {
  /**
   * Emitted when dragging starts
   */
  onDragStart?: (event: MouseEvent | TouchEvent) => void

  /**
   * Emitted during dragging
   */
  onDrag?: (event: MouseEvent | TouchEvent) => void

  /**
   * Emitted when dragging ends
   */
  onDragEnd?: (event: MouseEvent | TouchEvent) => void
}

export interface DraggableElement {
  id: string
  element: HTMLElement
  options: DraggableOptions
}
