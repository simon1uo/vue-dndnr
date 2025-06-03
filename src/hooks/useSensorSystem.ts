import type { BaseSensor, DragId, SensorAPI, SensorFactory, SensorSystemOptions, TryGetLock, TryGetLockOptions } from '@/types'
import { useKeyboardSensor, useMouseSensor, useTouchSensor } from '@/sensors'
import { getUniqueId } from '@/utils'
import { onUnmounted, ref, shallowRef } from 'vue'
import { useDragLock } from './useDragLock'

/**
 * Hook for managing the sensor system
 */
export function useSensorSystem(options: SensorSystemOptions = {}) {
  const {
    enableDefaultSensors = true,
    customSensors = [],
    lockTimeout = 5000,
  } = options

  // System state
  const activeSensor = shallowRef<BaseSensor | null>(null)
  const activeDragId = ref<DragId | null>(null)
  const dragLock = useDragLock({ lockTimeout })

  // Sensor API implementation
  const api: SensorAPI = {
    tryGetLock: ((dragId: DragId, forceStop?: () => void, options?: TryGetLockOptions) => {
      const sensorId = getUniqueId('sensor')
      const actions = dragLock.tryGetLock(dragId, sensorId, forceStop, options)

      if (actions) {
        activeDragId.value = dragId
      }

      return actions
    }) as TryGetLock,

    canGetLock: (id: DragId) => {
      return dragLock.canGetLock(id)
    },

    isLockClaimed: () => {
      return dragLock.isLockClaimed()
    },

    findClosestDraggableId: (event: Event) => {
      const _eventType = event.type
      return null
    },

    findOptionsForDraggable: (id: DragId) => {
      const _dragId = id
      return null
    },
  }

  // Sensor registration
  const sensors: BaseSensor[] = []

  function registerSensor(sensorFactory: SensorFactory) {
    const instance = sensorFactory(api)
    sensors.push(instance)
    instance.activate()
    return instance
  }

  // Register default sensors
  if (enableDefaultSensors) {
    registerSensor((api: SensorAPI) => useMouseSensor(api))
    registerSensor((api: SensorAPI) => useTouchSensor(api))
    registerSensor((api: SensorAPI) => useKeyboardSensor(api))
  }

  // Register custom sensors
  customSensors.forEach(registerSensor)

  // Cleanup
  onUnmounted(() => {
    sensors.forEach(sensor => sensor.deactivate())
    activeDragId.value = null
    activeSensor.value = null
  })

  return {
    registerSensor,
    api,
    phase: {
      get value() {
        return dragLock.getPhase()
      },
    },
    activeSensor,
    activeDragId,
  }
}
