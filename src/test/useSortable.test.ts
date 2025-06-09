import { useSortable } from '@/hooks/useSortable'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { cleanupTestContainer, createTestContainer, createTestItems } from './utils'

describe('useSortable', () => {
  let container: HTMLElement
  let items: HTMLElement[]

  beforeEach(() => {
    container = createTestContainer()
    items = createTestItems(3)
    items.forEach(item => container.appendChild(item))
  })

  afterEach(() => {
    cleanupTestContainer(container)
  })

  describe('basic Functionality', () => {
    it('should initialize with simple usage', () => {
      const sortableItems = useSortable(container)

      expect(sortableItems.value).toHaveLength(3)
      expect(sortableItems.value[0]).toBe(items[0])
      expect(sortableItems.value[1]).toBe(items[1])
      expect(sortableItems.value[2]).toBe(items[2])
    })

    it('should initialize with controls option', () => {
      const sortable = useSortable(container, { controls: true })

      expect(sortable.items.value).toHaveLength(3)
      expect(sortable.isDragging.value).toBe(false)
      expect(sortable.dragElement.value).toBeNull()
      expect(sortable.ghostElement.value).toBeNull()
      expect(sortable.currentIndex.value).toBeNull()
      expect(sortable.isSupported.value).toBe(true)
    })

    it('should support reactive target', async () => {
      const targetRef = ref<HTMLElement | null>(null)
      const sortable = useSortable(targetRef, { controls: true })

      // Initially no items
      expect(sortable.items.value).toHaveLength(0)

      // Set target
      targetRef.value = container
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(sortable.items.value).toHaveLength(3)
    })

    it('should handle null target gracefully', () => {
      const sortable = useSortable(null, { controls: true })

      expect(sortable.items.value).toHaveLength(0)
      expect(sortable.isSupported.value).toBe(true)
    })

    it('should handle string selector target', () => {
      container.id = 'test-container'
      document.body.appendChild(container)

      const sortable = useSortable('#test-container', { controls: true })

      expect(sortable.items.value).toHaveLength(3)

      document.body.removeChild(container)
    })
  })

  describe('configuration Options', () => {
    it('should respect immediate option', () => {
      const sortable = useSortable(container, {
        controls: true,
        immediate: false,
      })

      // Should not initialize immediately
      expect(sortable.items.value).toHaveLength(0)
    })

    it('should pass sortable options to manager', () => {
      const onStart = vi.fn()
      const onEnd = vi.fn()

      const sortable = useSortable(container, {
        controls: true,
        group: 'test-group',
        animation: 150,
        onStart,
        onEnd,
      })

      expect(sortable.items.value).toHaveLength(3)
      // Options are passed to manager, tested in manager tests
    })

    it('should support custom draggable selector', () => {
      // Add non-draggable item
      const nonDraggable = document.createElement('div')
      nonDraggable.className = 'non-draggable'
      nonDraggable.textContent = 'Non-draggable'
      container.appendChild(nonDraggable)

      const sortable = useSortable(container, {
        controls: true,
        draggable: '.draggable-item',
      })

      // Should only include draggable items
      expect(sortable.items.value).toHaveLength(3)
      expect(sortable.items.value.every(item =>
        item.classList.contains('draggable-item'),
      )).toBe(true)
    })
  })

  describe('control Methods', () => {
    it('should provide sort method', () => {
      const sortable = useSortable(container, { controls: true })

      expect(typeof sortable.sort).toBe('function')

      // Test sorting (basic functionality)
      const order = ['item-2', 'item-0', 'item-1']
      sortable.sort(order)

      // Sort method delegates to manager
      expect(sortable.items.value).toHaveLength(3)
    })

    it('should provide updateItems method', () => {
      const sortable = useSortable(container, { controls: true })

      expect(typeof sortable.updateItems).toBe('function')

      // Add new item
      const newItem = document.createElement('div')
      newItem.className = 'draggable-item'
      newItem.setAttribute('data-id', 'item-3')
      newItem.textContent = 'Item 3'
      container.appendChild(newItem)

      // Update items
      sortable.updateItems()

      expect(sortable.items.value).toHaveLength(4)
    })

    it('should provide destroy method', () => {
      const sortable = useSortable(container, { controls: true })

      expect(typeof sortable.destroy).toBe('function')

      // Destroy should not throw
      expect(() => sortable.destroy()).not.toThrow()
    })

    it('should provide start and stop methods', () => {
      const sortable = useSortable(container, { controls: true })

      expect(typeof sortable.start).toBe('function')
      expect(typeof sortable.stop).toBe('function')

      // Methods should not throw (even if not fully implemented)
      expect(() => sortable.start(items[0])).not.toThrow()
      expect(() => sortable.stop()).not.toThrow()
    })
  })

  describe('reactive State', () => {
    it('should expose reactive state properties', () => {
      const sortable = useSortable(container, { controls: true })

      // Check reactive properties exist
      expect(sortable.items).toBeDefined()
      expect(sortable.isDragging).toBeDefined()
      expect(sortable.dragElement).toBeDefined()
      expect(sortable.ghostElement).toBeDefined()
      expect(sortable.currentIndex).toBeDefined()
      expect(sortable.isSupported).toBeDefined()

      // Check initial values
      expect(sortable.isDragging.value).toBe(false)
      expect(sortable.dragElement.value).toBeNull()
      expect(sortable.ghostElement.value).toBeNull()
      expect(sortable.currentIndex.value).toBeNull()
    })

    it('should update items when DOM changes', async () => {
      const sortable = useSortable(container, { controls: true })

      expect(sortable.items.value).toHaveLength(3)

      // Remove an item
      container.removeChild(items[1])
      sortable.updateItems()

      expect(sortable.items.value).toHaveLength(2)
    })
  })

  describe('browser Support', () => {
    it('should detect browser support', () => {
      const sortable = useSortable(container, { controls: true })

      // In test environment, should be supported
      expect(sortable.isSupported.value).toBe(true)
    })

    it('should handle unsupported environment gracefully', () => {
      // Mock unsupported environment
      const originalWindow = globalThis.window
      // @ts-expect-error - Testing unsupported environment
      delete globalThis.window

      const sortable = useSortable(container, { controls: true })

      expect(sortable.isSupported.value).toBe(false)

      // Restore window
      globalThis.window = originalWindow
    })
  })

  describe('cleanup', () => {
    it('should cleanup on destroy', () => {
      const sortable = useSortable(container, { controls: true })

      // Should not throw on cleanup
      expect(() => sortable.destroy()).not.toThrow()
    })

    it('should handle multiple destroy calls', () => {
      const sortable = useSortable(container, { controls: true })

      sortable.destroy()
      expect(() => sortable.destroy()).not.toThrow()
    })
  })

  describe('type Safety', () => {
    it('should return correct type for simple usage', () => {
      const items = useSortable(container)

      // Should be a ref with HTMLElement array
      expect(Array.isArray(items.value)).toBe(true)
      expect(items.value.every(item => item instanceof HTMLElement)).toBe(true)
    })

    it('should return correct type for controls usage', () => {
      const sortable = useSortable(container, { controls: true })

      // Should have all control properties
      expect('items' in sortable).toBe(true)
      expect('isDragging' in sortable).toBe(true)
      expect('start' in sortable).toBe(true)
      expect('stop' in sortable).toBe(true)
      expect('sort' in sortable).toBe(true)
    })
  })
})
