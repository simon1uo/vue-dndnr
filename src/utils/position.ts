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
 * @param bounds.left - The left boundary coordinate
 * @param bounds.top - The top boundary coordinate
 * @param bounds.right - The right boundary coordinate
 * @param bounds.bottom - The bottom boundary coordinate
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

/**
 * Get the client rectangle of an element
 * @param element - The target HTML or SVG element
 * @returns The element's client rectangle coordinates
 */
export function getClientRect(element: HTMLElement | SVGElement): DOMRect {
  return element.getBoundingClientRect()
}

/**
 * Calculate the center point of a rectangle
 * @param rect - The rectangle object
 * @param rect.width - The width of the rectangle
 * @param rect.height - The height of the rectangle
 * @param rect.left - The left position of the rectangle
 * @param rect.top - The top position of the rectangle
 * @returns The center position coordinates
 */
export function getCenter(rect: { width: number, height: number, left: number, top: number }): Position {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

/**
 * Get the center point of an element
 * @param element - The target HTML or SVG element
 * @returns The center position coordinates of the element
 */
export function getElementCenter(element: HTMLElement | SVGElement): Position {
  const rect = getClientRect(element)
  return getCenter(rect)
}

/**
 * Get the four corners of a rectangle
 * @param rect - The rectangle object
 * @param rect.width - The width of the rectangle
 * @param rect.height - The height of the rectangle
 * @param rect.left - The left position of the rectangle
 * @param rect.top - The top position of the rectangle
 * @returns An object containing the positions of the top-left, top-right, bottom-left, and bottom-right corners
 */
export function getCorners(rect: { width: number, height: number, left: number, top: number }): {
  topLeft: Position
  topRight: Position
  bottomLeft: Position
  bottomRight: Position
} {
  return {
    topLeft: {
      x: rect.left,
      y: rect.top,
    },
    topRight: {
      x: rect.left + rect.width,
      y: rect.top,
    },
    bottomLeft: {
      x: rect.left,
      y: rect.top + rect.height,
    },
    bottomRight: {
      x: rect.left + rect.width,
      y: rect.top + rect.height,
    },
  }
}

/**
 * Calculate the distance between two positions
 * @param pos1 - The first position
 * @param pos2 - The second position
 * @returns The Euclidean distance between the two positions
 */
export function getDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if a position is within a rectangle
 * @param position - The position to check
 * @param rect - The rectangle to check against
 * @param rect.left - The left position of the rectangle
 * @param rect.top - The top position of the rectangle
 * @param rect.right - The right position of the rectangle
 * @param rect.bottom - The bottom position of the rectangle
 * @returns True if the position is within the rectangle, false otherwise
 */
export function isPositionInRect(
  position: Position,
  rect: { left: number, top: number, right: number, bottom: number },
): boolean {
  return (
    position.x >= rect.left
    && position.x <= rect.right
    && position.y >= rect.top
    && position.y <= rect.bottom
  )
}
