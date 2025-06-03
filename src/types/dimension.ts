import type { Position } from './common'
import type { DragId, DropId } from './core'

/**
 * Represents a rectangle with position and size
 */
export interface Rect {
  /** Top position (y-coordinate of the top edge) */
  top: number
  /** Right position (x-coordinate of the right edge) */
  right: number
  /** Bottom position (y-coordinate of the bottom edge) */
  bottom: number
  /** Left position (x-coordinate of the left edge) */
  left: number
  /** Width of the rectangle */
  width: number
  /** Height of the rectangle */
  height: number
  /** X-coordinate of the top-left corner */
  x: number
  /** Y-coordinate of the top-left corner */
  y: number
}

/**
 * Represents the box model of an element with different box types
 */
export interface BoxModel {
  /** The margin box (element + padding + border + margin) */
  marginBox: Rect
  /** The border box (element + padding + border) */
  borderBox: Rect
  /** The padding box (element + padding) */
  paddingBox: Rect
  /** The content box (element only) */
  contentBox: Rect
}

/**
 * Represents the dimensions of a draggable element
 */
export interface DragDimension {
  /** The unique identifier of the draggable element */
  id: DragId
  /** The ID of the droppable container where this draggable is located */
  dropId: DropId
  /** Box model in client coordinates (relative to viewport) */
  client: BoxModel
  /** Box model in page coordinates (relative to document) */
  page: BoxModel
  /** Current window scroll position when dimensions were captured */
  windowScroll: Position
}

/**
 * Represents the dimensions of a droppable container
 */
export interface DropDimension {
  /** The unique identifier of the droppable container */
  id: DropId
  /** Box model in client coordinates (relative to viewport) */
  client: BoxModel
  /** Box model in page coordinates (relative to document) */
  page: BoxModel
  /** Current window scroll position when dimensions were captured */
  windowScroll: Position
  /** Information about the scrollable frame, if this droppable is scrollable */
  frame?: {
    /** Current scroll position of the container */
    scroll: Position
    /** Size of the scrollable area */
    scrollSize: Position
    /** Visible height of the container */
    clientHeight: number
    /** Visible width of the container */
    clientWidth: number
  }
  /** Subject information for drop calculations */
  subject: {
    /** Box model in page coordinates */
    page: BoxModel
    /** Box model adjusted for droppable displacement */
    withDroppableDisplacement: BoxModel
    /** Dimensions of draggable elements within this droppable */
    activities: DragDimension[]
  }
}
