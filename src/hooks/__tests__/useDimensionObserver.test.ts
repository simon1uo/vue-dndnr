import * as VueUse from '@vueuse/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDimensionObserver } from '../useDimensionObserver'

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
    tryOnUnmounted: vi.fn(() => {}),
  }
})

describe('useDimensionObserver', () => {
  let mockElement: HTMLDivElement
  let mockOnUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Create a mock element
    mockElement = document.createElement('div')
    Object.defineProperty(mockElement, 'clientHeight', { value: 100 })
    Object.defineProperty(mockElement, 'clientWidth', { value: 100 })
    Object.defineProperty(mockElement, 'scrollHeight', { value: 200 })
    Object.defineProperty(mockElement, 'scrollWidth', { value: 200 })

    mockOnUpdate = vi.fn()

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize correctly', () => {
    const observer = useDimensionObserver(mockElement, mockOnUpdate)
    expect(observer).toHaveProperty('observe')
    expect(observer).toHaveProperty('disconnect')
    expect(observer).toHaveProperty('updateElementId')
    expect(observer).toHaveProperty('isActive')
    expect(observer.isActive.value).toBe(false)
  })

  it('should start observing when observe is called', () => {
    const observer = useDimensionObserver(mockElement, mockOnUpdate)
    observer.observe('drag', 'drag-1')
    expect(observer.isActive.value).toBe(true)
  })

  it('should stop observing when disconnect is called', () => {
    const observer = useDimensionObserver(mockElement, mockOnUpdate)
    observer.observe('drag', 'drag-1')
    expect(observer.isActive.value).toBe(true)
    observer.disconnect()
    expect(observer.isActive.value).toBe(false)
  })

  it('should set up appropriate observers based on element type', () => {
    // Test for drag element
    const dragObserver = useDimensionObserver(mockElement, mockOnUpdate)
    dragObserver.observe('drag', 'drag-1')

    // For drag elements, we should set up size and window observers
    expect(VueUse.useElementSize).toHaveBeenCalled()
    expect(VueUse.useWindowScroll).toHaveBeenCalled()

    vi.clearAllMocks()

    // Test for drop element
    const dropObserver = useDimensionObserver(mockElement, mockOnUpdate)
    dropObserver.observe('drop', 'drop-1')

    // For drop elements, we should also set up scroll observer
    expect(VueUse.useElementSize).toHaveBeenCalled()
    expect(VueUse.useWindowScroll).toHaveBeenCalled()
    expect(VueUse.useScroll).toHaveBeenCalled()
  })

  it('should respect configuration options', () => {
    // Disable all observers
    const observer = useDimensionObserver(mockElement, mockOnUpdate, {
      windowResize: false,
      windowScroll: false,
      elementResize: false,
      elementScroll: false,
    })

    observer.observe('drop', 'drop-1')

    // Since all observers are disabled, these hooks should not be called
    expect(VueUse.useElementSize).not.toHaveBeenCalled()
    expect(VueUse.useWindowScroll).not.toHaveBeenCalled()
    expect(VueUse.useElementBounding).not.toHaveBeenCalled()
    expect(VueUse.useScroll).not.toHaveBeenCalled()
  })

  it('should update element ID correctly', () => {
    const observer = useDimensionObserver(mockElement, mockOnUpdate)
    observer.observe('drag', 'drag-1')

    // Change the element ID
    observer.updateElementId('drop', 'drop-1')

    // Verify the internal state has been updated
    expect(observer.isActive.value).toBe(true)

    // We can't directly test the internal state of elementId and elementType
    // since they are private, but we can test that the observer is still active
  })

  it('should register unmount cleanup', () => {
    const observer = useDimensionObserver(mockElement, mockOnUpdate)
    observer.observe('drag', 'drag-1')

    // tryOnUnmounted should have been called
    expect(VueUse.tryOnUnmounted).toHaveBeenCalled()
  })
})
