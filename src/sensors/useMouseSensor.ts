import type {
  DraggingState,
  MouseSensorOptions,
  PendingState,
  Position,
  SensorAPI,
  SensorStateType,
} from '@/types'
import { defaultWindow, tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'

/**
 * Hook for handling mouse drag events
 *
 * @param api - Sensor API for interacting with the drag system
 * @param options - Mouse sensor configuration options
 * @returns Mouse sensor instance
 */
export function useMouseSensor(api: SensorAPI, options: MouseSensorOptions = {}) {
  const {
    dragTolerance = 5,
    captureWindow = true,
    isEnabled = true,
  } = options

  const state = ref<SensorStateType>('IDLE')
  const pending = shallowRef<PendingState | null>(null)
  const active = shallowRef<DraggingState | null>(null)

  const isWindowCaptured = ref(false)
  const windowTarget = computed(() => isWindowCaptured.value ? defaultWindow : null)

  function reset() {
    if (pending.value?.actions) {
      pending.value.actions.abort()
    }

    if (active.value?.actions) {
      active.value.actions.cancel()
    }

    state.value = 'IDLE'
    pending.value = null
    active.value = null
    isWindowCaptured.value = false
  }

  /**
   * Handle mouse down event - start potential drag operation
   */
  function onMouseDown(event: MouseEvent) {
    // Ignore if sensor is disabled
    if (!isEnabled) {
      return
    }

    // Only handle primary button (left click)
    if (event.button !== 0) {
      return
    }

    // Skip if any modifier keys are pressed
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return
    }

    // Find the draggable element ID from the event
    const dragId = api.findClosestDraggableId(event)

    // Skip if no draggable found or cannot get lock
    if (!dragId || !api.canGetLock(dragId)) {
      return
    }

    // Try to get drag lock
    const actions = api.tryGetLock(
      dragId,
      () => {
        // Force stop callback (cleanup if lock is forcibly released)
        reset()
      },
      {
        sourceEvent: event,
        // Use event.currentTarget as EventTarget (which might be null but is handled by the API)
        captureEvent: captureWindow ? window : event.currentTarget as EventTarget,
      },
    )

    // Skip if lock couldn't be acquired
    if (!actions) {
      return
    }

    // Update state to pending
    state.value = 'PENDING'
    pending.value = {
      dragId,
      point: { x: event.clientX, y: event.clientY },
      actions,
    }

    // Mark window as captured (events will be bound by useEventListener)
    isWindowCaptured.value = true

    // Prevent default browser drag behavior
    event.preventDefault()
  }

  /**
   * Handle mouse move event - track movement and start drag if threshold exceeded
   */
  function onMouseMove(event: MouseEvent) {
    if (state.value === 'IDLE') {
      return
    }

    const currentPosition: Position = { x: event.clientX, y: event.clientY }

    if (state.value === 'PENDING' && pending.value) {
      const { point, actions } = pending.value

      // Calculate distance moved
      const deltaX = currentPosition.x - point.x
      const deltaY = currentPosition.y - point.y
      const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // If moved beyond threshold, start dragging
      if (distanceMoved >= dragTolerance && actions) {
        // Start fluid drag
        const dragActions = actions.fluidLift(currentPosition)

        // Update state to dragging
        state.value = 'DRAGGING'
        active.value = {
          dragId: pending.value.dragId!,
          actions: dragActions,
        }
        pending.value = null
      }
    }
    else if (state.value === 'DRAGGING' && active.value?.actions) {
      // Update drag position
      active.value.actions.move(currentPosition)
    }

    // Prevent default browser behavior
    event.preventDefault()
  }

  /**
   * Handle mouse up event - complete or cancel drag operation
   */
  function onMouseUp(event: MouseEvent) {
    if (state.value === 'IDLE') {
      return
    }

    if (state.value === 'PENDING' && pending.value) {
      // Abort pending drag (not moved enough to start drag)
      pending.value.actions?.abort()
      reset()
    }
    else if (state.value === 'DRAGGING' && active.value?.actions) {
      // Complete drag operation
      active.value.actions.drop()
      reset()
    }

    event.preventDefault()
  }

  /**
   * Handle mouse leave event - continue tracking
   */
  function onMouseLeave(event: MouseEvent) {
    // For most cases, we continue tracking with window events
    // This is just a precaution
    event.preventDefault()
  }

  /**
   * Handle context menu event - cancel drag
   */
  function onContextMenu(event: MouseEvent) {
    if (state.value !== 'IDLE') {
      reset()
      event.preventDefault()
    }
  }

  /**
   * Handle window blur - cancel drag if active
   */
  function onWindowBlur() {
    if (state.value !== 'IDLE') {
      reset()
    }
  }

  useEventListener(defaultWindow, 'mousedown', onMouseDown, { passive: false })
  useEventListener(windowTarget, 'mousemove', onMouseMove, { passive: false })
  useEventListener(windowTarget, 'mouseup', onMouseUp, { passive: false })
  useEventListener(windowTarget, 'mouseleave', onMouseLeave, { passive: false })
  useEventListener(windowTarget, 'contextmenu', onContextMenu, { passive: false })
  useEventListener(windowTarget, 'blur', onWindowBlur)

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
