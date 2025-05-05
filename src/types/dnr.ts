import type { MaybeRefOrGetter } from 'vue'
import type { ActivationTrigger, PointerType, Position, Size } from './common'
import type { PositionType, ResizeHandle, ResizeHandleType } from './resizable'

/**
 * Combined configuration options for Drag and Resize (DnR) functionality
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
   * Element or selector to use as bounds for the draggable/resizable element
   * Can be an HTML element, 'parent', or an object with explicit bounds for dragging
   */
  bounds?: MaybeRefOrGetter<HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number } | null | undefined>

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
   * Border style for handleType 'borders'.
   * Accepts any valid CSS border value. Default is 'none'.
   * @default 'none'
   */
  handleBorderStyle?: MaybeRefOrGetter<string>

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
