/**
 * Utility functions for dimension calculations
 */

import type { Size } from '../types'
import type { ResizeHandle } from '../types/resizable'

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
    // Always ensure width is at least 0
    width = Math.max(width, 0)
    if (minWidth !== undefined)
      width = Math.max(width, minWidth)
    if (maxWidth !== undefined)
      width = Math.min(width, maxWidth)
  }

  if (typeof height === 'number') {
    // Always ensure height is at least 0
    height = Math.max(height, 0)
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
