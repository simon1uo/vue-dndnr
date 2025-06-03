import type { FluidDragActions, PreDragActions, SensorAPI, TouchSensor } from '@/types'
import { useTouchSensor } from '@/sensors'
import { useEventListener } from '@vueuse/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

// Mock VueUse module
vi.mock('@vueuse/core', () => ({
  defaultWindow: vi.fn(),
  useEventListener: vi.fn(),
  tryOnBeforeUnmount: vi.fn(fn => fn()),
}))

describe('useTouchSensor', () => {
  let api: SensorAPI
  let mockFluidActions: FluidDragActions
  let mockPreDragActions: PreDragActions

  beforeEach(() => {
    // Enable timer mocks
    vi.useFakeTimers()

    mockFluidActions = {
      move: vi.fn(),
      drop: vi.fn(),
      cancel: vi.fn(),
      moveUp: vi.fn(),
      moveDown: vi.fn(),
      moveLeft: vi.fn(),
      moveRight: vi.fn(),
    }

    mockPreDragActions = {
      fluidLift: vi.fn().mockReturnValue(mockFluidActions),
      snapLift: vi.fn(),
      abort: vi.fn(),
    }

    api = {
      tryGetLock: vi.fn().mockReturnValue(mockPreDragActions),
      canGetLock: vi.fn().mockReturnValue(true),
      findClosestDraggableId: vi.fn().mockReturnValue('test-id'),
      findOptionsForDraggable: vi.fn(),
      isLockClaimed: vi.fn().mockReturnValue(false),
    } as unknown as SensorAPI
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const sensor = useTouchSensor(api)
      expect(sensor).toBeDefined()
      expect(sensor.activate).toBeInstanceOf(Function)
      expect(sensor.deactivate).toBeInstanceOf(Function)
      expect(sensor.state.value).toBe('IDLE')
    })

    it('should initialize with custom options', () => {
      const sensor = useTouchSensor(api, {
        isEnabled: false,
        longPressDelay: 200,
      })
      expect(sensor).toBeDefined()
      expect(sensor.state.value).toBe('IDLE')
    })
  })

  describe('state Management', () => {
    it('should transition from IDLE to PENDING on touchstart', async () => {
      const { state } = useTouchSensor(api)

      // Get touchstart handler
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      if (touchstartHandler) {
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()
        expect(state.value).toBe('PENDING')
      }
    })

    it('should transition from PENDING to DRAGGING after long press', async () => {
      const { state } = useTouchSensor(api) as TouchSensor

      // Get touchstart handler
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      if (touchstartHandler) {
        // Start touch
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()

        // Wait for long press
        vi.advanceTimersByTime(120)
        await nextTick()

        expect(state.value).toBe('DRAGGING')
        expect(mockPreDragActions.fluidLift).toHaveBeenCalledWith({ x: 0, y: 0 })
      }
    })

    it('should return to IDLE on touchend', async () => {
      const { state } = useTouchSensor(api) as TouchSensor

      // Get handlers
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      const touchendHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchend',
      )?.[2]

      if (touchstartHandler && touchendHandler) {
        // Start touch
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()

        // End touch
        const touchEnd = new TouchEvent('touchend', { touches: [] })
        touchendHandler(touchEnd)
        await nextTick()

        expect(state.value).toBe('IDLE')
      }
    })
  })

  describe('event Handling', () => {
    it('should handle touchmove events during drag', async () => {
      // Reset mock to ensure we start fresh
      (mockFluidActions.move as ReturnType<typeof vi.fn>).mockClear()

      const sensor = useTouchSensor(api) as TouchSensor

      // Get handlers
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      const touchmoveHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchmove',
      )?.[2]

      if (touchstartHandler && touchmoveHandler) {
        // Start touch and wait for long press
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()

        // Verify we're in pending state
        expect(sensor.state.value).toBe('PENDING')

        vi.advanceTimersByTime(120)
        await nextTick()

        // Verify we're in dragging state before moving
        expect(sensor.state.value).toBe('DRAGGING')
        expect(mockPreDragActions.fluidLift).toHaveBeenCalled()

        // Create a mock for move to ensure it's called
        const moveMock = vi.fn()
        mockFluidActions.move = moveMock

        // Multiple moves
        const positions = [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
          { x: 30, y: 30 },
        ]

        for (const pos of positions) {
          const touchMove = new TouchEvent('touchmove', {
            touches: [new Touch({
              identifier: 1,
              target: document.body,
              clientX: pos.x,
              clientY: pos.y,
            })],
          })
          touchmoveHandler(touchMove)
          await nextTick()
        }

        // Verify total number of calls
        expect(moveMock).toHaveBeenCalledTimes(positions.length)
      }
    })

    it('should handle touchcancel events', async () => {
      const { state } = useTouchSensor(api) as TouchSensor

      // Get handlers
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      const touchcancelHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchcancel',
      )?.[2]

      if (touchstartHandler && touchcancelHandler) {
        // Start touch
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()

        // Cancel touch
        const touchCancel = new TouchEvent('touchcancel')
        touchcancelHandler(touchCancel)
        await nextTick()

        expect(state.value).toBe('IDLE')
        expect(mockPreDragActions.abort).toHaveBeenCalled()
      }
    })
  })

  describe('lifecycle Management', () => {
    it('should activate and deactivate properly', () => {
      const sensor = useTouchSensor(api) as TouchSensor

      sensor.activate()
      expect(sensor.state.value).toBe('IDLE')

      sensor.deactivate()
      expect(sensor.state.value).toBe('IDLE')
      expect(mockPreDragActions.abort).not.toHaveBeenCalled()
    })
  })

  describe('error Handling', () => {
    it('should handle lock acquisition failure', async () => {
      (api.canGetLock as ReturnType<typeof vi.fn>).mockReturnValue(false)
      const { state } = useTouchSensor(api) as TouchSensor

      // Get touchstart handler
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      if (touchstartHandler) {
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()

        expect(state.value).toBe('IDLE')
        expect(mockPreDragActions.fluidLift).not.toHaveBeenCalled()
      }
    })

    it('should handle missing draggable id', async () => {
      (api.findClosestDraggableId as ReturnType<typeof vi.fn>).mockReturnValue(null)
      const { state } = useTouchSensor(api) as TouchSensor

      // Get touchstart handler
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      if (touchstartHandler) {
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()

        expect(state.value).toBe('IDLE')
        expect(mockPreDragActions.fluidLift).not.toHaveBeenCalled()
      }
    })
  })

  describe('configuration Options', () => {
    it('should respect longPressDelay option', async () => {
      const customDelay = 200
      const { state } = useTouchSensor(api, { longPressDelay: customDelay }) as TouchSensor

      // Get touchstart handler
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      if (touchstartHandler) {
        // Start touch
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()

        // Advance less than custom delay
        vi.advanceTimersByTime(customDelay - 50)
        await nextTick()
        expect(state.value).toBe('PENDING')

        // Advance to custom delay
        vi.advanceTimersByTime(50)
        await nextTick()
        expect(state.value).toBe('DRAGGING')
      }
    })

    it('should respect isEnabled option', async () => {
      const { state } = useTouchSensor(api, { isEnabled: false }) as TouchSensor

      // Get touchstart handler
      const touchstartHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'touchstart',
      )?.[2]

      if (touchstartHandler) {
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 1,
            target: document.body,
            clientX: 0,
            clientY: 0,
          })],
        })
        touchstartHandler(touchStart)
        await nextTick()

        expect(state.value).toBe('IDLE')
        expect(mockPreDragActions.fluidLift).not.toHaveBeenCalled()
      }
    })
  })
})
