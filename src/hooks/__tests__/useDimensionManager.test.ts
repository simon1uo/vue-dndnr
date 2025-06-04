import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDimensionManager } from '../useDimensionManager'

const mockCollector = {
  collectDragDimensions: vi.fn().mockImplementation((dragId, dropId) => ({
    id: dragId,
    dropId,
    client: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
    page: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
    windowScroll: { x: 0, y: 0 },
  })),
  collectDropDimensions: vi.fn().mockImplementation(dropId => ({
    id: dropId,
    client: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
    page: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
    windowScroll: { x: 0, y: 0 },
    subject: {
      page: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
      withDroppableDisplacement: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
      activities: [],
    },
  })),
  getDragDimensions: vi.fn().mockImplementation((dragId) => {
    if (dragId === 'drag-1') {
      return {
        id: dragId,
        dropId: 'drop-1',
        client: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
        page: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
        windowScroll: { x: 0, y: 0 },
      }
    }
    return null
  }),
  getDropDimensions: vi.fn().mockImplementation((dropId) => {
    if (dropId === 'drop-1') {
      return {
        id: dropId,
        client: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
        page: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
        windowScroll: { x: 0, y: 0 },
        subject: {
          page: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
          withDroppableDisplacement: { marginBox: {}, borderBox: {}, paddingBox: {}, contentBox: {} },
          activities: [],
        },
      }
    }
    return null
  }),
  clearCache: vi.fn(),
}

const mockObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  updateElementId: vi.fn(),
  isActive: ref(false),
}

// Mock dependencies
vi.mock('../useDimensionCollector', () => ({
  default: () => mockCollector,
}))

vi.mock('../useDimensionObserver', () => ({
  default: () => mockObserver,
}))

describe('useDimensionManager', () => {
  let dimensionManager: ReturnType<typeof useDimensionManager>

  beforeEach(() => {
    dimensionManager = useDimensionManager()

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should register draggable elements', () => {
    const element = document.createElement('div')
    dimensionManager.registerDraggable('drag-1', 'drop-1', element)

    expect(dimensionManager.allDraggableIds.value).toContain('drag-1')
  })

  it('should register droppable elements', () => {
    const element = document.createElement('div')
    dimensionManager.registerDroppable('drop-1', element)

    expect(dimensionManager.allDroppableIds.value).toContain('drop-1')
  })

  it('should unregister draggable elements', () => {
    const element = document.createElement('div')
    dimensionManager.registerDraggable('drag-1', 'drop-1', element)
    dimensionManager.unregisterDraggable('drag-1')

    expect(dimensionManager.allDraggableIds.value).not.toContain('drag-1')
  })

  it('should unregister droppable elements', () => {
    const element = document.createElement('div')
    dimensionManager.registerDroppable('drop-1', element)
    dimensionManager.unregisterDroppable('drop-1')

    expect(dimensionManager.allDroppableIds.value).not.toContain('drop-1')
  })

  it('should get drag dimensions', () => {
    const result = dimensionManager.getDragDimensions('drag-1')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('drag-1')
    expect(result?.dropId).toBe('drop-1')
  })

  it('should get drop dimensions', () => {
    const result = dimensionManager.getDropDimensions('drop-1')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('drop-1')
  })

  it('should return null for non-existent drag dimensions', () => {
    const result = dimensionManager.getDragDimensions('non-existent')
    expect(result).toBeNull()
  })

  it('should return null for non-existent drop dimensions', () => {
    const result = dimensionManager.getDropDimensions('non-existent')
    expect(result).toBeNull()
  })

  it('should force update drag dimensions', () => {
    const element = document.createElement('div')
    dimensionManager.registerDraggable('drag-1', 'drop-1', element)

    const result = dimensionManager.getDragDimensions('drag-1', true)
    expect(result).not.toBeNull()
    expect(result?.id).toBe('drag-1')
  })

  it('should force update drop dimensions', () => {
    const element = document.createElement('div')
    dimensionManager.registerDroppable('drop-1', element)

    const result = dimensionManager.getDropDimensions('drop-1', true)
    expect(result).not.toBeNull()
    expect(result?.id).toBe('drop-1')
  })

  it('should update all dimensions', () => {
    const dragElement = document.createElement('div')
    const dropElement = document.createElement('div')

    dimensionManager.registerDraggable('drag-1', 'drop-1', dragElement)
    dimensionManager.registerDroppable('drop-1', dropElement)

    dimensionManager.updateAllDimensions()

    // 验证为两个元素调用了 collectDimensions
    expect(mockCollector.collectDropDimensions).toHaveBeenCalledWith('drop-1')
    expect(mockCollector.collectDragDimensions).toHaveBeenCalledWith('drag-1', 'drop-1')
  })

  it('should reset all registrations and caches', () => {
    const dragElement = document.createElement('div')
    const dropElement = document.createElement('div')

    dimensionManager.registerDraggable('drag-1', 'drop-1', dragElement)
    dimensionManager.registerDroppable('drop-1', dropElement)

    dimensionManager.reset()

    expect(dimensionManager.allDraggableIds.value).toHaveLength(0)
    expect(dimensionManager.allDroppableIds.value).toHaveLength(0)

    expect(mockCollector.clearCache).toHaveBeenCalled()
    expect(mockObserver.disconnect).toHaveBeenCalled()
  })

  it('should not auto-update when enableAutoUpdate is false', () => {
    const localDimensionManager = useDimensionManager({ enableAutoUpdate: false })
    const element = document.createElement('div')

    localDimensionManager.registerDraggable('drag-1', 'drop-1', element)

    expect(mockObserver.observe).not.toHaveBeenCalled()
  })
})
