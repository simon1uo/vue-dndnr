import type { DragId, DragState } from './core'
import type { PreDragActions, TryGetLockOptions } from './sensors'

/**
 * Interface for drag lock state
 */
export interface DragLock {
  /** ID of the dragged element */
  dragId: DragId
  /** ID of the sensor that owns the lock */
  sensorId: string
  /** Current lock phase */
  phase: DragState
  /** Callback to force stop the drag operation */
  forceStop?: () => void
  /** Lock options */
  options?: TryGetLockOptions
}

/**
 * Options for the drag lock system
 */
export interface DragLockOptions {
  /** Lock timeout in milliseconds */
  lockTimeout?: number
}

/**
 * Drag lock API interface
 */
export interface DragLockAPI {
  /** Try to acquire a lock */
  tryGetLock: (
    dragId: DragId,
    sensorId: string,
    forceStop?: () => void,
    options?: TryGetLockOptions
  ) => PreDragActions | null
  /** Check if a lock can be acquired */
  canGetLock: (dragId: DragId) => boolean
  /** Check if a lock is currently claimed */
  isLockClaimed: () => boolean
  /** Get the current lock state */
  getLock: () => DragLock | null
  /** Get the current lock phase */
  getPhase: () => DragState
}
