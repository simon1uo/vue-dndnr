import type { MaybeRefOrGetter } from 'vue'
import type { ActivationTrigger, PointerType, Position, PositionType, Size } from './common'

/**
 * Styles for different element states
 */
export interface StateStyles {
  /**
   * Styles applied when the element is active
   */
  active?: Record<string, string>

  /**
   * Styles applied when the element is being dragged
   */
  dragging?: Record<string, string>

  /**
   * Styles applied when the element is being resized
   */
  resizing?: Record<string, string>

  /**
   * Styles applied when hovering over resize handles
   */
  hover?: Record<string, string>
}

/**
 * Styles for resize handles in different states
 */
export interface HandleStyles {
  /**
   * Styles for handles in default state
   * Supports all CSS style properties
   */
  default?: Record<string, string>

  /**
   * Styles for handles in hover state
   * Supports all CSS style properties
   */
  hover?: Record<string, string>

  /**
   * Styles for handles in active state
   * Supports all CSS style properties
   */
  active?: Record<string, string>
}

/**
 * Valid resize handle positions
 * Supports both short ('t', 'b', etc.) and long ('top', 'bottom', etc.) formats
 */
export type ResizeHandle = 't' | 'b' | 'r' | 'l' | 'tr' | 'tl' | 'br' | 'bl' | 'top' | 'bottom' | 'right' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/**
 * Type of resize handles to display
 */
export type ResizeHandleType = 'borders' | 'handles' | 'custom' | 'none'

/**
 * Options for the resize handles
 */
export interface ResizeHandlesOptions {
  /**
   * Type of resize handles to display
   * - 'borders': Use element borders as resize handles (default)
   * - 'handles': Display visible handles at corners and edges
   * - 'custom': Use custom handles provided via slots
   * @default 'borders'
   */
  handleType?: MaybeRefOrGetter<ResizeHandleType>

  /**
   * Active resize handles to enable
   * @default ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']
   */
  handles?: MaybeRefOrGetter<ResizeHandle[]>

  /**
   * Custom handle elements to use when handleType is 'custom'
   * Map of handle positions to HTML elements
   */
  customHandles?: MaybeRefOrGetter<Map<ResizeHandle, HTMLElement> | null | undefined>

  /**
   * Size of the handle or border detection area in pixels
   * - For handleType 'borders': sets the border detection area size
   * - For handleType 'handles' or 'custom': sets the handle element size
   * @default 8
   */
  handlesSize?: MaybeRefOrGetter<number>

  /**
   * Custom styles for resize handles in different states
   * Allows customizing the appearance of resize handles
   */
  handleStyles?: MaybeRefOrGetter<Partial<HandleStyles>>

  /**
   * Whether to prevent default browser events during resize
   * @default true
   */
  preventDefault?: MaybeRefOrGetter<boolean>

  /**
   * Whether to stop event propagation to parent elements
   * @default false
   */
  stopPropagation?: MaybeRefOrGetter<boolean>

  /**
   * Whether to use event capturing phase
   * @default true
   */
  capture?: MaybeRefOrGetter<boolean>

  /**
   * Types of pointer events to respond to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: MaybeRefOrGetter<PointerType[] | null | undefined>

  /**
   * Whether resizing is disabled
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>

  /**
   * Called when resizing starts
   * @param event - The pointer event that triggered the start
   * @param handle - The handle that was clicked
   */
  onResizeStart?: (event: PointerEvent, handle: ResizeHandle) => void
}

/**
 * Combined configuration options for Drag and Resize (DnR) functionality
 */
/**
 * Represents a draggable element with its state
 */
export interface DraggableElement {
  /** Unique identifier for the draggable element */
  id: string
  /** Reference to the HTML element being made draggable */
  element: HTMLElement
  /** Current position of the element */
  position: Position
  /** Whether the element is currently being dragged */
  isDragging: boolean
}

/**
 * Combined configuration options for Drag and Resize (DnR) functionality
 * This is the shared options interface used by useDnR, useDraggable, and useResizable
 */
export interface DnROptions {
  /**
   * Initial position of the element
   * @default { x: 0, y: 0 }
   */
  initialPosition?: Position

  /**
   * Initial size of the resizable element
   * @default { width: 'auto', height: 'auto' }
   */
  initialSize?: Size

  /**
   * Initial active state of the element
   * Only active elements can be dragged/resized when activeOn is not 'none'
   * @default false
   */
  initialActive?: boolean

  /**
   * Determines how the element becomes active
   * - 'click': Element becomes active when clicked
   * - 'hover': Element becomes active when hovered
   * - 'none': Element is always active (traditional behavior)
   * @default 'none'
   */
  activeOn?: MaybeRefOrGetter<ActivationTrigger>

  /**
   * Prevents the deactivation of the component
   * When true, the component will stay active even when clicking outside or leaving the element
   * @default false
   */
  preventDeactivation?: MaybeRefOrGetter<boolean>

  /**
   * Whether dragging and resizing are disabled
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>

  /**
   * Whether dragging is disabled
   * @default false
   */
  disableDrag?: MaybeRefOrGetter<boolean>

  /**
   * Whether resizing is disabled
   * @default false
   */
  disableResize?: MaybeRefOrGetter<boolean>

  /**
   * Types of pointer events to respond to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: MaybeRefOrGetter<PointerType[] | null | undefined>

  /**
   * Whether to prevent default browser events
   * @default true
   */
  preventDefault?: MaybeRefOrGetter<boolean>

  /**
   * Whether to stop event propagation to parent elements
   * @default false
   */
  stopPropagation?: MaybeRefOrGetter<boolean>

  /**
   * Whether to use event capturing phase
   * @default true
   */
  capture?: MaybeRefOrGetter<boolean>

  /**
   * Delay in milliseconds for throttling events
   * @default 16 (approximately 60fps)
   */
  throttleDelay?: MaybeRefOrGetter<number>

  // Drag-specific options
  /**
   * Element for calculating bounds (If not set, it will use the event's target)
   */
  containerElement?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * Grid size for snapping during drag and resize
   * @type [number, number] - [x, y] coordinates for grid spacing
   */
  grid?: MaybeRefOrGetter<[number, number] | undefined | null>

  /**
   * Axis to constrain dragging movement
   * @default 'both'
   */
  axis?: MaybeRefOrGetter<'x' | 'y' | 'both'>

  /**
   * Element that triggers dragging (drag handle)
   * @default the draggable element itself
   */
  handle?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * Element to attach pointer event listeners to
   * @default window
   */
  draggingElement?: MaybeRefOrGetter<HTMLElement | SVGElement | Window | Document | null | undefined>

  /**
   * Scale factor for the draggable element
   * Useful when the element is within a transformed container
   * @default 1
   */
  scale?: MaybeRefOrGetter<number>

  // Resize-specific options
  /**
   * Position type for the element
   * - 'absolute': Use absolute positioning (default)
   * - 'relative': Use relative positioning
   * @default 'absolute'
   */
  positionType?: MaybeRefOrGetter<PositionType>

  /**
   * Minimum width constraint in pixels
   * @default 0
   */
  minWidth?: MaybeRefOrGetter<number>

  /**
   * Minimum height constraint in pixels
   * @default 0
   */
  minHeight?: MaybeRefOrGetter<number>

  /**
   * Maximum width constraint in pixels
   * @default Infinity
   */
  maxWidth?: MaybeRefOrGetter<number>

  /**
   * Maximum height constraint in pixels
   * @default Infinity
   */
  maxHeight?: MaybeRefOrGetter<number>

  /**
   * Whether to maintain aspect ratio during resizing
   * @default false
   */
  lockAspectRatio?: MaybeRefOrGetter<boolean>

  /**
   * Z-index value for the element
   * Controls the stacking order of elements
   * @default 'auto'
   */
  zIndex?: MaybeRefOrGetter<string | number>

  /**
   * Type of resize handles to display
   * - 'borders': Use element borders as resize handles (default)
   * - 'handles': Display visible handles at corners and edges
   * - 'custom': Use custom handles provided via slots
   * @default 'borders'
   */
  handleType?: MaybeRefOrGetter<ResizeHandleType>

  /**
   * Active resize handles to enable
   * @default ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']
   */
  handles?: MaybeRefOrGetter<ResizeHandle[]>

  /**
   * Custom handle elements to use when handleType is 'custom'
   * Map of handle positions to HTML elements
   */
  customHandles?: MaybeRefOrGetter<Map<ResizeHandle, HTMLElement> | null | undefined>

  /**
   * Size of the handle or border detection area in pixels
   * - For handleType 'borders': sets the border detection area size
   * - For handleType 'handles' or 'custom': sets the handle element size
   * @default 8
   */
  handlesSize?: MaybeRefOrGetter<number>

  /**
   * Custom styles for different element states
   * Allows customizing the appearance of the element in different states
   */
  stateStyles?: MaybeRefOrGetter<Partial<StateStyles>>

  /**
   * Custom styles for resize handles in different states
   * Allows customizing the appearance of resize handles
   */
  handleStyles?: MaybeRefOrGetter<Partial<HandleStyles>>

  // Callbacks for dragging
  /**
   * Called when dragging starts
   * @param position - Current position of the element
   * @param event - The pointer event that triggered the start
   * @returns {boolean|void} Return false to prevent dragging
   */
  onDragStart?: (position: Position, event: PointerEvent) => void | boolean

  /**
   * Called during dragging
   * @param position - Current position of the element
   * @param event - The pointer event during dragging
   * @returns {boolean|void} Return false to stop dragging
   */
  onDrag?: (position: Position, event: PointerEvent) => void | boolean

  /**
   * Called when dragging ends
   * @param position - Final position of the element
   * @param event - The pointer event that triggered the end
   * @returns {boolean|void} Return false to prevent position update
   */
  onDragEnd?: (position: Position, event: PointerEvent) => void | boolean

  // Callbacks for resizing
  /**
   * Called when resizing starts
   * @param size - Current size of the element
   * @param event - The pointer event that triggered the start
   */
  onResizeStart?: (size: Size, event: PointerEvent) => void

  /**
   * Called during resizing
   * @param size - Current size of the element
   * @param event - The pointer event during resizing
   */
  onResize?: (size: Size, event: PointerEvent) => void | boolean

  /**
   * Called when resizing ends
   * @param size - Final size of the element
   * @param event - The pointer event that triggered the end
   */
  onResizeEnd?: (size: Size, event: PointerEvent) => void

  /**
   * Called when the active state changes
   * @param active - New active state
   * @returns {boolean|void} Return false to prevent active state change
   */
  onActiveChange?: (active: boolean) => void | boolean
}
