import {
  calculateInsertIndex,
  createGhostElement,
  findDraggableElement,
  getChildAtIndex,
  getDraggableChildren,
  getDropPosition,
  getElementIndex,
  getLastChild,
  insertElementAtIndex,
} from '@/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('sortable DOM Utils', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="item" data-id="1">Item 1</div>
      <div class="item" data-id="2">Item 2</div>
      <div class="item" data-id="3">Item 3</div>
      <div class="item" data-id="4" style="display: none;">Hidden Item</div>
      <template>Template Item</template>
    `
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container)
    }
  })

  describe('getElementIndex', () => {
    it('should get correct element index', () => {
      const secondItem = container.children[1] as HTMLElement
      expect(getElementIndex(secondItem)).toBe(1)
    })

    it('should get correct index with selector filter', () => {
      const secondItem = container.children[1] as HTMLElement
      expect(getElementIndex(secondItem, '.item')).toBe(1)
    })

    it('should return -1 for element without parent', () => {
      const orphan = document.createElement('div')
      expect(getElementIndex(orphan)).toBe(-1)
    })

    it('should ignore hidden elements and templates', () => {
      const visibleItems = container.querySelectorAll('.item:not([style*="display: none"])')
      expect(visibleItems).toHaveLength(3)

      const thirdVisibleItem = visibleItems[2] as HTMLElement
      expect(getElementIndex(thirdVisibleItem, '.item')).toBe(2)
    })
  })

  describe('getDraggableChildren', () => {
    it('should get all draggable children with default selector', () => {
      const children = getDraggableChildren(container)
      expect(children).toHaveLength(3) // Excludes hidden item and template
      expect(children[0].dataset.id).toBe('1')
      expect(children[1].dataset.id).toBe('2')
      expect(children[2].dataset.id).toBe('3')
    })

    it('should get children with custom selector', () => {
      const children = getDraggableChildren(container, '.item')
      expect(children).toHaveLength(3) // Only visible .item elements
      expect(children.every(child => child.classList.contains('item'))).toBe(true)
    })

    it('should return empty array for null container', () => {
      const children = getDraggableChildren(null as any)
      expect(children).toEqual([])
    })

    it('should exclude hidden elements and templates', () => {
      const children = getDraggableChildren(container, '.item')
      const hiddenItem = children.find(child => child.style.display === 'none')
      expect(hiddenItem).toBeUndefined()
    })
  })

  describe('findDraggableElement', () => {
    it('should find draggable element from child', () => {
      const span = document.createElement('span')
      span.textContent = 'Nested content'
      const item = container.children[0] as HTMLElement
      item.appendChild(span)

      const found = findDraggableElement(span, container, '.item')
      expect(found).toBe(item)
    })

    it('should return null if no draggable parent found', () => {
      const outsideElement = document.createElement('div')
      document.body.appendChild(outsideElement)

      const found = findDraggableElement(outsideElement, container, '.item')
      expect(found).toBeNull()

      document.body.removeChild(outsideElement)
    })

    it('should return element itself if it matches selector', () => {
      const item = container.children[0] as HTMLElement
      const found = findDraggableElement(item, container, '.item')
      expect(found).toBe(item)
    })
  })

  describe('insertElementAtIndex', () => {
    it('should insert element at correct index', () => {
      const newItem = document.createElement('div')
      newItem.className = 'item'
      newItem.dataset.id = 'new'
      newItem.textContent = 'New Item'

      insertElementAtIndex(container, newItem, 1)

      const children = getDraggableChildren(container, '.item')
      expect(children[1].dataset.id).toBe('new')
      expect(children).toHaveLength(4)
    })

    it('should append element when index is greater than children length', () => {
      const newItem = document.createElement('div')
      newItem.className = 'item'
      newItem.dataset.id = 'last'

      insertElementAtIndex(container, newItem, 999)

      const children = getDraggableChildren(container, '.item')
      expect(children[children.length - 1].dataset.id).toBe('last')
    })

    it('should insert at beginning when index is 0', () => {
      const newItem = document.createElement('div')
      newItem.className = 'item'
      newItem.dataset.id = 'first'

      insertElementAtIndex(container, newItem, 0)

      const children = getDraggableChildren(container, '.item')
      expect(children[0].dataset.id).toBe('first')
    })
  })

  describe('createGhostElement', () => {
    it('should create ghost element with default class', () => {
      const original = container.children[0] as HTMLElement
      const ghost = createGhostElement(original)

      expect(ghost.classList.contains('sortable-ghost')).toBe(true)
      expect(ghost.style.pointerEvents).toBe('none')
      expect(ghost.style.opacity).toBe('0.5')
      expect(ghost.style.position).toBe('absolute')
      expect(ghost.style.zIndex).toBe('100000')
    })

    it('should create ghost element with custom class', () => {
      const original = container.children[0] as HTMLElement
      const ghost = createGhostElement(original, 'custom-ghost')

      expect(ghost.classList.contains('custom-ghost')).toBe(true)
      expect(ghost.classList.contains('sortable-ghost')).toBe(false)
    })

    it('should clone content correctly', () => {
      const original = container.children[0] as HTMLElement
      const ghost = createGhostElement(original)

      expect(ghost.textContent).toBe(original.textContent)
      expect(ghost.dataset.id).toBe(original.dataset.id)
      expect(ghost).not.toBe(original) // Should be a different element
    })
  })

  describe('getChildAtIndex', () => {
    it('should get child at specific index', () => {
      const child = getChildAtIndex(container, 1, '.item')
      expect(child?.dataset.id).toBe('2')
    })

    it('should return null for invalid index', () => {
      const child = getChildAtIndex(container, 999, '.item')
      expect(child).toBeNull()
    })

    it('should ignore hidden elements', () => {
      const child = getChildAtIndex(container, 2, '.item')
      expect(child?.dataset.id).toBe('3') // Should skip hidden item
    })
  })

  describe('getLastChild', () => {
    it('should get last visible child', () => {
      const last = getLastChild(container, '.item')
      expect(last?.dataset.id).toBe('3') // Should skip hidden item and template
    })

    it('should return null for empty container', () => {
      const emptyContainer = document.createElement('div')
      const last = getLastChild(emptyContainer)
      expect(last).toBeNull()
    })

    it('should work without selector', () => {
      const last = getLastChild(container)
      expect(last?.dataset.id).toBe('3') // Should get last visible element
    })
  })

  describe('getDropPosition', () => {
    beforeEach(() => {
      // Mock getBoundingClientRect for testing
      const items = container.querySelectorAll('.item:not([style*="display: none"])')
      items.forEach((item, index) => {
        const element = item as HTMLElement
        element.getBoundingClientRect = () => ({
          top: index * 50,
          bottom: (index + 1) * 50,
          left: 0,
          right: 100,
          width: 100,
          height: 50,
          x: 0,
          y: index * 50,
          toJSON: () => ({}),
        })
      })
    })

    it('should return correct drop position for middle of first item', () => {
      const position = getDropPosition(container, 25, '.item') // Middle of first item (0-50, middle=25)
      expect(position.index).toBe(1) // At middle, insert after first element
      expect(position.insertAfter).toBe(true)
    })

    it('should return correct drop position for between items', () => {
      const position = getDropPosition(container, 75, '.item') // In second item (50-100, middle=75)
      expect(position.index).toBe(2) // At middle of second element, insert after it
      expect(position.insertAfter).toBe(true)
    })

    it('should return correct drop position for end', () => {
      const position = getDropPosition(container, 200, '.item') // After all items
      expect(position.index).toBe(3)
      expect(position.insertAfter).toBe(true)
    })

    it('should handle empty container', () => {
      const emptyContainer = document.createElement('div')
      const position = getDropPosition(emptyContainer, 50, '.item')
      expect(position.index).toBe(0)
      expect(position.insertAfter).toBe(true)
      expect(position.target).toBeNull()
    })
  })

  describe('calculateInsertIndex', () => {
    beforeEach(() => {
      // Mock getBoundingClientRect for testing
      const items = container.querySelectorAll('.item:not([style*="display: none"])')
      items.forEach((item, index) => {
        const element = item as HTMLElement
        element.getBoundingClientRect = () => ({
          top: index * 50,
          bottom: (index + 1) * 50,
          left: 0,
          right: 100,
          width: 100,
          height: 50,
          x: 0,
          y: index * 50,
          toJSON: () => ({}),
        })
      })
    })

    it('should calculate correct insert index', () => {
      const index = calculateInsertIndex(container, 50, 25, '.item') // In first item middle
      expect(index).toBe(1) // At middle, insert after first element
    })

    it('should calculate index for end position', () => {
      const index = calculateInsertIndex(container, 50, 200, '.item')
      expect(index).toBe(3)
    })

    it('should calculate index for middle positions', () => {
      const index1 = calculateInsertIndex(container, 50, 75, '.item') // In second item middle
      expect(index1).toBe(2) // At middle, insert after second element

      const index2 = calculateInsertIndex(container, 50, 125, '.item') // In third item middle
      expect(index2).toBe(3) // At middle, insert after third element
    })
  })

  describe('edge Cases', () => {
    it('should handle elements with complex nested structure', () => {
      const complexContainer = document.createElement('div')
      complexContainer.innerHTML = `
        <div class="item">
          <span>Nested</span>
          <div>
            <p>Deep nested</p>
          </div>
        </div>
        <div class="item">
          <img src="test.jpg" alt="test">
          <button>Action</button>
        </div>
      `
      document.body.appendChild(complexContainer)

      const children = getDraggableChildren(complexContainer, '.item')
      expect(children).toHaveLength(2)

      const button = complexContainer.querySelector('button') as HTMLElement
      const found = findDraggableElement(button, complexContainer, '.item')
      expect(found).toBe(children[1])

      document.body.removeChild(complexContainer)
    })

    it('should handle containers with mixed element types', () => {
      const mixedContainer = document.createElement('ul')
      mixedContainer.innerHTML = `
        <li class="item">List Item 1</li>
        <li class="item">List Item 2</li>
        <div class="item">Div Item</div>
        <span class="item">Span Item</span>
      `
      document.body.appendChild(mixedContainer)

      const children = getDraggableChildren(mixedContainer, '.item')
      expect(children).toHaveLength(4)
      expect(children[0].tagName).toBe('LI')
      expect(children[2].tagName).toBe('DIV')
      expect(children[3].tagName).toBe('SPAN')

      document.body.removeChild(mixedContainer)
    })

    it('should handle elements with special characters in selectors', () => {
      const specialContainer = document.createElement('div')
      specialContainer.innerHTML = `
        <div class="item-1" data-test="value">Item 1</div>
        <div class="item-2" data-test="value">Item 2</div>
        <div class="other">Other</div>
      `
      document.body.appendChild(specialContainer)

      const children = getDraggableChildren(specialContainer, '[data-test="value"]')
      expect(children).toHaveLength(2)

      document.body.removeChild(specialContainer)
    })
  })
})
