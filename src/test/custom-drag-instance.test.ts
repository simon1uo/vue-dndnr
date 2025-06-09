import type { SortableEventCallbacks, SortableOptions } from '@/types'
import { CustomDragInstance } from '@/core/custom-drag-instance'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('customDragInstance', () => {
  let container: HTMLElement
  let dragInstance: CustomDragInstance
  let onStart: ReturnType<typeof vi.fn>
  let onEnd: ReturnType<typeof vi.fn>
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="item" data-id="1">Item 1</div>
      <div class="item" data-id="2">Item 2</div>
      <div class="item" data-id="3">Item 3</div>
    `
    document.body.appendChild(container)

    onStart = vi.fn()
    onEnd = vi.fn()
    onUpdate = vi.fn()

    const options: SortableOptions & SortableEventCallbacks = {
      draggable: '.item',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onStart,
      onEnd,
      onUpdate,
    }

    dragInstance = new CustomDragInstance(container, options)
  })

  afterEach(() => {
    dragInstance.destroy()
    document.body.removeChild(container)
  })

  describe('initialization', () => {
    it('should create instance with correct options', () => {
      expect(dragInstance).toBeDefined()
    })

    it('should set up event listeners on container', () => {
      const firstItem = container.querySelector('.item') as HTMLElement
      expect(firstItem).toBeTruthy()
    })
  })

  describe('mouse Events', () => {
    it('should handle mouse down on draggable element', () => {
      const firstItem = container.querySelector('.item') as HTMLElement
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })

      firstItem.dispatchEvent(mouseDownEvent)

      expect(firstItem.classList.contains('sortable-chosen')).toBe(true)
      expect(onStart).toHaveBeenCalledTimes(1)
    })

    it('should ignore mouse down on non-draggable elements', () => {
      const nonDraggable = document.createElement('span')
      nonDraggable.textContent = 'Not draggable'
      container.appendChild(nonDraggable)

      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })

      nonDraggable.dispatchEvent(mouseDownEvent)

      expect(onStart).not.toHaveBeenCalled()
    })

    it('should handle mouse move during drag', () => {
      const firstItem = container.querySelector('.item') as HTMLElement

      // Start drag
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 50,
      })
      firstItem.dispatchEvent(mouseDownEvent)

      // Move mouse
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 100,
        clientY: 150,
      })
      document.dispatchEvent(mouseMoveEvent)

      expect(firstItem.classList.contains('sortable-drag')).toBe(true)
    })

    it('should handle mouse up to end drag', () => {
      const firstItem = container.querySelector('.item') as HTMLElement

      // Start drag
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })
      firstItem.dispatchEvent(mouseDownEvent)

      // End drag
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      })
      document.dispatchEvent(mouseUpEvent)

      expect(firstItem.classList.contains('sortable-chosen')).toBe(false)
      expect(firstItem.classList.contains('sortable-drag')).toBe(false)
      expect(onEnd).toHaveBeenCalledTimes(1)
    })
  })

  describe('touch Events', () => {
    it('should handle touch start on draggable element', () => {
      const firstItem = container.querySelector('.item') as HTMLElement
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [new Touch({
          identifier: 0,
          target: firstItem,
          clientX: 100,
          clientY: 100,
        })],
      })

      firstItem.dispatchEvent(touchStartEvent)

      expect(firstItem.classList.contains('sortable-chosen')).toBe(true)
      expect(onStart).toHaveBeenCalledTimes(1)
    })

    it('should handle touch move during drag', () => {
      const firstItem = container.querySelector('.item') as HTMLElement

      // Start drag
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [new Touch({
          identifier: 0,
          target: firstItem,
          clientX: 100,
          clientY: 50,
        })],
      })
      firstItem.dispatchEvent(touchStartEvent)

      // Move touch
      const touchMoveEvent = new TouchEvent('touchmove', {
        bubbles: true,
        touches: [new Touch({
          identifier: 0,
          target: firstItem,
          clientX: 100,
          clientY: 150,
        })],
      })
      document.dispatchEvent(touchMoveEvent)

      expect(firstItem.classList.contains('sortable-drag')).toBe(true)
    })

    it('should handle touch end to end drag', () => {
      const firstItem = container.querySelector('.item') as HTMLElement

      // Start drag
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        touches: [new Touch({
          identifier: 0,
          target: firstItem,
          clientX: 100,
          clientY: 100,
        })],
      })
      firstItem.dispatchEvent(touchStartEvent)

      // End drag
      const touchEndEvent = new TouchEvent('touchend', {
        bubbles: true,
        changedTouches: [new Touch({
          identifier: 0,
          target: firstItem,
          clientX: 100,
          clientY: 200,
        })],
      })
      document.dispatchEvent(touchEndEvent)

      expect(firstItem.classList.contains('sortable-chosen')).toBe(false)
      expect(firstItem.classList.contains('sortable-drag')).toBe(false)
      expect(onEnd).toHaveBeenCalledTimes(1)
    })
  })

  describe('ghost Element', () => {
    it('should create ghost element during drag', () => {
      const firstItem = container.querySelector('.item') as HTMLElement
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })

      firstItem.dispatchEvent(mouseDownEvent)

      const ghostElement = container.querySelector('.sortable-ghost')
      expect(ghostElement).toBeTruthy()
      expect(ghostElement?.textContent).toBe('Item 1')
    })

    it('should remove ghost element after drag', () => {
      const firstItem = container.querySelector('.item') as HTMLElement

      // Start drag
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })
      firstItem.dispatchEvent(mouseDownEvent)

      // Verify ghost exists
      expect(container.querySelector('.sortable-ghost')).toBeTruthy()

      // End drag
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      })
      document.dispatchEvent(mouseUpEvent)

      // Verify ghost is removed
      expect(container.querySelector('.sortable-ghost')).toBeNull()
    })
  })

  describe('direction Detection', () => {
    it('should detect layout direction correctly', () => {
      // Access private method for testing
      const direction = (dragInstance as any).detectDirection()
      // Default layout should be detected based on actual element positions
      expect(['vertical', 'horizontal']).toContain(direction)
    })

    it('should detect horizontal layout with flex', () => {
      // Create horizontal layout
      container.style.display = 'flex'
      container.style.flexDirection = 'row'
      container.style.gap = '20px'

      const direction = (dragInstance as any).detectDirection()
      expect(direction).toBe('horizontal')
    })
  })

  describe('position Calculation', () => {
    it('should calculate insert position correctly', () => {
      const secondItem = container.children[1] as HTMLElement

      // Mock getBoundingClientRect to return predictable values for vertical layout
      const mockRect = {
        top: 100,
        left: 50,
        bottom: 150,
        right: 200,
        width: 150,
        height: 50,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      }

      vi.spyOn(secondItem, 'getBoundingClientRect').mockReturnValue(mockRect)

      // Mock detectDirection to return vertical
      vi.spyOn(dragInstance as any, 'detectDirection').mockReturnValue('vertical')

      // Test position in upper half (should return -1 for before)
      const beforePosition = (dragInstance as any).calculateInsertPosition(
        { clientX: 125, clientY: 112 }, // 25% down from top
        secondItem,
      )
      expect(beforePosition).toBe(-1)

      // Test position in lower half (should return 1 for after)
      const afterPosition = (dragInstance as any).calculateInsertPosition(
        { clientX: 125, clientY: 137 }, // 75% down from top
        secondItem,
      )
      expect(afterPosition).toBe(1)
    })
  })

  describe('options Update', () => {
    it('should update options correctly', () => {
      const newOptions = {
        ghostClass: 'new-ghost-class',
        chosenClass: 'new-chosen-class',
      }

      dragInstance.updateOptions(newOptions)

      // Test that new options are applied
      const firstItem = container.querySelector('.item') as HTMLElement
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })

      firstItem.dispatchEvent(mouseDownEvent)

      expect(firstItem.classList.contains('new-chosen-class')).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should clean up event listeners on destroy', () => {
      const firstItem = container.querySelector('.item') as HTMLElement

      dragInstance.destroy()

      // Try to trigger events after destroy
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      })
      firstItem.dispatchEvent(mouseDownEvent)

      expect(onStart).not.toHaveBeenCalled()
    })
  })
})
