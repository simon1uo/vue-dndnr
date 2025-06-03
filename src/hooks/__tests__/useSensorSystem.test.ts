import type { BaseSensor, SensorAPI, SensorStateType } from '@/types'
import { DragState } from '@/types/core'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { useSensorSystem } from '../useSensorSystem'

function createMockSensor(_api: SensorAPI): BaseSensor {
  const state = ref<SensorStateType>('IDLE')
  const activate = vi.fn()
  const deactivate = vi.fn()

  return {
    state,
    activate,
    deactivate,
  }
}

function createTestComponent(options = {}) {
  return defineComponent({
    setup() {
      const sensorSystem = useSensorSystem(options)
      return { sensorSystem }
    },
    template: '<div></div>',
  })
}

describe('useSensorSystem', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should initialize with default settings', () => {
    const wrapper = mount(createTestComponent())
    const system = wrapper.vm.sensorSystem

    expect(system.phase.value).toBe(DragState.IDLE)
    expect(system.activeDragId.value).toBeNull()
    expect(system.activeSensor.value).toBeNull()
    expect(system.api).toBeDefined()
    expect(system.registerSensor).toBeInstanceOf(Function)
  })

  it('should register custom sensors', () => {
    const mockSensor = vi.fn(createMockSensor)
    mount(createTestComponent({
      enableDefaultSensors: false,
      customSensors: [mockSensor],
    }))

    expect(mockSensor).toHaveBeenCalledTimes(1)
    expect(mockSensor).toHaveBeenCalledWith(expect.objectContaining({
      tryGetLock: expect.any(Function),
      canGetLock: expect.any(Function),
      isLockClaimed: expect.any(Function),
      findClosestDraggableId: expect.any(Function),
      findOptionsForDraggable: expect.any(Function),
    }))
  })

  it('should allow manual sensor registration', () => {
    const wrapper = mount(createTestComponent({
      enableDefaultSensors: false,
    }))

    const system = wrapper.vm.sensorSystem
    const mockSensor = vi.fn(createMockSensor)
    const sensor = system.registerSensor(mockSensor)

    expect(mockSensor).toHaveBeenCalledTimes(1)
    expect(sensor.activate).toHaveBeenCalledTimes(1)
  })

  it('should provide a functioning sensor API', () => {
    const wrapper = mount(createTestComponent({
      enableDefaultSensors: false,
    }))

    const system = wrapper.vm.sensorSystem

    expect(system.api.canGetLock('test-id')).toBe(true)
    expect(system.api.isLockClaimed()).toBe(false)
    expect(system.api.findClosestDraggableId({} as Event)).toBeNull()
    expect(system.api.findOptionsForDraggable('test-id')).toBeNull()
  })

  it('should handle drag lock acquisition', () => {
    const wrapper = mount(createTestComponent({
      enableDefaultSensors: false,
    }))

    const system = wrapper.vm.sensorSystem

    const actions = system.api.tryGetLock('test-drag-id')

    expect(actions).not.toBeNull()
    expect(system.activeDragId.value).toBe('test-drag-id')
    expect(system.phase.value).toBe(DragState.PRE_DRAG)
    expect(system.api.isLockClaimed()).toBe(true)
  })

  it('should enable default sensors when specified', async () => {
    vi.mock('@/sensors', () => ({
      useMouseSensor: vi.fn(() => ({
        state: ref('IDLE'),
        activate: vi.fn(),
        deactivate: vi.fn(),
      })),
      useTouchSensor: vi.fn(() => ({
        state: ref('IDLE'),
        activate: vi.fn(),
        deactivate: vi.fn(),
      })),
      useKeyboardSensor: vi.fn(() => ({
        state: ref('IDLE'),
        activate: vi.fn(),
        deactivate: vi.fn(),
      })),
    }))

    const wrapper = mount(createTestComponent({
      enableDefaultSensors: true,
    }))

    expect(wrapper.vm.sensorSystem).toBeDefined()
  })
})
