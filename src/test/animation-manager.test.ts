import type { AnimationOptions } from '@/core/animation-manager'
import { AnimationManager } from '@/core/animation-manager'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createTestContainer, createTestElement } from './utils'

describe('animationManager', () => {
  let container: HTMLElement
  let animationManager: AnimationManager
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn<[callback: FrameRequestCallback], number>>
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn<[handle: number], void>>

  beforeEach(() => {
    container = createTestContainer()
    animationManager = new AnimationManager(container)

    // Mock animation frame functions
    mockRequestAnimationFrame = vi.fn<[callback: FrameRequestCallback], number>((callback) => {
      setTimeout(callback, 16)
      return 1
    })
    mockCancelAnimationFrame = vi.fn<[handle: number], void>()

    globalThis.requestAnimationFrame = mockRequestAnimationFrame as unknown as typeof globalThis.requestAnimationFrame
    globalThis.cancelAnimationFrame = mockCancelAnimationFrame as unknown as typeof globalThis.cancelAnimationFrame

    // Mock DOMMatrix for transform calculations
    globalThis.DOMMatrix = vi.fn().mockImplementation((transform) => {
      if (transform === 'none' || !transform)
        return null
      // Simple mock for basic transform parsing
      return {
        a: 1, // scaleX
        d: 1, // scaleY
        e: 0, // translateX
        f: 0, // translateY
      }
    }) as unknown as typeof globalThis.DOMMatrix
  })

  afterEach(() => {
    animationManager.destroy()
    container.remove()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create animation manager with default options', () => {
      const manager = new AnimationManager()
      expect(manager.isAnimating.value).toBe(false)
      expect(manager.animatingElements.value).toEqual([])
    })

    it('should create animation manager with container and options', () => {
      const options: AnimationOptions = { animation: 300, easing: 'ease-in' }
      const manager = new AnimationManager(container, options)
      expect(manager.isAnimating.value).toBe(false)
      expect(manager.animatingElements.value).toEqual([])
    })

    it('should accept reactive options', () => {
      const reactiveOptions = ref<AnimationOptions>({ animation: 200 })
      const manager = new AnimationManager(container, reactiveOptions)
      expect(manager.isAnimating.value).toBe(false)
    })
  })

  describe('setContainer', () => {
    it('should update container element', () => {
      const newContainer = createTestContainer()
      animationManager.setContainer(newContainer)
      // Container is private, but we can test through captureAnimationState
      animationManager.captureAnimationState()
      expect(animationManager.isAnimating.value).toBe(false)
      newContainer.remove()
    })

    it('should handle null container', () => {
      animationManager.setContainer(null)
      animationManager.captureAnimationState()
      expect(animationManager.isAnimating.value).toBe(false)
    })
  })

  describe('updateOptions', () => {
    it('should update animation options', () => {
      const newOptions: AnimationOptions = { animation: 500, easing: 'ease-out' }
      animationManager.updateOptions(newOptions)
      // Options are private, but we can test through animation behavior
      expect(animationManager.isAnimating.value).toBe(false)
    })

    it('should update with reactive options', () => {
      const reactiveOptions = ref<AnimationOptions>({ animation: 300 })
      animationManager.updateOptions(reactiveOptions)

      reactiveOptions.value = { animation: 400, disabled: true }
      expect(animationManager.isAnimating.value).toBe(false)
    })
  })

  describe('captureAnimationState', () => {
    it('should capture state of child elements', () => {
      const child1 = createTestElement('div', 'Item 1')
      const child2 = createTestElement('div', 'Item 2')
      container.appendChild(child1)
      container.appendChild(child2)

      animationManager.updateOptions({ animation: 150 })
      animationManager.captureAnimationState()

      // State is captured internally, verify through fromRect property
      expect(child1.fromRect).toBeDefined()
      expect(child2.fromRect).toBeDefined()
    })

    it('should skip hidden elements', () => {
      const child1 = createTestElement('div', 'Visible')
      const child2 = createTestElement('div', 'Hidden')
      child2.style.display = 'none'

      container.appendChild(child1)
      container.appendChild(child2)

      animationManager.updateOptions({ animation: 150 })
      animationManager.captureAnimationState()

      expect(child1.fromRect).toBeDefined()
      expect(child2.fromRect).toBeUndefined()
    })

    it('should skip ghost elements', () => {
      const child1 = createTestElement('div', 'Normal')
      const child2 = createTestElement('div', 'Ghost')
      child2.classList.add('sortable-ghost')

      container.appendChild(child1)
      container.appendChild(child2)

      animationManager.updateOptions({ animation: 150 })
      animationManager.captureAnimationState()

      expect(child1.fromRect).toBeDefined()
      expect(child2.fromRect).toBeUndefined()
    })

    it('should not capture when animation is disabled', () => {
      const child = createTestElement('div', 'Item')
      container.appendChild(child)

      animationManager.updateOptions({ animation: 0 })
      animationManager.captureAnimationState()

      expect(child.fromRect).toBeUndefined()
    })

    it('should not capture when disabled option is true', () => {
      const child = createTestElement('div', 'Item')
      container.appendChild(child)

      animationManager.updateOptions({ animation: 150, disabled: true })
      animationManager.captureAnimationState()

      expect(child.fromRect).toBeUndefined()
    })

    it('should not capture when container is null', () => {
      animationManager.setContainer(null)
      animationManager.updateOptions({ animation: 150 })
      animationManager.captureAnimationState()

      expect(animationManager.isAnimating.value).toBe(false)
    })
  })

  describe('addAnimationState', () => {
    it('should add animation state for element', () => {
      const element = createTestElement('div', 'Test')
      const rect = { top: 0, left: 0, width: 100, height: 50 }

      animationManager.addAnimationState({
        target: element,
        rect,
      })

      // State is added internally, verify through animateAll behavior
      expect(animationManager.isAnimating.value).toBe(false)
    })
  })

  describe('removeAnimationState', () => {
    it('should remove animation state for element', () => {
      const element = createTestElement('div', 'Test')
      const rect = { top: 0, left: 0, width: 100, height: 50 }

      animationManager.addAnimationState({
        target: element,
        rect,
      })

      animationManager.removeAnimationState(element)

      // State is removed internally, verify through animateAll behavior
      expect(animationManager.isAnimating.value).toBe(false)
    })

    it('should handle removing non-existent element', () => {
      const element = createTestElement('div', 'Test')

      // Should not throw error
      expect(() => {
        animationManager.removeAnimationState(element)
      }).not.toThrow()
    })
  })

  describe('animateAll', () => {
    it('should call callback immediately when animation is disabled', () => {
      const callback = vi.fn()
      animationManager.updateOptions({ animation: 0 })

      animationManager.animateAll(callback)

      expect(callback).toHaveBeenCalledOnce()
      expect(animationManager.isAnimating.value).toBe(false)
    })

    it('should call callback immediately when disabled option is true', () => {
      const callback = vi.fn()
      animationManager.updateOptions({ animation: 150, disabled: true })

      animationManager.animateAll(callback)

      expect(callback).toHaveBeenCalledOnce()
      expect(animationManager.isAnimating.value).toBe(false)
    })

    it('should call callback immediately when no animations needed', () => {
      const callback = vi.fn()
      animationManager.updateOptions({ animation: 150 })

      // No captured states, so no animations
      animationManager.animateAll(callback)

      expect(callback).toHaveBeenCalledOnce()
      expect(animationManager.isAnimating.value).toBe(false)
    })

    it('should animate elements with position changes', async () => {
      const child1 = createTestElement('div', 'Item 1')
      const child2 = createTestElement('div', 'Item 2')
      container.appendChild(child1)
      container.appendChild(child2)

      // Mock getBoundingClientRect to simulate position changes
      const originalGetBoundingClientRect = child1.getBoundingClientRect
      child1.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 0,
        left: 0,
        width: 100,
        height: 50,
      })

      animationManager.updateOptions({ animation: 150 })
      animationManager.captureAnimationState()

      // Simulate position change
      child1.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 50,
        left: 0,
        width: 100,
        height: 50,
      })

      const callback = vi.fn()
      animationManager.animateAll(callback)

      expect(animationManager.isAnimating.value).toBe(true)
      expect(animationManager.animatingElements.value).toContain(child1)

      // Restore original method
      child1.getBoundingClientRect = originalGetBoundingClientRect
    })

    it('should handle callback after animation completion', async () => {
      const child = createTestElement('div', 'Item')
      container.appendChild(child)

      // Mock getBoundingClientRect
      child.getBoundingClientRect = vi.fn()
        .mockReturnValueOnce({ top: 0, left: 0, width: 100, height: 50 })
        .mockReturnValueOnce({ top: 50, left: 0, width: 100, height: 50 })

      animationManager.updateOptions({ animation: 100 })
      animationManager.captureAnimationState()

      const callback = vi.fn()
      animationManager.animateAll(callback)

      expect(animationManager.isAnimating.value).toBe(true)

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(callback).toHaveBeenCalledOnce()
      expect(animationManager.isAnimating.value).toBe(false)
    })
  })

  describe('animate', () => {
    it('should not animate when duration is 0', () => {
      const element = createTestElement('div', 'Test')
      const currentRect = { top: 0, left: 0, width: 100, height: 50 }
      const toRect = { top: 50, left: 0, width: 100, height: 50 }

      animationManager.animate(element, currentRect, toRect, 0)

      expect(element.style.transform).toBe('')
      expect(element.style.transition).toBe('')
    })

    it('should apply transform and transition for animation', () => {
      const element = createTestElement('div', 'Test')
      const currentRect = { top: 0, left: 0, width: 100, height: 50 }
      const toRect = { top: 50, left: 0, width: 100, height: 50 }

      animationManager.updateOptions({ animation: 150, easing: 'ease-in' })
      animationManager.animate(element, currentRect, toRect, 150)

      expect(element.style.transform).toBe('translate3d(0,0,0)')
      expect(element.style.transition).toContain('transform')
      expect(element.style.transition).toContain('150ms')
      expect(element.style.transition).toContain('ease-in')
    })

    it('should set animating flags correctly', () => {
      const element = createTestElement('div', 'Test')
      const currentRect = { top: 0, left: 0, width: 100, height: 50 }
      const toRect = { top: 50, left: 25, width: 100, height: 50 }

      animationManager.animate(element, currentRect, toRect, 150)

      expect(element.animatingX).toBe(true)
      expect(element.animatingY).toBe(true)
    })

    it('should dispatch animation events', () => {
      const element = createTestElement('div', 'Test')
      const currentRect = { top: 0, left: 0, width: 100, height: 50 }
      const toRect = { top: 50, left: 0, width: 100, height: 50 }

      const startEventSpy = vi.fn()
      element.addEventListener('sortable:animation:start', startEventSpy)

      animationManager.animate(element, currentRect, toRect, 150)

      expect(startEventSpy).toHaveBeenCalledOnce()
      expect(startEventSpy.mock.calls[0][0].detail.type).toBe('start')
      expect(startEventSpy.mock.calls[0][0].detail.target).toBe(element)
    })

    it('should clean up after animation completion', async () => {
      const element = createTestElement('div', 'Test')
      const currentRect = { top: 0, left: 0, width: 100, height: 50 }
      const toRect = { top: 50, left: 0, width: 100, height: 50 }

      const endEventSpy = vi.fn()
      element.addEventListener('sortable:animation:end', endEventSpy)

      animationManager.animate(element, currentRect, toRect, 100)

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(element.style.transform).toBe('')
      expect(element.style.transition).toBe('')
      expect(element.animatingX).toBe(false)
      expect(element.animatingY).toBe(false)
      expect(endEventSpy).toHaveBeenCalledOnce()
    })
  })

  describe('cancelAnimations', () => {
    it('should cancel all ongoing animations', () => {
      const element1 = createTestElement('div', 'Item 1')
      const element2 = createTestElement('div', 'Item 2')

      // Set up elements as if they're animating
      element1.animated = setTimeout(() => {}, 1000) as unknown as NodeJS.Timeout
      element1.animatingX = true
      element1.animatingY = true
      element2.animated = setTimeout(() => {}, 1000) as unknown as NodeJS.Timeout
      element2.animatingX = true

      animationManager.animatingElements.value = [element1, element2]
      animationManager.isAnimating.value = true

      const cancelEventSpy1 = vi.fn()
      const cancelEventSpy2 = vi.fn()
      element1.addEventListener('sortable:animation:cancel', cancelEventSpy1)
      element2.addEventListener('sortable:animation:cancel', cancelEventSpy2)

      animationManager.cancelAnimations()

      expect(animationManager.isAnimating.value).toBe(false)
      expect(animationManager.animatingElements.value).toEqual([])
      expect(element1.animatingX).toBe(false)
      expect(element1.animatingY).toBe(false)
      expect(element2.animatingX).toBe(false)
      expect(cancelEventSpy1).toHaveBeenCalledOnce()
      expect(cancelEventSpy2).toHaveBeenCalledOnce()
    })

    it('should handle canceling when no animations are running', () => {
      expect(() => {
        animationManager.cancelAnimations()
      }).not.toThrow()

      expect(animationManager.isAnimating.value).toBe(false)
      expect(animationManager.animatingElements.value).toEqual([])
    })
  })

  describe('destroy', () => {
    it('should clean up all resources', () => {
      const element = createTestElement('div', 'Test')
      element.animated = setTimeout(() => {}, 1000) as unknown as NodeJS.Timeout
      element.animatingX = true

      animationManager.animatingElements.value = [element]
      animationManager.isAnimating.value = true

      animationManager.destroy()

      expect(animationManager.isAnimating.value).toBe(false)
      expect(animationManager.animatingElements.value).toEqual([])
      expect(element.animatingX).toBe(false)
    })
  })
})
