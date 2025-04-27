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
 * Represents the dimensions of an element
 */
export interface Size {
  /** The width value (can be a number in pixels or a CSS string value) */
  width: number | string
  /** The height value (can be a number in pixels or a CSS string value) */
  height: number | string
}
