import type { Rect } from '@/types'
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
  if (!selector)
    return false

  if (selector[0] === '>') {
    const childSelector = selector.slice(1)
    return matchesSelector(element, childSelector)
  }

  if (element) {
    try {
      if (element.matches) {
        return element.matches(selector)
      }
      else if ((element as any).msMatchesSelector) {
        return (element as any).msMatchesSelector(selector)
      }
      else if ((element as any).webkitMatchesSelector) {
        return element.webkitMatchesSelector(selector)
      }
    }
    catch {
      return false
    }
  }

  return false
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

/**
 * Get the value of a style property of an element
 * @param element - The target HTML element
 * @param prop - The style property to get the value of
 * @returns The value of the style property
 */
export function getElementStyleValue(element: HTMLElement | Window, prop?: string): string | CSSStyleDeclaration | undefined {
  if (!element)
    return undefined

  try {
    if (element === window) {
      const docEl = window.document.documentElement
      if (!prop) {
        return window.getComputedStyle(docEl, null)
      }
      return window.getComputedStyle(docEl, null).getPropertyValue(prop) || (window.getComputedStyle(docEl, null) as any)[prop]
    }

    let computedStyle: CSSStyleDeclaration | undefined
    if (window.getComputedStyle) {
      computedStyle = window.getComputedStyle(element as HTMLElement, null)
    }
    else if ((element as any).currentStyle) {
      computedStyle = (element as any).currentStyle
    }

    if (!prop) {
      return computedStyle
    }
    return computedStyle ? computedStyle.getPropertyValue(prop) || (computedStyle as any)[prop] : undefined
  }
  catch {
    return undefined
  }
}

/**
 * Set the value of a style property of an element
 * @param element - The target HTML element
 * @param property - The style property to set the value of
 * @param value - The value to set the style property to
 * @returns True if the style property was set successfully, false otherwise
 */
export function setElementStyleValue(element: HTMLElement, property: string, value: string): boolean {
  if (!element)
    return false

  try {
    if (value === '') {
      element.style.removeProperty(property)
    }
    else {
      element.style.setProperty(property, value, 'important')
    }
    return true
  }
  catch {
    return false
  }
}

/**
 * Gets the parent node or host element for a given HTMLElement
 * @param element - The element to get the parent or host for
 * @returns The parent node or host element
 */
export function getElementParentOrHost(element: HTMLElement) {
  // Check if el is a shadow DOM host
  if ('host' in element && (element.host as any).nodeType && element.host !== element) {
    return element.host
  }
  return element.parentNode
}

/**
 * Get the matrix of an element
 * @param element - The target HTML or SVG element or a string of CSS transform values
 * @param selfOnly - Whether to only get the matrix of the element itself (not traverse parents)
 * @returns The matrix of the element
 */
export function getElementMatrix(element: HTMLElement | string, selfOnly?: boolean): DOMMatrix | null {
  try {
    let appliedTransforms = ''

    if (typeof element === 'string') {
      appliedTransforms = element
    }
    else {
      let currentElement: HTMLElement | null = element

      do {
        const transform = getElementStyleValue(currentElement, 'transform')
        if (transform && transform !== 'none') {
          appliedTransforms = `${transform} ${appliedTransforms}`
        }

        if (selfOnly) {
          break
        }

        currentElement = currentElement.parentNode as HTMLElement
      } while (currentElement)
    }

    const MatrixFn
      = window.DOMMatrix
        || window.WebKitCSSMatrix
        || (window as any).CSSMatrix
        || (window as any).MSCSSMatrix

    return MatrixFn ? new MatrixFn(appliedTransforms) : null
  }
  catch {
    return null
  }
}

/**
 * Get the bounding rectangle coordinates of an element
 * @param element - The target HTML or SVG element
 * @param relativeToContainingBlock - Whether to get the rectangle relative to the containing block
 * @param relativeToNonStaticParent - Whether to get the rectangle relative to the non-static parent
 * @param undoScale - Whether to undo the scale of the element
 * @param container - The container to get the rectangle relative to
 * @returns The bounding rectangle coordinates of the element
 */
export function getElementRect(
  element: HTMLElement | Window,
  relativeToContainingBlock?: boolean,
  relativeToNonStaticParent?: boolean,
  undoScale?: boolean,
  container?: HTMLElement,
): Rect | null {
  if (element !== window && !('getBoundingClientRect' in element)) {
    return new DOMRect()
  }

  let elRect: DOMRect
  let top: number
  let left: number
  let right: number
  let bottom: number
  let height: number
  let width: number

  if (element === window) {
    top = 0
    left = 0
    right = 0
    bottom = 0
    height = window.innerHeight
    width = window.innerWidth
  }
  else {
    elRect = (element as HTMLElement).getBoundingClientRect()
    top = elRect.top
    left = elRect.left
    right = elRect.right
    bottom = elRect.bottom
    height = elRect.height
    width = elRect.width
  }

  if (relativeToContainingBlock || relativeToNonStaticParent) {
    do {
      if (
        container
        && container.getBoundingClientRect
        && (
          getElementStyleValue(container, 'transform') !== 'none'
          || (relativeToNonStaticParent
            && getElementStyleValue(container, 'position') !== 'static')
        )
      ) {
        const containerRect = container.getBoundingClientRect()

        // Set relative to edges of padding box of container
        top -= containerRect.top + Number.parseInt(getElementStyleValue(container, 'border-top-width') as string)
        left -= containerRect.left + Number.parseInt(getElementStyleValue(container, 'border-left-width') as string)
        bottom = top + height
        right = left + width

        break
      }

      container = container?.parentNode as HTMLElement
    } while (container)
  }

  if (undoScale && element !== window) {
    const elMatrix = getElementMatrix(element as HTMLElement)

    if (elMatrix) {
      const scaleX = elMatrix.a
      const scaleY = elMatrix.d
      top /= scaleY
      left /= scaleX

      width /= scaleX
      height /= scaleY
    }
  }

  return { top, left, right, bottom, width, height }
}

/**
 * Get the closest element that matches the selector
 * @param el - The element to start searching from
 * @param selector - The selector to match
 * @param container - The container to search within
 * @param includeContainer - Whether to include the container in the search
 * @returns The closest element that matches the selector, or null if not found
 */
export function findClosestElementBySelector(el: HTMLElement, selector: string, container?: HTMLElement, includeContainer?: boolean) {
  const context = container || document
  if (el) {
    do {
      if (selector && (
        (selector[0] === '>'
          ? (el.parentNode === context && matchesSelector(el, selector))
          : matchesSelector(el, selector)
        )
        || (includeContainer && el === container)
      )) {
        return el
      }

      if (el === container)
        break

      el = getElementParentOrHost(el) as HTMLElement
    } while (el)
  }

  return null
}
