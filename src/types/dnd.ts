import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'

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
 * Represents an individual item in the sortable list/grid
 */
export interface DataItem<T> {
  /**
   * Unique identifier for the item
   */
  id: string | number

  /**
   * The actual data payload
   */
  data: T

  /**
   * Whether the item is currently selected
   * Used for multi-selection functionality
   */
  selected?: boolean
}

/**
 * Represents the source and target information for a sort operation
 */
export interface SortInfo {
  /**
   * The index of the item being dragged
   */
  sourceIndex: number

  /**
   * The index where the item will be dropped
   */
  targetIndex: number

  /**
   * The container ID where the drag started
   */
  sourceContainerId?: string

  /**
   * The container ID where the item will be dropped
   */
  targetContainerId?: string
}

/**
 * Extended drag data for sortable lists
 */
export interface SortableDragData<T> extends DragData<T> {
  /**
   * Unique identifier of the item itself, mirroring DataItem<T>['id']
   */
  id: string | number
  /**
   * The index of the item in its container
   */
  index: number

  /**
   * The container ID where the item is located
   */
  containerId?: string

  /**
   * Whether this is a multi-selection drag
   */
  isMultiSelect?: boolean

  /**
   * The indices of all selected items in a multi-selection drag
   */
  selectedIndices?: number[]
}

/**
 * Extended drag options specifically for sortable items.
 * The generic T here refers to the type of the `item.data` in `DataItem<T>`.
 */
export interface SortableDragOptions<T> extends DragOptions<SortableDragData<T>> {
  /**
   * The index of the item in its container
   */
  index: number

  /**
   * The container ID where the item is located
   */
  containerId?: string

  /**
   * Whether this item is part of a multi-selection
   */
  isMultiSelect?: boolean

  /**
   * The indices of all selected items in a multi-selection
   */
  selectedIndices?: number[]

  /**
   * Class applied to the item being dragged.
   * Overwrites dragClass from UseDnDOptions if both are provided.
   */
  dragClass?: MaybeRefOrGetter<string>
}

/**
 * Extended drop options for sortable lists
 */
export interface SortableDropOptions<T> extends DropOptions<SortableDragData<T>> {
  /**
   * The container ID where items can be dropped
   */
  containerId?: string

  /**
   * Whether to allow dropping between items
   * @default true
   */
  allowBetweenItems?: boolean

  /**
   * Whether to allow dropping on items (for nesting)
   * @default false
   */
  allowOnItems?: boolean

  /**
   * The maximum depth for nested items
   * Only used when allowOnItems is true
   */
  maxDepth?: number
}

/**
 * Configuration options for the useDnD hook
 */
export interface UseDnDOptions<T> {
  /**
   * The list of items to be made sortable
   */
  items: MaybeRefOrGetter<DataItem<T>[]>

  /**
   * Function to get a unique key for Vue transitions
   */
  getKey?: (item: DataItem<T>) => string | number

  /**
   * The orientation of the sortable list/grid
   * @default 'vertical'
   */
  orientation?: MaybeRefOrGetter<'vertical' | 'horizontal' | 'grid'>

  /**
   * Whether to disable sorting functionality
   */
  disabled?: MaybeRefOrGetter<boolean>

  /**
   * Identifier for connecting multiple sortable lists
   * Items can be dragged between lists with the same group
   */
  group?: MaybeRefOrGetter<string>

  /**
   * Class applied to the item being dragged.
   * Can be overwritten by dragOptions.dragClass.
   * Consider removing this if dragClass is solely in dragOptions.
   */
  dragClass?: MaybeRefOrGetter<string>

  /**
   * Class for the placeholder/ghost element
   * Applied to the element that shows where the dragged item will be placed
   */
  ghostClass?: MaybeRefOrGetter<string>

  /**
   * Configuration for multi-selection functionality
   */
  multiSelect?: MaybeRefOrGetter<boolean | {
    /**
     * Modifier key for multi-selection
     * @default 'ctrl'
     */
    key?: 'ctrl' | 'meta' | 'shift' | 'alt'
  }>

  /**
   * Callback fired when the selection changes
   * @param selectedItems Array of currently selected items
   */
  onSelectionChange?: (selectedItems: DataItem<T>[]) => void

  /**
   * Configuration for nested list functionality
   */
  nested?: MaybeRefOrGetter<boolean | {
    /**
     * Maximum nesting depth allowed
     */
    maxDepth?: number

    /**
     * Function to determine if an item can be nested under a parent
     * @param item The item to be nested
     * @param parent The potential parent item, or null for root level
     */
    acceptNested?: (item: DataItem<T>, parent: DataItem<T> | null) => boolean
  }>

  /**
   * Configuration for grid layout
   */
  grid?: MaybeRefOrGetter<boolean | {
    /**
     * Number of columns in the grid
     */
    columns?: number

    /**
     * Width of each column in pixels
     */
    columnWidth?: number

    /**
     * Height of each row in pixels
     */
    rowHeight?: number

    /**
     * Gap between grid items in pixels
     */
    gap?: number
  }>

  /**
   * Configuration for animation effects
   */
  animation?: MaybeRefOrGetter<number | {
    /**
     * CSS easing function for animations
     */
    easing?: string

    /**
     * Duration of the animation in milliseconds
     */
    duration?: number
  }>

  /**
   * Configuration for virtual scrolling
   */
  virtualScroll?: MaybeRefOrGetter<boolean | {
    /**
     * Height of each item in pixels
     * Required for basic virtual scrolling
     */
    itemHeight: number

    /**
     * Number of items to render outside viewport
     * @default 5
     */
    buffer?: number
  }>

  /**
   * Callback fired when items are reordered
   * @param event Object containing information about the sort operation
   */
  onSort?: (event: { oldIndex: number, newIndex: number, item: DataItem<T>, items: DataItem<T>[] }) => void

  /**
   * Callback fired when the list changes
   * @param items The updated list of items
   * @param eventType The type of change that occurred
   */
  onChange?: (items: DataItem<T>[], eventType: 'sort' | 'add' | 'remove') => void

  /**
   * Extended drag options for sortable items
   */
  dragOptions?: MaybeRefOrGetter<Partial<SortableDragOptions<T>>>

  /**
   * Extended drop options for the sortable container
   */
  dropOptions?: MaybeRefOrGetter<Partial<SortableDropOptions<T>>>
}

/**
 * Return value of the useDnD hook
 */
export interface UseDnDReturn<T> {
  /**
   * Items with internal state, ready for rendering
   * Includes computed properties like selection state
   */
  processedItems: ComputedRef<DataItem<T>[]>

  /**
   * Array of currently selected items
   */
  selectedItems: Ref<DataItem<T>[]>

  /**
   * Whether any item is currently being dragged
   */
  isDragging: Ref<boolean>

  /**
   * The item currently being dragged, or null if no drag is in progress
   */
  draggedItem: Ref<DataItem<T> | null>

  /**
   * Whether the container is currently a valid drop target
   */
  isDropTarget: Ref<boolean>

  /**
   * Select an item
   * @param item The item to select
   */
  selectItem: (item: DataItem<T>) => void

  /**
   * Deselect an item
   * @param item The item to deselect
   */
  deselectItem: (item: DataItem<T>) => void

  /**
   * Toggle the selection state of an item
   * @param item The item to toggle
   */
  toggleSelectItem: (item: DataItem<T>) => void

  /**
   * Select all items in the list
   */
  selectAll: () => void

  /**
   * Deselect all items in the list
   */
  deselectAll: () => void

  /**
   * Props to be spread on the list container element
   * Includes event listeners and other necessary attributes
   */
  containerProps: ComputedRef<Record<string, any>>

  /**
   * Function to get props for a specific item
   * @param item The item to get props for
   * @param index The index of the item in the list
   * @returns Object containing props to be spread on the item element
   */
  getItemProps: (item: DataItem<T>, index: number) => Record<string, any>

  /**
   * Function to get props for the placeholder element
   * @param index The index where the placeholder should be shown
   * @returns Object containing props to be spread on the placeholder element
   */
  getPlaceholderProps: (index: number) => Record<string, any>
}
