import type { Position } from '@/types'

/**
 * Apply grid snapping to a position
 * @param position - The original position to snap
 * @param grid - Optional grid size as [x, y] coordinates
 * @returns The position snapped to the nearest grid points
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
 * @param position - The current position to constrain
 * @param axis - The axis to constrain movement to ('x', 'y', or 'both')
 * @param startPosition - The starting position for reference
 * @returns The position constrained to the specified axis
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
 * @param position - The current position to constrain
 * @param bounds - The bounding rectangle or constraints object
 * @param elementSize - The size of the element being constrained
 * @param elementSize.width - The width of the element being constrained
 * @param elementSize.height - The height of the element being constrained
 * @returns The position constrained within the specified bounds
 */
export function applyBounds(
  position: Position,
  bounds: { left: number, top: number, right: number, bottom: number },
  elementSize: { width: number, height: number },
): Position {
  if (!bounds || !elementSize)
    return position

  return {
    x: Math.min(
      Math.max(position.x, bounds.left),
      bounds.right - elementSize.width,
    ),
    y: Math.min(
      Math.max(position.y, bounds.top),
      bounds.bottom - elementSize.height,
    ),
  }
}

/**
 * Calculate the delta between two positions
 * @param position1 - The first position
 * @param position2 - The second position
 * @returns The difference between the two positions as a Position object
 */
export function calculateDelta(position1: Position, position2: Position): Position {
  return {
    x: position2.x - position1.x,
    y: position2.y - position1.y,
  }
}

/**
 * Calculate position from a pointer event with optional scaling
 * @param event - The pointer event containing position information
 * @param scale - Optional scale factor to apply to the position
 * @returns The calculated position coordinates
 */
export function calculatePosition(event: PointerEvent, scale = 1): Position {
  const clientX = event instanceof MouseEvent ? event.clientX : (event as TouchEvent).touches[0].clientX
  const clientY = event instanceof MouseEvent ? event.clientY : (event as TouchEvent).touches[0].clientY

  return {
    x: clientX / scale,
    y: clientY / scale,
  }
}
