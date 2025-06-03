import type { DragId, Position } from '@/types'
import type { FluidDragActions, PreDragActions, SnapDragActions } from '@/types/sensors'
import { tryOnUnmounted } from '@vueuse/core'
import { shallowRef } from 'vue'

export interface DragActionsOptions {
  /** Initial position of the dragged element */
  initialPosition?: Position
  /** Grid size for snapping */
  grid?: { x: number, y: number }
  /** Axis constraints (x, y, or both) */
  axis?: 'x' | 'y' | 'both'
  /** Scale factor for movement */
  scale?: number
  /** Callback when drag starts */
  onDragStart?: (position: Position) => void
  /** Callback during drag */
  onDrag?: (position: Position) => void
  /** Callback when drag ends */
  onDragEnd?: (position: Position) => void
}

/**
 * Hook to manage drag actions
 * @param dragId - ID of the draggable element
 * @param options - Configuration options
 */
export function useDragActions(dragId: DragId, options: DragActionsOptions = {}) {
  const {
    initialPosition = { x: 0, y: 0 },
    grid,
    axis = 'both',
    scale = 1,
    onDragStart,
    onDrag,
    onDragEnd,
  } = options

  // Current position state
  const position = shallowRef<Position>(initialPosition)

  /**
   * Applies constraints to a position
   */
  function applyConstraints(pos: Position): Position {
    let { x, y } = pos

    if (axis === 'x')
      y = initialPosition.y
    if (axis === 'y')
      x = initialPosition.x

    if (scale !== 1) {
      x = x / scale
      y = y / scale
    }

    if (grid) {
      x = Math.round(x / grid.x) * grid.x
      y = Math.round(y / grid.y) * grid.y
    }

    if (scale !== 1) {
      x = x * scale
      y = y * scale
    }

    return { x, y }
  }

  /**
   * Creates pre-drag actions
   */
  function createPreDragActions(): PreDragActions {
    return {
      fluidLift: (clientPosition: Position) => {
        position.value = clientPosition
        onDragStart?.(clientPosition)
        return createFluidDragActions()
      },
      snapLift: () => {
        onDragStart?.(position.value)
        return createSnapDragActions()
      },
      abort: () => {
        position.value = initialPosition
      },
    }
  }

  /**
   * Creates fluid drag actions
   */
  function createFluidDragActions(): FluidDragActions {
    return {
      move: (clientPosition: Position) => {
        const newPosition = applyConstraints(clientPosition)
        position.value = newPosition
        onDrag?.(newPosition)
      },
      drop: () => {
        onDragEnd?.(position.value)
      },
      cancel: () => {
        position.value = initialPosition
        onDragEnd?.(initialPosition)
      },
      moveUp: () => moveByDelta({ x: 0, y: -1 }),
      moveDown: () => moveByDelta({ x: 0, y: 1 }),
      moveLeft: () => moveByDelta({ x: -1, y: 0 }),
      moveRight: () => moveByDelta({ x: 1, y: 0 }),
    }
  }

  /**
   * Creates snap drag actions
   */
  function createSnapDragActions(): SnapDragActions {
    return {
      move: (clientPosition: Position) => {
        const newPosition = applyConstraints(clientPosition)
        position.value = newPosition
        onDrag?.(newPosition)
      },
      drop: () => {
        onDragEnd?.(position.value)
      },
      cancel: () => {
        position.value = initialPosition
        onDragEnd?.(initialPosition)
      },
      moveUp: () => moveByDelta({ x: 0, y: -1 }),
      moveDown: () => moveByDelta({ x: 0, y: 1 }),
      moveLeft: () => moveByDelta({ x: -1, y: 0 }),
      moveRight: () => moveByDelta({ x: 1, y: 0 }),
    }
  }

  /**
   * Moves by a delta amount
   */
  function moveByDelta(delta: Position) {
    const current = position.value
    const newPosition = applyConstraints({
      x: current.x + delta.x,
      y: current.y + delta.y,
    })
    position.value = newPosition
    onDrag?.(newPosition)
  }

  // Cleanup on unmount
  tryOnUnmounted(() => {
    position.value = initialPosition
  })

  return {
    position,
    createPreDragActions,
  }
}
