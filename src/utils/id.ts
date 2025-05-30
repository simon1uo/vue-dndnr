/**
 * Generate a unique identifier with optional prefix
 * @param prefix - Optional prefix for the generated ID
 * @returns A unique string identifier
 */
export function getUniqueId(prefix = 'dnd'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Get the ID of an element or generate and set one if it doesn't exist
 * @param element - The target HTML or SVG element
 * @param prefix - Optional prefix for the generated ID
 * @returns The element's ID (existing or newly generated)
 */
export function getElementId(element: HTMLElement | SVGElement, prefix = 'dnd-el'): string {
  if (!element.id) {
    element.id = getUniqueId(prefix)
  }
  return element.id
}

/**
 * Generate a sequential ID with a given prefix
 * Useful for creating predictable IDs in a sequence
 * @param prefix - The prefix for the ID
 * @param counter - The current counter value
 * @returns A string ID in the format "prefix-counter"
 */
export function getSequentialId(prefix: string, counter: number): string {
  return `${prefix}-${counter}`
}

/**
 * Create an ID generator function that produces sequential IDs
 * @param prefix - The prefix for generated IDs
 * @returns A function that returns a new sequential ID each time it's called
 */
export function createIdGenerator(prefix = 'dnd'): () => string {
  let counter = 0
  return () => getSequentialId(prefix, counter++)
}
