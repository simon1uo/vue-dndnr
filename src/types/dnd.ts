import type { MaybeRefOrGetter } from 'vue'

/**
 * Drag data with source information
 */
export interface DragData<T = unknown> {
  /**
   * Type identifier for the dragged item
   */
  type: string

  /**
   * The actual data being dragged
   */
  payload: T

  /**
   * Source information about where the drag started
   */
  source?: {
    /**
     * Unique identifier of the source element
     */
    id: string | number

    /**
     * Index of the item in its container
     */
    index: number

    /**
     * Optional container identifier
     */
    containerId?: string
  }
}

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
export interface DragOptions<T = unknown> {
  /**
   * The data to be dragged
   */
  data?: MaybeRefOrGetter<DragData<T>> | (() => DragData<T>)

  /**
   * Custom drag preview configuration
   * Note: This might be ignored or behave differently when `forceFallback` is true.
   */
  dragPreview?: MaybeRefOrGetter<DragPreview | undefined>

  /**
   * Element that triggers dragging (drag handle).
   * Defaults to the target element itself.
   */
  handle?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * Element to attach pointer event listeners to when `forceFallback` is true.
   * Defaults to the window.
   */
  draggingElement?: MaybeRefOrGetter<HTMLElement | SVGElement | Window | Document | null | undefined>

  /**
   * Delay before drag starts in milliseconds
   * @default 0
   */
  delay?: number

  /**
   * Whether to only apply delay on touch devices
   * @default false
   */
  delayOnTouchOnly?: boolean

  /**
   * Ignore the HTML5 DnD behaviour and force the fallback to kick in.
   * When true, drag and drop is simulated using pointer events.
   * @default false
   */
  forceFallback?: boolean

  /**
   * Class name for the cloned DOM Element when using `forceFallback`.
   * @default 'dndnr-fallback'
   */
  fallbackClass?: string

  /**
   * Appends the cloned DOM Element (fallback element) to the Document's Body when using `forceFallback`.
   * If false, it will be appended to the target's parent element.
   * @default true
   */
  fallbackOnBody?: boolean

  /**
   * Specify in pixels how far the mouse should move before it's considered as a drag when `forceFallback` is true.
   * @default 0
   */
  fallbackTolerance?: number

  /**
   * Styles for different drag states
   */
  stateStyles?: MaybeRefOrGetter<DragStateStyles | undefined>

  /**
   * Called when drag starts
   */
  onDragStart?: (event: DragEvent | PointerEvent) => void

  /**
   * Called during drag
   */
  onDrag?: (event: DragEvent | PointerEvent) => void

  /**
   * Called when drag ends
   */
  onDragEnd?: (event: DragEvent | PointerEvent) => void
}

/**
 * Options for drop zone configuration
 */
export interface DropOptions<T = unknown> {
  /**
   * Acceptance criteria for dropped items
   * Can be an array of accepted types or a function that validates types
   */
  accept?: MaybeRefOrGetter<readonly string[] | ((types: readonly string[]) => boolean) | undefined>

  /**
   * Visual effect for drop operation
   * @default 'move'
   */
  dropEffect?: 'none' | 'copy' | 'link' | 'move'

  /**
   * Styles for different drop states
   */
  stateStyles?: MaybeRefOrGetter<DropStateStyles | undefined>

  /**
   * Determines if the drop zone should accept drags initiated in fallback mode (using pointer events).
   * @default true
   */
  allowFallbackDrags?: MaybeRefOrGetter<boolean>
  /**
   * Callback fired when an item is dropped and accepted
   * @param data The dropped data
   * @param event The original drop event
   */
  onDrop?: (data: DragData<T>, event: DragEvent) => void

  /**
   * Callback fired when a draggable element enters the drop zone
   * @param data The current drag data (null during dragenter as data is not yet available)
   * @param event The original dragenter event
   */
  onDragEnter?: (data: DragData<T> | null, event: DragEvent) => void

  /**
   * Callback fired when a draggable element is over the drop zone
   * @param data The current drag data (null during dragover as data is not yet available)
   * @param event The original dragover event
   */
  onDragOver?: (data: DragData<T> | null, event: DragEvent) => void

  /**
   * Callback fired when a draggable element leaves the drop zone
   * @param data The current drag data (null during dragleave as data is not yet available)
   * @param event The original dragleave event
   */
  onDragLeave?: (data: DragData<T> | null, event: DragEvent) => void
}

/**
 * Drop state styles configuration
 */
export interface DropStateStyles {
  /**
   * Styles applied when item is over the drop zone
   * Supports all CSS style properties
   */
  over?: Record<string, string>

  /**
   * Styles applied when drop is valid
   * Supports all CSS style properties
   */
  valid?: Record<string, string>

  /**
   * Styles applied when drop is invalid
   * Supports all CSS style properties
   */
  invalid?: Record<string, string>
}
