import type { RenderOptions } from '@testing-library/vue'
import type { Component } from 'vue'
import type { DragLocation, Position } from '../types/core'
import { render } from '@testing-library/vue'

/**
 * Creates a mock drag location
 * @param dropId - The ID of the droppable container
 * @param index - The index within the container
 */
export function createDragLocation(dropId: string = 'test-drop', index: number = 0): DragLocation {
  return {
    dropId,
    index,
  }
}

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
 * Cleans up after tests
 */
export function cleanup() {
  // @ts-expect-error - ResizeObserver might not exist
  delete globalThis.ResizeObserver
}
