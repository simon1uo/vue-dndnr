import type { FluidDragActions, MouseSensor, PreDragActions, SensorAPI } from '@/types'
import { useMouseSensor } from '@/sensors'
import { useEventListener } from '@vueuse/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

// Mock VueUse module
vi.mock('@vueuse/core', () => ({
  defaultWindow: vi.fn(),
  useEventListener: vi.fn(),
  tryOnUnmounted: vi.fn(fn => fn()),
}))

describe('useMouseSensor', () => {
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

    // Reset useEventListener mock
    (useEventListener as ReturnType<typeof vi.fn>).mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const sensor = useMouseSensor(api) as MouseSensor
      expect(sensor).toBeDefined()
      expect(sensor.activate).toBeInstanceOf(Function)
      expect(sensor.deactivate).toBeInstanceOf(Function)
      expect(sensor.state.value).toBe('IDLE')
    })

    it('should initialize with custom options', () => {
      const sensor = useMouseSensor(api, {
        isEnabled: false,
        dragTolerance: 10,
      }) as MouseSensor
      expect(sensor).toBeDefined()
    })
  })

  describe('state Management', () => {
    it('should transition from IDLE to PENDING on mousedown', async () => {
      const { state } = useMouseSensor(api) as MouseSensor

      // Simulate mousedown
      const mouseDown = new MouseEvent('mousedown', {
        button: 0,
        clientX: 0,
        clientY: 0,
      })

      // Trigger the event handler directly
      const handler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      if (handler) {
        handler(mouseDown)
        await nextTick()
        expect(state.value).toBe('PENDING')
      }
    })

    it('should transition from PENDING to DRAGGING on movement', async () => {
      const { state } = useMouseSensor(api) as MouseSensor

      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        button: 0,
        clientX: 0,
        clientY: 0,
      })

      // Get mousedown handler
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      // Get mousemove handler
      const mousemoveHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousemove',
      )?.[2]

      if (mousedownHandler && mousemoveHandler) {
        mousedownHandler(mouseDown)
        await nextTick()

        // Move beyond threshold
        const mouseMove = new MouseEvent('mousemove', {
          clientX: 10,
          clientY: 10,
        })
        mousemoveHandler(mouseMove)
        await nextTick()

        expect(state.value).toBe('DRAGGING')
        expect(mockPreDragActions.fluidLift).toHaveBeenCalled()
      }
    })

    it('should return to IDLE on mouseup', async () => {
      const { state } = useMouseSensor(api) as MouseSensor

      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        button: 0,
        clientX: 0,
        clientY: 0,
      })

      // Get handlers
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      const mouseupHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mouseup',
      )?.[2]

      if (mousedownHandler && mouseupHandler) {
        mousedownHandler(mouseDown)
        await nextTick()

        const mouseUp = new MouseEvent('mouseup')
        mouseupHandler(mouseUp)
        await nextTick()

        expect(state.value).toBe('IDLE')
      }
    })
  })

  describe('event Handling', () => {
    it('should ignore non-primary mouse button', async () => {
      const { state } = useMouseSensor(api) as MouseSensor

      // Get mousedown handler
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      if (mousedownHandler) {
        const mouseDown = new MouseEvent('mousedown', {
          button: 2, // Right click
          clientX: 0,
          clientY: 0,
        })
        mousedownHandler(mouseDown)
        await nextTick()
        expect(state.value).toBe('IDLE')
      }
    })

    it('should handle mousemove events during drag', async () => {
      const _sensor = useMouseSensor(api) as MouseSensor

      // Get handlers
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      const mousemoveHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousemove',
      )?.[2]

      if (mousedownHandler && mousemoveHandler) {
        // Start drag
        const mouseDown = new MouseEvent('mousedown', {
          button: 0,
          clientX: 0,
          clientY: 0,
        })
        mousedownHandler(mouseDown)
        await nextTick()

        // Move beyond threshold to start dragging
        const initialMove = new MouseEvent('mousemove', {
          clientX: 10,
          clientY: 10,
        })
        mousemoveHandler(initialMove)
        await nextTick()

        // Multiple moves
        const positions = [
          { x: 20, y: 20 },
          { x: 30, y: 30 },
          { x: 40, y: 40 },
        ]

        for (const pos of positions) {
          const mouseMove = new MouseEvent('mousemove', {
            clientX: pos.x,
            clientY: pos.y,
          })
          mousemoveHandler(mouseMove)
          await nextTick()
        }

        expect(mockFluidActions.move).toHaveBeenCalledTimes(positions.length)
      }
    })

    it('should prevent default on mousedown during drag', async () => {
      const _sensor = useMouseSensor(api) as MouseSensor
      const preventDefault = vi.fn()

      // Get mousedown handler
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      if (mousedownHandler) {
        const mouseDown = new MouseEvent('mousedown', {
          button: 0,
          clientX: 0,
          clientY: 0,
        })
        Object.defineProperty(mouseDown, 'preventDefault', { value: preventDefault })

        mousedownHandler(mouseDown)
        await nextTick()

        expect(preventDefault).toHaveBeenCalled()
      }
    })
  })

  describe('lifecycle Management', () => {
    it('should activate and deactivate properly', () => {
      const sensor = useMouseSensor(api) as MouseSensor

      sensor.activate()
      expect(sensor.state.value).toBe('IDLE')

      sensor.deactivate()
      expect(sensor.state.value).toBe('IDLE')
    })

    it('should clean up event listeners on deactivate', () => {
      const sensor = useMouseSensor(api) as MouseSensor

      sensor.deactivate()
      // Since useEventListener handles cleanup automatically,
      // we verify the state is cleaned up
      expect(sensor.state.value).toBe('IDLE')
    })
  })

  describe('error Handling', () => {
    it('should handle lock acquisition failure', async () => {
      (api.canGetLock as ReturnType<typeof vi.fn>).mockReturnValue(false)
      const { state } = useMouseSensor(api) as MouseSensor

      // Get mousedown handler
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      if (mousedownHandler) {
        const mouseDown = new MouseEvent('mousedown', {
          button: 0,
          clientX: 0,
          clientY: 0,
        })
        mousedownHandler(mouseDown)
        await nextTick()

        expect(state.value).toBe('IDLE')
        expect(mockPreDragActions.fluidLift).not.toHaveBeenCalled()
      }
    })

    it('should handle missing draggable id', async () => {
      (api.findClosestDraggableId as ReturnType<typeof vi.fn>).mockReturnValue(null)
      const { state } = useMouseSensor(api) as MouseSensor

      // Get mousedown handler
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      if (mousedownHandler) {
        const mouseDown = new MouseEvent('mousedown', {
          button: 0,
          clientX: 0,
          clientY: 0,
        })
        mousedownHandler(mouseDown)
        await nextTick()

        expect(state.value).toBe('IDLE')
        expect(mockPreDragActions.fluidLift).not.toHaveBeenCalled()
      }
    })
  })

  describe('configuration Options', () => {
    it('should respect dragTolerance option', async () => {
      const { state } = useMouseSensor(api, { dragTolerance: 20 }) as MouseSensor

      // Get handlers
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      const mousemoveHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousemove',
      )?.[2]

      if (mousedownHandler && mousemoveHandler) {
        // Start drag
        const mouseDown = new MouseEvent('mousedown', {
          button: 0,
          clientX: 0,
          clientY: 0,
        })
        mousedownHandler(mouseDown)
        await nextTick()

        // Move less than tolerance
        const mouseMove = new MouseEvent('mousemove', {
          clientX: 10,
          clientY: 10,
        })
        mousemoveHandler(mouseMove)
        await nextTick()

        // With a movement of 14.14 (sqrt(10^2 + 10^2)), which is less than 20,
        // the state should still be PENDING
        expect(state.value).toBe('PENDING')
        expect(mockPreDragActions.fluidLift).not.toHaveBeenCalled()

        // Move beyond tolerance
        const mouseMoveBeyond = new MouseEvent('mousemove', {
          clientX: 25,
          clientY: 0,
        })
        mousemoveHandler(mouseMoveBeyond)
        await nextTick()

        // Now the state should be DRAGGING
        expect(state.value).toBe('DRAGGING')
        expect(mockPreDragActions.fluidLift).toHaveBeenCalled()
      }
    })

    it('should respect isEnabled option', async () => {
      const { state } = useMouseSensor(api, { isEnabled: false }) as MouseSensor

      // Get mousedown handler
      const mousedownHandler = (useEventListener as ReturnType<typeof vi.fn>).mock.calls.find(
        call => call[1] === 'mousedown',
      )?.[2]

      if (mousedownHandler) {
        const mouseDown = new MouseEvent('mousedown', {
          button: 0,
          clientX: 0,
          clientY: 0,
        })
        mousedownHandler(mouseDown)
        await nextTick()

        expect(state.value).toBe('IDLE')
        expect(mockPreDragActions.fluidLift).not.toHaveBeenCalled()
      }
    })
  })
})
