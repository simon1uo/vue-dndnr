import type { Size } from '@/types'
import { isClient } from './config'

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

/**
 * Get the dimensions of an element including position, size, and scroll information
 * @param element - The target HTML or SVG element
 * @returns An object containing comprehensive dimension information about the element
 */
export function getDimension(element: HTMLElement | SVGElement): {
  width: number
  height: number
  top: number
  left: number
  right: number
  bottom: number
  scrollWidth: number
  scrollHeight: number
  scrollTop: number
  scrollLeft: number
} {
  if (!isClient) {
    return {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      scrollWidth: 0,
      scrollHeight: 0,
      scrollTop: 0,
      scrollLeft: 0,
    }
  }

  const rect = element.getBoundingClientRect()

  return {
    width: rect.width,
    height: rect.height,
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight,
    scrollTop: 'scrollTop' in element ? element.scrollTop : 0,
    scrollLeft: 'scrollLeft' in element ? element.scrollLeft : 0,
  }
}

/**
 * Get the viewport dimensions
 * @returns The current viewport width and height
 */
export function getViewport(): { width: number, height: number } {
  if (!isClient) {
    return {
      width: 0,
      height: 0,
    }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

/**
 * Find the nearest scrollable container for an element
 * @param element - The target element to find the scroll container for
 * @returns The nearest scrollable container element or null if none found
 */
export function getScrollContainer(element: HTMLElement | SVGElement): HTMLElement | null {
  if (!isClient)
    return null

  let parent = element.parentElement

  while (parent) {
    const { overflow, overflowX, overflowY } = window.getComputedStyle(parent)
    const isScrollable = /auto|scroll|overlay/.test(overflow + overflowX + overflowY)

    if (isScrollable)
      return parent

    parent = parent.parentElement
  }

  return document.documentElement
}

/**
 * Check if an element is visible within its scroll container
 * @param element - The element to check visibility for
 * @param container - The scroll container (defaults to the nearest scroll container)
 * @param partial - Whether to consider partial visibility (default: false, requires full visibility)
 * @returns True if the element is visible within the container, false otherwise
 */
export function isElementVisible(
  element: HTMLElement | SVGElement,
  container?: HTMLElement | null,
  partial = false,
): boolean {
  if (!isClient)
    return false

  const scrollContainer = container || getScrollContainer(element)
  if (!scrollContainer)
    return true

  const elementRect = element.getBoundingClientRect()
  const containerRect = scrollContainer.getBoundingClientRect()

  if (partial) {
    return !(
      elementRect.bottom < containerRect.top
      || elementRect.top > containerRect.bottom
      || elementRect.right < containerRect.left
      || elementRect.left > containerRect.right
    )
  }

  return (
    elementRect.top >= containerRect.top
    && elementRect.bottom <= containerRect.bottom
    && elementRect.left >= containerRect.left
    && elementRect.right <= containerRect.right
  )
}
