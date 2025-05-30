import { describe, expect, it } from 'vitest'
import { createIdGenerator, getElementId, getSequentialId, getUniqueId } from '../id'

describe('id utils', () => {
  it('should generate unique IDs with default prefix', () => {
    const id1 = getUniqueId()
    const id2 = getUniqueId()

    expect(id1).toMatch(/^dnd-\d+-\d+$/)
    expect(id2).toMatch(/^dnd-\d+-\d+$/)
    expect(id1).not.toBe(id2)
  })

  it('should generate unique IDs with custom prefix', () => {
    const id = getUniqueId('custom')
    expect(id).toMatch(/^custom-\d+-\d+$/)
  })

  it('should get or create element ID', () => {
    const element = document.createElement('div')
    const id = getElementId(element)

    expect(id).toBe(element.id)
    expect(id).toMatch(/^dnd-el-\d+-\d+$/)

    // Should return the same ID for the same element
    const id2 = getElementId(element)
    expect(id2).toBe(id)
  })

  it('should get or create element ID with custom prefix', () => {
    const element = document.createElement('div')
    const id = getElementId(element, 'custom')

    expect(id).toBe(element.id)
    expect(id).toMatch(/^custom-\d+-\d+$/)
  })

  it('should generate sequential IDs', () => {
    const id1 = getSequentialId('test', 1)
    const id2 = getSequentialId('test', 2)

    expect(id1).toBe('test-1')
    expect(id2).toBe('test-2')
  })

  it('should create ID generator function', () => {
    const generateId = createIdGenerator('item')

    const id1 = generateId()
    const id2 = generateId()
    const id3 = generateId()

    expect(id1).toBe('item-0')
    expect(id2).toBe('item-1')
    expect(id3).toBe('item-2')
  })
})
