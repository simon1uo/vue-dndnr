import type { GhostElementOptions } from '@/types'
import { isClient } from '@/utils/config'

/**
 * Get element index in parent, ignoring hidden elements and templates
 * Based on SortableJS index function
 * @param el - The target element
 * @param selector - Optional selector to filter siblings
 * @returns The index of the element, or -1 if not found
 */
export function getElementIndex(el: HTMLElement, selector?: string): number {
  if (!el?.parentNode)
    return -1

  let index = 0
  let sibling = el.previousElementSibling as HTMLElement | null

  while (sibling) {
    // Skip template elements and hidden elements
    if (
      sibling.nodeName.toUpperCase() !== 'TEMPLATE'
      && sibling.style.display !== 'none'
      && (!selector || matchesSelector(sibling, selector))
    ) {
      index++
    }
    sibling = sibling.previousElementSibling as HTMLElement | null
  }

  return index
}

/**
 * Get all draggable children from container
 * Based on SortableJS getChild logic
 * @param container - The parent container
 * @param selector - Selector for draggable elements (default: '> *')
 * @returns Array of draggable child elements
 */
export function getDraggableChildren(
  container: HTMLElement,
  selector = '> *',
): HTMLElement[] {
  if (!container)
    return []

  const children = Array.from(container.children) as HTMLElement[]

  return children.filter((child) => {
    // Skip hidden elements and templates
    if (
      child.style.display === 'none'
      || child.nodeName.toUpperCase() === 'TEMPLATE'
    ) {
      return false
    }

    // Apply selector filter
    return matchesSelector(child, selector)
  })
}

/**
 * Find the closest draggable element
 * Based on SortableJS closest function
 * @param target - Starting element
 * @param container - Container element to search within
 * @param selector - Draggable selector
 * @returns The closest draggable element or null
 */
export function findDraggableElement(
  target: HTMLElement,
  container: HTMLElement,
  selector = '> *',
): HTMLElement | null {
  let current: HTMLElement | null = target

  while (current && current !== container) {
    if (matchesSelector(current, selector)) {
      return current
    }
    current = getParentOrHost(current)
  }

  return null
}

/**
 * Insert element at specific index in container
 * Based on SortableJS insertion logic
 * @param container - Target container
 * @param element - Element to insert
 * @param index - Target index position
 */
export function insertElementAtIndex(
  container: HTMLElement,
  element: HTMLElement,
  index: number,
): void {
  const children = getDraggableChildren(container)

  if (index >= children.length) {
    container.appendChild(element)
  }
  else {
    container.insertBefore(element, children[index])
  }
}

/**
 * Create ghost element for drag preview with enhanced options
 * Based on SortableJS ghost creation logic with fallback mode support
 * @param original - Original element to clone
 * @param options - Ghost element options or legacy ghostClass string
 * @returns Cloned ghost element
 */
export function createGhostElement(
  original: HTMLElement,
  options: string | GhostElementOptions = 'sortable-ghost',
): HTMLElement {
  // Handle legacy string parameter
  const ghostOptions: GhostElementOptions = typeof options === 'string'
    ? { ghostClass: options }
    : options

  const {
    ghostClass = 'sortable-ghost',
    fallbackClass = 'sortable-fallback',
    fallbackOnBody = false,
    useFallback = false,
    nativeDraggable = true,
    transformOrigin,
    tapDistance,
    initialRect,
  } = ghostOptions

  const ghost = cloneElement(original)

  // Add appropriate class based on mode
  if (useFallback || !nativeDraggable) {
    toggleClass(ghost, fallbackClass, true)
  }
  else {
    toggleClass(ghost, ghostClass, true)
  }

  // Get original element position for fallback mode
  // Use provided initialRect if available, otherwise get current rect
  const rect = initialRect || original.getBoundingClientRect()

  // Base styles for ghost element
  const baseStyles: Record<string, string> = {
    'pointer-events': 'none',
    'opacity': '0.5',
    'z-index': '100000',
    'transition': '',
    'transform': '',
  }

  // Enhanced styles for fallback mode
  if (useFallback || !nativeDraggable) {
    // For fallback mode, position the ghost at the exact location of the original element
    // Based on SortableJS _appendGhost logic (lines 870-916)
    const position = fallbackOnBody ? 'fixed' : 'absolute'

    // Calculate initial position based on positioning mode
    let top: number
    let left: number

    if (fallbackOnBody) {
      // For body positioning, use viewport coordinates (fixed positioning)
      // This matches SortableJS when fallbackOnBody is true
      top = rect.top
      left = rect.left
    }
    else {
      const container = original.parentElement
      if (container) {
        top = rect.top
        left = rect.left

        // Find the relatively positioned parent (like SortableJS does)
        const containerStyle = window.getComputedStyle(container)

        // Check if need to adjust for relative positioning
        if (containerStyle.position !== 'static' || containerStyle.transform !== 'none') {
          const containerRect = container.getBoundingClientRect()

          // Calculate border widths
          const borderTop = Number.parseInt(containerStyle.borderTopWidth) || 0
          const borderLeft = Number.parseInt(containerStyle.borderLeftWidth) || 0
          const paddingTop = Number.parseInt(containerStyle.paddingTop) || 0
          const paddingLeft = Number.parseInt(containerStyle.paddingLeft) || 0

          // Position relative to container's border box
          top = rect.top - containerRect.top - borderTop - paddingTop
          left = rect.left - containerRect.left - borderLeft - paddingLeft

          // Handle container transforms (simplified version of SortableJS matrix handling)
          if (containerStyle.transform !== 'none') {
            try {
              const matrix = new DOMMatrix(containerStyle.transform)
              const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b)
              const scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d)

              // Apply scale adjustment if significant scaling detected
              if (Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) {
                top = top / scaleY
                left = left / scaleX
              }
            }
            catch {
              // Fallback if DOMMatrix fails
              console.warn('[createGhostElement] Could not parse container transform')
            }
          }
        }
        else {
          // For static positioned containers, use simple offset calculation
          const containerRect = container.getBoundingClientRect()
          top = rect.top - containerRect.top
          left = rect.left - containerRect.left
        }
      }
      else {
        // No container, use viewport coordinates
        top = rect.top
        left = rect.left
      }
    }

    Object.assign(baseStyles, {
      'position': position,
      'top': `${top}px`,
      'left': `${left}px`,
      'width': `${rect.width}px`,
      'height': `${rect.height}px`,
      'box-sizing': 'border-box',
      'margin': '0',
    })

    // Set transform origin if specified
    if (transformOrigin) {
      baseStyles['transform-origin'] = transformOrigin
    }
    else if (tapDistance && rect.width > 0 && rect.height > 0) {
      // Calculate transform origin based on tap distance (where user clicked)
      // This ensures the ghost rotates/scales around the click point
      const originX = Math.max(0, Math.min(100, (tapDistance.left / rect.width * 100)))
      const originY = Math.max(0, Math.min(100, (tapDistance.top / rect.height * 100)))
      baseStyles['transform-origin'] = `${originX}% ${originY}%`
    }
  }
  else {
    // Native mode styles - let browser handle positioning
    baseStyles.position = 'absolute'
  }

  setCss(ghost, baseStyles)

  return ghost
}

/**
 * Update ghost element position during drag
 * Based on SortableJS _onTouchMove logic for fallback mode
 * @param ghost - Ghost element to position
 * @param position - Current mouse/touch position
 * @param options - Position update options
 */
export function updateGhostPosition(
  ghost: HTMLElement,
  position: { x: number, y: number },
  options: {
    offset?: { x: number, y: number }
    matrix?: DOMMatrix
    scale?: { x: number, y: number }
    tapDistance?: { left: number, top: number }
  } = {},
): void {
  const {
    offset = { x: 0, y: 0 },
    scale = { x: 1, y: 1 },
  } = options

  // Calculate position with offset and scale
  const x = (position.x + offset.x) / scale.x
  const y = (position.y + offset.y) / scale.y

  // Apply transform
  const transform = `translate3d(${x}px, ${y}px, 0)`
  ghost.style.transform = transform
}

/**
 * Get the nth child element, ignoring hidden and non-draggable elements
 * Based on SortableJS getChild function
 * @param container - Parent container
 * @param childNum - Target child index
 * @param selector - Draggable selector
 * @returns The child element at index or null
 */
export function getChildAtIndex(
  container: HTMLElement,
  childNum: number,
  selector = '> *',
): HTMLElement | null {
  let currentChild = 0
  let i = 0
  const children = container.children

  while (i < children.length) {
    const child = children[i] as HTMLElement

    if (
      child.style.display !== 'none'
      && child.nodeName.toUpperCase() !== 'TEMPLATE'
      && matchesSelector(child, selector)
    ) {
      if (currentChild === childNum) {
        return child
      }
      currentChild++
    }
    i++
  }

  return null
}

/**
 * Get the last child element, ignoring hidden elements
 * Based on SortableJS lastChild function
 * @param container - Parent container
 * @param selector - Optional selector filter
 * @returns The last valid child element or null
 */
export function getLastChild(
  container: HTMLElement,
  selector?: string,
): HTMLElement | null {
  let last = container.lastElementChild as HTMLElement | null

  while (last) {
    if (
      last.style.display !== 'none'
      && last.nodeName.toUpperCase() !== 'TEMPLATE'
      && (!selector || matchesSelector(last, selector))
    ) {
      return last
    }
    last = last.previousElementSibling as HTMLElement | null
  }

  return null
}

/**
 * Calculate drop position based on mouse coordinates
 * Simplified logic based on SortableJS approach
 * @param container - Target container
 * @param clientY - Mouse Y coordinate
 * @param selector - Draggable selector
 * @returns Object with target element and insert position
 */
export function getDropPosition(
  container: HTMLElement,
  clientY: number,
  selector = '> *',
): { target: HTMLElement | null, insertAfter: boolean, index: number } {
  const children = getDraggableChildren(container, selector)

  if (children.length === 0) {
    return { target: null, insertAfter: true, index: 0 }
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const rect = child.getBoundingClientRect()
    const middle = rect.top + rect.height / 2

    // If mouse is in the upper half of this element, insert before it
    if (clientY < middle) {
      return { target: child, insertAfter: false, index: i }
    }

    // If mouse is in the lower half but still within this element, insert after it
    if (clientY <= rect.bottom) {
      return { target: child, insertAfter: true, index: i + 1 }
    }
  }

  // Insert at the end
  const lastChild = children[children.length - 1]
  return { target: lastChild, insertAfter: true, index: children.length }
}

/**
 * Calculate insertion index based on drop position
 * @param container - Target container
 * @param clientX - Mouse X coordinate
 * @param clientY - Mouse Y coordinate
 * @param selector - Draggable selector
 * @returns Target insertion index
 */
export function calculateInsertIndex(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  selector = '> *',
): number {
  const { index } = getDropPosition(container, clientY, selector)
  return index
}

// Helper functions

/**
 * Check if element matches selector with cross-browser support
 * Based on SortableJS matches function
 */
function matchesSelector(el: HTMLElement, selector: string): boolean {
  if (!selector)
    return true

  // Handle child selector
  if (selector.startsWith('>')) {
    selector = selector.substring(1).trim()
  }

  if (!el)
    return false

  try {
    if (el.matches) {
      return el.matches(selector)
    }
    else if ((el as any).msMatchesSelector) {
      return (el as any).msMatchesSelector(selector)
    }
    else if ((el as any).webkitMatchesSelector) {
      return (el as any).webkitMatchesSelector(selector)
    }
  }
  catch {
    return false
  }

  return false
}

/**
 * Get parent or host element (for shadow DOM support)
 * Based on SortableJS getParentOrHost function
 */
function getParentOrHost(el: HTMLElement): HTMLElement | null {
  const host = (el as any).host
  return (host && (el as any) !== document && host.nodeType && host !== el)
    ? host
    : el.parentElement
}

/**
 * Clone element with library support
 * Based on SortableJS clone function
 */
function cloneElement(el: HTMLElement): HTMLElement {
  if (!isClient)
    return el.cloneNode(true) as HTMLElement

  // Support for Polymer
  const Polymer = (window as any).Polymer
  if (Polymer?.dom) {
    return Polymer.dom(el).cloneNode(true)
  }

  // Support for jQuery/Zepto
  const $ = (window as any).jQuery || (window as any).Zepto
  if ($) {
    return $(el).clone(true)[0]
  }

  return el.cloneNode(true) as HTMLElement
}

/**
 * Toggle CSS class with fallback for older browsers
 * Based on SortableJS toggleClass function
 */
function toggleClass(el: HTMLElement, className: string, state: boolean): void {
  if (!el || !className)
    return

  if (el.classList) {
    el.classList[state ? 'add' : 'remove'](className)
  }
  else {
    const R_SPACE = /\s+/g
    let currentClass = (` ${el.className} `).replace(R_SPACE, ' ')
    currentClass = currentClass.replace(` ${className} `, ' ')
    el.className = (currentClass + (state ? ` ${className}` : '')).replace(R_SPACE, ' ').trim()
  }
}

/**
 * Set multiple CSS properties
 */
function setCss(el: HTMLElement, styles: Record<string, string>): void {
  Object.entries(styles).forEach(([property, value]) => {
    el.style.setProperty(property, value)
  })
}
