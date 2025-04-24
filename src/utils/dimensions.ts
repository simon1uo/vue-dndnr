import type { Size } from '../types'

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
    width = Math.max(width, 0)
    if (minWidth !== undefined)
      width = Math.max(width, minWidth)
    if (maxWidth !== undefined)
      width = Math.min(width, maxWidth)
  }

  if (typeof height === 'number') {
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
    const widthChange = Math.abs(width - originalWidth)
    const heightChange = Math.abs(height - originalHeight)

    if (widthChange >= heightChange) {
      height = width / aspectRatio
    }
    else {
      width = height * aspectRatio
    }
  }

  return { width, height }
}
