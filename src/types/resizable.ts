/**
 * Types for the resizable component
 */

export interface Size {
  width: number | string
  height: number | string
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface ResizableOptions {
  /**
   * Initial size of the resizable element
   */
  initialSize?: Size

  /**
   * Minimum width of the resizable element
   */
  minWidth?: number

  /**
   * Minimum height of the resizable element
   */
  minHeight?: number

  /**
   * Maximum width of the resizable element
   */
  maxWidth?: number

  /**
   * Maximum height of the resizable element
   */
  maxHeight?: number

  /**
   * Grid to snap to during resizing [x, y]
   */
  grid?: [number, number]

  /**
   * Whether to maintain aspect ratio during resizing
   */
  lockAspectRatio?: boolean

  /**
   * Which resize handles to enable
   */
  handles?: ResizeHandle[]

  /**
   * Whether resizing is disabled
   */
  disabled?: boolean

  /**
   * Pointer types to respond to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: string[]

  /**
   * Whether to prevent default browser behavior during resize
   * @default true
   */
  preventDefault?: boolean

  /**
   * Whether to stop event propagation during resize
   * @default false
   */
  stopPropagation?: boolean
}

export interface ResizableEvents {
  /**
   * Emitted when resizing starts
   */
  onResizeStart?: (event: MouseEvent | TouchEvent, handle: ResizeHandle) => void

  /**
   * Emitted during resizing
   */
  onResize?: (event: MouseEvent | TouchEvent, handle: ResizeHandle) => void

  /**
   * Emitted when resizing ends
   */
  onResizeEnd?: (event: MouseEvent | TouchEvent, handle: ResizeHandle) => void
}
