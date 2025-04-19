/**
 * Utility functions for dimension calculations
 */

import type { Size } from '../types'
import type { ResizeHandle } from '../types/resizable'

/**
 * Calculate the new size based on resize handle and mouse/touch event
 */
export function calculateSize(
  event: MouseEvent | TouchEvent,
  initialSize: Size,
  handle: ResizeHandle,
  initialPosition: { x: number, y: number },
  offset: { x: number, y: number },
): { size: Size, position: { x: number, y: number } } {
  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY

  const deltaX = clientX - offset.x
  const deltaY = clientY - offset.y

  let width = Number(initialSize.width)
  let height = Number(initialSize.height)
  let x = initialPosition.x
  let y = initialPosition.y

  // Handle different resize directions
  switch (handle) {
    case 'e':
      width = width + deltaX
      break
    case 'w':
      width = width - deltaX
      x = x + deltaX
      break
    case 's':
      height = height + deltaY
      break
    case 'n':
      height = height - deltaY
      y = y + deltaY
      break
    case 'ne':
      width = width + deltaX
      height = height - deltaY
      y = y + deltaY
      break
    case 'nw':
      width = width - deltaX
      height = height - deltaY
      x = x + deltaX
      y = y + deltaY
      break
    case 'se':
      width = width + deltaX
      height = height + deltaY
      break
    case 'sw':
      width = width - deltaX
      height = height + deltaY
      x = x + deltaX
      break
  }

  return {
    size: { width, height },
    position: { x, y },
  }
}

/**
 * Apply min/max constraints to a size
 */
export function applyMinMaxConstraints(
  size: Size,
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number,
): Size {
  let { width, height } = size

  if (typeof width === 'number') {
    if (minWidth !== undefined)
      width = Math.max(width, minWidth)
    if (maxWidth !== undefined)
      width = Math.min(width, maxWidth)
  }

  if (typeof height === 'number') {
    if (minHeight !== undefined)
      height = Math.max(height, minHeight)
    if (maxHeight !== undefined)
      height = Math.min(height, maxHeight)
  }

  return { width, height }
}

/**
 * Apply aspect ratio lock to a size
 */
export function applyAspectRatioLock(
  size: Size,
  originalSize: Size,
  lockAspectRatio: boolean,
): Size {
  if (!lockAspectRatio)
    return size

  const originalWidth = Number(originalSize.width)
  const originalHeight = Number(originalSize.height)
  const aspectRatio = originalWidth / originalHeight

  let { width, height } = size

  if (typeof width === 'number' && typeof height === 'number') {
    // Determine which dimension changed more
    const widthChange = Math.abs(width - originalWidth)
    const heightChange = Math.abs(height - originalHeight)

    if (widthChange >= heightChange) {
      // Width changed more, adjust height based on aspect ratio
      height = width / aspectRatio
    }
    else {
      // Height changed more, adjust width based on aspect ratio
      width = height * aspectRatio
    }
  }

  return { width, height }
}
