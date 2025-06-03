import type {
  DraggingState,
  KeyboardSensorOptions,
  SensorAPI,
  SensorStateType,
  SnapDragActions,
} from '@/types'
import { defaultWindow, tryOnUnmounted, useEventListener } from '@vueuse/core'
import { shallowRef } from 'vue'

/**
 * Hook for handling keyboard-based drag and drop interactions
 *
 * @param api - Sensor API for drag and drop operations
 * @param options - Configuration options
 * @returns Keyboard sensor instance
 */
export function useKeyboardSensor(api: SensorAPI, options: KeyboardSensorOptions = {}) {
  const {
    moveStep = 15,
    isEnabled = true,
  } = options

  const state = shallowRef<SensorStateType>('IDLE')
  const active = shallowRef<DraggingState | null>(null)

  function reset() {
    if (active.value?.actions) {
      active.value.actions.cancel()
    }

    state.value = 'IDLE'
    active.value = null
  }

  /**
   * Handles key down events
   */
  function onKeyDown(event: KeyboardEvent) {
    // Ignore if sensor is disabled
    if (!isEnabled) {
      return
    }

    const { key } = event

    // Handle drag start with Space key
    if (key === ' ' || key === 'Spacebar') {
      if (state.value === 'IDLE') {
        const target = document.activeElement
        if (!target)
          return

        const dragId = api.findClosestDraggableId(event)
        if (!dragId || !api.canGetLock(dragId))
          return

        // Try to get lock
        const actions = api.tryGetLock(
          dragId,
          () => {
            reset()
          },
          { sourceEvent: event },
        )

        if (!actions)
          return

        // Start snap lift (immediate positioning)
        const snapActions = actions.snapLift()

        // Update state to dragging
        state.value = 'DRAGGING'
        active.value = {
          dragId,
          actions: snapActions,
        }

        // Prevent default space behavior (scrolling)
        event.preventDefault()
      }
      else if (state.value === 'DRAGGING' && active.value?.actions) {
        // Drop on second space press
        active.value.actions.drop()
        reset()
        event.preventDefault()
      }
    }
    // Handle movement with arrow keys
    else if (state.value === 'DRAGGING' && active.value?.actions) {
      const actions = active.value.actions as SnapDragActions

      switch (key) {
        case 'ArrowUp':
          actions.moveUp()
          actions.move({ x: 0, y: -moveStep })
          event.preventDefault()
          break
        case 'ArrowDown':
          actions.moveDown()
          actions.move({ x: 0, y: moveStep })
          event.preventDefault()
          break
        case 'ArrowLeft':
          actions.moveLeft()
          actions.move({ x: -moveStep, y: 0 })
          event.preventDefault()
          break
        case 'ArrowRight':
          actions.moveRight()
          actions.move({ x: moveStep, y: 0 })
          event.preventDefault()
          break
        case 'Escape':
          // Cancel drag operation
          actions.cancel()
          reset()
          event.preventDefault()
          break
      }
    }
  }

  // Event listeners
  useEventListener(defaultWindow, 'keydown', onKeyDown)

  // Cleanup on component unmount
  tryOnUnmounted(() => {
    reset()
  })

  return {
    state,
    activate: () => { },
    deactivate: () => {
      reset()
    },
  }
}
