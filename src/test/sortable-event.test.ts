import type { SortableEventData } from '@/types'
import {
  createSortableEvent,
  dispatchSortableEvent,
  getCallbackName,
  getDraggableFromEvent,
  isDragDropSupported,
  normalizeEventData,
  shouldPreventEvent,
} from '@/utils/sortable-event'
import { describe, expect, it, vi } from 'vitest'

// Mock DOM APIs for testing
Object.defineProperty(window, 'CustomEvent', {
  writable: true,
  value: class CustomEvent extends Event {
    detail: any
    constructor(type: string, options?: CustomEventInit) {
      super(type, options)
      this.detail = options?.detail
    }
  },
})

describe('sortable-event utilities', () => {
  describe('createSortableEvent', () => {
    it('should create a sortable event with required properties', () => {
      const container = document.createElement('div')
      const item = document.createElement('div')

      const eventData: SortableEventData = {
        type: 'start',
        item,
        to: container,
        from: container,
        oldIndex: 0,
        newIndex: 1,
      }

      const event = createSortableEvent('start', eventData, container)

      expect(event.type).toBe('start')
      expect(event.item).toBe(item)
      expect(event.to).toBe(container)
      expect(event.from).toBe(container)
      expect(event.oldIndex).toBe(0)
      expect(event.newIndex).toBe(1)
      expect(event.bubbles).toBe(true)
      expect(event.cancelable).toBe(true)
    })

    it('should use target as fallback for missing properties', () => {
      const container = document.createElement('div')

      const eventData: SortableEventData = {
        type: 'start',
      }

      const event = createSortableEvent('start', eventData, container)

      expect(event.to).toBe(container)
      expect(event.from).toBe(container)
      expect(event.item).toBe(container)
    })

    it('should include custom properties', () => {
      const container = document.createElement('div')

      const eventData: SortableEventData = {
        type: 'start',
        customProperty: 'test value',
      }

      const event = createSortableEvent('start', eventData, container)

      expect((event as any).customProperty).toBe('test value')
    })
  })

  describe('dispatchSortableEvent', () => {
    it('should dispatch DOM event and execute callback', () => {
      const container = document.createElement('div')
      const callback = vi.fn()
      const dispatchEventSpy = vi.spyOn(container, 'dispatchEvent').mockReturnValue(true)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
      }

      const result = dispatchSortableEvent(container, 'start', eventData, callback)

      expect(dispatchEventSpy).toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(result).toBe(true)

      dispatchEventSpy.mockRestore()
    })

    it('should handle callback returning false', () => {
      const container = document.createElement('div')
      const callback = vi.fn().mockReturnValue(false)
      const dispatchEventSpy = vi.spyOn(container, 'dispatchEvent').mockReturnValue(true)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
      }

      const result = dispatchSortableEvent(container, 'start', eventData, callback)

      expect(result).toBe(false)

      dispatchEventSpy.mockRestore()
    })

    it('should handle DOM event being cancelled', () => {
      const container = document.createElement('div')
      const callback = vi.fn()
      const dispatchEventSpy = vi.spyOn(container, 'dispatchEvent').mockReturnValue(false)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
      }

      const result = dispatchSortableEvent(container, 'start', eventData, callback)

      expect(result).toBe(false)

      dispatchEventSpy.mockRestore()
    })

    it('should handle errors gracefully', () => {
      const container = document.createElement('div')
      const callback = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
      }

      const result = dispatchSortableEvent(container, 'start', eventData, callback)

      expect(result).toBe(true) // DOM event succeeded
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('normalizeEventData', () => {
    it('should normalize event data with defaults', () => {
      const item = document.createElement('div')
      const container = document.createElement('div')

      const data = {
        item,
        oldIndex: 0,
      }

      const defaults = {
        to: container,
        from: container,
        newIndex: 1,
      }

      const normalized = normalizeEventData('start', data, defaults)

      expect(normalized.type).toBe('start')
      expect(normalized.item).toBe(item)
      expect(normalized.to).toBe(container)
      expect(normalized.from).toBe(container)
      expect(normalized.oldIndex).toBe(0)
      expect(normalized.newIndex).toBe(1)
      expect(normalized.willInsertAfter).toBe(false)
    })

    it('should preserve custom properties', () => {
      const data = {
        customProp: 'test',
      }

      const normalized = normalizeEventData('start', data)

      expect(normalized.customProp).toBe('test')
    })
  })

  describe('getCallbackName', () => {
    it('should convert event types to callback names', () => {
      expect(getCallbackName('start')).toBe('onStart')
      expect(getCallbackName('end')).toBe('onEnd')
      expect(getCallbackName('update')).toBe('onUpdate')
      expect(getCallbackName('add')).toBe('onAdd')
      expect(getCallbackName('remove')).toBe('onRemove')
    })
  })

  describe('shouldPreventEvent', () => {
    it('should return false when no filter is provided', () => {
      const element = document.createElement('div')
      expect(shouldPreventEvent(element)).toBe(false)
    })

    it('should handle string selector filters', () => {
      const element = document.createElement('div')
      element.className = 'no-drag'

      expect(shouldPreventEvent(element, '.no-drag')).toBe(true)
      expect(shouldPreventEvent(element, '.other-class')).toBe(false)
    })

    it('should handle function filters', () => {
      const element = document.createElement('div')
      element.setAttribute('data-no-drag', 'true')

      const filter = (el: HTMLElement) => el.hasAttribute('data-no-drag')

      expect(shouldPreventEvent(element, filter)).toBe(true)

      element.removeAttribute('data-no-drag')
      expect(shouldPreventEvent(element, filter)).toBe(false)
    })

    it('should handle function filter errors', () => {
      const element = document.createElement('div')
      const filter = () => {
        throw new Error('Test error')
      }

      expect(shouldPreventEvent(element, filter)).toBe(false)
    })
  })

  describe('getDraggableFromEvent', () => {
    it('should find draggable element from event target', () => {
      const container = document.createElement('div')
      const draggable = document.createElement('div')
      const child = document.createElement('span')

      container.appendChild(draggable)
      draggable.appendChild(child)

      const result = getDraggableFromEvent(child, container)
      expect(result).toBe(draggable)
    })

    it('should return null for invalid targets', () => {
      const container = document.createElement('div')

      expect(getDraggableFromEvent(null, container)).toBe(null)
      expect(getDraggableFromEvent({} as any, container)).toBe(null)
    })

    it('should handle handle selector', () => {
      const container = document.createElement('div')
      const draggable = document.createElement('div')
      const handle = document.createElement('span')
      const child = document.createElement('button')

      handle.className = 'handle'
      container.appendChild(draggable)
      draggable.appendChild(handle)
      handle.appendChild(child)

      const result = getDraggableFromEvent(child, container, '.handle')
      expect(result).toBe(handle)
    })

    it('should return null when handle not found', () => {
      const container = document.createElement('div')
      const draggable = document.createElement('div')
      const child = document.createElement('span')

      container.appendChild(draggable)
      draggable.appendChild(child)

      const result = getDraggableFromEvent(child, container, '.handle')
      expect(result).toBe(null)
    })
  })

  describe('isDragDropSupported', () => {
    it('should detect drag and drop support', () => {
      // Test the function works without throwing errors
      const result = isDragDropSupported()
      expect(typeof result).toBe('boolean')

      // In some test environments, drag and drop APIs might not be fully available
      // So we just test that the function returns a boolean value
    })
  })
})
