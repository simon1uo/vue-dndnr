import type { Position } from '@/types'
import type { RenderOptions } from '@testing-library/vue'
import type { Component } from 'vue'
import { render } from '@testing-library/vue'

/**
 * Creates a mock position
 * @param x - The x coordinate
 * @param y - The y coordinate
 */
export function createPosition(x: number = 0, y: number = 0): Position {
  return { x, y }
}

/**
 * Creates a mock pointer event
 * @param type - The type of pointer event
 * @param position - The position of the pointer
 */
export function createPointerEvent(type: string, position: Position): PointerEvent {
  return new PointerEvent(type, {
    clientX: position.x,
    clientY: position.y,
    bubbles: true,
  })
}

/**
 * Renders a component with drag and drop context
 * @param component - The component to render
 * @param options - Additional render options
 */
export function renderWithDnD(
  component: Component,
  options: RenderOptions<typeof component> = {},
) {
  return render(component, {
    ...options,
    global: {
      ...options.global,
      stubs: {
        'transition': false,
        'transition-group': false,
        ...options.global?.stubs,
      },
    },
  })
}

/**
 * Waits for a specified amount of time
 * @param ms - The number of milliseconds to wait
 */
export function wait(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Creates a mock ResizeObserver for testing
 */
export function mockResizeObserver() {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.ResizeObserver = ResizeObserver
  return ResizeObserver
}

/**
 * Creates a test container element for sortable testing
 */
export function createTestContainer(): HTMLElement {
  const container = document.createElement('div')
  container.className = 'test-container'
  container.style.cssText = 'position: relative; width: 200px; height: 300px;'
  document.body.appendChild(container)
  return container
}

/**
 * Creates a test element for testing
 * @param tagName - The tag name of the element
 * @param textContent - The text content of the element
 */
export function createTestElement(tagName: string = 'div', textContent: string = ''): HTMLElement {
  const element = document.createElement(tagName)
  element.textContent = textContent
  element.style.cssText = 'position: relative; width: 100px; height: 50px; background: #f0f0f0;'

  // Mock getBoundingClientRect for testing
  element.getBoundingClientRect = () => ({
    top: 0,
    left: 0,
    width: 100,
    height: 50,
    right: 100,
    bottom: 50,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })

  return element
}

/**
 * Creates test items for sortable testing
 * @param count - Number of items to create
 */
export function createTestItems(count: number): HTMLElement[] {
  const items: HTMLElement[] = []
  for (let i = 0; i < count; i++) {
    const item = createTestElement('div', `Item ${i}`)
    item.className = 'draggable-item'
    item.setAttribute('data-id', `item-${i}`)
    item.style.cssText = 'height: 50px; margin: 5px; background: #f0f0f0; cursor: move;'
    items.push(item)
  }
  return items
}

/**
 * Cleans up test container
 * @param container - Container to clean up
 */
export function cleanupTestContainer(container: HTMLElement): void {
  if (container.parentNode) {
    container.parentNode.removeChild(container)
  }
}

/**
 * Cleans up after tests
 */
export function cleanup() {
  // @ts-expect-error - ResizeObserver might not exist
  delete globalThis.ResizeObserver
}
