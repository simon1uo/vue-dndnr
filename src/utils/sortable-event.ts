import type { SortableEvent, SortableEventData, SortableEventType } from '@/types'

/**
 * Browser compatibility check for CustomEvent support.
 * Based on SortableJS browser detection logic.
 */
const isCustomEventSupported = (() => {
  if (typeof window === 'undefined')
    return false

  try {
    // Check for CustomEvent constructor
    if (typeof window.CustomEvent === 'function') {
      // Test if it actually works
      const testEvent = new CustomEvent('test', { bubbles: true, cancelable: true })
      return testEvent instanceof Event
    }
    return false
  }
  catch {
    return false
  }
})()

/**
 * Check if we're in IE11 or Edge Legacy.
 * These browsers have limited CustomEvent support.
 */
const isLegacyBrowser = (() => {
  if (typeof window === 'undefined')
    return false

  const userAgent = window.navigator.userAgent
  return /Trident.*rv[ :]*11\./.test(userAgent) || /Edge\//.test(userAgent)
})()

/**
 * Create a sortable event with cross-browser compatibility.
 * Based on SortableJS event creation logic.
 *
 * @param eventType - The type of event to create
 * @param eventData - The data to include in the event
 * @param target - The target element for the event
 * @returns A properly formatted SortableEvent
 */
export function createSortableEvent(
  eventType: SortableEventType,
  eventData: SortableEventData,
  target?: HTMLElement,
): SortableEvent {
  let event: Event

  // Create event with browser compatibility
  if (isCustomEventSupported && !isLegacyBrowser) {
    // Modern browsers with full CustomEvent support
    event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: true,
      detail: eventData,
    })
  }
  else {
    // Fallback for older browsers
    event = document.createEvent('Event')
    event.initEvent(eventType, true, true)
  }

  // Cast to SortableEvent and add properties
  const sortableEvent = event as SortableEvent

  // Add standard sortable properties
  sortableEvent.to = eventData.to || target || document.body
  sortableEvent.from = eventData.from || target || document.body
  sortableEvent.item = eventData.item || target || document.body
  sortableEvent.clone = eventData.clone
  sortableEvent.oldIndex = eventData.oldIndex
  sortableEvent.newIndex = eventData.newIndex
  sortableEvent.oldDraggableIndex = eventData.oldDraggableIndex
  sortableEvent.newDraggableIndex = eventData.newDraggableIndex
  sortableEvent.originalEvent = eventData.originalEvent
  sortableEvent.pullMode = eventData.pullMode
  sortableEvent.related = eventData.related
  sortableEvent.willInsertAfter = eventData.willInsertAfter

  // Add any additional custom properties
  for (const key in eventData) {
    if (key !== 'type' && !(key in sortableEvent)) {
      ;(sortableEvent as any)[key] = eventData[key]
    }
  }

  return sortableEvent
}

/**
 * Dispatch a sortable event on a target element.
 * Handles both DOM event dispatching and callback execution.
 *
 * @param target - The target element to dispatch the event on
 * @param eventType - The type of event to dispatch
 * @param eventData - The data to include in the event
 * @param callback - Optional callback function to execute
 * @returns Whether the event was not cancelled
 */
export function dispatchSortableEvent(
  target: HTMLElement,
  eventType: SortableEventType,
  eventData: SortableEventData,
  callback?: (event: SortableEvent) => void | boolean,
): boolean {
  // Create the event
  const event = createSortableEvent(eventType, eventData, target)

  // Dispatch DOM event
  let domEventResult = true
  try {
    domEventResult = target.dispatchEvent(event)
  }
  catch (error) {
    console.error(`Error dispatching DOM event ${eventType}:`, error)
  }

  // Execute callback if provided
  let callbackResult = true
  if (callback) {
    try {
      const result = callback(event)
      if (result === false) {
        callbackResult = false
      }
    }
    catch (error) {
      console.error(`Error in event callback for ${eventType}:`, error)
    }
  }

  // Event is cancelled if either DOM event or callback returned false
  return domEventResult && callbackResult
}

/**
 * Normalize event data to ensure all required properties are present.
 * Provides default values for missing properties.
 *
 * @param eventType - The type of event
 * @param data - The raw event data
 * @param defaults - Default values to use
 * @returns Normalized event data
 */
export function normalizeEventData(
  eventType: SortableEventType,
  data: Partial<SortableEventData>,
  defaults: Partial<SortableEventData> = {},
): SortableEventData {
  return {
    type: eventType,
    to: data.to || defaults.to,
    from: data.from || defaults.from,
    item: data.item || defaults.item,
    clone: data.clone || defaults.clone,
    oldIndex: data.oldIndex ?? defaults.oldIndex,
    newIndex: data.newIndex ?? defaults.newIndex,
    oldDraggableIndex: data.oldDraggableIndex ?? defaults.oldDraggableIndex,
    newDraggableIndex: data.newDraggableIndex ?? defaults.newDraggableIndex,
    originalEvent: data.originalEvent || defaults.originalEvent,
    pullMode: data.pullMode || defaults.pullMode,
    related: data.related || defaults.related,
    willInsertAfter: data.willInsertAfter ?? defaults.willInsertAfter ?? false,
    ...data, // Include any additional custom properties
  }
}

/**
 * Create a callback name from an event type.
 * Converts 'start' to 'onStart', 'end' to 'onEnd', etc.
 *
 * @param eventType - The event type
 * @returns The callback name
 */
export function getCallbackName(eventType: SortableEventType): string {
  return `on${eventType.charAt(0).toUpperCase()}${eventType.slice(1)}`
}

/**
 * Check if an event should be prevented based on filter options.
 * Used to implement the filter functionality.
 *
 * @param element - The element to check
 * @param filter - The filter selector or function
 * @returns Whether the event should be prevented
 */
export function shouldPreventEvent(
  element: HTMLElement,
  filter?: string | ((element: HTMLElement, event: Event) => boolean),
): boolean {
  if (!filter)
    return false

  if (typeof filter === 'string') {
    // CSS selector filter
    return element.matches(filter) || !!element.closest(filter)
  }

  if (typeof filter === 'function') {
    // Function filter - we don't have the original event here,
    // so we pass a dummy event
    try {
      return filter(element, new Event('filter'))
    }
    catch {
      return false
    }
  }

  return false
}

/**
 * Get the draggable element from an event target.
 * Traverses up the DOM tree to find the draggable element.
 *
 * @param target - The event target
 * @param container - The container element
 * @param handle - Optional handle selector
 * @returns The draggable element or null
 */
export function getDraggableFromEvent(
  target: EventTarget | null,
  container: HTMLElement,
  handle?: string,
): HTMLElement | null {
  if (!target || !(target instanceof HTMLElement))
    return null

  let element = target

  // If handle is specified, check if target is within handle
  if (handle) {
    const handleElement = element.closest(handle)
    if (!handleElement)
      return null

    // Return the handle element itself
    return handleElement as HTMLElement
  }

  // Find the draggable element within the container
  while (element && element !== container) {
    if (element.parentElement === container) {
      return element
    }
    element = element.parentElement!
  }

  return null
}

/**
 * Check if browser supports the required drag and drop features.
 *
 * @returns Whether drag and drop is supported
 */
export function isDragDropSupported(): boolean {
  if (typeof window === 'undefined')
    return false

  try {
    const testElement = document.createElement('div')
    return (
      'draggable' in testElement
      && 'ondragstart' in testElement
      && 'ondrop' in testElement
      && typeof testElement.draggable === 'boolean'
    )
  }
  catch {
    return false
  }
}
