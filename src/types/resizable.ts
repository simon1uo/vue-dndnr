/**
 * Types for the resizable component
 */
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ActivationTrigger, PointerType, Position, Size } from './common'

/**
 * Valid resize handle positions
 * Supports both short ('t', 'b', etc.) and long ('top', 'bottom', etc.) formats
 */
export type ResizeHandle = 't' | 'b' | 'r' | 'l' | 'tr' | 'tl' | 'br' | 'bl' | 'top' | 'bottom' | 'right' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/**
 * Type of resize handles to display
 */
export type ResizeHandleType = 'borders' | 'handles' | 'custom'

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
   * Border style for handleType 'borders'.
   * Accepts any valid CSS border value. Default is 'none'.
   * @default 'none'
   */
  handleBorderStyle?: MaybeRefOrGetter<string>

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
 * Result of the useResizeHandles composable
 */
export interface ResizeHandlesResult {
  /**
   * Current handle type
   */
  handleType: ComputedRef<ResizeHandleType>

  /**
   * Currently active handle (during resize)
   */
  activeHandle: Ref<ResizeHandle | null>

  /**
   * Currently hovered handle
   */
  hoverHandle: Ref<ResizeHandle | null>

  /**
   * Map of handle elements
   */
  handleElements: Ref<Map<ResizeHandle, HTMLElement>>

  /**
   * List of created handle elements (for cleanup)
   */
  createdHandleElements: Ref<HTMLElement[]>

  /**
   * Get cursor style for a handle
   */
  getCursorForHandle: (handle: ResizeHandle) => string

  /**
   * Create a handle element
   */
  createHandleElement: (handle: ResizeHandle, isCustom?: boolean) => HTMLElement

  /**
   * Apply styles to a handle element
   */
  applyHandleStyles: (handleEl: HTMLElement, handle: ResizeHandle, isCustom?: boolean) => void

  /**
   * Register a handle element
   */
  registerHandle: (handle: ResizeHandle, element: HTMLElement) => void

  /**
   * Unregister a handle element
   */
  unregisterHandle: (handle: ResizeHandle) => void

  /**
   * Set up handle elements
   */
  setupHandleElements: (targetElement: HTMLElement | SVGElement) => void

  /**
   * Clean up handle elements
   */
  cleanup: () => void

  /**
   * Detect which handle is under the pointer
   */
  detectBoundary: (event: PointerEvent, element: HTMLElement | SVGElement) => ResizeHandle | null

  /**
   * Handle pointerdown event on a handle
   */
  onHandlePointerDown: (event: PointerEvent, handle: ResizeHandle) => void

  /**
   * Get event listener configuration
   */
  getConfig: () => { capture: boolean, passive: boolean }
}

/**
 * Position type for the resizable element
 */
export type PositionType = 'absolute' | 'relative'

/**
 * Configuration options for resizable functionality
 */
export interface ResizableOptions {
  /**
   * Initial size of the resizable element
   * @default { width: 'auto', height: 'auto' }
   */
  initialSize?: Size

  /**
   * Initial position of the element
   * If not provided, the current element position will be used
   * @default { x: 0, y: 0 }
   */
  initialPosition?: Position

  /**
   * Position type for the element
   * - 'absolute': Use absolute positioning (default)
   * - 'relative': Use relative positioning
   * @default 'absolute'
   */
  positionType?: MaybeRefOrGetter<PositionType>

  /**
   * Initial active state of the element
   * Only active elements can be resized when activeOn is not 'none'
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
   * Grid size for snapping during resize
   * @type [number, number] - [width, height] spacing for the grid
   */
  grid?: MaybeRefOrGetter<[number, number] | undefined | null>

  /**
   * Whether to maintain aspect ratio during resizing
   * @default false
   */
  lockAspectRatio?: MaybeRefOrGetter<boolean>

  /**
   * Active resize handles to enable
   * @default ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']
   */
  handles?: MaybeRefOrGetter<ResizeHandle[]>

  /**
   * Type of resize handles to display
   * - 'borders': Use element borders as resize handles (default)
   * - 'handles': Display visible handles at corners and edges
   * - 'custom': Use custom handles provided via slots
   * @default 'borders'
   */
  handleType?: MaybeRefOrGetter<ResizeHandleType>

  /**
   * Custom handle elements to use when handleType is 'custom'
   * Map of handle positions to HTML elements
   */
  customHandles?: MaybeRefOrGetter<Map<ResizeHandle, HTMLElement> | null | undefined>

  /**
   * Element or selector to use as bounds for the resizable element
   * Can be an HTML element or 'parent'
   */
  bounds?: MaybeRefOrGetter<HTMLElement | 'parent' | null | undefined>

  /**
   * Whether resizing is disabled
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>

  /**
   * Types of pointer events to respond to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: MaybeRefOrGetter<PointerType[] | null | undefined>

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

  /**
   * Whether to use event capturing phase
   * @default true
   */
  capture?: MaybeRefOrGetter<boolean>

  /**
   * Delay in milliseconds for throttling resize events
   * @default 16 (approximately 60fps)
   */
  throttleDelay?: MaybeRefOrGetter<number>

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
  onResize?: (size: Size, event: PointerEvent) => void

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
