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
  /** A pre-drag operation is in progress */
  PRE_DRAG = 'PRE_DRAG',
  /** An item is currently being dragged */
  DRAGGING = 'DRAGGING',
  /** An item is being dropped */
  DROPPING = 'DROPPING',
  /** Drag operation has completed */
  COMPLETED = 'COMPLETED',
}

/**
 * Unique identifier for draggable items
 */
export type DragId = string

/**
 * Unique identifier for droppable containers
 */
export type DropId = string

/**
 * Represents the direction of movement or layout
 * Used to specify the orientation of containers and movement constraints
 */
export type Direction = 'horizontal' | 'vertical'

/**
 * Event data when a drag operation starts
 */
export interface DragStart {
  /** The ID of the item being dragged */
  dragId: DragId
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
