import type { MaybeRefOrGetter } from 'vue'
import type { Position } from './common'

/**
 * Defines the drag mode for the draggable item.
 * Controls how the drag and drop operation is handled.
 *
 */
export enum DragMode {
  /**
   * Uses the native HTML5 Drag and Drop API.
   * This is the default mode and provides the best performance and browser compatibility.
   */
  Native = 'native',

  /**
   * Uses a custom implementation based on pointer events.
   * This mode provides more control over the drag behavior but may have performance implications.
   */
  Pointer = 'pointer',
}

/**
 * Defines the configuration for a custom drag preview element.
 * This allows for a visual representation of the item being dragged,
 * different from the original element.
 */
export interface DragPreview {
  /**
   * The HTML element to be used as the drag preview.
   * This can be a direct reference to an HTMLElement or a Vue ref/getter.
   */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>

  /**
   * Specifies the offset of the drag preview relative to the cursor.
   * `x` is the horizontal offset and `y` is the vertical offset.
   * @default { x: 0, y: 0 } (If not set, but typically defaults to cursor hotspot or center of preview)
   */
  offset?: {
    x: number
    y: number
  }

  /**
   * A scale factor to apply to the drag preview element.
   * Useful for making the preview smaller or larger than the original.
   * @default 1 (If not set)
   */
  scale?: number
}

/**
 * Defines CSS styles for a draggable item in its different states.
 * Allows for visual feedback during the drag and drop operation.
 */
export interface DragStateStyles {
  /**
   * CSS styles to apply when the item is in its normal (not being dragged) state.
   * Supports any valid CSS style properties as key-value pairs.
   * @example { cursor: 'grab', opacity: '1' }
   * @default (Specific to `useDrag` hook, typically `{ cursor: 'grab' }` is merged)
   */
  normal?: Record<string, string>

  /**
   * CSS styles to apply when the item is actively being dragged.
   * Supports any valid CSS style properties as key-value pairs.
   * @example { cursor: 'grabbing', opacity: '0.5' }
   * @default (Specific to `useDrag` hook, typically `{ opacity: '0.5', cursor: 'grabbing' }` is merged)
   */
  dragging?: Record<string, string>
}

/**
 * Configuration options for the `useDrag` hook, controlling the behavior of a draggable item.
 */
export interface DragOptions {
  /**
   * A unique identifier for the draggable item. This is required to differentiate
   * between multiple draggable items.
   */
  dragId: string

  /**
   * The index of the draggable item, typically within its original container or list.
   * This is required for reordering or identifying the item's source position.
   */
  index: number

  /**
   * A string identifier for the type of the draggable item.
   * This is used by drop zones to determine if they can accept the item.
   * @default 'default'
   */
  type?: string

  /**
   * Configuration for the custom drag preview.
   * If not provided, the browser may use a default ghost image of the dragged element.
   */
  dragPreview?: MaybeRefOrGetter<DragPreview | undefined>

  /**
   * Specifies an alternative HTML element to act as the drag handle.
   * If not provided, the `target` element of `useDrag` itself will be the handle.
   * @default The target element passed to `useDrag`.
   */
  handle?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * The HTML element or `Window`/`Document` to which drag event listeners are attached.
   * Useful if drag events need to be captured on a different scope than the handle.
   * @default defaultWindow (the global `window` object)
   */
  draggingElement?: MaybeRefOrGetter<HTMLElement | SVGElement | Window | Document | null | undefined>

  /**
   * A delay in milliseconds before a drag operation starts after a mousedown/pointerdown event.
   * @default 0
   */
  delay?: number

  /**
   * If true, the `delay` option will only apply to touch events, not mouse events.
   * Note: `useDrag` does not explicitly use this, its default behavior is effectively no touch-only delay,
   * meaning `delay` applies to all pointer types if set.
   * @default false (implicitly)
   */
  delayOnTouchOnly?: boolean

  /**
   * Specifies the drag mode to use for this draggable item.
   * - 'native': Uses the native HTML5 Drag and Drop API (default)
   * - 'pointer': Uses a custom pointer events based implementation
   * @default DragMode.Native
   */
  dragMode?: MaybeRefOrGetter<DragMode>

  /**
   * Custom state-based styles to apply to the draggable `target` element.
   * These styles are merged with internal defaults.
   * @default {} (empty object, internal defaults are `{ normal: { cursor: 'grab' }, dragging: { opacity: '0.5', cursor: 'grabbing' } }`)
   */
  stateStyles?: MaybeRefOrGetter<DragStateStyles | undefined>

  /**
   * Callback function fired when a drag operation starts.
   * @param dragData - Object containing `dragId`, `index`, and `type` of the dragged item.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (pointer mode) that initiated the drag.
   */
  onDragStart?: (dragData: { dragId: string, index: number, type: string }, event: DragEvent | PointerEvent) => void

  /**
   * Callback function fired continuously while an item is being dragged.
   * @param dragData - Object containing `dragId`, `index`, and `type` of the dragged item.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (pointer mode) during dragging.
   */
  onDrag?: (dragData: { dragId: string, index: number, type: string }, event: DragEvent | PointerEvent) => void

  /**
   * Callback function fired when a drag operation ends (e.g., on drop or cancel).
   * @param dragData - Object containing `dragId`, `index`, and `type` of the dragged item.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (pointer mode) that ended the drag.
   */
  onDragEnd?: (dragData: { dragId: string, index: number, type: string }, event: DragEvent | PointerEvent) => void
}

/**
 * Data associated with a drop event, representing the item that was dropped or is interacting with the drop zone.
 */
export interface DropItemData {
  dragId: string
  index: number
  type: string
}

/**
 * Configuration options for the `useDrop` hook, controlling the behavior of a drop zone.
 */
export interface DropOptions {
  /**
   * A unique identifier for the drop zone. This is required if you have multiple drop zones
   * and need to distinguish them, though not strictly used by `useDrop` for identification in callbacks.
   */
  dropId: string

  /**
   * Defines which types of draggable items this drop zone will accept.
   * Can be a string (single type), an array of strings (multiple types),
   * or a function that takes the draggable item's `type` and returns `true` if accepted.
   * @default undefined (accepts all types if not specified)
   */
  accept?: MaybeRefOrGetter<string | string[] | ((type: string) => boolean) | undefined>

  /**
   * The visual feedback (cursor style) to show when a draggable item is over this drop zone
   * and is accepted. Corresponds to the `DataTransfer.dropEffect` property.
   * @default 'move'
   */
  dropEffect?: 'none' | 'copy' | 'link' | 'move'

  /**
   * Callback function fired when an accepted draggable item is dropped onto this drop zone.
   * @param data - Object containing `dragId`, `index`, and `type` of the dropped item.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (pointer mode) of the drop.
   */
  onDrop?: (data: DropItemData, event: DragEvent | PointerEvent) => void

  /**
   * Callback function fired when a draggable item first enters the boundaries of this drop zone.
   * @param data - Object containing `dragId`, `index`, and `type` of the dragged item if recognized, otherwise `null`.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (pointer mode) of the dragenter.
   */
  onDragEnter?: (data: DropItemData | null, event: DragEvent | PointerEvent) => void

  /**
   * Callback function fired continuously while a draggable item is being dragged over this drop zone.
   * @param data - Object containing `dragId`, `index`, and `type` of the dragged item if recognized, otherwise `null`.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (pointer mode) of the dragover.
   */
  onDragOver?: (data: DropItemData | null, event: DragEvent | PointerEvent) => void

  /**
   * Callback function fired when a draggable item leaves the boundaries of this drop zone.
   * @param data - Object containing `dragId`, `index`, and `type` of the dragged item if recognized (often null on leave), otherwise `null`.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (pointer mode) of the dragleave.
   */
  onDragLeave?: (data: DropItemData | null, event: DragEvent | PointerEvent) => void
}

/**
 * Represents the context of the currently active drag operation within the drag-and-drop store.
 * This data is shared globally while a drag is in progress.
 */
export interface ActiveDragContext {
  /**
   * A unique ID generated for this specific drag operation instance (e.g., a single mousedown-to-mouseup sequence).
   */
  id: string

  /**
   * The `dragId` (from `DragOptions`) of the item being dragged.
   */
  dragId: string

  /**
   * The `index` (from `DragOptions`) of the item being dragged.
   */
  index: number

  /**
   * The `type` (from `DragOptions`) of the item being dragged.
   */
  type: string

  /**
   * The `dropId` of the drop zone from which the item was originally dragged, if applicable.
   * This is typically set if an item is dragged out of one drop zone and into another.
   */
  sourceDropId?: string

  /**
   * The current drag mode being used for this drag operation.
   * Matches the `dragMode` option from the originating `useDrag` instance.
   */
  dragMode: DragMode

  /**
   * The HTML element from which the drag originated.
   * This is used to calculate the initial offset of the pointer within the element for `DragMode.Pointer`.
   * @optional
   */
  sourceNode?: HTMLElement

  /**
   * The initial position of the pointer (e.g., mouse cursor or touch point) when the drag operation started.
   * This is used in conjunction with `sourceNode` to determine the offset for `DragMode.Pointer` previews.
   * @optional
   */
  initialPointerPosition?: Position

  /**
   * The current position of the pointer during the drag operation.
   * This is particularly useful for custom drag preview implementations.
   */
  currentPosition?: Position
}

/**
 * Options for the drag preview layer, controlling its behavior and appearance.
 */
export interface DragPreviewOptions {
  /**
   * Target container where the preview element will be rendered.
   * If not provided, document.body will be used by default.
   * @default document.body
   */
  container?: MaybeRefOrGetter<HTMLElement | null | undefined>

  /**
   * Z-index style value for the preview layer, controlling the stacking order.
   * @default 1000
   */
  zIndex?: MaybeRefOrGetter<number | undefined>

  /**
   * Custom element to use as preview.
   */
  element?: MaybeRefOrGetter<HTMLElement | null | undefined>

  /**
   * Offset configuration for the preview element.
   */
  offset?: MaybeRefOrGetter<Position | undefined>

  /**
   * Animation effect configuration for the preview element.
   */
  animation?: MaybeRefOrGetter<{
    duration?: number
    easing?: string
    initial?: Record<string, string>
    active?: Record<string, string>
  } | undefined>

  /**
   * The drag mode to use for this preview.
   * Only 'pointer' mode will show the custom preview element.
   * @default undefined (will use the dragMode from the active drag context)
   */
  dragMode?: MaybeRefOrGetter<DragMode | undefined>
}
