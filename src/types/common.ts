/**
 * Represents a 2D position with x and y coordinates
 */
export interface Position {
  /** The horizontal coordinate */
  x: number
  /** The vertical coordinate */
  y: number
}

/**
 * Valid pointer types for pointer events
 */
export type PointerType = 'mouse' | 'touch' | 'pen'

/**
 * Type for activation trigger
 * - 'click': Element becomes active when clicked
 * - 'hover': Element becomes active when hovered
 * - 'none': Element is always active (traditional behavior)
 */
export type ActivationTrigger = 'click' | 'hover' | 'none'

/**
 * Represents the dimensions of an element
 */
export interface Size {
  /** The width value (can be a number in pixels or a CSS string value) */
  width: number | string
  /** The height value (can be a number in pixels or a CSS string value) */
  height: number | string
}

/**
 * Valid position types for positioning elements
 */
export type PositionType = 'absolute' | 'relative'

/**
 * Drag state enumeration
 * Represents different states during drag operation
 */
export enum DragState {
  /** Not dragging */
  IDLE = 'idle',
  /** Drag initiated but not started */
  PENDING = 'pending',
  /** Currently dragging */
  DRAGGING = 'dragging',
  /** Drag completed */
  COMPLETED = 'completed',
}

/**
 * Direction enumeration for sortable lists
 */
export enum SortDirection {
  /** Horizontal sorting */
  HORIZONTAL = 'horizontal',
  /** Vertical sorting */
  VERTICAL = 'vertical',
  /** Auto-detect direction */
  AUTO = 'auto',
}

/**
 * Animation easing functions
 * Standard CSS easing functions for animations
 */
export type EasingFunction =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier(n,n,n,n)'

/**
 * Represents a rectangular area with position and dimensions
 */
export interface Rect {
  /** The horizontal coordinate */
  x: number
  /** The vertical coordinate */
  y: number
  /** The width of the rectangle */
  width: number
  /** The height of the rectangle */
  height: number
}
