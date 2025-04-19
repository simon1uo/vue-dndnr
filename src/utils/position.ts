/**
 * Utility functions for position calculations
 */

import type { Position } from '../types'

/**
 * Calculate the position based on mouse/touch event
 */
export function calculatePosition(
  event: MouseEvent | TouchEvent,
  initialPosition: Position,
  offset: Position,
): Position {
  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY

  return {
    x: clientX - offset.x + initialPosition.x,
    y: clientY - offset.y + initialPosition.y,
  }
}

/**
 * Apply grid snapping to a position
 */
export function applyGrid(position: Position, grid: [number, number]): Position {
  if (!grid)
    return position

  const [gridX, gridY] = grid
  return {
    x: Math.round(position.x / gridX) * gridX,
    y: Math.round(position.y / gridY) * gridY,
  }
}

/**
 * Apply axis constraints to a position
 */
export function applyAxisConstraints(
  position: Position,
  axis: 'x' | 'y' | 'both',
  initialPosition: Position,
): Position {
  if (axis === 'both')
    return position

  return {
    x: axis === 'x' ? position.x : initialPosition.x,
    y: axis === 'y' ? position.y : initialPosition.y,
  }
}

/**
 * Apply bounds constraints to a position
 */
export function applyBoundsConstraints(
  position: Position,
  bounds: { left: number, top: number, right: number, bottom: number },
  elementWidth: number,
  elementHeight: number,
): Position {
  return {
    x: Math.min(Math.max(position.x, bounds.left), bounds.right - elementWidth),
    y: Math.min(Math.max(position.y, bounds.top), bounds.bottom - elementHeight),
  }
}
