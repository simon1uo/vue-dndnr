import type { SortablePullFunction } from './sortable'

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
  | 'revert'

/**
 * Sortable-specific data interface
 * Contains all sortable-specific information separated from native DOM events.
 * This provides better type safety and clearer separation of concerns.
 */
export interface SortableData {
  /** Target container element where the dragged item will be placed */
  to?: HTMLElement
  /** Source container element where the dragged item originated from */
  from?: HTMLElement
  /** The element being dragged */
  item?: HTMLElement
  /** The element being dragged (used in onMove events) */
  dragged?: HTMLElement
  /** Rectangle information of the dragged element (used in onMove events) */
  draggedRect?: DOMRect
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
  /**
   * Pull mode when cross-list dragging
   * @default undefined
   */
  pullMode?: boolean | 'clone' | SortablePullFunction
  /** Related target element (typically the element being dragged over) */
  related?: HTMLElement
  /** Rectangle information of the related element (used in onMove events) */
  relatedRect?: DOMRect
  /**
   * Whether the item will be inserted after the target
   * @default false
   */
  willInsertAfter?: boolean
  /** Additional custom data properties */
  [key: string]: any
}

/**
 * Event callback functions
 * Complete set of callback functions for drag and drop events.
 * These callbacks can be provided in options to respond to various stages
 * of the sorting operation.
 *
 * All callbacks now use a two-parameter signature:
 * - First parameter: Native DOM event (PointerEvent, DragEvent, etc.)
 * - Second parameter: Sortable-specific data (SortableData)
 */
export interface SortableEventCallbacks {
  /**
   * Triggered when dragging starts
   * @param event The native event that initiated the drag (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   */
  onStart?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when dragging ends
   * @param event The native event that ended the drag (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   */
  onEnd?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when element is added to list from another list
   * @param event The native event that triggered the add operation
   * @param sortableData Sortable-specific data containing drag information
   */
  onAdd?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when element is removed from list and added to another list
   * @param event The native event that triggered the remove operation
   * @param sortableData Sortable-specific data containing drag information
   */
  onRemove?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when element position changes within the same list
   * @param event The native event that triggered the update operation
   * @param sortableData Sortable-specific data containing drag information
   */
  onUpdate?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when any sorting operation occurs (add, update, or remove)
   * @param event The native event that triggered the sort operation
   * @param sortableData Sortable-specific data containing drag information
   */
  onSort?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when element is filtered out (prevented from dragging)
   * @param event The native event that was filtered (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   */
  onFilter?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when element is being moved
   * @param event The native event during the move (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   * @returns Return false to cancel the move operation
   */
  onMove?: (event: PointerEvent | DragEvent, sortableData: SortableData) => boolean | void
  /**
   * Triggered when element is cloned
   * @param event The native event that triggered the clone operation
   * @param sortableData Sortable-specific data containing drag information
   */
  onClone?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when position changes (during drag)
   * @param event The native event during position change (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   */
  onChange?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when element is chosen (pointerdown)
   * @param event The native event that chose the element (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   */
  onChoose?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when element is unchosen (pointerup)
   * @param event The native event that unchose the element (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   */
  onUnchoose?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when element is dropped outside valid containers
   * @param event The native event when element was dropped outside
   * @param sortableData Sortable-specific data containing drag information
   */
  onSpill?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when elements are selected (multi-drag feature)
   * @param event The native event that selected elements (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   */
  onSelect?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when elements are deselected (multi-drag feature)
   * @param event The native event that deselected elements (PointerEvent or DragEvent)
   * @param sortableData Sortable-specific data containing drag information
   */
  onDeselect?: (event: PointerEvent | DragEvent, sortableData: SortableData) => void
  /**
   * Triggered when the list data needs to be updated after a sort operation
   * When provided, manual update mode is used instead of automatic updates
   * @param newList The new list data after sorting
   * @param oldList The original list data before sorting
   */
  onListUpdate?: <T>(newList: T[], oldList: T[]) => void
}

/**
 * Event listener function type
 * Generic event listener that can handle any sortable event using the new two-parameter signature.
 * Optionally returns a boolean to control event flow.
 *
 * @param event The native DOM event (PointerEvent, DragEvent, etc.)
 * @param sortableData Sortable-specific data containing drag information
 * @returns Optional boolean to control event flow (e.g., false to cancel)
 */
export type SortableEventListener = (event: PointerEvent | DragEvent, sortableData: SortableData) => void | boolean

/**
 * Event handler map
 * Maps event types to their handler functions.
 * Used for storing and retrieving event handlers.
 */
export type SortableEventHandlerMap = {
  [K in SortableEventType]?: SortableEventListener
}

/**
 * Custom event data interface
 * For creating custom sortable events with specific data.
 * Used when dispatching events programmatically.
 * Extends SortableData with event type information.
 */
export interface SortableEventData extends SortableData {
  /** Event type identifier */
  type: SortableEventType
  /** Original DOM event that triggered this sortable event */
  originalEvent?: PointerEvent | DragEvent | Event
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
