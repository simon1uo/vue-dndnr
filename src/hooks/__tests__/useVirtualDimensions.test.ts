import { describe, expect, it } from 'vitest'
import { useVirtualDimensions } from '../useVirtualDimensions'

describe('useVirtualDimensions', () => {
  it('should initialize with default options', () => {
    const virtualDimensions = useVirtualDimensions()
    expect(virtualDimensions.averageHeight.value).toBe(50)
    expect(virtualDimensions.averageWidth.value).toBe(200)
  })

  it('should initialize with custom options', () => {
    const virtualDimensions = useVirtualDimensions({
      defaultItemHeight: 100,
      defaultItemWidth: 300,
    })
    expect(virtualDimensions.averageHeight.value).toBe(100)
    expect(virtualDimensions.averageWidth.value).toBe(300)
  })

  it('should create virtual dimensions with correct structure', () => {
    const virtualDimensions = useVirtualDimensions()
    const dimension = virtualDimensions.getVirtualDimension('drag-1', 'drop-1', 0)

    expect(dimension).toHaveProperty('id', 'drag-1')
    expect(dimension).toHaveProperty('dropId', 'drop-1')
    expect(dimension).toHaveProperty('client')
    expect(dimension).toHaveProperty('page')
    expect(dimension).toHaveProperty('windowScroll')

    // Check box model properties
    expect(dimension.client).toHaveProperty('marginBox')
    expect(dimension.client).toHaveProperty('contentBox')
    expect(dimension.client).toHaveProperty('borderBox')
    expect(dimension.client).toHaveProperty('paddingBox')
  })

  it('should calculate correct positions based on index', () => {
    const virtualDimensions = useVirtualDimensions({
      defaultItemHeight: 100,
    })

    const dimension1 = virtualDimensions.getVirtualDimension('drag-1', 'drop-1', 0)
    const dimension2 = virtualDimensions.getVirtualDimension('drag-2', 'drop-1', 1)

    expect(dimension1.client.borderBox.top).toBe(0)
    expect(dimension2.client.borderBox.top).toBe(100)
  })

  it('should update cache and recalculate averages', () => {
    const virtualDimensions = useVirtualDimensions()

    // Update cache with actual measurements
    virtualDimensions.updateCache('drag-1', {
      id: 'drag-1',
      dropId: 'drop-1',
      client: {
        borderBox: { height: 60, width: 250, top: 0, right: 250, bottom: 60, left: 0, x: 0, y: 0 },
      } as any,
      page: {} as any,
      windowScroll: { x: 0, y: 0 },
    })

    virtualDimensions.updateCache('drag-2', {
      id: 'drag-2',
      dropId: 'drop-1',
      client: {
        borderBox: { height: 80, width: 300, top: 0, right: 300, bottom: 80, left: 0, x: 0, y: 0 },
      } as any,
      page: {} as any,
      windowScroll: { x: 0, y: 0 },
    })

    // Average should be (60 + 80) / 2 = 70
    expect(virtualDimensions.averageHeight.value).toBe(70)
    // Average should be (250 + 300) / 2 = 275
    expect(virtualDimensions.averageWidth.value).toBe(275)
  })

  it('should calculate visible range correctly', () => {
    const virtualDimensions = useVirtualDimensions({
      defaultItemHeight: 100,
      bufferSize: 1,
    })

    const { start, end } = virtualDimensions.getVisibleRange(300, 200, 100)

    // With scrollTop 300 and item height 100, we should start at index 2 (minus buffer)
    expect(start).toBe(2)
    // With viewport height 200, we should see 2 items (plus buffer)
    expect(end).toBe(5)
  })

  it('should clear cache and reset averages', () => {
    const virtualDimensions = useVirtualDimensions({
      defaultItemHeight: 100,
      defaultItemWidth: 300,
    })

    virtualDimensions.updateCache('drag-1', {
      id: 'drag-1',
      dropId: 'drop-1',
      client: {
        borderBox: { height: 60, width: 250, top: 0, right: 250, bottom: 60, left: 0, x: 0, y: 0 },
      } as any,
      page: {} as any,
      windowScroll: { x: 0, y: 0 },
    })

    virtualDimensions.clearCache()

    expect(virtualDimensions.averageHeight.value).toBe(100)
    expect(virtualDimensions.averageWidth.value).toBe(300)
  })

  it('should calculate estimated total height correctly', () => {
    const virtualDimensions = useVirtualDimensions({
      defaultItemHeight: 100,
    })

    expect(virtualDimensions.getEstimatedTotalHeight(10)).toBe(1000)
  })
})
