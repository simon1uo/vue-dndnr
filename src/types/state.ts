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
 * Public state of the element
 */
export interface PublicState {
  /**
   * The ID of the active element
   */
  activeId: string | null
  /**
   * The active element
   */
  activeElement: HTMLElement | null
  /**
   * Whether the element is being dragged
   */
  isDragging: boolean
  /**
   * The position of the element when dragging
   */
  dragPosition: Position
  /**
   * Whether the element is being resized
   */
  isResizing: boolean
  /**
   * The size of the element when resizing
   */
  resizeSize: Size
  /**
   * The active handle of the element when resizing
   */
  activeHandle: ResizeHandle | null
  /**
   * The handle the user is hovering over when resizing
   */
  hoverHandle: ResizeHandle | null
}

export type UniqueId = string

/**
 * Internal state of the element
 */
export interface InternalState {
  /**
   * A unique identifier for the element
   * If not provided, a random ID will be generated.
   */
  id?: MaybeRefOrGetter<UniqueId>
  /**
   * Whether the action is disabled
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>
  /**
   * Initial active state of the element
   * Only active elements can be dragged when activeOn is not 'none'
   * @default false
   */
  initialActive?: boolean

  /**
   * Event that triggers activation.
   * @default 'none'
   */
  activeOn?: MaybeRefOrGetter<ActivationTrigger>

  /**
   * Prevents the deactivation of the component
   * @default false
   */
  preventDeactivation?: MaybeRefOrGetter<boolean>

  /**
   * Delay in milliseconds for throttling events
   * @default 16
   */
  throttleDelay?: MaybeRefOrGetter<number>

  /**
   * Element for calculating bounds
   */
  containerElement?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * Grid size for snapping during drag or resize
   * @type [number, number]
   */
  grid?: MaybeRefOrGetter<[number, number] | undefined | null>

  /**
   * Custom styles for different element states.
   */
  stateStyles?: MaybeRefOrGetter<Partial<StateStyles>>

  /**
   * Position type for the element
   * @default 'absolute'
   */
  positionType?: MaybeRefOrGetter<PositionType>

  /**
   * Z-index value for the element
   * @default 'auto'
   */
  zIndex?: MaybeRefOrGetter<string | number>

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
   * Called when the active state changes
   */
  onActiveChange?: (active: boolean) => void | boolean
}
