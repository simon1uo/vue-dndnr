import { isClient } from '@/utils/config'

/**
 * Get the computed position of an element
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
 * Get the computed size of an element
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
 * Check if an element matches a selector
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
 * Check if an element or its parents match a selector
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
 * Get the bounds of an element
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
