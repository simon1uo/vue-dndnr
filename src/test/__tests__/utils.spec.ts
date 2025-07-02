import { describe, expect, it } from 'vitest'
import { cleanup, createPointerEvent, createPosition, mockResizeObserver, wait } from '..'

describe('test utils', () => {
  it('should create position with default values', () => {
    const position = createPosition()
    expect(position.x).toBe(0)
    expect(position.y).toBe(0)
  })

  it('should create position with custom values', () => {
    const position = createPosition(100, 200)
    expect(position.x).toBe(100)
    expect(position.y).toBe(200)
  })

  it('should create pointer event with correct properties', () => {
    const position = createPosition(100, 200)
    const event = createPointerEvent('pointerdown', position)
    expect(event.type).toBe('pointerdown')
    expect(event.clientX).toBe(100)
    expect(event.clientY).toBe(200)
    expect(event.bubbles).toBe(true)
  })

  it('should wait for specified time', async () => {
    const start = Date.now()
    await wait(100)
    const duration = Date.now() - start
    expect(duration).toBeGreaterThanOrEqual(100)
  })

  it('should mock ResizeObserver', () => {
    const _ResizeObserver = mockResizeObserver()
    expect(globalThis.ResizeObserver).toBeDefined()
    expect(typeof globalThis.ResizeObserver.prototype.observe).toBe('function')
    expect(typeof globalThis.ResizeObserver.prototype.unobserve).toBe('function')
    expect(typeof globalThis.ResizeObserver.prototype.disconnect).toBe('function')
    cleanup()
    expect(globalThis.ResizeObserver).toBeUndefined()
  })
})
