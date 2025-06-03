import type { KeyboardSensor, PreDragActions, SensorAPI, SnapDragActions } from '@/types'
import { useKeyboardSensor } from '@/sensors'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

interface DirectionMethodMap {
  [key: string]: keyof SnapDragActions
}

describe('useKeyboardSensor', () => {
  let api: SensorAPI
  let mockSnapActions: SnapDragActions
  let mockPreDragActions: PreDragActions

  beforeEach(() => {
    mockSnapActions = {
      move: vi.fn(),
      drop: vi.fn(),
      cancel: vi.fn(),
      moveUp: vi.fn(),
      moveDown: vi.fn(),
      moveLeft: vi.fn(),
      moveRight: vi.fn(),
    }

    mockPreDragActions = {
      snapLift: vi.fn().mockReturnValue(mockSnapActions),
      fluidLift: vi.fn(),
      abort: vi.fn(),
    }

    api = {
      tryGetLock: vi.fn().mockReturnValue(mockPreDragActions),
      canGetLock: vi.fn().mockReturnValue(true),
      findClosestDraggableId: vi.fn().mockReturnValue('test-id'),
      findOptionsForDraggable: vi.fn(),
      isLockClaimed: vi.fn().mockReturnValue(false),
    } as unknown as SensorAPI

    // Mock document.activeElement
    Object.defineProperty(document, 'activeElement', {
      value: document.createElement('div'),
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const sensor = useKeyboardSensor(api) as KeyboardSensor
      expect(sensor).toBeDefined()
      expect(sensor.activate).toBeInstanceOf(Function)
      expect(sensor.deactivate).toBeInstanceOf(Function)
      expect(sensor.state.value).toBe('IDLE')
    })

    it('should initialize with custom options', () => {
      const sensor = useKeyboardSensor(api, { isEnabled: false }) as KeyboardSensor
      expect(sensor).toBeDefined()
      expect(sensor.state.value).toBe('IDLE')
    })
  })

  describe('state Management', () => {
    it('should transition from IDLE to DRAGGING on space key', async () => {
      const { state } = useKeyboardSensor(api) as KeyboardSensor
      const spaceKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(spaceKeyDown)
      await nextTick()
      expect(state.value).toBe('DRAGGING')
      expect(mockPreDragActions.snapLift).toHaveBeenCalled()
    })

    it('should return to IDLE on second space key press', async () => {
      const { state } = useKeyboardSensor(api) as KeyboardSensor

      // Start drag
      const startKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(startKeyDown)
      await nextTick()

      // End drag
      const endKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(endKeyDown)
      await nextTick()

      expect(mockSnapActions.drop).toHaveBeenCalled()
      expect(state.value).toBe('IDLE')
    })

    it('should return to IDLE on escape key', async () => {
      const { state } = useKeyboardSensor(api) as KeyboardSensor

      // Start drag
      const startKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(startKeyDown)
      await nextTick()

      // Cancel drag
      const escKeyDown = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(escKeyDown)
      await nextTick()

      expect(mockSnapActions.cancel).toHaveBeenCalled()
      expect(state.value).toBe('IDLE')
    })
  })

  describe('event Handling', () => {
    it('should handle arrow key movements', async () => {
      const { state } = useKeyboardSensor(api) as KeyboardSensor

      // Start drag
      const startKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(startKeyDown)
      await nextTick()

      // Test arrow keys
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      const expectedMethods: DirectionMethodMap = {
        ArrowUp: 'moveUp',
        ArrowDown: 'moveDown',
        ArrowLeft: 'moveLeft',
        ArrowRight: 'moveRight',
      }

      for (let i = 0; i < arrowKeys.length; i++) {
        const arrowKey = arrowKeys[i]
        const arrowKeyDown = new KeyboardEvent('keydown', { key: arrowKey })
        window.dispatchEvent(arrowKeyDown)
        await nextTick()

        expect(mockSnapActions[expectedMethods[arrowKey]]).toHaveBeenCalled()
        expect(state.value).toBe('DRAGGING')
      }
    })

    it('should prevent default on handled keys', async () => {
      const _sensor = useKeyboardSensor(api) as KeyboardSensor
      const preventDefault = vi.fn()

      // Start drag
      const spaceKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      Object.defineProperty(spaceKeyDown, 'preventDefault', { value: preventDefault })
      window.dispatchEvent(spaceKeyDown)
      await nextTick()

      expect(preventDefault).toHaveBeenCalled()
    })
  })

  describe('lifecycle Management', () => {
    it('should activate and deactivate properly', () => {
      const sensor = useKeyboardSensor(api) as KeyboardSensor

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
      const { state } = useKeyboardSensor(api) as KeyboardSensor

      const spaceKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(spaceKeyDown)
      await nextTick()

      expect(state.value).toBe('IDLE')
      expect(mockPreDragActions.snapLift).not.toHaveBeenCalled()
    })

    it('should handle missing draggable id', async () => {
      (api.findClosestDraggableId as ReturnType<typeof vi.fn>).mockReturnValue(null)
      const { state } = useKeyboardSensor(api) as KeyboardSensor

      const spaceKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(spaceKeyDown)
      await nextTick()

      expect(state.value).toBe('IDLE')
      expect(mockPreDragActions.snapLift).not.toHaveBeenCalled()
    })
  })

  describe('configuration Options', () => {
    it('should respect isEnabled option', async () => {
      const { state } = useKeyboardSensor(api, { isEnabled: false }) as KeyboardSensor

      const spaceKeyDown = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(spaceKeyDown)
      await nextTick()

      expect(state.value).toBe('IDLE')
      expect(mockPreDragActions.snapLift).not.toHaveBeenCalled()
    })
  })
})
