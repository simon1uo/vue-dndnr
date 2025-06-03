import type { Position } from '@/types/common'
import type { BoxModel, Rect } from '@/types/dimension'
import { defaultWindow } from '@vueuse/core'

/**
 * Calculate detailed box model for an element
 * @param element - Target HTML element
 * @param boundingClientRect - Element's bounding client rect
 * @param contentRect - Element's content rect
 * @returns Complete box model with all measurements
 */
export function calculateDetailedBoxModel(
  element: HTMLElement,
  boundingClientRect: Rect,
  contentRect: { width: number, height: number },
): BoxModel {
  if (!defaultWindow) {
    const zeroRect: Rect = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    }
    return {
      marginBox: { ...zeroRect },
      borderBox: { ...zeroRect },
      paddingBox: { ...zeroRect },
      contentBox: { ...zeroRect },
    }
  }

  try {
    const style = defaultWindow.getComputedStyle(element)

    // Parse numeric values from computed style
    const margin = {
      top: Number.parseFloat(style.marginTop),
      right: Number.parseFloat(style.marginRight),
      bottom: Number.parseFloat(style.marginBottom),
      left: Number.parseFloat(style.marginLeft),
    }

    const border = {
      top: Number.parseFloat(style.borderTopWidth),
      right: Number.parseFloat(style.borderRightWidth),
      bottom: Number.parseFloat(style.borderBottomWidth),
      left: Number.parseFloat(style.borderLeftWidth),
    }

    const padding = {
      top: Number.parseFloat(style.paddingTop),
      right: Number.parseFloat(style.paddingRight),
      bottom: Number.parseFloat(style.paddingBottom),
      left: Number.parseFloat(style.paddingLeft),
    }

    // Calculate border box (matches boundingClientRect)
    const borderBox: Rect = {
      ...boundingClientRect,
    }

    // Calculate content box
    const contentBox: Rect = {
      width: contentRect.width,
      height: contentRect.height,
      left: borderBox.left + padding.left + border.left,
      top: borderBox.top + padding.top + border.top,
      right: borderBox.right - padding.right - border.right,
      bottom: borderBox.bottom - padding.bottom - border.bottom,
      x: borderBox.left + padding.left + border.left,
      y: borderBox.top + padding.top + border.top,
    }

    // Calculate padding box
    const paddingBox: Rect = {
      width: borderBox.width - border.left - border.right,
      height: borderBox.height - border.top - border.bottom,
      left: borderBox.left + border.left,
      top: borderBox.top + border.top,
      right: borderBox.right - border.right,
      bottom: borderBox.bottom - border.bottom,
      x: borderBox.left + border.left,
      y: borderBox.top + border.top,
    }

    // Calculate margin box
    const marginBox: Rect = {
      width: borderBox.width + margin.left + margin.right,
      height: borderBox.height + margin.top + margin.bottom,
      left: borderBox.left - margin.left,
      top: borderBox.top - margin.top,
      right: borderBox.right + margin.right,
      bottom: borderBox.bottom + margin.bottom,
      x: borderBox.left - margin.left,
      y: borderBox.top - margin.top,
    }

    return {
      contentBox,
      paddingBox,
      borderBox,
      marginBox,
    }
  }
  catch (error) {
    console.error('Error calculating box model:', error)
    const zeroRect: Rect = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    }
    return {
      marginBox: { ...zeroRect },
      borderBox: { ...boundingClientRect },
      paddingBox: { ...zeroRect },
      contentBox: { ...zeroRect },
    }
  }
}

/**
 * Transform box model from client to page coordinates
 * @param clientBox - Box model in client coordinates
 * @param windowScroll - Current window scroll position
 * @returns Box model in page coordinates
 */
export function transformBoxToPageCoordinates(clientBox: BoxModel, windowScroll: Position): BoxModel {
  const transform = (rect: Rect): Rect => ({
    ...rect,
    top: rect.top + windowScroll.y,
    right: rect.right + windowScroll.x,
    bottom: rect.bottom + windowScroll.y,
    left: rect.left + windowScroll.x,
    x: rect.x + windowScroll.x,
    y: rect.y + windowScroll.y,
  })

  return {
    contentBox: transform(clientBox.contentBox),
    paddingBox: transform(clientBox.paddingBox),
    borderBox: transform(clientBox.borderBox),
    marginBox: transform(clientBox.marginBox),
  }
}

/**
 * Offset a rectangle by a position
 * @param rect - The original rectangle
 * @param position - The position to offset by
 * @returns A new rectangle offset by the given position
 */
export function offsetRect(rect: Rect, position: Position): Rect {
  return {
    ...rect,
    top: rect.top + position.y,
    right: rect.right + position.x,
    bottom: rect.bottom + position.y,
    left: rect.left + position.x,
    x: rect.x + position.x,
    y: rect.y + position.y,
  }
}

/**
 * Check if an element is visible (not display: none)
 * @param element - The element to check
 * @returns Whether the element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  try {
    if (!defaultWindow)
      return false

    const style = defaultWindow.getComputedStyle(element)
    return style.display !== 'none'
  }
  catch (error) {
    console.error('Error checking element visibility:', error)
    return false
  }
}
