import type { EasingFunction, SortDirection } from './common'

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
   * - true: Items can be put into this list from any group
   * - false: Items cannot be put into this list
   * - 'same-group': Only items from the same group can be put (default)
   * - string[]: Array of allowed group names
   * - function: Custom logic for put behavior
   * @default 'same-group'
   */
  put?: boolean | 'same-group' | string[] | SortablePutFunction
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
  evt?: Event
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
  evt?: Event
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
 * Function type for cloning items during cross-list drag and drop operations.
 * Used when pull: 'clone' is set to create deep copies instead of references.
 *
 * @template T - The type of the item to clone
 * @param item - The original item to clone
 * @returns A deep copy of the original item
 */
export type CloneItemFn<T = any> = (item: T) => T

/**
 * Core sortable options interface.
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
   * Offset for fallback mode ghost element positioning
   * @default { x: 0, y: 0 }
   */
  fallbackOffset?: { x: number, y: number }
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
  /**
   * Revert dragged element to original position when spilled (dropped outside valid containers)
   * @default false
   */
  revertOnSpill?: boolean
  /**
   * Remove dragged element from DOM when spilled (dropped outside valid containers)
   * @default false
   */
  removeOnSpill?: boolean

  /**
   * Custom function to clone items when using pull: 'clone'
   * By default structuredClone or JSON.parse(JSON.stringify()) will be used
   * Provide this function for better control over the cloning process
   * @param item - The item to clone
   * @returns A deep copy of the item
   * @default undefined
   */
  cloneItem?: CloneItemFn
}
