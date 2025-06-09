import type { MaybeRefOrGetter } from '@vueuse/core'
import type { DragState, EasingFunction, Position, SortDirection } from './common'

/**
 * Configuration interface for sortable groups.
 * Defines how sortable lists can interact with each other through drag and drop operations.
 */
export interface SortableGroup {
  /**
   * Group name identifier for cross-list dragging
   * Used to connect multiple sortable lists
   * @default undefined
   */
  name?: string
  /**
   * Controls whether items can be pulled from this list
   * - true: Items can be pulled
   * - false: Items cannot be pulled
   * - 'clone': Items are cloned when pulled
   * - function: Custom logic for pull behavior
   * @default true
   */
  pull?: boolean | 'clone' | SortablePullFunction
  /**
   * Controls whether items can be put into this list
   * - true: Items can be put into this list
   * - false: Items cannot be put into this list
   * - string[]: Array of allowed group names
   * - function: Custom logic for put behavior
   * @default true
   */
  put?: boolean | string[] | SortablePutFunction
  /**
   * Whether to revert cloned element to original position after moving to another list
   * @default false
   */
  revertClone?: boolean
}

/**
 * Function type to determine if items can be pulled from a list.
 *
 * @param to - Target container element
 * @param from - Source container element
 * @param dragEl - Element being dragged
 * @param evt - Original drag event
 * @returns boolean or 'clone' - Whether the item can be pulled and how
 */
export type SortablePullFunction = (
  to: HTMLElement,
  from: HTMLElement,
  dragEl: HTMLElement,
  evt: Event
) => boolean | 'clone'

/**
 * Function type to determine if items can be put into a list.
 *
 * @param to - Target container element
 * @param from - Source container element
 * @param dragEl - Element being dragged
 * @param evt - Original drag event
 * @returns Whether the item can be put into the target list
 */
export type SortablePutFunction = (
  to: HTMLElement,
  from: HTMLElement,
  dragEl: HTMLElement,
  evt: Event
) => boolean

/**
 * Function type to filter which elements should not trigger drag.
 *
 * @param evt - Original event that triggered the drag
 * @param item - The item being dragged
 * @param target - The target element under the pointer
 * @returns Whether the element should be filtered (true = prevent drag)
 */
export type SortableFilterFunction = (
  evt: Event,
  item: HTMLElement,
  target: HTMLElement
) => boolean

/**
 * Function type to determine sort direction dynamically.
 *
 * @param evt - Original event that triggered the sort
 * @param target - Target element under the pointer
 * @param dragEl - Element being dragged
 * @returns The direction to sort in ('vertical' | 'horizontal')
 */
export type SortableDirectionFunction = (
  evt: Event,
  target: HTMLElement,
  dragEl: HTMLElement
) => SortDirection

/**
 * Core sortable options interface.
 * Based on SortableJS options with Vue3 adaptations.
 * Contains all configuration options for sortable behavior.
 */
export interface SortableOptions {
  // Basic options
  /**
   * Group configuration for cross-list dragging
   * Can be a string (group name) or a SortableGroup object
   * @default undefined
   */
  group?: string | SortableGroup
  /**
   * Whether to allow sorting within list
   * @default true
   */
  sort?: boolean
  /**
   * Whether sorting is disabled
   * @default false
   */
  disabled?: boolean

  // Drag behavior
  /**
   * Time in milliseconds to define when the sorting should start
   * @default 0
   */
  delay?: number
  /**
   * Whether to only apply delay for touch devices
   * @default false
   */
  delayOnTouchOnly?: boolean
  /**
   * Number of pixels a touch point needs to move before cancelling a delayed drag
   * @default 0
   */
  touchStartThreshold?: number

  // Selectors
  /**
   * CSS selector to specify draggable items within the container
   * @default undefined
   */
  draggable?: string
  /**
   * CSS selector for drag handles within draggable items
   * @default undefined
   */
  handle?: string
  /**
   * CSS selector or function to define elements that should not trigger drag
   * @default undefined
   */
  filter?: string | SortableFilterFunction
  /**
   * Whether to prevent default event when filter is triggered
   * @default true
   */
  preventOnFilter?: boolean

  // Styling
  /**
   * Class name to add to ghost element during drag
   * @default 'sortable-ghost'
   */
  ghostClass?: string
  /**
   * Class name to add to chosen item
   * @default 'sortable-chosen'
   */
  chosenClass?: string
  /**
   * Class name to add to dragging item
   * @default 'sortable-drag'
   */
  dragClass?: string

  // Animation
  /**
   * Animation duration in milliseconds
   * @default 150
   */
  animation?: number
  /**
   * Easing function for animations
   * @default 'cubic-bezier(1, 0, 0, 1)'
   */
  easing?: EasingFunction

  // Scrolling
  /**
   * Enable auto-scrolling of container or window
   * @default true
   */
  scroll?: boolean | HTMLElement
  /**
   * Pixels from edge to start scrolling
   * @default 30
   */
  scrollSensitivity?: number
  /**
   * Scrolling speed in pixels per frame
   * @default 10
   */
  scrollSpeed?: number
  /**
   * Enable auto-scrolling when dragging
   * @default true
   */
  autoScroll?: boolean
  /**
   * Enable scrolling parent elements
   * @default true
   */
  bubbleScroll?: boolean

  // Advanced
  /**
   * Threshold of the swap zone
   * @default 1
   */
  swapThreshold?: number
  /**
   * Enable inverted swap zone
   * @default false
   */
  invertSwap?: boolean
  /**
   * Threshold of the inverted swap zone
   * @default swapThreshold
   */
  invertedSwapThreshold?: number
  /**
   * Direction of sorting ('vertical' | 'horizontal' | function)
   * @default 'vertical'
   */
  direction?: SortDirection | SortableDirectionFunction
  /**
   * Force fallback mode for non-HTML5 browsers
   * @default false
   */
  forceFallback?: boolean
  /**
   * Class name for fallback mode
   * @default 'sortable-fallback'
   */
  fallbackClass?: string
  /**
   * Append ghost element to body
   * @default false
   */
  fallbackOnBody?: boolean
  /**
   * Pixel tolerance before fallback is activated
   * @default 0
   */
  fallbackTolerance?: number
  /**
   * Ignore dragover events on non-draggable elements
   * @default false
   */
  dragoverBubble?: boolean
  /**
   * Remove clone from DOM when hiding
   * @default true
   */
  removeCloneOnHide?: boolean
  /**
   * Threshold for empty inserting
   * @default 0
   */
  emptyInsertThreshold?: number
  /**
   * Function to set custom data transfer
   * @param dataTransfer The DataTransfer object
   * @param dragEl The dragged element
   */
  setData?: (dataTransfer: DataTransfer, dragEl: HTMLElement) => void
  /**
   * HTML attribute that holds the element's id
   * @default 'data-id'
   */
  dataIdAttr?: string
}

/**
 * Responsive sortable options interface with Vue3 reactivity support.
 * All options support MaybeRefOrGetter for reactive updates.
 * Extends core options with reactive capabilities.
 */
export interface ResponsiveSortableOptions {
  /**
   * Group configuration with reactive support
   * @default undefined
   */
  group?: MaybeRefOrGetter<string | SortableGroup>
  /**
   * Sorting within list with reactive support
   * @default true
   */
  sort?: MaybeRefOrGetter<boolean>
  /**
   * Disabled state with reactive support
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>
  /**
   * Delay before drag starts with reactive support
   * @default 0
   */
  delay?: MaybeRefOrGetter<number>
  /**
   * Only delay on touch with reactive support
   * @default false
   */
  delayOnTouchOnly?: MaybeRefOrGetter<boolean>
  /**
   * Touch start threshold with reactive support
   * @default 0
   */
  touchStartThreshold?: MaybeRefOrGetter<number>
  /**
   * Draggable selector with reactive support
   * @default undefined
   */
  draggable?: MaybeRefOrGetter<string>
  /**
   * Handle selector with reactive support
   * @default undefined
   */
  handle?: MaybeRefOrGetter<string>
  /**
   * Filter selector with reactive support
   * @default undefined
   */
  filter?: MaybeRefOrGetter<string>
  /**
   * Prevent on filter with reactive support
   * @default true
   */
  preventOnFilter?: MaybeRefOrGetter<boolean>
  /**
   * Ghost class with reactive support
   * @default 'sortable-ghost'
   */
  ghostClass?: MaybeRefOrGetter<string>
  /**
   * Chosen class with reactive support
   * @default 'sortable-chosen'
   */
  chosenClass?: MaybeRefOrGetter<string>
  /**
   * Drag class with reactive support
   * @default 'sortable-drag'
   */
  dragClass?: MaybeRefOrGetter<string>
  /**
   * Invert swap with reactive support
   * @default false
   */
  invertSwap?: MaybeRefOrGetter<boolean>
  /**
   * Animation duration with reactive support
   * @default 150
   */
  animation?: MaybeRefOrGetter<number>
  /**
   * Animation easing with reactive support
   * @default 'cubic-bezier(1, 0, 0, 1)'
   */
  easing?: MaybeRefOrGetter<EasingFunction>
  /**
   * Scroll configuration with reactive support
   * @default true
   */
  scroll?: MaybeRefOrGetter<boolean | HTMLElement>
  /**
   * Scroll sensitivity with reactive support
   * @default 30
   */
  scrollSensitivity?: MaybeRefOrGetter<number>
  /**
   * Scroll speed with reactive support
   * @default 10
   */
  scrollSpeed?: MaybeRefOrGetter<number>
  /**
   * Auto scroll with reactive support
   * @default true
   */
  autoScroll?: MaybeRefOrGetter<boolean>
  /**
   * Bubble scroll with reactive support
   * @default true
   */
  bubbleScroll?: MaybeRefOrGetter<boolean>
  /**
   * Swap threshold with reactive support
   * @default 1
   */
  swapThreshold?: MaybeRefOrGetter<number>
  /**
   * Sort direction with reactive support
   * @default 'vertical'
   */
  direction?: MaybeRefOrGetter<SortDirection>
  /**
   * Data ID attribute with reactive support
   * @default 'data-id'
   */
  dataIdAttr?: MaybeRefOrGetter<string>
}

/**
 * Base plugin configuration options interface.
 * Used as a foundation for specific plugin option interfaces.
 */
export interface PluginOptions {
  /**
   * Unique plugin identifier
   */
  name: string
  /**
   * Whether the plugin is enabled
   * @default true
   */
  enabled?: boolean
  /**
   * Plugin-specific configuration options
   * @default {}
   */
  options?: Record<string, any>
}

/**
 * Multi-drag plugin options interface.
 * Configuration for the multi-drag functionality.
 */
export interface MultiDragOptions extends PluginOptions {
  /**
   * Class name added to selected items
   * @default 'selected'
   */
  selectedClass?: string
  /**
   * Key to enable multi-drag functionality
   * @default 'Meta'
   */
  multiDragKey?: string | null
  /**
   * Map of available keys for multi-drag operations
   * @default {}
   */
  availableKeys?: Record<string, string>
}

/**
 * Auto-scroll plugin options interface.
 * Configuration for automatic scrolling behavior.
 */
export interface AutoScrollOptions extends PluginOptions {
  /**
   * Pixels from edge to start scrolling
   * @default 30
   */
  scrollSensitivity?: number
  /**
   * Scrolling speed in pixels per frame
   * @default 10
   */
  scrollSpeed?: number
  /**
   * Enable scrolling parent elements
   * @default true
   */
  bubbleScroll?: boolean
}

/**
 * Swap plugin options interface.
 * Configuration for swap functionality between items.
 */
export interface SwapOptions extends PluginOptions {
  /**
   * Class name added during swap
   * @default 'swapping'
   */
  swapClass?: string
  /**
   * Threshold of the swap zone
   * @default 1
   */
  swapThreshold?: number
}

/**
 * Internal drag state interface.
 * Tracks the current state of a drag operation.
 */
export interface DragStateInfo {
  /** Current drag operation state */
  state: DragState
  /** Element being dragged */
  element: HTMLElement | null
  /** Ghost/clone element during drag */
  ghost: HTMLElement | null
  /** Original index before drag */
  oldIndex: number | null
  /** Current index during/after drag */
  newIndex: number | null
  /** Initial drag start position */
  startPosition: Position | null
  /** Current drag position */
  currentPosition: Position | null
  /** Original container element */
  sourceContainer: HTMLElement | null
  /** Current container element */
  targetContainer: HTMLElement | null
}
