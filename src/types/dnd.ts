import type { MaybeRefOrGetter } from 'vue'

/**
 * Drag preview configuration
 */
export interface DragPreview {
  /**
   * Custom element to use as drag preview
   */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>

  /**
   * Offset from the cursor position
   */
  offset?: {
    x: number
    y: number
  }

  /**
   * Scale factor for the preview
   */
  scale?: number
}

/**
 * Styles for different drag states
 */
export interface DragStateStyles {
  /**
   * Styles applied when the item is not being dragged
   * Supports all CSS style properties
   */
  normal?: Record<string, string>
  /**
   * Styles applied when the item is being dragged
   * Supports all CSS style properties
   */
  dragging?: Record<string, string>
}

/**
 * Options for drag configuration
 */
export interface DragOptions {
  /**
   * Unique identifier for the dragged item (required)
   */
  dragId: string
  /**
   * Index of the item in its container (required)
   */
  index: number
  /**
   * Type identifier for the dragged item (default: 'default')
   */
  type?: string
  dragPreview?: MaybeRefOrGetter<DragPreview | undefined>
  handle?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>
  draggingElement?: MaybeRefOrGetter<HTMLElement | SVGElement | Window | Document | null | undefined>
  delay?: number
  delayOnTouchOnly?: boolean
  forceFallback?: boolean
  fallbackClass?: string
  fallbackOnBody?: boolean
  fallbackTolerance?: number
  stateStyles?: MaybeRefOrGetter<DragStateStyles | undefined>
  onDragStart?: (event: DragEvent | PointerEvent) => void
  onDrag?: (event: DragEvent | PointerEvent) => void
  onDragEnd?: (event: DragEvent | PointerEvent) => void
}

/**
 * Options for drop zone configuration
 */
export interface DropOptions {
  /**
   * Unique identifier for the drop zone (required)
   */
  dropId: string
  /**
   * Acceptance criteria for dropped item type
   * Can be a string, array of strings, or a function that validates type
   */
  accept?: MaybeRefOrGetter<string | string[] | ((type: string) => boolean) | undefined>
  dropEffect?: 'none' | 'copy' | 'link' | 'move'
  allowFallbackDrags?: MaybeRefOrGetter<boolean>
  /**
   * Callback fired when an item is dropped and accepted
   * @param params Information about the dropped item
   * @param event The original drop event
   */
  onDrop?: (params: { dragId: string, index: number, type: string }, event: DragEvent) => void
  /**
   * Callback fired when a draggable element enters the drop zone
   * @param params Information about the dragged item (null if not available)
   * @param event The original dragenter event
   */
  onDragEnter?: (params: { dragId: string, index: number, type: string } | null, event: DragEvent) => void
  /**
   * Callback fired when a draggable element is over the drop zone
   * @param params Information about the dragged item (null if not available)
   * @param event The original dragover event
   */
  onDragOver?: (params: { dragId: string, index: number, type: string } | null, event: DragEvent) => void
  /**
   * Callback fired when a draggable element leaves the drop zone
   * @param params Information about the dragged item (null if not available)
   * @param event The original dragleave event
   */
  onDragLeave?: (params: { dragId: string, index: number, type: string } | null, event: DragEvent) => void
}

/**
 * Represents the currently active drag operation's context.
 */
export interface ActiveDragContext {
  /** The unique ID generated for this specific drag operation instance. */
  id: string
  /** The ID of the draggable item. */
  dragId: string
  /** The original index of the draggable item. */
  index: number
  /** The type of the draggable item. */
  type: string
  /** The ID of the drop zone from which the item was dragged, if applicable. */
  sourceDropId?: string
  /** Indicates if the drag operation is using a fallback mechanism (e.g., pointer events). */
  isFallback: boolean
}
