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
