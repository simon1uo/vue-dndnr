/**
 * Represents a location in a droppable container
 * Used to track the position of draggable items within droppable containers
 */
export interface DragLocation {
  /** The ID of the droppable container where the item is located */
  dropId: string
  /** The index position within the container, zero-based */
  index: number
}

/**
 * Contains information about a drag operation
 * Used to track the state and movement of a drag operation
 */
export interface DragRubric {
  /** The ID of the item being dragged */
  dragId: string
  /** The source location where the drag started */
  source: DragLocation
  /** The destination location where the drag ended, null if not dropped */
  destination: DragLocation | null
}

/**
 * Represents the current state of a drag operation
 * Used to track the lifecycle of drag operations
 */
export enum DragState {
  /** No drag operation is in progress */
  IDLE = 'IDLE',
  /** An item is currently being dragged */
  DRAGGING = 'DRAGGING',
  /** An item is being dropped */
  DROPPING = 'DROPPING',
}

/**
 * Represents a 2D position in the coordinate system
 * Used for tracking positions of elements
 */
export interface Position {
  /** The horizontal coordinate */
  x: number
  /** The vertical coordinate */
  y: number
}

/**
 * Represents the direction of movement or layout
 * Used to specify the orientation of containers and movement constraints
 */
export type Direction = 'horizontal' | 'vertical'

/**
 * Represents the dimensions and position of a draggable element
 * Used to track the size and location of draggable items
 */
export interface DragDimension {
  /** The unique identifier of the draggable element */
  dragId: string
  /** The width of the element in pixels */
  width: number
  /** The height of the element in pixels */
  height: number
  /** The current position of the element */
  position: Position
  /** The center point of the element */
  center: Position
}

/**
 * Represents the dimensions and characteristics of a droppable container
 * Used to define the drop zone boundaries and behavior
 */
export interface DropDimension {
  /** The unique identifier of the droppable container */
  dropId: string
  /** The width of the container in pixels */
  width: number
  /** The height of the container in pixels */
  height: number
  /** The position of the container */
  position: Position
  /** The direction of item flow within the container */
  direction: Direction
  /** Whether the container is currently enabled for dropping */
  isEnabled: boolean
  /** Whether the container can be scrolled */
  isScrollable: boolean
}

/**
 * Event data when a drag operation starts
 */
export interface DragStart {
  /** The ID of the item being dragged */
  dragId: string
  /** The source location of the drag */
  source: DragLocation
  /** The mode of dragging (e.g., FLUID or SNAP) */
  mode: 'FLUID' | 'SNAP'
}

/**
 * Event data during a drag operation
 */
export interface DragUpdate extends DragStart {
  /** The current destination location, if any */
  destination: DragLocation | null
}

/**
 * Result data when a drag operation completes
 */
export interface DropResult extends DragUpdate {
  /** Reason why the drag operation ended */
  reason: 'DROP' | 'CANCEL'
}

/**
 * Configuration props for the drag and drop context
 */
export interface DragDropContextProps {
  /**
   * Called when a drag operation starts
   * @param initial - Initial drag event data
   */
  onDragStart?: (initial: DragStart) => void

  /**
   * Called when a drag operation is updated
   * @param update - Updated drag event data
   */
  onDragUpdate?: (update: DragUpdate) => void

  /**
   * Called when a drag operation ends
   * @param result - Final drag and drop result
   */
  onDragEnd: (result: DropResult) => void

  /**
   * Whether to enable sensor event capturing
   * @default true
   */
  enableDefaultSensors?: boolean

  /**
   * Lock axis to constrain movement
   * @default undefined - movement in any direction
   */
  lockAxis?: 'x' | 'y'

  /**
   * Whether to enable dropping on external drop targets
   * @default false
   */
  enableDropExternal?: boolean
}

/**
 * API interface for input sensors (mouse, touch, keyboard, etc.)
 * Used to abstract different input methods for drag and drop operations
 */
export interface SensorAPI {
  /**
   * Called when the sensor detects a drag start event
   * @param event - The original input event
   */
  onDragStart: (event: Event) => void

  /**
   * Called when the sensor detects movement during drag
   * @param event - The original input event
   */
  onDragMove: (event: Event) => void

  /**
   * Called when the sensor detects a drag end event
   * @param event - The original input event
   */
  onDragEnd: (event: Event) => void

  /**
   * Called when the sensor needs to be cleaned up
   */
  onCleanup: () => void

  /**
   * Whether the sensor is currently active
   */
  isActive: boolean

  /**
   * The type of input this sensor handles
   */
  type: 'mouse' | 'touch' | 'keyboard'
}
