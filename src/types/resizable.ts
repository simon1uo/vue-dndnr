/**
 * Types for the resizable component
 */
import type { MaybeRefOrGetter } from 'vue'
import type { PointerType, Size } from './common'

export type ResizeHandle = 't' | 'b' | 'r' | 'l' | 'tr' | 'tl' | 'br' | 'bl' | 'top' | 'bottom' | 'right' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export interface ResizableOptions {
  /**
   * Initial size of the resizable element
   */
  initialSize?: Size

  /**
   * Minimum width of the resizable element
   */
  minWidth?: MaybeRefOrGetter<number>

  /**
   * Minimum height of the resizable element
   */
  minHeight?: MaybeRefOrGetter<number>

  /**
   * Maximum width of the resizable element
   */
  maxWidth?: MaybeRefOrGetter<number>

  /**
   * Maximum height of the resizable element
   */
  maxHeight?: MaybeRefOrGetter<number>

  /**
   * Grid to snap to during resizing [x, y]
   */
  grid?: MaybeRefOrGetter<[number, number] | undefined | null>

  /**
   * Whether to maintain aspect ratio during resizing
   */
  lockAspectRatio?: MaybeRefOrGetter<boolean>

  /**
   * Which resize handles to enable
   * @default ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']
   */
  handles?: MaybeRefOrGetter<ResizeHandle[]>

  /**
   * Element or selector to use as bounds for the resizable element
   */
  bounds?: MaybeRefOrGetter<HTMLElement | 'parent' | null | undefined>

  /**
   * Whether resizing is disabled
   */
  disabled?: MaybeRefOrGetter<boolean>

  /**
   * Pointer types to respond to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: MaybeRefOrGetter<PointerType[] | null | undefined>

  /**
   * Whether to prevent default browser behavior during resize
   * @default true
   */
  preventDefault?: MaybeRefOrGetter<boolean>

  /**
   * Whether to stop event propagation during resize
   * @default false
   */
  stopPropagation?: MaybeRefOrGetter<boolean>

  /**
   * Threshold in pixels for boundary detection
   * @default 8
   */
  boundaryThreshold?: MaybeRefOrGetter<number>

  /**
   * Whether to dispatch events in capturing phase
   * @default true
   */
  capture?: MaybeRefOrGetter<boolean>

  /**
   * Throttle delay in milliseconds for resize events
   * @default 16 (approximately 60fps)
   */
  throttleDelay?: MaybeRefOrGetter<number>

  /**
   * Called when resizing starts
   * @param size Current size of the element
   * @param event The mouse or touch event
   */
  onResizeStart?: (size: Size, event: PointerEvent) => void

  /**
   * Called during resizing
   * @param size Current size of the element
   * @param event The mouse or touch event
   */
  onResize?: (size: Size, event: PointerEvent) => void

  /**
   * Called when resizing ends
   * @param size Final size of the element
   * @param event The mouse or touch event
   */
  onResizeEnd?: (size: Size, event: PointerEvent) => void
}
