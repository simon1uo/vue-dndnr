import type { Direction, DragDimension, DragDropContextProps, DragRubric, DragStart, DragUpdate, DropDimension, DropResult, SensorAPI } from '../core'
import { createDragLocation, createPosition } from '@/test'
import { describe, expect, it, vi } from 'vitest'
import { DragState } from '../core'

describe('core Types', () => {
  it('should have correct DragState enum values', () => {
    expect(DragState.IDLE).toBe('IDLE')
    expect(DragState.DRAGGING).toBe('DRAGGING')
    expect(DragState.DROPPING).toBe('DROPPING')
  })

  it('should create valid DragLocation object', () => {
    const location = createDragLocation('list-1', 0)
    expect(location.dropId).toBe('list-1')
    expect(location.index).toBe(0)
  })

  it('should create valid DragRubric object', () => {
    const rubric: DragRubric = {
      dragId: 'item-1',
      source: {
        dropId: 'list-1',
        index: 0,
      },
      destination: null,
    }
    expect(rubric.dragId).toBe('item-1')
    expect(rubric.source.dropId).toBe('list-1')
    expect(rubric.destination).toBeNull()
  })

  it('should create valid Position object', () => {
    const pos = createPosition(100, 200)
    expect(pos.x).toBe(100)
    expect(pos.y).toBe(200)
  })

  it('should allow valid Direction values', () => {
    const horizontal: Direction = 'horizontal'
    const vertical: Direction = 'vertical'

    expect(horizontal).toBe('horizontal')
    expect(vertical).toBe('vertical')
  })
})

describe('dimension Types', () => {
  it('should create valid DragDimension object', () => {
    const dimension: DragDimension = {
      dragId: 'item-1',
      width: 100,
      height: 50,
      position: createPosition(0, 0),
      center: createPosition(50, 25),
    }
    expect(dimension.dragId).toBe('item-1')
    expect(dimension.width).toBe(100)
    expect(dimension.height).toBe(50)
    expect(dimension.position).toEqual({ x: 0, y: 0 })
    expect(dimension.center).toEqual({ x: 50, y: 25 })
  })

  it('should create valid DropDimension object', () => {
    const dimension: DropDimension = {
      dropId: 'list-1',
      width: 200,
      height: 400,
      position: createPosition(0, 0),
      direction: 'vertical',
      isEnabled: true,
      isScrollable: false,
    }
    expect(dimension.dropId).toBe('list-1')
    expect(dimension.width).toBe(200)
    expect(dimension.height).toBe(400)
    expect(dimension.direction).toBe('vertical')
    expect(dimension.isEnabled).toBe(true)
    expect(dimension.isScrollable).toBe(false)
  })
})

describe('event Types', () => {
  it('should create valid DragStart object', () => {
    const dragStart: DragStart = {
      dragId: 'item-1',
      source: createDragLocation('list-1', 0),
      mode: 'FLUID',
    }
    expect(dragStart.dragId).toBe('item-1')
    expect(dragStart.source).toEqual({ dropId: 'list-1', index: 0 })
    expect(dragStart.mode).toBe('FLUID')
  })

  it('should create valid DragUpdate object', () => {
    const dragUpdate: DragUpdate = {
      dragId: 'item-1',
      source: createDragLocation('list-1', 0),
      mode: 'FLUID',
      destination: createDragLocation('list-2', 1),
    }
    expect(dragUpdate.destination).toEqual({ dropId: 'list-2', index: 1 })
  })

  it('should create valid DropResult object', () => {
    const dropResult: DropResult = {
      dragId: 'item-1',
      source: createDragLocation('list-1', 0),
      mode: 'FLUID',
      destination: createDragLocation('list-2', 1),
      reason: 'DROP',
    }
    expect(dropResult.reason).toBe('DROP')
  })
})

describe('context Props', () => {
  it('should create valid DragDropContextProps object', () => {
    const onDragEnd = vi.fn()
    const props: DragDropContextProps = {
      onDragEnd,
      enableDefaultSensors: true,
      lockAxis: 'x',
      enableDropExternal: false,
    }
    expect(props.onDragEnd).toBe(onDragEnd)
    expect(props.enableDefaultSensors).toBe(true)
    expect(props.lockAxis).toBe('x')
    expect(props.enableDropExternal).toBe(false)
  })
})

describe('sensor API', () => {
  it('should create valid SensorAPI object', () => {
    const sensor: SensorAPI = {
      onDragStart: vi.fn(),
      onDragMove: vi.fn(),
      onDragEnd: vi.fn(),
      onCleanup: vi.fn(),
      isActive: false,
      type: 'mouse',
    }
    expect(sensor.isActive).toBe(false)
    expect(sensor.type).toBe('mouse')
    expect(typeof sensor.onDragStart).toBe('function')
    expect(typeof sensor.onDragMove).toBe('function')
    expect(typeof sensor.onDragEnd).toBe('function')
    expect(typeof sensor.onCleanup).toBe('function')
  })
})
