import type { SortableEventData } from '@/types'
import { EventDispatcher } from '@/core/event-dispatcher'
import { describe, expect, it, vi } from 'vitest'

describe('eventDispatcher', () => {
  let dispatcher: EventDispatcher

  beforeEach(() => {
    dispatcher = new EventDispatcher()
  })

  describe('event Registration', () => {
    it('should register event listeners', () => {
      const listener = vi.fn()
      const cleanup = dispatcher.on('start', listener)

      expect(dispatcher.hasListeners('start')).toBe(true)
      expect(dispatcher.getListenerCount('start')).toBe(1)
      expect(typeof cleanup).toBe('function')
    })

    it('should register multiple listeners for the same event', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      dispatcher.on('start', listener1)
      dispatcher.on('start', listener2)

      expect(dispatcher.getListenerCount('start')).toBe(2)
    })

    it('should register one-time listeners', () => {
      const listener = vi.fn()
      const cleanup = dispatcher.once('start', listener)

      expect(dispatcher.hasListeners('start')).toBe(true)
      expect(dispatcher.getListenerCount('start')).toBe(1)
      expect(typeof cleanup).toBe('function')
    })

    it('should not register the same listener twice', () => {
      const listener = vi.fn()

      dispatcher.on('start', listener)
      dispatcher.on('start', listener)

      expect(dispatcher.getListenerCount('start')).toBe(1)
    })
  })

  describe('event Dispatching', () => {
    it('should dispatch events to registered listeners', () => {
      const listener = vi.fn()
      dispatcher.on('start', listener)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
        to: document.createElement('div'),
        from: document.createElement('div'),
      }

      const result = dispatcher.dispatch('start', eventData)

      expect(listener).toHaveBeenCalledWith(eventData)
      expect(result).toBe(true)
    })

    it('should dispatch events to multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      dispatcher.on('start', listener1)
      dispatcher.on('start', listener2)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
        to: document.createElement('div'),
        from: document.createElement('div'),
      }

      dispatcher.dispatch('start', eventData)

      expect(listener1).toHaveBeenCalledWith(eventData)
      expect(listener2).toHaveBeenCalledWith(eventData)
    })

    it('should execute one-time listeners only once', () => {
      const listener = vi.fn()
      dispatcher.once('start', listener)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
        to: document.createElement('div'),
        from: document.createElement('div'),
      }

      dispatcher.dispatch('start', eventData)
      dispatcher.dispatch('start', eventData)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(dispatcher.hasListeners('start')).toBe(false)
    })

    it('should handle event cancellation', () => {
      const listener1 = vi.fn().mockReturnValue(false)
      const listener2 = vi.fn()

      dispatcher.on('start', listener1)
      dispatcher.on('start', listener2)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
        to: document.createElement('div'),
        from: document.createElement('div'),
      }

      const result = dispatcher.dispatch('start', eventData)

      expect(result).toBe(false)
      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    it('should handle errors in listeners gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      const normalListener = vi.fn()

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      dispatcher.on('start', errorListener)
      dispatcher.on('start', normalListener)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
        to: document.createElement('div'),
        from: document.createElement('div'),
      }

      const result = dispatcher.dispatch('start', eventData)

      expect(result).toBe(true)
      expect(errorListener).toHaveBeenCalled()
      expect(normalListener).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event listener for start:'),
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('event Removal', () => {
    it('should remove specific listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      dispatcher.on('start', listener1)
      dispatcher.on('start', listener2)

      expect(dispatcher.getListenerCount('start')).toBe(2)

      dispatcher.off('start', listener1)

      expect(dispatcher.getListenerCount('start')).toBe(1)

      const eventData: SortableEventData = {
        type: 'start',
        item: document.createElement('div'),
        to: document.createElement('div'),
        from: document.createElement('div'),
      }

      dispatcher.dispatch('start', eventData)

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    it('should remove all listeners for an event type', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      dispatcher.on('start', listener1)
      dispatcher.on('start', listener2)
      dispatcher.on('end', listener1)

      expect(dispatcher.getListenerCount('start')).toBe(2)
      expect(dispatcher.getListenerCount('end')).toBe(1)

      dispatcher.removeAllListeners('start')

      expect(dispatcher.hasListeners('start')).toBe(false)
      expect(dispatcher.hasListeners('end')).toBe(true)
    })

    it('should remove all listeners', () => {
      const listener = vi.fn()

      dispatcher.on('start', listener)
      dispatcher.on('end', listener)
      dispatcher.once('update', listener)

      expect(dispatcher.getEventTypes()).toEqual(expect.arrayContaining(['start', 'end', 'update']))

      dispatcher.removeAllListeners()

      expect(dispatcher.getEventTypes()).toEqual([])
      expect(dispatcher.hasListeners('start')).toBe(false)
      expect(dispatcher.hasListeners('end')).toBe(false)
      expect(dispatcher.hasListeners('update')).toBe(false)
    })

    it('should use cleanup function returned by on()', () => {
      const listener = vi.fn()
      const cleanup = dispatcher.on('start', listener)

      expect(dispatcher.hasListeners('start')).toBe(true)

      cleanup()

      expect(dispatcher.hasListeners('start')).toBe(false)
    })

    it('should use cleanup function returned by once()', () => {
      const listener = vi.fn()
      const cleanup = dispatcher.once('start', listener)

      expect(dispatcher.hasListeners('start')).toBe(true)

      cleanup()

      expect(dispatcher.hasListeners('start')).toBe(false)
    })
  })

  describe('utility Methods', () => {
    it('should return correct event types', () => {
      dispatcher.on('start', vi.fn())
      dispatcher.on('end', vi.fn())
      dispatcher.once('update', vi.fn())

      const eventTypes = dispatcher.getEventTypes()
      expect(eventTypes).toEqual(expect.arrayContaining(['start', 'end', 'update']))
      expect(eventTypes).toHaveLength(3)
    })

    it('should return correct listener counts', () => {
      const listener = vi.fn()

      dispatcher.on('start', listener)
      dispatcher.on('start', vi.fn())
      dispatcher.once('start', vi.fn())

      expect(dispatcher.getListenerCount('start')).toBe(3)
      expect(dispatcher.getListenerCount('end')).toBe(0)
    })

    it('should correctly identify if listeners exist', () => {
      expect(dispatcher.hasListeners('start')).toBe(false)

      dispatcher.on('start', vi.fn())
      expect(dispatcher.hasListeners('start')).toBe(true)

      dispatcher.removeAllListeners('start')
      expect(dispatcher.hasListeners('start')).toBe(false)
    })
  })
})
