import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDimensionManager } from '../useDimensionManager'
import { useDimensionObserver } from '../useDimensionObserver'

// Store tryOnUnmounted callbacks for testing
const tryOnUnmountedCallbacks: Array<() => void> = []

// Mock useDimensionObserver and useDimensionCollector
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockUpdateElementId = vi.fn()
const mockIsActive = ref(true)

const mockCollectDragDimensions = vi.fn((dragId, dropId) => ({
  id: dragId,
  dropId,
  client: {
    borderBox: {
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    },
    contentBox: {
      width: 100,
      height: 100,
    },
  },
  page: {
    borderBox: {
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    },
    contentBox: {
      width: 100,
      height: 100,
    },
  },
  windowScroll: { x: 0, y: 0 },
}))

const mockCollectDropDimensions = vi.fn(dropId => ({
  id: dropId,
  client: {
    borderBox: {
      top: 0,
      right: 200,
      bottom: 200,
      left: 0,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
    },
    contentBox: {
      width: 200,
      height: 200,
    },
  },
  page: {
    borderBox: {
      top: 0,
      right: 200,
      bottom: 200,
      left: 0,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
    },
    contentBox: {
      width: 200,
      height: 200,
    },
  },
  windowScroll: { x: 0, y: 0 },
  subject: {
    page: {},
    withDroppableDisplacement: {},
    activities: [],
  },
}))

const mockClearCache = vi.fn()

vi.mock('../useDimensionObserver', () => ({
  useDimensionObserver: vi.fn(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    updateElementId: mockUpdateElementId,
    isActive: mockIsActive,
  })),
}))

vi.mock('../useDimensionCollector', () => ({
  useDimensionCollector: vi.fn(() => ({
    collectDragDimensions: mockCollectDragDimensions,
    collectDropDimensions: mockCollectDropDimensions,
    getDragDimensions: vi.fn(),
    getDropDimensions: vi.fn(),
    clearCache: mockClearCache,
  })),
}))

// Mock VueUse hooks
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual as any,
    useElementSize: vi.fn(() => ({
      width: ref(100),
      height: ref(100),
    })),
    useElementBounding: vi.fn(() => ({
      width: ref(100),
      height: ref(100),
      top: ref(0),
      right: ref(100),
      bottom: ref(100),
      left: ref(0),
      x: ref(0),
      y: ref(0),
    })),
    useScroll: vi.fn(() => ({
      x: ref(0),
      y: ref(0),
    })),
    useWindowScroll: vi.fn(() => ({
      x: ref(0),
      y: ref(0),
    })),
    useDebounceFn: vi.fn(fn => fn),
    useThrottleFn: vi.fn(fn => fn),
    tryOnUnmounted: vi.fn((fn) => {
      // Store the callback for later execution
      tryOnUnmountedCallbacks.push(fn)
    }),
  }
})

describe('useDimensionManager', () => {
  let mockDragElement: HTMLDivElement
  let mockDropElement: HTMLDivElement

  beforeEach(() => {
    // Clear tryOnUnmounted callbacks
    tryOnUnmountedCallbacks.length = 0

    // Create mock elements
    mockDragElement = document.createElement('div')
    mockDropElement = document.createElement('div')

    // Set up mock element properties
    Object.defineProperty(mockDragElement, 'clientHeight', { value: 100 })
    Object.defineProperty(mockDragElement, 'clientWidth', { value: 100 })
    Object.defineProperty(mockDragElement, 'scrollHeight', { value: 100 })
    Object.defineProperty(mockDragElement, 'scrollWidth', { value: 100 })

    Object.defineProperty(mockDropElement, 'clientHeight', { value: 200 })
    Object.defineProperty(mockDropElement, 'clientWidth', { value: 200 })
    Object.defineProperty(mockDropElement, 'scrollHeight', { value: 400 })
    Object.defineProperty(mockDropElement, 'scrollWidth', { value: 400 })

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize correctly', () => {
    const manager = useDimensionManager()
    expect(manager).toHaveProperty('registerDraggable')
    expect(manager).toHaveProperty('registerDroppable')
    expect(manager).toHaveProperty('unregisterDraggable')
    expect(manager).toHaveProperty('unregisterDroppable')
    expect(manager).toHaveProperty('refreshDimensions')
    expect(manager).toHaveProperty('getDraggableDimension')
    expect(manager).toHaveProperty('getDroppableDimension')
    expect(manager).toHaveProperty('allDragDimensions')
    expect(manager).toHaveProperty('allDropDimensions')
  })

  it('should register and unregister draggable elements', () => {
    const manager = useDimensionManager()

    // Register a draggable
    manager.registerDraggable('drag-1', mockDragElement, 'drop-1')

    // Check if dimensions were collected
    const dragDimension = manager.getDraggableDimension('drag-1')
    expect(dragDimension).toBeTruthy()
    expect(dragDimension?.id).toBe('drag-1')
    expect(dragDimension?.dropId).toBe('drop-1')

    // Unregister the draggable
    manager.unregisterDraggable('drag-1')

    // Check if dimensions were removed
    expect(manager.getDraggableDimension('drag-1')).toBeNull()
  })

  it('should register and unregister droppable elements', () => {
    const manager = useDimensionManager()

    // Register a droppable
    manager.registerDroppable('drop-1', mockDropElement)

    // Check if dimensions were collected
    const dropDimension = manager.getDroppableDimension('drop-1')
    expect(dropDimension).toBeTruthy()
    expect(dropDimension?.id).toBe('drop-1')

    // Unregister the droppable
    manager.unregisterDroppable('drop-1')

    // Check if dimensions were removed
    expect(manager.getDroppableDimension('drop-1')).toBeNull()
  })

  it('should update droppable activities when draggables change', () => {
    const manager = useDimensionManager()

    // Register a droppable first
    manager.registerDroppable('drop-1', mockDropElement)

    // Register a draggable in that droppable
    manager.registerDraggable('drag-1', mockDragElement, 'drop-1')

    // Check if the droppable's activities array was updated
    const dropDimension = manager.getDroppableDimension('drop-1')
    expect(dropDimension?.subject.activities).toHaveLength(1)
    expect(dropDimension?.subject.activities[0].id).toBe('drag-1')

    // Unregister the draggable
    manager.unregisterDraggable('drag-1')

    // Check if the activities array was updated
    const updatedDropDimension = manager.getDroppableDimension('drop-1')
    expect(updatedDropDimension?.subject.activities).toHaveLength(0)
  })

  it('should refresh dimensions correctly', () => {
    const manager = useDimensionManager()

    // Register elements
    manager.registerDroppable('drop-1', mockDropElement)
    manager.registerDraggable('drag-1', mockDragElement, 'drop-1')

    // Clear the mocks to track new calls
    mockCollectDragDimensions.mockClear()
    mockCollectDropDimensions.mockClear()

    // Refresh all dimensions
    manager.refreshDimensions()

    // Check if dimensions were recollected
    expect(mockCollectDragDimensions).toHaveBeenCalled()
    expect(mockCollectDropDimensions).toHaveBeenCalled()

    // Refresh specific draggable
    mockCollectDragDimensions.mockClear()
    mockCollectDropDimensions.mockClear()
    manager.refreshDimensions('drag', 'drag-1')
    expect(mockCollectDragDimensions).toHaveBeenCalled()
    expect(mockCollectDropDimensions).not.toHaveBeenCalled()

    // Refresh specific droppable
    mockCollectDragDimensions.mockClear()
    mockCollectDropDimensions.mockClear()
    manager.refreshDimensions('drop', 'drop-1')
    expect(mockCollectDragDimensions).not.toHaveBeenCalled()
    expect(mockCollectDropDimensions).toHaveBeenCalled()
  })

  it('should clean up when unmounted', () => {
    const manager = useDimensionManager()

    // Register some elements
    manager.registerDroppable('drop-1', mockDropElement)
    manager.registerDraggable('drag-1', mockDragElement, 'drop-1')

    // Verify dimensions exist
    expect(manager.getDraggableDimension('drag-1')).not.toBeNull()
    expect(manager.getDroppableDimension('drop-1')).not.toBeNull()

    // Execute the unmount callback
    expect(tryOnUnmountedCallbacks.length).toBeGreaterThan(0)
    tryOnUnmountedCallbacks.forEach(callback => callback())

    // Verify cleanup functions were called
    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockClearCache).toHaveBeenCalled()

    // Verify dimensions were cleared
    expect(manager.allDragDimensions.value).toHaveLength(0)
    expect(manager.allDropDimensions.value).toHaveLength(0)
  })

  it('should handle observer options correctly', () => {
    // Reset mock before creating manager with options
    vi.mocked(useDimensionObserver).mockClear()

    const _manager = useDimensionManager({
      observerOptions: {
        windowResize: false,
        windowScroll: false,
        elementResize: false,
        elementScroll: false,
      },
    })

    // Check if useDimensionObserver was called with the correct options
    expect(useDimensionObserver).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      {
        windowResize: false,
        windowScroll: false,
        elementResize: false,
        elementScroll: false,
      },
    )
  })
})
