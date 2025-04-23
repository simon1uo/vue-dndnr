/**
 * Types for the resizable component
 */
import type { MaybeRefOrGetter } from 'vue'

export interface Size {
  width: number | string
  height: number | string
}

export type ResizeHandle = 't' | 'b' | 'r' | 'l' | 'tr' | 'tl' | 'br' | 'bl' | 'top' | 'bottom' | 'right' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

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
   * Element or selector to use as bounds for the resizable element
   */
  bounds?: MaybeRefOrGetter<HTMLElement | 'parent'>

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

  /**
   * Threshold in pixels for boundary detection
   * @default 8
   */
  boundaryThreshold?: number

  /**
   * Called when resizing starts
   * @param size Current size of the element
   * @param event The mouse or touch event
   */
  onResizeStart?: (size: Size, event: MouseEvent | TouchEvent) => void

  /**
   * Called during resizing
   * @param size Current size of the element
   * @param event The mouse or touch event
   */
  onResize?: (size: Size, event: MouseEvent | TouchEvent) => void

  /**
   * Called when resizing ends
   * @param size Final size of the element
   * @param event The mouse or touch event
   */
  onResizeEnd?: (size: Size, event: MouseEvent | TouchEvent) => void
}
