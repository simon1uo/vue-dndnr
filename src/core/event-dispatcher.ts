import type {
  SortableEvent,
  SortableEventData,
  SortableEventListener,
  SortableEventType,
} from '@/types'

/**
 * Event dispatcher for sortable events.
 * Manages event registration, triggering, and cleanup.
 * Based on SortableJS EventDispatcher with Vue3 adaptations.
 */
export class EventDispatcher {
  private listeners: Map<SortableEventType, Set<SortableEventListener>> = new Map()
  private onceListeners: Map<SortableEventType, Set<SortableEventListener>> = new Map()

  /**
   * Register an event listener.
   *
   * @param eventType - The type of event to listen for
   * @param listener - The callback function to execute
   * @returns Cleanup function to remove the listener
   */
  on(eventType: SortableEventType, listener: SortableEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    this.listeners.get(eventType)!.add(listener)

    // Return cleanup function
    return () => this.off(eventType, listener)
  }

  /**
   * Register a one-time event listener.
   *
   * @param eventType - The type of event to listen for
   * @param listener - The callback function to execute once
   * @returns Cleanup function to remove the listener
   */
  once(eventType: SortableEventType, listener: SortableEventListener): () => void {
    if (!this.onceListeners.has(eventType)) {
      this.onceListeners.set(eventType, new Set())
    }

    this.onceListeners.get(eventType)!.add(listener)

    // Return cleanup function
    return () => this.offOnce(eventType, listener)
  }

  /**
   * Remove an event listener.
   *
   * @param eventType - The type of event to stop listening for
   * @param listener - The callback function to remove
   */
  off(eventType: SortableEventType, listener: SortableEventListener): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.listeners.delete(eventType)
      }
    }
  }

  /**
   * Remove a one-time event listener.
   *
   * @param eventType - The type of event to stop listening for
   * @param listener - The callback function to remove
   */
  private offOnce(eventType: SortableEventType, listener: SortableEventListener): void {
    const listeners = this.onceListeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.onceListeners.delete(eventType)
      }
    }
  }

  /**
   * Dispatch an event to all registered listeners.
   *
   * @param eventType - The type of event to dispatch
   * @param data - The event data to include
   * @returns Whether the event was cancelled (false) or completed (true)
   */
  dispatch(eventType: SortableEventType, data: SortableEventData): boolean {
    let cancelled = false

    // Execute regular listeners
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      for (const listener of listeners) {
        try {
          const result = listener(data as SortableEvent)
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
    const onceListeners = this.onceListeners.get(eventType)
    if (onceListeners) {
      // Create a copy to avoid modification during iteration
      const listenersToExecute = Array.from(onceListeners)

      // Clear the one-time listeners first
      this.onceListeners.delete(eventType)

      for (const listener of listenersToExecute) {
        try {
          const result = listener(data as SortableEvent)
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
   * Remove all listeners for a specific event type.
   *
   * @param eventType - The type of event to clear listeners for
   */
  removeAllListeners(eventType?: SortableEventType): void {
    if (eventType) {
      this.listeners.delete(eventType)
      this.onceListeners.delete(eventType)
    }
    else {
      this.listeners.clear()
      this.onceListeners.clear()
    }
  }

  /**
   * Check if there are any listeners for a specific event type.
   *
   * @param eventType - The type of event to check
   * @returns Whether there are any listeners for this event type
   */
  hasListeners(eventType: SortableEventType): boolean {
    const hasRegular = this.listeners.has(eventType) && this.listeners.get(eventType)!.size > 0
    const hasOnce = this.onceListeners.has(eventType) && this.onceListeners.get(eventType)!.size > 0
    return hasRegular || hasOnce
  }

  /**
   * Get the number of listeners for a specific event type.
   *
   * @param eventType - The type of event to count listeners for
   * @returns The total number of listeners (regular + once)
   */
  getListenerCount(eventType: SortableEventType): number {
    const regularCount = this.listeners.get(eventType)?.size || 0
    const onceCount = this.onceListeners.get(eventType)?.size || 0
    return regularCount + onceCount
  }

  /**
   * Get all registered event types.
   *
   * @returns Array of all event types that have listeners
   */
  getEventTypes(): SortableEventType[] {
    const types = new Set<SortableEventType>()

    for (const type of this.listeners.keys()) {
      types.add(type)
    }

    for (const type of this.onceListeners.keys()) {
      types.add(type)
    }

    return Array.from(types)
  }
}
