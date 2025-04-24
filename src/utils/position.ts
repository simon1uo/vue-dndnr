/**
 * Utility functions for position calculations
 */

import type { Position } from '../types'

/**
 * Apply grid snapping to a position
 */
export function applyGrid(position: Position, grid?: [number, number]): Position {
  if (!grid)
    return position

  const [gridX, gridY] = grid
  return {
    x: Math.round(position.x / gridX) * gridX,
    y: Math.round(position.y / gridY) * gridY,
  }
}

/**
 * Apply axis constraint to a position
 */
export function applyAxisConstraint(position: Position, axis?: 'x' | 'y' | 'both', startPosition?: Position): Position {
  if (!axis || axis === 'both')
    return position
  if (!startPosition)
    return position

  return {
    x: axis === 'x' ? position.x : startPosition.x,
    y: axis === 'y' ? position.y : startPosition.y,
  }
}

/**
 * Apply bounds constraint to a position
 */
export function applyBounds(
  position: Position,
  bounds?: HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number },
  elementSize?: { width: number, height: number },
): Position {
  if (!bounds || !elementSize)
    return position

  let boundingRect: { left: number, top: number, right: number, bottom: number }

  if (bounds === 'parent') {
    return position
  }
  else if (bounds instanceof HTMLElement) {
    const rect = bounds.getBoundingClientRect()
    boundingRect = {
      left: 0,
      top: 0,
      right: rect.width,
      bottom: rect.height,
    }
  }
  else {
    boundingRect = bounds
  }

  return {
    x: Math.min(
      Math.max(position.x, boundingRect.left),
      boundingRect.right - elementSize.width,
    ),
    y: Math.min(
      Math.max(position.y, boundingRect.top),
      boundingRect.bottom - elementSize.height,
    ),
  }
}

/**
 * Calculate position delta between two positions
 */
export function calculateDelta(position1: Position, position2: Position): Position {
  return {
    x: position2.x - position1.x,
    y: position2.y - position1.y,
  }
}

/**
 * Calculate position from event and scale
 */
export function calculatePosition(event: MouseEvent | TouchEvent, scale = 1): Position {
  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY

  return {
    x: clientX / scale,
    y: clientY / scale,
  }
}
