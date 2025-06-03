import type { Ref } from 'vue'
import type { Position } from './common'
import type { DragId } from './core'

/**
 * Events that can activate a sensor
 */
export type SensorActivateEvent = MouseEvent | TouchEvent | KeyboardEvent

/**
 * Common sensor state machine states
 */
export type SensorStateType = 'IDLE' | 'PENDING' | 'DRAGGING'

/**
 * Base sensor options interface
 */
export interface BaseSensorOptions {
  /**
   * Whether the sensor is enabled
   * @default true
   */
  isEnabled?: boolean
}

/**
 * Mouse sensor options interface
 */
export interface MouseSensorOptions extends BaseSensorOptions {
  /**
   * Distance threshold in pixels that the mouse needs to move
   * before a drag operation is started
   * @default 5
   */
  dragTolerance?: number
  /**
   * Whether to capture window events
   * @default true
   */
  captureWindow?: boolean
}

/**
 * Touch sensor options interface
 */
export interface TouchSensorOptions extends BaseSensorOptions {
  /**
   * Time in milliseconds to wait before starting drag
   * @default 120
   */
  longPressDelay?: number
  /**
   * Distance in pixels that touch can move while waiting for long press
   * @default 5
   */
  dragTolerance?: number
}

/**
 * Keyboard sensor options interface
 */
export interface KeyboardSensorOptions extends BaseSensorOptions {
  /**
   * Pixels to move per key press
   * @default 15
   */
  moveStep?: number
}

/**
 * Base drag actions interface
 */
export interface DragActions {
  /** Move the dragged item to a new position */
  move: (clientPosition: Position) => void
  /** Complete the drag operation */
  drop: () => void
  /** Cancel the drag operation */
  cancel: () => void
}

/**
 * Actions available before dragging starts
 */
export interface PreDragActions {
  /** Start dragging with fluid movement */
  fluidLift: (clientPosition: Position) => FluidDragActions
  /** Start dragging with snap movement */
  snapLift: () => SnapDragActions
  /** Abort the pre-drag state */
  abort: () => void
}

/**
 * Actions available during fluid dragging
 */
export interface FluidDragActions extends DragActions {
  moveUp: () => void
  moveDown: () => void
  moveLeft: () => void
  moveRight: () => void
}

/**
 * Actions available during snap dragging
 */
export interface SnapDragActions extends DragActions {
  moveUp: () => void
  moveDown: () => void
  moveLeft: () => void
  moveRight: () => void
}

/**
 * Options for trying to get a drag lock
 */
export interface TryGetLockOptions {
  /** The event that triggered the lock attempt */
  sourceEvent?: SensorActivateEvent
  /** Function to check if an item can be lifted */
  canLift?: (id: DragId) => boolean
  /** Event target to capture events on */
  captureEvent?: EventTarget
}

/**
 * Function to attempt getting a drag lock
 */
export type TryGetLock = (
  dragId: DragId,
  forceStop?: () => void,
  options?: TryGetLockOptions
) => PreDragActions | null

/**
 * API provided to sensors
 */
export interface SensorAPI {
  /** Try to get a lock for dragging */
  tryGetLock: TryGetLock
  /** Check if a lock can be obtained */
  canGetLock: (id: DragId) => boolean
  /** Check if a lock is currently claimed */
  isLockClaimed: () => boolean
  /** Find the closest draggable element's ID */
  findClosestDraggableId: (event: Event) => DragId | null
  /** Find options for a draggable element */
  findOptionsForDraggable: (id: DragId) => Record<string, any> | null
}

/**
 * Base sensor interface
 */
export interface BaseSensor {
  /** Current sensor state */
  state: Ref<SensorStateType>
  /** Activate the sensor */
  activate: () => void
  /** Deactivate the sensor */
  deactivate: () => void
}

/**
 * Mouse sensor interface
 */
export interface MouseSensor extends BaseSensor {
  /** Mouse sensor specific options */
  options?: MouseSensorOptions
}

/**
 * Touch sensor interface
 */
export interface TouchSensor extends BaseSensor {
  /** Touch sensor specific options */
  options?: TouchSensorOptions
}

/**
 * Keyboard sensor interface
 */
export interface KeyboardSensor extends BaseSensor {
  /** Keyboard sensor specific options */
  options?: KeyboardSensorOptions
}

/**
 * Sensor factory function type
 */
export type SensorFactory<T extends BaseSensor = BaseSensor> = (
  api: SensorAPI,
  options?: T extends MouseSensor
    ? MouseSensorOptions
    : T extends TouchSensor
      ? TouchSensorOptions
      : T extends KeyboardSensor
        ? KeyboardSensorOptions
        : never
) => T

/**
 * Pending state data interface
 */
export interface PendingState {
  /** Current position */
  point: Position
  /** Drag item ID */
  dragId: DragId | null
  /** Pre-drag actions */
  actions: PreDragActions | null
}

/**
 * Dragging state data interface
 */
export interface DraggingState {
  /** Drag item ID */
  dragId?: DragId
  /** Active drag actions */
  actions: FluidDragActions | SnapDragActions | null
}

/**
 * Options for useSensorSystem
 */
export interface SensorSystemOptions {
  /** Whether to enable default sensors */
  enableDefaultSensors?: boolean
  /** Custom sensors to use */
  customSensors?: SensorFactory[]
  /** Lock timeout in milliseconds */
  lockTimeout?: number
}
