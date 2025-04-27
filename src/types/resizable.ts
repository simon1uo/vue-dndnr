/**
 * Types for the resizable component
 */
import type { MaybeRefOrGetter } from 'vue'
import type { PointerType, Size } from './common'

/**
 * Valid resize handle positions
 * Supports both short ('t', 'b', etc.) and long ('top', 'bottom', etc.) formats
 */
export type ResizeHandle = 't' | 'b' | 'r' | 'l' | 'tr' | 'tl' | 'br' | 'bl' | 'top' | 'bottom' | 'right' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/**
 * Configuration options for resizable functionality
 */
export interface ResizableOptions {
  /**
   * Initial size of the resizable element
   * @default { width: 'auto', height: 'auto' }
   */
  initialSize?: Size

  /**
   * Minimum width constraint in pixels
   * @default 0
   */
  minWidth?: MaybeRefOrGetter<number>

  /**
   * Minimum height constraint in pixels
   * @default 0
   */
  minHeight?: MaybeRefOrGetter<number>

  /**
   * Maximum width constraint in pixels
   * @default Infinity
   */
  maxWidth?: MaybeRefOrGetter<number>

  /**
   * Maximum height constraint in pixels
   * @default Infinity
   */
  maxHeight?: MaybeRefOrGetter<number>

  /**
   * Grid size for snapping during resize
   * @type [number, number] - [width, height] spacing for the grid
   */
  grid?: MaybeRefOrGetter<[number, number] | undefined | null>

  /**
   * Whether to maintain aspect ratio during resizing
   * @default false
   */
  lockAspectRatio?: MaybeRefOrGetter<boolean>

  /**
   * Active resize handles to enable
   * @default ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']
   */
  handles?: MaybeRefOrGetter<ResizeHandle[]>

  /**
   * Element or selector to use as bounds for the resizable element
   * Can be an HTML element or 'parent'
   */
  bounds?: MaybeRefOrGetter<HTMLElement | 'parent' | null | undefined>

  /**
   * Whether resizing is disabled
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>

  /**
   * Types of pointer events to respond to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: MaybeRefOrGetter<PointerType[] | null | undefined>

  /**
   * Whether to prevent default browser events during resize
   * @default true
   */
  preventDefault?: MaybeRefOrGetter<boolean>

  /**
   * Whether to stop event propagation to parent elements
   * @default false
   */
  stopPropagation?: MaybeRefOrGetter<boolean>

  /**
   * Distance in pixels from edges to detect resize handles
   * @default 8
   */
  boundaryThreshold?: MaybeRefOrGetter<number>

  /**
   * Whether to use event capturing phase
   * @default true
   */
  capture?: MaybeRefOrGetter<boolean>

  /**
   * Delay in milliseconds for throttling resize events
   * @default 16 (approximately 60fps)
   */
  throttleDelay?: MaybeRefOrGetter<number>

  /**
   * Called when resizing starts
   * @param size - Current size of the element
   * @param event - The pointer event that triggered the start
   */
  onResizeStart?: (size: Size, event: PointerEvent) => void

  /**
   * Called during resizing
   * @param size - Current size of the element
   * @param event - The pointer event during resizing
   */
  onResize?: (size: Size, event: PointerEvent) => void

  /**
   * Called when resizing ends
   * @param size - Final size of the element
   * @param event - The pointer event that triggered the end
   */
  onResizeEnd?: (size: Size, event: PointerEvent) => void
}
