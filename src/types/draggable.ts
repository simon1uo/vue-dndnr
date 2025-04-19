/**
 * Types for the draggable component
 */

export interface Position {
  x: number
  y: number
}

export type PointerType = 'mouse' | 'touch' | 'pen'

export interface DraggableOptions {
  /**
   * Initial position of the element
   */
  initialPosition?: Position

  /**
   * Element or selector to use as bounds for the draggable element
   */
  bounds?: HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number }

  /**
   * Grid size for snapping during drag [x, y]
   */
  grid?: [number, number]

  /**
   * Axis to drag on
   * @default 'both'
   */
  axis?: 'x' | 'y' | 'both'

  /**
   * CSS selector for the drag handle
   */
  handle?: string

  /**
   * CSS selector for elements that should not trigger drag
   */
  cancel?: string

  /**
   * Scale factor for the draggable element (useful for transformed parents)
   * @default 1
   */
  scale?: number

  /**
   * Whether dragging is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Pointer types that listen to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: PointerType[]

  /**
   * Whether to prevent default events
   * @default true
   */
  preventDefault?: boolean

  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean
}

export interface DraggableElement {
  id: string
  element: HTMLElement
  position: Position
  isDragging: boolean
}
