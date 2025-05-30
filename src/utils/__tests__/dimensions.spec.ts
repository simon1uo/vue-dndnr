import { describe, expect, it, vi } from 'vitest'
import * as configModule from '../config'
import { getViewport, isElementVisible } from '../dimensions'

describe('dimensions utils', () => {
  describe('getViewport', () => {
    it('should return viewport dimensions', () => {
      // Mock window.innerWidth and window.innerHeight
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768)

      const viewport = getViewport()

      expect(viewport.width).toBe(1024)
      expect(viewport.height).toBe(768)
    })

    it('should return zeros when not in client environment', () => {
      // Mock isClient to return false
      const isClientSpy = vi.spyOn(configModule, 'isClient', 'get').mockReturnValue(false)

      const viewport = getViewport()

      expect(viewport.width).toBe(0)
      expect(viewport.height).toBe(0)

      isClientSpy.mockRestore()
    })
  })

  describe('isElementVisible', () => {
    it('should return true when element is fully visible in container', () => {
      // Create test elements
      const container = document.createElement('div')
      const element = document.createElement('div')

      // Mock getBoundingClientRect for both elements
      container.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      })

      element.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 25,
        left: 25,
        bottom: 75,
        right: 75,
      })

      expect(isElementVisible(element, container, false)).toBe(true)
    })

    it('should return false when element is outside container', () => {
      // Create test elements
      const container = document.createElement('div')
      const element = document.createElement('div')

      // Mock getBoundingClientRect for both elements
      container.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      })

      element.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 150,
        left: 150,
        bottom: 200,
        right: 200,
      })

      expect(isElementVisible(element, container, false)).toBe(false)
    })

    it('should return true when element is partially visible and partial flag is true', () => {
      // Create test elements
      const container = document.createElement('div')
      const element = document.createElement('div')

      // Mock getBoundingClientRect for both elements
      container.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      })

      element.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 50,
        left: 50,
        bottom: 150,
        right: 150,
      })

      expect(isElementVisible(element, container, true)).toBe(true)
      expect(isElementVisible(element, container, false)).toBe(false)
    })
  })
})
