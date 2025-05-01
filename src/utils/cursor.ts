import type { ResizeHandle } from '@/types'

/**
 * Get the appropriate cursor style for a resize handle
 * @param handle - The resize handle position
 * @returns The CSS cursor style for the handle
 */
export function getCursorStyle(handle: ResizeHandle): string {
  switch (handle) {
    case 't':
    case 'top':
      return 'n-resize'
    case 'b':
    case 'bottom':
      return 's-resize'
    case 'r':
    case 'right':
      return 'e-resize'
    case 'l':
    case 'left':
      return 'w-resize'
    case 'tr':
    case 'top-right':
      return 'ne-resize'
    case 'tl':
    case 'top-left':
      return 'nw-resize'
    case 'br':
    case 'bottom-right':
      return 'se-resize'
    case 'bl':
    case 'bottom-left':
      return 'sw-resize'
    default:
      return 'default'
  }
}

export default getCursorStyle
