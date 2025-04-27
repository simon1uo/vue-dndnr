import type { MaybeRefOrGetter } from 'vue'
import type { PointerType, Position } from './common'

export interface DraggableOptions {
  /**
   * Initial position of the element
   */
  initialPosition?: Position

  /**
   * Element or selector to use as bounds for the draggable element
   */
  bounds?: MaybeRefOrGetter<HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number } | null | undefined>

  /**
   * Grid size for snapping during drag [x, y]
   */
  grid?: MaybeRefOrGetter<[number, number] | undefined | null>

  /**
   * Axis to drag on
   * @default 'both'
   */
  axis?: MaybeRefOrGetter<'x' | 'y' | 'both'>

  /**
   * Element for the drag handle
   */
  handle?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * Element to attach `pointermove` and `pointerup` events to.
   *
   * @default window
   */
  draggingElement?: MaybeRefOrGetter<HTMLElement | SVGElement | Window | Document | null | undefined>

  /**
   * Scale factor for the draggable element (useful for transformed parents)
   * @default 1
   */
  scale?: MaybeRefOrGetter<number>

  /**
   * Whether dragging is disabled
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>

  /**
   * Pointer types that listen to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: MaybeRefOrGetter<PointerType[] | null | undefined>

  /**
   * Whether to prevent default events
   * @default true
   */
  preventDefault?: MaybeRefOrGetter<boolean>

  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: MaybeRefOrGetter<boolean>

  /**
   * Whether to dispatch events in capturing phase
   * @default true
   */
  capture?: MaybeRefOrGetter<boolean>

  /**
   * Throttle delay in milliseconds for drag events
   * @default 16 (approximately 60fps)
   */
  throttleDelay?: MaybeRefOrGetter<number>

  /**
   * Called when dragging starts
   * @param position Current position of the element
   * @param event The mouse or touch event
   */
  onDragStart?: (position: Position, event: PointerEvent) => void | boolean

  /**
   * Called during dragging
   * @param position Current position of the element
   * @param event The mouse or touch event
   */
  onDrag?: (position: Position, event: PointerEvent) => void | boolean

  /**
   * Called when dragging ends
   * @param position Final position of the element
   * @param event The mouse or touch event
   */
  onDragEnd?: (position: Position, event: PointerEvent) => void | boolean
}

export interface DraggableElement {
  id: string
  element: HTMLElement
  position: Position
  isDragging: boolean
}
