import type {
  AnimationEvent,
  SortableEvent,
  SortableEventData,
  SortableEventListener,
  SortableEventType,
} from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import { IE } from '@/utils'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, ref, toValue } from 'vue'

/**
 * Browser compatibility check for CustomEvent support.
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
 * Create a sortable event with cross-browser compatibility.
 *
 * @param eventType - The type of event to create
 * @param eventData - The data to include in the event
 * @param target - The target element for the event
 * @returns A properly formatted SortableEvent
 */
function createSortableEvent(
  eventType: SortableEventType,
  eventData: SortableEventData,
  target?: HTMLElement,
): SortableEvent {
  let event: Event

  // Create event with browser compatibility
  if (isCustomEventSupported && !IE) {
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
      ; (sortableEvent as any)[key] = eventData[key]
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
function dispatchSortableEvent(
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
function normalizeEventData(
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
 * Event dispatcher options for configuration
 */
export interface UseEventDispatcherOptions {
  /**
   * Whether to dispatch DOM events on the target element
   * @default true
   */
  dispatchDOMEvents?: MaybeRefOrGetter<boolean>
  /**
   * Whether to enable event bubbling for DOM events
   * @default true
   */
  bubbles?: MaybeRefOrGetter<boolean>
  /**
   * Whether DOM events should be cancelable
   * @default true
   */
  cancelable?: MaybeRefOrGetter<boolean>
  /**
   * Custom event prefix for DOM events
   * @default 'sortable'
   */
  eventPrefix?: MaybeRefOrGetter<string>
}

/**
 * Return type for useEventDispatcher composable
 */
export interface UseEventDispatcherReturn {
  /** Register an event listener */
  on: (eventType: SortableEventType, listener: SortableEventListener) => () => void
  /** Register a one-time event listener */
  once: (eventType: SortableEventType, listener: SortableEventListener) => () => void
  /** Remove an event listener */
  off: (eventType: SortableEventType, listener: SortableEventListener) => void
  /** Dispatch a sortable event */
  dispatch: (eventType: SortableEventType, data: Partial<SortableEventData>, callback?: (event: SortableEvent) => void | boolean) => boolean
  /** Dispatch an animation event */
  dispatchAnimation: (type: 'start' | 'end' | 'cancel', target: HTMLElement, duration?: number, easing?: string, callback?: (event: AnimationEvent) => void) => void
  /** Check if there are listeners for an event type */
  hasListeners: (eventType: SortableEventType) => boolean
  /** Get listener count for an event type */
  getListenerCount: (eventType: SortableEventType) => number
  /** Remove all listeners */
  removeAllListeners: (eventType?: SortableEventType) => void
  /** Get all registered event types */
  getEventTypes: () => SortableEventType[]
}

/**
 * Unified event dispatching composable for Vue sortable functionality.
 *
 * Provides a centralized event system that:
 * - Follows Vue 3 Composition API and @vueuse/core patterns
 * - Maintains compatibility with existing SortableJS event structure
 * - Supports both programmatic listeners and DOM event dispatching
 * - Handles animation events alongside sortable events
 * - Provides proper TypeScript typing with English JSDoc comments
 * - Follows established hook signature pattern (target first, options second)
 * - Integrates seamlessly with existing SortableManager architecture
 *
 * @param target - Target container element for event dispatching
 * @param options - Event dispatcher configuration options
 * @returns Unified event dispatcher functionality
 *
 * @example
 * Basic usage:
 * ```ts
 * const { dispatch, on, off } = useEventDispatcher(containerRef)
 *
 * // Register listener
 * const cleanup = on('start', (event) => {
 *   console.log('Drag started:', event.item)
 * })
 *
 * // Dispatch event
 * dispatch('start', { item: dragElement, oldIndex: 0 })
 *
 * // Cleanup
 * cleanup()
 * ```
 *
 * Advanced usage with options:
 * ```ts
 * const { dispatch, dispatchAnimation } = useEventDispatcher(containerRef, {
 *   eventPrefix: 'custom-sortable',
 *   dispatchDOMEvents: true,
 *   bubbles: false
 * })
 * ```
 */
export function useEventDispatcher(
  target: MaybeRefOrGetter<HTMLElement | null>,
  options: MaybeRefOrGetter<UseEventDispatcherOptions> = {},
): UseEventDispatcherReturn {
  // Internal state for event listeners
  const listeners = ref<Map<SortableEventType, Set<SortableEventListener>>>(new Map())
  const onceListeners = ref<Map<SortableEventType, Set<SortableEventListener>>>(new Map())

  // Computed target element
  const targetElement = computed(() => toValue(target))

  // Computed options with defaults
  const resolvedOptions = computed(() => {
    const opts = toValue(options)
    return {
      dispatchDOMEvents: toValue(opts.dispatchDOMEvents) ?? true,
      bubbles: toValue(opts.bubbles) ?? true,
      cancelable: toValue(opts.cancelable) ?? true,
      eventPrefix: toValue(opts.eventPrefix) ?? 'sortable',
    }
  })

  /**
   * Remove an event listener
   */
  const off = (eventType: SortableEventType, listener: SortableEventListener): void => {
    const eventListeners = listeners.value.get(eventType)
    if (eventListeners) {
      eventListeners.delete(listener)
      if (eventListeners.size === 0) {
        listeners.value.delete(eventType)
      }
    }
  }

  /**
   * Remove a one-time event listener
   */
  const offOnce = (eventType: SortableEventType, listener: SortableEventListener): void => {
    const eventListeners = onceListeners.value.get(eventType)
    if (eventListeners) {
      eventListeners.delete(listener)
      if (eventListeners.size === 0) {
        onceListeners.value.delete(eventType)
      }
    }
  }

  /**
   * Register an event listener
   */
  const on = (eventType: SortableEventType, listener: SortableEventListener): (() => void) => {
    if (!listeners.value.has(eventType)) {
      listeners.value.set(eventType, new Set())
    }

    listeners.value.get(eventType)!.add(listener)

    // Return cleanup function
    return () => off(eventType, listener)
  }

  /**
   * Register a one-time event listener
   */
  const once = (eventType: SortableEventType, listener: SortableEventListener): (() => void) => {
    if (!onceListeners.value.has(eventType)) {
      onceListeners.value.set(eventType, new Set())
    }

    onceListeners.value.get(eventType)!.add(listener)

    // Return cleanup function
    return () => offOnce(eventType, listener)
  }

  /**
   * Execute listeners for an event type
   */
  const executeListeners = (eventType: SortableEventType, event: SortableEvent): boolean => {
    let cancelled = false

    // Execute regular listeners
    const eventListeners = listeners.value.get(eventType)
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          const result = listener(event)
          if (result === false) {
            cancelled = true
          }
        }
        catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
        }
      }
    }

    // Execute one-time listeners
    const eventOnceListeners = onceListeners.value.get(eventType)
    if (eventOnceListeners) {
      // Create a copy to avoid modification during iteration
      const listenersToExecute = Array.from(eventOnceListeners)

      // Clear the one-time listeners first
      onceListeners.value.delete(eventType)

      for (const listener of listenersToExecute) {
        try {
          const result = listener(event)
          if (result === false) {
            cancelled = true
          }
        }
        catch (error) {
          console.error(`Error in once event listener for ${eventType}:`, error)
        }
      }
    }

    return !cancelled
  }

  /**
   * Dispatch a sortable event
   */
  const dispatch = (
    eventType: SortableEventType,
    data: Partial<SortableEventData>,
    callback?: (event: SortableEvent) => void | boolean,
  ): boolean => {
    const el = targetElement.value
    if (!el) {
      return false
    }

    // Normalize event data with defaults
    const eventData = normalizeEventData(eventType, {
      to: el,
      from: el,
      ...data,
    })

    // Create the sortable event
    const event = createSortableEvent(eventType, eventData, el)

    // Execute programmatic listeners first
    const listenerResult = executeListeners(eventType, event)

    // Dispatch DOM event if enabled
    let domEventResult = true
    const opts = resolvedOptions.value
    if (opts.dispatchDOMEvents) {
      domEventResult = dispatchSortableEvent(el, eventType, eventData, callback)
    }
    else if (callback) {
      // Execute callback even if DOM events are disabled
      try {
        const result = callback(event)
        if (result === false) {
          domEventResult = false
        }
      }
      catch (error) {
        console.error(`Error in event callback for ${eventType}:`, error)
      }
    }

    // Event is successful if both listeners and DOM event succeeded
    return listenerResult && domEventResult
  }

  /**
   * Dispatch an animation event
   */
  const dispatchAnimation = (
    type: 'start' | 'end' | 'cancel',
    target: HTMLElement,
    duration?: number,
    easing?: string,
    callback?: (event: AnimationEvent) => void,
  ): void => {
    const opts = resolvedOptions.value
    const event: AnimationEvent = {
      type,
      target,
      duration,
      easing,
      properties: {
        transform: window.getComputedStyle(target).transform,
        transition: window.getComputedStyle(target).transition,
      },
    }

    // Dispatch custom DOM event if enabled
    if (opts.dispatchDOMEvents) {
      const customEvent = new CustomEvent(`${opts.eventPrefix}:animation:${type}`, {
        detail: event,
        bubbles: opts.bubbles,
        cancelable: opts.cancelable,
      })

      target.dispatchEvent(customEvent)
    }

    // Execute callback if provided
    if (callback) {
      try {
        callback(event)
      }
      catch (error) {
        console.error(`Error in animation event callback for ${type}:`, error)
      }
    }
  }

  /**
   * Check if there are listeners for an event type
   */
  const hasListeners = (eventType: SortableEventType): boolean => {
    const hasRegular = listeners.value.has(eventType) && listeners.value.get(eventType)!.size > 0
    const hasOnce = onceListeners.value.has(eventType) && onceListeners.value.get(eventType)!.size > 0
    return hasRegular || hasOnce
  }

  /**
   * Get listener count for an event type
   */
  const getListenerCount = (eventType: SortableEventType): number => {
    const regularCount = listeners.value.get(eventType)?.size || 0
    const onceCount = onceListeners.value.get(eventType)?.size || 0
    return regularCount + onceCount
  }

  /**
   * Remove all listeners
   */
  const removeAllListeners = (eventType?: SortableEventType): void => {
    if (eventType) {
      listeners.value.delete(eventType)
      onceListeners.value.delete(eventType)
    }
    else {
      listeners.value.clear()
      onceListeners.value.clear()
    }
  }

  /**
   * Get all registered event types
   */
  const getEventTypes = (): SortableEventType[] => {
    const types = new Set<SortableEventType>()

    for (const type of listeners.value.keys()) {
      types.add(type)
    }

    for (const type of onceListeners.value.keys()) {
      types.add(type)
    }

    return Array.from(types)
  }

  // Cleanup on unmount
  tryOnUnmounted(() => {
    removeAllListeners()
  })

  return {
    on,
    once,
    off,
    dispatch,
    dispatchAnimation,
    hasListeners,
    getListenerCount,
    removeAllListeners,
    getEventTypes,
  }
}

export default useEventDispatcher
