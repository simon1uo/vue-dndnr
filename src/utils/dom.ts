import { isClient } from '@/utils/config'

/**
 * Get the computed position of an element relative to its container
 * @param element - The target HTML or SVG element
 * @returns The computed x and y coordinates of the element
 */
export function getElementPosition(element: HTMLElement | SVGElement): { x: number, y: number } {
  if (!isClient)
    return { x: 0, y: 0 }

  const style = window.getComputedStyle(element)
  const transform = style.transform

  if (transform && transform !== 'none') {
    const matrix = new DOMMatrix(transform)
    return {
      x: matrix.e,
      y: matrix.f,
    }
  }

  return {
    x: Number.parseInt(style.left || '0', 10),
    y: Number.parseInt(style.top || '0', 10),
  }
}

/**
 * Get the computed size (width and height) of an element
 * @param element - The target HTML or SVG element
 * @returns The computed width and height of the element
 */
export function getElementSize(element: HTMLElement | SVGElement): { width: number, height: number } {
  if (!isClient)
    return { width: 0, height: 0 }

  const style = window.getComputedStyle(element)
  return {
    width: Number.parseInt(style.width || '0', 10),
    height: Number.parseInt(style.height || '0', 10),
  }
}

/**
 * Check if an element matches a CSS selector
 * @param element - The target HTML or SVG element
 * @param selector - The CSS selector string to match against
 * @returns True if the element matches the selector, false otherwise
 */
export function matchesSelector(element: HTMLElement | SVGElement, selector: string): boolean {
  const matchesMethod
    = element.matches
      || (element as any).matchesSelector
      || (element as any).msMatchesSelector
      || (element as any).mozMatchesSelector
      || (element as any).webkitMatchesSelector
      || (element as any).oMatchesSelector

  return matchesMethod.call(element, selector)
}

/**
 * Check if an element or any of its parent elements match a CSS selector
 * @param element - The target HTML or SVG element to start checking from
 * @param selector - The CSS selector string to match against
 * @returns True if the element or any of its parents match the selector, false otherwise
 */
export function matchesSelectorAndParents(element: HTMLElement | SVGElement, selector: string): boolean {
  let target: HTMLElement | SVGElement | null = element

  do {
    if (matchesSelector(target, selector))
      return true
    target = target.parentElement || (target.parentNode as HTMLElement | SVGElement | null)
  } while (target)

  return false
}

/**
 * Get the bounding rectangle coordinates of an element
 * @param element - The target HTML or SVG element
 * @returns An object containing the left, top, right, and bottom coordinates of the element's bounding rectangle
 */
export function getElementBounds(element: HTMLElement | SVGElement): {
  left: number
  top: number
  right: number
  bottom: number
} {
  const rect = element.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  }
}
