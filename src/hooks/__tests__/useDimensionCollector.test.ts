import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDimensionCollector } from '../useDimensionCollector'

// Mock VueUse hooks
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual as any,
    defaultWindow: window,
    useElementBounding: vi.fn(() => ({
      top: { value: 0 },
      right: { value: 100 },
      bottom: { value: 100 },
      left: { value: 0 },
      width: { value: 100 },
      height: { value: 100 },
      x: { value: 0 },
      y: { value: 0 },
      update: vi.fn(),
    })),
    useElementSize: vi.fn(() => ({
      width: { value: 100 },
      height: { value: 100 },
    })),
    useWindowScroll: vi.fn(() => ({
      x: ref(0),
      y: ref(0),
    })),
    useScroll: vi.fn(() => ({
      x: { value: 0 },
      y: { value: 0 },
    })),
  }
})

describe('useDimensionCollector', () => {
  // Mock element
  const mockElement = {
    getBoundingClientRect: () => ({
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    }),
    scrollHeight: 200,
    scrollWidth: 200,
    clientHeight: 100,
    clientWidth: 100,
    style: {},
    nodeType: 1, // Add nodeType to make instanceof HTMLElement check pass
  } as unknown as HTMLElement

  // Mock getComputedStyle
  const originalGetComputedStyle = window.getComputedStyle
  beforeAll(() => {
    window.getComputedStyle = vi.fn().mockImplementation(() => {
      const styles = {
        marginTop: '10px',
        marginRight: '10px',
        marginBottom: '10px',
        marginLeft: '10px',
        borderTopWidth: '1px',
        borderRightWidth: '1px',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        paddingTop: '5px',
        paddingRight: '5px',
        paddingBottom: '5px',
        paddingLeft: '5px',
      }

      return {
        ...styles,
        getPropertyValue: (prop: string) => styles[prop as keyof typeof styles] || '',
      } as unknown as CSSStyleDeclaration
    })
  })

  afterAll(() => {
    window.getComputedStyle = originalGetComputedStyle
  })

  it('should collect drag dimensions correctly', () => {
    const element = ref(mockElement)
    const { collectDragDimensions } = useDimensionCollector(element)
    const dragDimensions = collectDragDimensions('drag-1', 'drop-1')

    expect(dragDimensions).toBeDefined()
    expect(dragDimensions?.id).toBe('drag-1')
    expect(dragDimensions?.dropId).toBe('drop-1')
    expect(dragDimensions?.client).toBeDefined()
    expect(dragDimensions?.page).toBeDefined()
    expect(dragDimensions?.windowScroll).toEqual({ x: 0, y: 0 })

    // Check box model calculations
    const { client } = dragDimensions!
    expect(client.contentBox).toBeDefined()
    expect(client.paddingBox).toBeDefined()
    expect(client.borderBox).toBeDefined()
    expect(client.marginBox).toBeDefined()

    // Check specific box model calculations
    expect(client.contentBox.width).toBe(100)
    expect(client.contentBox.height).toBe(100)
    expect(client.paddingBox.width).toBe(98) // content + padding
    expect(client.paddingBox.height).toBe(98)
    expect(client.borderBox.width).toBe(100) // borderBox is from getBoundingClientRect
    expect(client.borderBox.height).toBe(100)
    expect(client.marginBox.width).toBe(120) // borderBox + margin
    expect(client.marginBox.height).toBe(120)
  })

  it('should collect drop dimensions correctly', () => {
    const { collectDropDimensions } = useDimensionCollector(ref(mockElement))
    const dropDimensions = collectDropDimensions('drop-1')

    expect(dropDimensions).toBeDefined()
    expect(dropDimensions?.id).toBe('drop-1')
    expect(dropDimensions?.client).toBeDefined()
    expect(dropDimensions?.page).toBeDefined()
    expect(dropDimensions?.windowScroll).toEqual({ x: 0, y: 0 })
    expect(dropDimensions?.frame).toBeDefined()

    // Check frame properties for scrollable container
    const { frame } = dropDimensions!
    expect(frame).toBeDefined()
    expect(frame?.scroll).toEqual({ x: 0, y: 0 })
    expect(frame?.scrollSize).toEqual({ x: 200, y: 200 })
    expect(frame?.clientHeight).toBe(100)
    expect(frame?.clientWidth).toBe(100)

    // Check box model calculations
    const { client } = dropDimensions!
    expect(client.contentBox.width).toBe(100)
    expect(client.contentBox.height).toBe(100)
    expect(client.paddingBox.width).toBe(98)
    expect(client.paddingBox.height).toBe(98)
    expect(client.borderBox.width).toBe(100)
    expect(client.borderBox.height).toBe(100)
    expect(client.marginBox.width).toBe(120)
    expect(client.marginBox.height).toBe(120)
  })

  it('should cache and retrieve dimensions correctly', () => {
    const collector = useDimensionCollector(ref(mockElement))

    // Collect and cache dimensions
    const dragDimensions = collector.collectDragDimensions('drag-1', 'drop-1')
    const dropDimensions = collector.collectDropDimensions('drop-1')

    // Retrieve from cache
    const cachedDrag = collector.getDragDimensions('drag-1')
    const cachedDrop = collector.getDropDimensions('drop-1')

    expect(cachedDrag).toEqual(dragDimensions)
    expect(cachedDrop).toEqual(dropDimensions)

    // Clear cache
    collector.clearCache()
    expect(collector.getDragDimensions('drag-1')).toBeNull()
    expect(collector.getDropDimensions('drop-1')).toBeNull()
  })

  it('should handle null/undefined target element', () => {
    const { collectDragDimensions, collectDropDimensions } = useDimensionCollector(ref(null))

    expect(collectDragDimensions('drag-1', 'drop-1')).toBeNull()
    expect(collectDropDimensions('drop-1')).toBeNull()
  })
})
