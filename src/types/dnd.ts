import type { MaybeRefOrGetter } from 'vue'

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
   * If true, forces the use of a fallback mechanism (based on pointer events) for dragging,
   * instead of the native HTML5 Drag and Drop API.
   * @default false
   */
  forceFallback?: boolean

  /**
   * CSS class name to apply to the fallback drag image element when `forceFallback` is true.
   * @default 'dndnr-fallback'
   */
  fallbackClass?: string

  /**
   * If true and `forceFallback` is true, the fallback drag image is appended to the document body.
   * Otherwise, it's appended to the parent of the original `target` element.
   * @default true
   */
  fallbackOnBody?: boolean

  /**
   * The distance in pixels the pointer must move after a mousedown/pointerdown event
   * before a drag operation starts in fallback mode (`forceFallback: true`).
   * @default 0
   */
  fallbackTolerance?: number
  /**
   * Custom state-based styles to apply to the draggable `target` element.
   * These styles are merged with internal defaults.
   * @default {} (empty object, internal defaults are `{ normal: { cursor: 'grab' }, dragging: { opacity: '0.5', cursor: 'grabbing' } }`)
   */
  stateStyles?: MaybeRefOrGetter<DragStateStyles | undefined>

  /**
   * Callback function fired when a drag operation starts.
   * @param dragData - Object containing `dragId`, `index`, and `type` of the dragged item.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (fallback mode) that initiated the drag.
   */
  onDragStart?: (dragData: { dragId: string, index: number, type: string }, event: DragEvent | PointerEvent) => void

  /**
   * Callback function fired continuously while an item is being dragged.
   * @param dragData - Object containing `dragId`, `index`, and `type` of the dragged item.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (fallback mode) during dragging.
   */
  onDrag?: (dragData: { dragId: string, index: number, type: string }, event: DragEvent | PointerEvent) => void

  /**
   * Callback function fired when a drag operation ends (e.g., on drop or cancel).
   * @param dragData - Object containing `dragId`, `index`, and `type` of the dragged item.
   * @param event - The `DragEvent` (native DnD) or `PointerEvent` (fallback mode) that ended the drag.
   */
  onDragEnd?: (dragData: { dragId: string, index: number, type: string }, event: DragEvent | PointerEvent) => void
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
   * If true, this drop zone will also react to drags initiated in fallback mode
   * (i.e., when `forceFallback: true` is used in `useDrag`).
   * @default true
   */
  allowFallbackDrags?: MaybeRefOrGetter<boolean>

  /**
   * Callback function fired when an accepted draggable item is dropped onto this drop zone.
   * @param params - Object containing `dragId`, `index`, and `type` of the dropped item.
   * @param event - The `DragEvent` (native DnD or fallback mode via PointerEvent cast) of the drop.
   */
  onDrop?: (params: { dragId: string, index: number, type: string }, event: DragEvent) => void

  /**
   * Callback function fired when a draggable item first enters the boundaries of this drop zone.
   * @param params - Object containing `dragId`, `index`, and `type` of the dragged item if recognized, otherwise `null`.
   * @param event - The `DragEvent` (native DnD or fallback mode via PointerEvent cast) of the dragenter.
   */
  onDragEnter?: (params: { dragId: string, index: number, type: string } | null, event: DragEvent) => void

  /**
   * Callback function fired continuously while a draggable item is being dragged over this drop zone.
   * @param params - Object containing `dragId`, `index`, and `type` of the dragged item if recognized, otherwise `null`.
   * @param event - The `DragEvent` (native DnD or fallback mode via PointerEvent cast) of the dragover.
   */
  onDragOver?: (params: { dragId: string, index: number, type: string } | null, event: DragEvent) => void

  /**
   * Callback function fired when a draggable item leaves the boundaries of this drop zone.
   * @param params - Object containing `dragId`, `index`, and `type` of the dragged item if recognized (often null on leave), otherwise `null`.
   * @param event - The `DragEvent` (native DnD or fallback mode via PointerEvent cast) of the dragleave.
   */
  onDragLeave?: (params: { dragId: string, index: number, type: string } | null, event: DragEvent) => void
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
   * (Currently not explicitly set by `useDrag` or `useDrop` in a way that populates this for inter-dropzone source tracking).
   */
  sourceDropId?: string

  /**
   * Indicates if the current drag operation is using the fallback mechanism
   * (pointer events) instead of the native HTML5 Drag and Drop API.
   * `true` if `forceFallback` was enabled for the `useDrag` instance, `false` otherwise.
   */
  isFallback: boolean
}
