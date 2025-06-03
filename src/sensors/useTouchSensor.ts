import type {
  DraggingState,
  PendingState,
  SensorAPI,
  SensorStateType,
  TouchSensorOptions,
} from '@/types'
import { defaultWindow, tryOnBeforeUnmount, useEventListener } from '@vueuse/core'
import { reactive, ref, shallowRef } from 'vue'

/**
 * Hook for handling touch-based drag and drop interactions
 * @param api - Sensor API for drag and drop operations
 * @param options - Configuration options
 */
export function useTouchSensor(api: SensorAPI, options: TouchSensorOptions = {}) {
  const {
    longPressDelay = 120,
    dragTolerance = 5,
    isEnabled = true,
  } = options

  const state = ref<SensorStateType>('IDLE')
  const longPressTimer = shallowRef<number | null>(null)
  const pendingState = reactive<PendingState & { touchId: number | null }>({
    point: { x: 0, y: 0 },
    touchId: null,
    dragId: null,
    actions: null,
  })

  const draggingState = reactive<DraggingState & { touchId: number | null }>({
    dragId: undefined,
    actions: null,
    touchId: null,
  })

  function reset() {
    if (state.value === 'PENDING') {
      pendingState.actions?.abort()
      cleanupPendingState()
    }
    else if (state.value === 'DRAGGING') {
      draggingState.actions?.cancel()
      cleanupDraggingState()
    }
    state.value = 'IDLE'
  }

  function cleanupPendingState() {
    pendingState.point = { x: 0, y: 0 }
    pendingState.touchId = null
    pendingState.dragId = null
    pendingState.actions = null

    if (longPressTimer.value) {
      window.clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
  }

  /**
   * Cleans up the dragging state
   */
  function cleanupDraggingState() {
    draggingState.actions = null
    draggingState.touchId = null
  }

  /**
   * Handles the touchstart event
   */
  function onTouchStart(event: TouchEvent) {
    // Ignore if sensor is disabled
    if (!isEnabled) {
      return
    }

    // Only handle single touch
    if (event.touches.length !== 1)
      return

    const touch = event.touches[0]
    const dragId = api.findClosestDraggableId(event)

    if (!dragId || !api.canGetLock(dragId))
      return

    // Try to get lock
    const actions = api.tryGetLock(dragId, () => {
      reset()
    }, { sourceEvent: event })

    if (!actions)
      return

    // Enter pending state
    state.value = 'PENDING'
    pendingState.point = { x: touch.clientX, y: touch.clientY }
    pendingState.touchId = touch.identifier
    pendingState.dragId = dragId
    pendingState.actions = actions

    // Start long press timer
    longPressTimer.value = window.setTimeout(() => {
      if (state.value === 'PENDING') {
        const fluidActions = actions.fluidLift(pendingState.point)
        state.value = 'DRAGGING'
        draggingState.actions = fluidActions
        draggingState.dragId = dragId
        draggingState.touchId = pendingState.touchId
        cleanupPendingState()
      }
    }, longPressDelay)

    // Prevent scrolling
    event.preventDefault()
  }

  /**
   * Handles the touchmove event
   */
  function onTouchMove(event: TouchEvent) {
    if (state.value === 'IDLE')
      return

    // Find the relevant touch
    let relevantTouchId = null

    if (state.value === 'PENDING') {
      relevantTouchId = pendingState.touchId
    }
    else if (state.value === 'DRAGGING') {
      relevantTouchId = draggingState.touchId
    }

    if (relevantTouchId === null)
      return

    const touch = Array.from(event.touches).find(
      t => t.identifier === relevantTouchId,
    )

    if (!touch)
      return

    if (state.value === 'PENDING') {
      const { clientX, clientY } = touch
      const { point } = pendingState

      // Check if touch has moved beyond threshold
      const distance = Math.sqrt(
        (clientX - point.x) ** 2 + (clientY - point.y) ** 2,
      )

      if (distance > dragTolerance) {
        // Cancel drag if moved too far during long press
        pendingState.actions?.abort()
        cleanupPendingState()
        state.value = 'IDLE'
      }
    }
    else if (state.value === 'DRAGGING' && draggingState.actions) {
      // Update position
      draggingState.actions.move({
        x: touch.clientX,
        y: touch.clientY,
      })
    }

    // Prevent scrolling
    event.preventDefault()
  }

  /**
   * Handles the touchend and touchcancel events
   */
  function onTouchEnd(_event: TouchEvent) {
    if (state.value === 'PENDING') {
      pendingState.actions?.abort()
      cleanupPendingState()
    }
    else if (state.value === 'DRAGGING') {
      draggingState.actions?.drop()
      cleanupDraggingState()
    }

    state.value = 'IDLE'
  }

  useEventListener(defaultWindow, 'touchstart', onTouchStart, { passive: false })
  useEventListener(defaultWindow, 'touchmove', onTouchMove, { passive: false })
  useEventListener(defaultWindow, 'touchend', onTouchEnd)
  useEventListener(defaultWindow, 'touchcancel', onTouchEnd)

  // Cleanup
  tryOnBeforeUnmount(() => {
    reset()
  })

  return {
    state,
    activate: () => {
    },
    deactivate: () => {
      reset()
    },
  }
}
