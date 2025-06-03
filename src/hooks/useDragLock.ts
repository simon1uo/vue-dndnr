import type { DragId, DragLock, DragLockAPI, DragLockOptions, FluidDragActions, PreDragActions, SnapDragActions, TryGetLockOptions } from '@/types'
import { DragState } from '@/types'
import { tryOnUnmounted } from '@vueuse/core'
import { ref, shallowRef } from 'vue'

/**
 * Drag lock mechanism
 *
 * Coordinates drag operations between multiple sensors,
 * ensuring only one drag operation can be active at a time
 */
export function useDragLock(options: DragLockOptions = {}) {
  const { lockTimeout = 5000 } = options

  // Lock state
  const lock = shallowRef<DragLock | null>(null)
  const phase = ref<DragState>(DragState.IDLE)

  // Lock timeout timer
  let lockTimeoutId: ReturnType<typeof setTimeout> | null = null

  /**
   * Clear the lock timeout timer
   */
  function clearLockTimeout() {
    if (lockTimeoutId !== null) {
      clearTimeout(lockTimeoutId)
      lockTimeoutId = null
    }
  }

  /**
   * Set the lock timeout
   */
  function setLockTimeout() {
    clearLockTimeout()

    lockTimeoutId = setTimeout(() => {
      // If lock is in PRE_DRAG state and times out, automatically release it
      if (phase.value === DragState.PRE_DRAG && lock.value) {
        const { forceStop } = lock.value
        if (forceStop)
          forceStop()
        releaseLock()
      }
    }, lockTimeout)
  }

  /**
   * Release the lock
   */
  function releaseLock() {
    clearLockTimeout()
    lock.value = null
    phase.value = DragState.IDLE
  }

  /**
   * Update the lock phase
   */
  function updatePhase(newPhase: DragState) {
    if (!lock.value)
      return false

    // Check if the phase transition is valid
    const isValidTransition = isValidPhaseTransition(phase.value, newPhase)
    if (!isValidTransition)
      return false

    phase.value = newPhase

    // If entering COMPLETED state, automatically release the lock
    if (newPhase === DragState.COMPLETED) {
      releaseLock()
    }

    return true
  }

  /**
   * Check if a phase transition is valid
   */
  function isValidPhaseTransition(from: DragState, to: DragState): boolean {
    switch (from) {
      case DragState.IDLE:
        return to === DragState.PRE_DRAG
      case DragState.PRE_DRAG:
        return to === DragState.DRAGGING || to === DragState.COMPLETED || to === DragState.IDLE
      case DragState.DRAGGING:
        return to === DragState.DROPPING || to === DragState.COMPLETED
      case DragState.DROPPING:
        return to === DragState.COMPLETED
      case DragState.COMPLETED:
        return to === DragState.IDLE
      default:
        return false
    }
  }

  /**
   * Try to acquire a lock
   */
  function tryGetLock(
    dragId: DragId,
    sensorId: string,
    forceStop?: () => void,
    options?: TryGetLockOptions,
  ): PreDragActions | null {
    // If a lock already exists, cannot acquire a new one
    if (lock.value !== null)
      return null

    // Create a new lock
    lock.value = {
      dragId,
      sensorId,
      phase: DragState.PRE_DRAG,
      forceStop,
      options,
    }

    // Update the phase
    phase.value = DragState.PRE_DRAG

    // Set the lock timeout
    setLockTimeout()

    // Create pre-drag actions
    const preDragActions: PreDragActions = {
      fluidLift: (_clientPosition) => {
        // Clear the lock timeout
        clearLockTimeout()

        // Update phase to dragging
        updatePhase(DragState.DRAGGING)

        // Create fluid drag actions
        const fluidActions: FluidDragActions = {
          move: (_clientPosition) => {
            // Implementation will be added in later tasks
          },
          drop: () => {
            updatePhase(DragState.DROPPING)
            updatePhase(DragState.COMPLETED)
          },
          cancel: () => {
            updatePhase(DragState.COMPLETED)
          },
          moveUp: () => {
            // Implementation will be added in later tasks
          },
          moveDown: () => {
            // Implementation will be added in later tasks
          },
          moveLeft: () => {
            // Implementation will be added in later tasks
          },
          moveRight: () => {
            // Implementation will be added in later tasks
          },
        }

        return fluidActions
      },
      snapLift: () => {
        // Clear the lock timeout
        clearLockTimeout()

        // Update phase to dragging
        updatePhase(DragState.DRAGGING)

        // Create snap drag actions
        const snapActions: SnapDragActions = {
          move: (_clientPosition) => {
            // Implementation will be added in later tasks
          },
          drop: () => {
            updatePhase(DragState.DROPPING)
            updatePhase(DragState.COMPLETED)
          },
          cancel: () => {
            updatePhase(DragState.COMPLETED)
          },
          moveUp: () => {
            // Implementation will be added in later tasks
          },
          moveDown: () => {
            // Implementation will be added in later tasks
          },
          moveLeft: () => {
            // Implementation will be added in later tasks
          },
          moveRight: () => {
            // Implementation will be added in later tasks
          },
        }

        return snapActions
      },
      abort: () => {
        // If the lock still exists and belongs to the current sensor, release it
        if (lock.value && lock.value.sensorId === sensorId) {
          releaseLock()
        }
      },
    }

    return preDragActions
  }

  /**
   * Try to abandon the lock
   * Can only abandon if the current sensor owns the lock
   */
  function _tryAbandon(sensorId: string): boolean {
    if (lock.value && lock.value.sensorId === sensorId) {
      releaseLock()
      return true
    }
    return false
  }

  /**
   * Check if a lock can be acquired
   */
  function canGetLock(_dragId: DragId): boolean {
    return lock.value === null
  }

  /**
   * Check if a lock is currently claimed
   */
  function isLockClaimed(): boolean {
    return lock.value !== null
  }

  /**
   * Get the current lock
   */
  function getLock(): DragLock | null {
    return lock.value
  }

  /**
   * Get the current lock phase
   */
  function getPhase(): DragState {
    return phase.value
  }

  // Cleanup function
  tryOnUnmounted(() => {
    clearLockTimeout()
    if (lock.value) {
      const { forceStop } = lock.value
      if (forceStop)
        forceStop()
      releaseLock()
    }
  })

  // Export the lock API
  const api: DragLockAPI = {
    tryGetLock,
    canGetLock,
    isLockClaimed,
    getLock,
    getPhase,
  }

  return api
}
