import type { MaybeRefOrGetter } from 'vue'
import type { ActivationTrigger, PointerType, Position } from './common'

/**
 * Configuration options for draggable functionality
 */
export interface DraggableOptions {
  /**
   * Initial position of the element
   * @default { x: 0, y: 0 }
   */
  initialPosition?: Position

  /**
   * Initial active state of the element
   * Only active elements can be dragged when activeOn is not 'none'
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
   * Element or selector to use as bounds for the draggable element
   * Can be an HTML element, 'parent', or an object with explicit bounds
   */
  bounds?: MaybeRefOrGetter<HTMLElement | 'parent' | { left: number, top: number, right: number, bottom: number } | null | undefined>

  /**
   * Grid size for snapping during drag
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

  /**
   * Whether dragging is disabled
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
   * Delay in milliseconds for throttling drag events
   * @default 16 (approximately 60fps)
   */
  throttleDelay?: MaybeRefOrGetter<number>

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

  /**
   * Called when the active state changes
   * @param active - New active state
   * @returns {boolean|void} Return false to prevent active state change
   */
  onActiveChange?: (active: boolean) => void | boolean
}

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
