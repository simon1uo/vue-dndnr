/**
 * Sortable event interface
 * Standard drag and drop event interface based on SortableJS.
 * Contains information about the drag operation, including source and target elements,
 * positions, and related DOM elements.
 */
export interface SortableEvent extends Event {
  /** Target container element where the dragged item will be placed */
  to: HTMLElement
  /** Source container element where the dragged item originated from */
  from: HTMLElement
  /** The element being dragged */
  item: HTMLElement
  /** Clone element created during drag operation, if cloning is enabled */
  clone?: HTMLElement
  /** Original index position in the source container */
  oldIndex?: number
  /** New index position in the target container */
  newIndex?: number
  /** Original index among draggable elements only */
  oldDraggableIndex?: number
  /** New index among draggable elements only */
  newDraggableIndex?: number
  /** Original DOM event that triggered this sortable event */
  originalEvent?: Event
  /**
   * Pull mode when cross-list dragging
   * @default undefined
   */
  pullMode?: 'clone' | undefined
  /** Related target element (typically the element being dragged over) */
  related?: HTMLElement
  /**
   * Whether the item will be inserted after the target
   * @default false
   */
  willInsertAfter?: boolean
}

/**
 * Event callback functions
 * Complete set of callback functions for drag and drop events.
 * These callbacks can be provided in options to respond to various stages
 * of the sorting operation.
 */
export interface SortableEventCallbacks {
  /**
   * Triggered when dragging starts
   * @param event The sortable event object containing drag information
   */
  onStart?: (event: SortableEvent) => void
  /**
   * Triggered when dragging ends
   * @param event The sortable event object containing drag information
   */
  onEnd?: (event: SortableEvent) => void
  /**
   * Triggered when element is added to list from another list
   * @param event The sortable event object containing drag information
   */
  onAdd?: (event: SortableEvent) => void
  /**
   * Triggered when element is removed from list and added to another list
   * @param event The sortable event object containing drag information
   */
  onRemove?: (event: SortableEvent) => void
  /**
   * Triggered when element position changes within the same list
   * @param event The sortable event object containing drag information
   */
  onUpdate?: (event: SortableEvent) => void
  /**
   * Triggered when any sorting operation occurs (add, update, or remove)
   * @param event The sortable event object containing drag information
   */
  onSort?: (event: SortableEvent) => void
  /**
   * Triggered when element is filtered out (prevented from dragging)
   * @param event The sortable event object containing drag information
   */
  onFilter?: (event: SortableEvent) => void
  /**
   * Triggered when element is being moved
   * @param event The sortable event object containing drag information
   * @param originalEvent The original DOM event
   * @returns Return false to cancel the move operation
   */
  onMove?: (event: SortableEvent, originalEvent: Event) => boolean | void
  /**
   * Triggered when element is cloned
   * @param event The sortable event object containing drag information
   */
  onClone?: (event: SortableEvent) => void
  /**
   * Triggered when position changes (during drag)
   * @param event The sortable event object containing drag information
   */
  onChange?: (event: SortableEvent) => void
  /**
   * Triggered when element is chosen (mousedown/touchstart)
   * @param event The sortable event object containing drag information
   */
  onChoose?: (event: SortableEvent) => void
  /**
   * Triggered when element is unchosen (mouseup/touchend)
   * @param event The sortable event object containing drag information
   */
  onUnchoose?: (event: SortableEvent) => void
  /**
   * Triggered when element is dropped outside valid containers
   * @param event The sortable event object containing drag information
   */
  onSpill?: (event: SortableEvent) => void
  /**
   * Triggered when elements are selected (multi-drag feature)
   * @param event The sortable event object containing drag information
   */
  onSelect?: (event: SortableEvent) => void
  /**
   * Triggered when elements are deselected (multi-drag feature)
   * @param event The sortable event object containing drag information
   */
  onDeselect?: (event: SortableEvent) => void
}

/**
 * Internal event types
 * All possible event types that can be dispatched by the sortable system.
 * Used for event handling and dispatching.
 */
export type SortableEventType =
  | 'start'
  | 'end'
  | 'add'
  | 'remove'
  | 'update'
  | 'sort'
  | 'filter'
  | 'move'
  | 'clone'
  | 'change'
  | 'choose'
  | 'unchoose'
  | 'spill'
  | 'select'
  | 'deselect'

/**
 * Event listener function type
 * Generic event listener that can handle any sortable event and
 * optionally return a boolean to control event flow.
 *
 * @param event The sortable event object
 * @param args Additional arguments that might be passed
 * @returns Optional boolean to control event flow (e.g., false to cancel)
 */
export type SortableEventListener = (event: SortableEvent, ...args: any[]) => void | boolean

/**
 * Event handler map
 * Maps event types to their handler functions.
 * Used for storing and retrieving event handlers.
 */
export type SortableEventHandlerMap = {
  [K in SortableEventType]?: SortableEventListener
}

/**
 * Plugin event interface
 * Events specific to the plugin system.
 * Used for plugin lifecycle management and communication.
 */
export interface PluginEvent {
  /** Plugin name identifier */
  plugin: string
  /** Event type identifier */
  type: string
  /** Optional event data payload */
  data?: any
  /** Target element associated with the event */
  target?: HTMLElement
  /**
   * Whether the event can be cancelled
   * @default false
   */
  cancelable?: boolean
  /**
   * Whether the event was cancelled
   * @default false
   */
  cancelled?: boolean
}

/**
 * Plugin event callbacks
 * Callback functions for plugin lifecycle events.
 */
export interface PluginEventCallbacks {
  /**
   * Triggered when plugin is initialized
   * @param event The plugin event object
   */
  onPluginInit?: (event: PluginEvent) => void
  /**
   * Triggered when plugin is destroyed
   * @param event The plugin event object
   */
  onPluginDestroy?: (event: PluginEvent) => void
  /**
   * Triggered when plugin state changes
   * @param event The plugin event object
   */
  onPluginStateChange?: (event: PluginEvent) => void
  /**
   * Triggered when plugin error occurs
   * @param event The plugin event object
   */
  onPluginError?: (event: PluginEvent) => void
}

/**
 * Custom event data interface
 * For creating custom sortable events with specific data.
 * Used when dispatching events programmatically.
 */
export interface SortableEventData {
  /** Event type identifier */
  type: SortableEventType
  /** Target container element */
  to?: HTMLElement
  /** Source container element */
  from?: HTMLElement
  /** Dragged item element */
  item?: HTMLElement
  /** Clone element if cloning is enabled */
  clone?: HTMLElement
  /** Original index position */
  oldIndex?: number
  /** New index position */
  newIndex?: number
  /** Original DOM event that triggered this */
  originalEvent?: Event
  /**
   * Additional custom data properties
   * Allows for extending the event with custom data
   */
  [key: string]: any
}

/**
 * Event dispatcher interface
 * Interface for the event dispatching system.
 * Provides methods for registering, removing, and triggering event handlers.
 */
export interface EventDispatcher {
  /**
   * Add event listener
   * @param eventType The type of event to listen for
   * @param listener The callback function to execute
   * @returns Cleanup function to remove the listener
   */
  on: (eventType: SortableEventType, listener: SortableEventListener) => () => void
  /**
   * Remove event listener
   * @param eventType The type of event to remove listener from
   * @param listener The callback function to remove
   */
  off: (eventType: SortableEventType, listener: SortableEventListener) => void
  /**
   * Dispatch event
   * @param eventType The type of event to dispatch
   * @param data The event data to include
   * @returns Result from event handlers (if any)
   */
  dispatch: (eventType: SortableEventType, data: SortableEventData) => boolean | void
  /**
   * Remove all listeners
   * Clears all registered event handlers
   */
  removeAllListeners: () => void
  /**
   * Check if has listeners for event type
   * @param eventType The type of event to check
   * @returns Whether there are any listeners for this event type
   */
  hasListeners: (eventType: SortableEventType) => boolean
}

/**
 * Event bus interface
 * For cross-component communication.
 * Provides a pub/sub pattern for components to communicate.
 */
export interface SortableEventBus {
  /**
   * Emit event
   * @param event The event name to emit
   * @param args Additional arguments to pass to listeners
   */
  emit: (event: string, ...args: any[]) => void
  /**
   * Listen to event
   * @param event The event name to listen for
   * @param listener The callback function to execute
   * @returns Cleanup function to remove the listener
   */
  on: (event: string, listener: (...args: any[]) => void) => () => void
  /**
   * Listen to event once
   * @param event The event name to listen for
   * @param listener The callback function to execute once
   * @returns Cleanup function to remove the listener
   */
  once: (event: string, listener: (...args: any[]) => void) => () => void
  /**
   * Remove listener
   * @param event The event name to remove listener from
   * @param listener Optional specific listener to remove (removes all if not provided)
   */
  off: (event: string, listener?: (...args: any[]) => void) => void
  /**
   * Clear all listeners
   * Removes all event listeners from all event types
   */
  clear: () => void
}

/**
 * Animation event interface
 * Contains information about animation state changes.
 */
export interface AnimationEvent {
  /**
   * Animation type
   * Indicates the phase of the animation
   */
  type: 'start' | 'end' | 'cancel'
  /** Target element being animated */
  target: HTMLElement
  /**
   * Animation duration in milliseconds
   * @default 150
   */
  duration?: number
  /**
   * Animation easing function name
   * @default "ease"
   */
  easing?: string
  /**
   * Animation CSS properties and values
   * Key-value pairs of properties being animated
   */
  properties?: Record<string, any>
}

/**
 * Animation event callbacks
 * Callback functions for animation lifecycle events.
 */
export interface AnimationEventCallbacks {
  /**
   * Triggered when animation starts
   * @param event The animation event object
   */
  onAnimationStart?: (event: AnimationEvent) => void
  /**
   * Triggered when animation ends
   * @param event The animation event object
   */
  onAnimationEnd?: (event: AnimationEvent) => void
  /**
   * Triggered when animation is cancelled
   * @param event The animation event object
   */
  onAnimationCancel?: (event: AnimationEvent) => void
}
