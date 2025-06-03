import { describe, expect, it, vi } from 'vitest'
import { useDragActions } from '../useDragActions'

describe('useDragActions', () => {
  it('should create with default options', () => {
    const { position, createPreDragActions } = useDragActions('test-drag-id')
    expect(position.value).toEqual({ x: 0, y: 0 })
    expect(createPreDragActions).toBeDefined()
  })

  it('should handle fluid lift', () => {
    const onDragStart = vi.fn()
    const { createPreDragActions } = useDragActions('test-drag-id', {
      onDragStart,
    })

    const preDragActions = createPreDragActions()
    const fluidActions = preDragActions.fluidLift({ x: 100, y: 100 })

    expect(onDragStart).toHaveBeenCalledWith({ x: 100, y: 100 })
    expect(fluidActions).toBeDefined()
    expect(fluidActions.move).toBeDefined()
    expect(fluidActions.drop).toBeDefined()
    expect(fluidActions.cancel).toBeDefined()
    expect(fluidActions.moveUp).toBeDefined()
    expect(fluidActions.moveDown).toBeDefined()
    expect(fluidActions.moveLeft).toBeDefined()
    expect(fluidActions.moveRight).toBeDefined()
  })

  it('should handle snap lift', () => {
    const onDragStart = vi.fn()
    const { createPreDragActions } = useDragActions('test-drag-id', {
      initialPosition: { x: 50, y: 50 },
      onDragStart,
    })

    const preDragActions = createPreDragActions()
    const snapActions = preDragActions.snapLift()

    expect(onDragStart).toHaveBeenCalledWith({ x: 50, y: 50 })
    expect(snapActions).toBeDefined()
    expect(snapActions.move).toBeDefined()
    expect(snapActions.drop).toBeDefined()
    expect(snapActions.cancel).toBeDefined()
    expect(snapActions.moveUp).toBeDefined()
    expect(snapActions.moveDown).toBeDefined()
    expect(snapActions.moveLeft).toBeDefined()
    expect(snapActions.moveRight).toBeDefined()
  })

  it('should handle move with constraints', () => {
    const onDrag = vi.fn()
    const { createPreDragActions } = useDragActions('test-drag-id', {
      grid: { x: 10, y: 10 },
      axis: 'x',
      scale: 2,
      onDrag,
    })

    const preDragActions = createPreDragActions()
    const fluidActions = preDragActions.fluidLift({ x: 100, y: 100 })
    fluidActions.move({ x: 25, y: 25 })

    expect(onDrag).toHaveBeenCalledWith({ x: 20, y: 0 })
  })

  it('should handle drop', () => {
    const onDragEnd = vi.fn()
    const { createPreDragActions } = useDragActions('test-drag-id', {
      onDragEnd,
    })

    const preDragActions = createPreDragActions()
    const fluidActions = preDragActions.fluidLift({ x: 100, y: 100 })
    fluidActions.drop()

    expect(onDragEnd).toHaveBeenCalledWith({ x: 100, y: 100 })
  })

  it('should handle cancel', () => {
    const onDragEnd = vi.fn()
    const { position, createPreDragActions } = useDragActions('test-drag-id', {
      initialPosition: { x: 50, y: 50 },
      onDragEnd,
    })

    const preDragActions = createPreDragActions()
    const fluidActions = preDragActions.fluidLift({ x: 100, y: 100 })
    fluidActions.cancel()

    expect(position.value).toEqual({ x: 50, y: 50 })
    expect(onDragEnd).toHaveBeenCalledWith({ x: 50, y: 50 })
  })

  it('should handle keyboard movement', () => {
    const onDrag = vi.fn()
    const { createPreDragActions } = useDragActions('test-drag-id', {
      onDrag,
    })

    const preDragActions = createPreDragActions()
    const fluidActions = preDragActions.fluidLift({ x: 100, y: 100 })

    fluidActions.moveUp()
    expect(onDrag).toHaveBeenCalledWith({ x: 100, y: 99 })

    fluidActions.moveDown()
    expect(onDrag).toHaveBeenCalledWith({ x: 100, y: 100 })

    fluidActions.moveLeft()
    expect(onDrag).toHaveBeenCalledWith({ x: 99, y: 100 })

    fluidActions.moveRight()
    expect(onDrag).toHaveBeenCalledWith({ x: 100, y: 100 })
  })
})
