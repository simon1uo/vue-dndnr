import type { SortableEventCallbacks, SortableOptions } from '@/types'
import { SortableManager } from '@/core/sortable-manager'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

describe('sortableManager', () => {
  let container: HTMLElement
  let manager: SortableManager

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="item" data-id="1">Item 1</div>
      <div class="item" data-id="2">Item 2</div>
      <div class="item" data-id="3">Item 3</div>
    `
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (manager) {
      manager.destroy()
    }
    if (container.parentNode) {
      document.body.removeChild(container)
    }
  })

  describe('initialization', () => {
    it('should create manager with element reference', () => {
      manager = new SortableManager(container)
      expect(manager).toBeDefined()
      expect(manager.isDragging.value).toBe(false)
      expect(manager.dragElement.value).toBeNull()
    })

    it('should create manager with element selector', () => {
      container.id = 'test-container'
      manager = new SortableManager('#test-container')
      expect(manager).toBeDefined()
    })

    it('should create manager with reactive target', async () => {
      const target = ref<HTMLElement | null>(null)
      manager = new SortableManager(target, { draggable: '.item' })

      target.value = container
      await manager.waitForUpdate()

      expect(manager.items.value).toHaveLength(3)
    })

    it('should initialize with options', () => {
      const options: SortableOptions = {
        draggable: '.item',
        ghostClass: 'custom-ghost',
        animation: 200,
      }

      manager = new SortableManager(container, options)
      expect(manager).toBeDefined()
    })
  })

  describe('reactive state', () => {
    beforeEach(() => {
      manager = new SortableManager(container, { draggable: '.item' })
    })

    it('should have correct initial state', async () => {
      await manager.initialize()

      expect(manager.isDragging.value).toBe(false)
      expect(manager.dragElement.value).toBeNull()
      expect(manager.ghostElement.value).toBeNull()
      expect(manager.currentIndex.value).toBeNull()
      expect(manager.items.value).toHaveLength(3)
    })

    it('should update items when DOM changes', async () => {
      await manager.initialize()

      const newItem = document.createElement('div')
      newItem.className = 'item'
      newItem.dataset.id = '4'
      newItem.textContent = 'Item 4'
      container.appendChild(newItem)

      manager.updateItems()
      expect(manager.items.value).toHaveLength(4)
    })
  })

  describe('options handling', () => {
    it('should handle reactive options', async () => {
      const options = ref<SortableOptions>({
        draggable: '.item',
        disabled: false,
      })

      manager = new SortableManager(container, options)
      await manager.initialize()

      // Change options
      options.value.disabled = true
      await nextTick()

      // Manager should react to options change
      expect(manager).toBeDefined()
    })

    it('should handle static options', async () => {
      const options: SortableOptions = {
        draggable: '.item',
        ghostClass: 'custom-ghost',
      }

      manager = new SortableManager(container, options)
      await manager.initialize()

      expect(manager).toBeDefined()
    })
  })

  describe('event callbacks', () => {
    it('should register event callbacks', async () => {
      const onStart = vi.fn()
      const onEnd = vi.fn()
      const onUpdate = vi.fn()

      const callbacks: SortableEventCallbacks = {
        onStart,
        onEnd,
        onUpdate,
      }

      manager = new SortableManager(container, {
        draggable: '.item',
        ...callbacks,
      })

      await manager.initialize()
      expect(manager).toBeDefined()
    })
  })

  describe('lifecycle', () => {
    it('should initialize correctly', async () => {
      manager = new SortableManager(container, { draggable: '.item' })

      await manager.initialize()
      expect(manager.items.value).toHaveLength(3)
    })

    it('should destroy correctly', async () => {
      manager = new SortableManager(container, { draggable: '.item' })
      await manager.initialize()

      manager.destroy()

      expect(manager.isDragging.value).toBe(false)
      expect(manager.dragElement.value).toBeNull()
      expect(manager.items.value).toHaveLength(0)
    })

    it('should handle multiple initialize calls', async () => {
      manager = new SortableManager(container, { draggable: '.item' })

      await manager.initialize()
      await manager.initialize() // Should not throw

      expect(manager.items.value).toHaveLength(3)
    })
  })

  describe('target changes', () => {
    it('should handle target element changes', async () => {
      const target = ref<HTMLElement | null>(container)
      manager = new SortableManager(target, { draggable: '.item' })

      // 不需要手动调用 initialize，watcher 会自动处理
      await nextTick()
      expect(manager.items.value).toHaveLength(3)

      // Change target
      const newContainer = document.createElement('div')
      newContainer.innerHTML = `
        <div class="item">New Item 1</div>
        <div class="item">New Item 2</div>
      `
      document.body.appendChild(newContainer)

      target.value = newContainer
      await manager.waitForUpdate()

      expect(manager.items.value).toHaveLength(2)

      document.body.removeChild(newContainer)
    })

    it('should handle null target', async () => {
      const target = ref<HTMLElement | null>(container)
      manager = new SortableManager(target, { draggable: '.item' })

      await manager.initialize()
      expect(manager.items.value).toHaveLength(3)

      target.value = null
      await nextTick()

      expect(manager.items.value).toHaveLength(0)
    })
  })

  describe('error handling', () => {
    it('should handle invalid selector', () => {
      manager = new SortableManager('#non-existent', { draggable: '.item' })
      expect(manager).toBeDefined()
    })

    it('should handle null target gracefully', async () => {
      manager = new SortableManager(null, { draggable: '.item' })
      await manager.initialize()

      expect(manager.items.value).toHaveLength(0)
    })
  })

  describe('drag and Drop Functionality', () => {
    let container: HTMLElement
    let manager: SortableManager

    beforeEach(async () => {
      container = document.createElement('div')
      container.innerHTML = `
        <div class="item" data-id="1">Item 1</div>
        <div class="item" data-id="2">Item 2</div>
        <div class="item" data-id="3">Item 3</div>
      `
      document.body.appendChild(container)

      manager = new SortableManager(container, {
        draggable: '.item',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
      })

      await manager.initialize()
      await manager.waitForUpdate()
    })

    afterEach(() => {
      manager.cleanup()
      document.body.removeChild(container)
    })

    it('should handle mouse drag start', async () => {
      const firstItem = container.querySelector('.item') as HTMLElement
      const startEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })

      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      expect(manager.isDragging.value).toBe(true)
      expect(manager.dragElement.value).toBe(firstItem)
      expect(firstItem.classList.contains('sortable-chosen')).toBe(true)
    })

    it('should handle touch drag start', async () => {
      const firstItem = container.querySelector('.item') as HTMLElement
      const startEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [new Touch({
          identifier: 0,
          target: firstItem,
          clientX: 100,
          clientY: 100,
        })],
      })

      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      expect(manager.isDragging.value).toBe(true)
      expect(manager.dragElement.value).toBe(firstItem)
    })

    it('should create ghost element during drag', async () => {
      const firstItem = container.querySelector('.item') as HTMLElement
      const startEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })

      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      const ghostElement = container.querySelector('.sortable-ghost')
      expect(ghostElement).toBeTruthy()
      expect(ghostElement?.textContent).toBe('Item 1')
    })

    it('should handle drag end and cleanup', async () => {
      const firstItem = container.querySelector('.item') as HTMLElement

      // Start drag
      const startEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })
      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      // End drag
      const endEvent = new MouseEvent('mouseup', {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      })
      document.dispatchEvent(endEvent)
      await manager.waitForUpdate()

      expect(manager.isDragging.value).toBe(false)
      expect(manager.dragElement.value).toBeNull()
      expect(firstItem.classList.contains('sortable-chosen')).toBe(false)
      expect(container.querySelector('.sortable-ghost')).toBeNull()
    })

    it('should reorder items during drag', async () => {
      const items = Array.from(container.querySelectorAll('.item')) as HTMLElement[]
      const [firstItem, secondItem, thirdItem] = items

      // Mock getBoundingClientRect for all items to simulate vertical layout
      vi.spyOn(firstItem, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        left: 0,
        bottom: 50,
        right: 200,
        width: 200,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })
      vi.spyOn(secondItem, 'getBoundingClientRect').mockReturnValue({
        top: 50,
        left: 0,
        bottom: 100,
        right: 200,
        width: 200,
        height: 50,
        x: 0,
        y: 50,
        toJSON: () => ({}),
      })
      vi.spyOn(thirdItem, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 0,
        bottom: 150,
        right: 200,
        width: 200,
        height: 50,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      })

      // Start drag on first item
      const startEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 25, // Center of first item
      })
      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      // Move to second item position (lower half to trigger "after" insertion)
      const moveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 100,
        clientY: 85, // Lower half of second item
      })
      document.dispatchEvent(moveEvent)
      await manager.waitForUpdate()

      // End drag
      const endEvent = new MouseEvent('mouseup', {
        bubbles: true,
        clientX: 100,
        clientY: 85,
      })
      document.dispatchEvent(endEvent)
      await manager.waitForUpdate()

      // Check if order changed
      const newOrder = Array.from(container.querySelectorAll('.item')).map(
        el => el.getAttribute('data-id'),
      )
      expect(newOrder).not.toEqual(['1', '2', '3'])
    })
  })

  describe('event system integration', () => {
    beforeEach(async () => {
      manager = new SortableManager(container, { draggable: '.item' })
      await manager.initialize()
    })

    it('should register and trigger event listeners', async () => {
      const startListener = vi.fn()
      const endListener = vi.fn()

      const cleanupStart = manager.on('start', startListener)
      const cleanupEnd = manager.on('end', endListener)

      expect(manager.hasListeners('start')).toBe(true)
      expect(manager.hasListeners('end')).toBe(true)
      expect(manager.getListenerCount('start')).toBe(1)
      expect(manager.getListenerCount('end')).toBe(1)

      // Simulate drag start
      const firstItem = container.querySelector('.item') as HTMLElement
      const startEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })
      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      expect(startListener).toHaveBeenCalled()

      // Simulate drag end
      const endEvent = new MouseEvent('mouseup', {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      })
      document.dispatchEvent(endEvent)
      await manager.waitForUpdate()

      expect(endListener).toHaveBeenCalled()

      // Cleanup
      cleanupStart()
      cleanupEnd()

      expect(manager.hasListeners('start')).toBe(false)
      expect(manager.hasListeners('end')).toBe(false)
    })

    it('should support one-time event listeners', async () => {
      const listener = vi.fn()
      const cleanup = manager.once('start', listener)

      expect(manager.hasListeners('start')).toBe(true)

      // Trigger event twice
      const firstItem = container.querySelector('.item') as HTMLElement
      const startEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })

      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      // End first drag
      const endEvent = new MouseEvent('mouseup', {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      })
      document.dispatchEvent(endEvent)
      await manager.waitForUpdate()

      // Start second drag
      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      // Listener should only be called once
      expect(listener).toHaveBeenCalledTimes(1)
      expect(manager.hasListeners('start')).toBe(false)

      cleanup() // Should be safe to call even after auto-removal
    })

    it('should remove specific event listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      manager.on('start', listener1)
      manager.on('start', listener2)

      expect(manager.getListenerCount('start')).toBe(2)

      manager.off('start', listener1)

      expect(manager.getListenerCount('start')).toBe(1)
    })

    it('should clean up all event listeners on cleanup', () => {
      const listener = vi.fn()

      manager.on('start', listener)
      manager.on('end', listener)
      manager.once('update', listener)

      expect(manager.hasListeners('start')).toBe(true)
      expect(manager.hasListeners('end')).toBe(true)
      expect(manager.hasListeners('update')).toBe(true)

      manager.cleanup()

      expect(manager.hasListeners('start')).toBe(false)
      expect(manager.hasListeners('end')).toBe(false)
      expect(manager.hasListeners('update')).toBe(false)
    })

    it('should handle event listener errors gracefully', async () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      const normalListener = vi.fn()

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      manager.on('start', errorListener)
      manager.on('start', normalListener)

      // Trigger event
      const firstItem = container.querySelector('.item') as HTMLElement
      const startEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })
      firstItem.dispatchEvent(startEvent)
      await manager.waitForUpdate()

      expect(errorListener).toHaveBeenCalled()
      expect(normalListener).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
