import type { Size } from '@/types'

/**
 * Apply minimum and maximum size constraints to a given size object
 * @param size - The original size object containing width and height
 * @param minWidth - Optional minimum width constraint
 * @param minHeight - Optional minimum height constraint
 * @param maxWidth - Optional maximum width constraint
 * @param maxHeight - Optional maximum height constraint
 * @returns A new size object with constraints applied
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
 * Apply aspect ratio locking to maintain proportions when resizing
 * @param size - The current size to be adjusted
 * @param originalSize - The original size used as reference for aspect ratio
 * @param lockAspectRatio - Whether to enforce aspect ratio locking
 * @returns A new size object with aspect ratio maintained if locking is enabled
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
