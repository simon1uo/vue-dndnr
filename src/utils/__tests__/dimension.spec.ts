import type { Position } from '@/types/common'
import type { BoxModel, Rect } from '@/types/dimension'
import { describe, expect, it, vi } from 'vitest'
import { calculateDetailedBoxModel, isElementVisible, offsetRect, transformBoxToPageCoordinates } from '../dimension'

describe('dimension utils', () => {
  describe('calculateDetailedBoxModel', () => {
    it('should calculate correct box model dimensions', () => {
      // Create a mock element
      const element = document.createElement('div')

      // Mock getComputedStyle
      const mockStyle = {
        marginTop: '10px',
        marginRight: '20px',
        marginBottom: '30px',
        marginLeft: '40px',
        borderTopWidth: '1px',
        borderRightWidth: '2px',
        borderBottomWidth: '3px',
        borderLeftWidth: '4px',
        paddingTop: '5px',
        paddingRight: '6px',
        paddingBottom: '7px',
        paddingLeft: '8px',
        display: 'block',
      }

      const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle')
      getComputedStyleSpy.mockReturnValue(mockStyle as any)

      // Mock bounding client rect and content rect
      const boundingClientRect: Rect = {
        top: 100,
        right: 200,
        bottom: 300,
        left: 50,
        width: 150,
        height: 200,
        x: 50,
        y: 100,
      }

      const contentRect = {
        width: 132, // 150 - 4 - 2 - 8 - 6 (width - borderLeft - borderRight - paddingLeft - paddingRight)
        height: 184, // 200 - 1 - 3 - 5 - 7 (height - borderTop - borderBottom - paddingTop - paddingBottom)
      }

      const boxModel = calculateDetailedBoxModel(element, boundingClientRect, contentRect)

      // Verify border box matches the bounding client rect
      expect(boxModel.borderBox).toEqual(boundingClientRect)

      // Verify margin box
      expect(boxModel.marginBox).toEqual({
        top: 90, // borderBox.top - marginTop = 100 - 10
        right: 220, // borderBox.right + marginRight = 200 + 20
        bottom: 330, // borderBox.bottom + marginBottom = 300 + 30
        left: 10, // borderBox.left - marginLeft = 50 - 40
        width: 210, // borderBox.width + marginLeft + marginRight = 150 + 40 + 20
        height: 240, // borderBox.height + marginTop + marginBottom = 200 + 10 + 30
        x: 10, // borderBox.x - marginLeft = 50 - 40
        y: 90, // borderBox.y - marginTop = 100 - 10
      })

      // Verify padding box
      expect(boxModel.paddingBox).toEqual({
        top: 101, // borderBox.top + borderTop = 100 + 1
        right: 198, // borderBox.right - borderRight = 200 - 2
        bottom: 297, // borderBox.bottom - borderBottom = 300 - 3
        left: 54, // borderBox.left + borderLeft = 50 + 4
        width: 144, // contentBox.width + paddingLeft + paddingRight = 132 + 8 + 6
        height: 196, // contentBox.height + paddingTop + paddingBottom = 184 + 5 + 7
        x: 54, // borderBox.x + borderLeft = 50 + 4
        y: 101, // borderBox.y + borderTop = 100 + 1
      })

      // Verify content box
      expect(boxModel.contentBox).toEqual({
        top: 106, // paddingBox.top + paddingTop = 101 + 5
        right: 192, // paddingBox.right - paddingRight = 198 - 6
        bottom: 290, // paddingBox.bottom - paddingBottom = 297 - 7
        left: 62, // paddingBox.left + paddingLeft = 54 + 8
        width: 132, // from contentRect
        height: 184, // from contentRect
        x: 62, // paddingBox.x + paddingLeft = 54 + 8
        y: 106, // paddingBox.y + paddingTop = 101 + 5
      })

      // 测试 isElementVisible 函数
      expect(isElementVisible(element)).toBe(true)

      // 清理 mock
      getComputedStyleSpy.mockRestore()
    })

    it('should handle errors gracefully', () => {
      // 创建一个会导致 getComputedStyle 抛出错误的情况
      const element = document.createElement('div')

      // 模拟 getComputedStyle 抛出错误
      const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle')
      getComputedStyleSpy.mockImplementation(() => {
        throw new Error('Test error')
      })

      const boundingClientRect: Rect = {
        top: 100,
        right: 200,
        bottom: 300,
        left: 50,
        width: 150,
        height: 200,
        x: 50,
        y: 100,
      }

      const contentRect = { width: 100, height: 100 }

      // 应该返回零矩形，但 borderBox 应该保留原始值
      const boxModel = calculateDetailedBoxModel(element, boundingClientRect, contentRect)

      expect(boxModel.borderBox).toEqual(boundingClientRect)

      // isElementVisible 也应该处理错误
      expect(isElementVisible(element)).toBe(false)

      getComputedStyleSpy.mockRestore()
    })
  })

  describe('transformBoxToPageCoordinates', () => {
    it('should correctly transform client coordinates to page coordinates', () => {
      const clientBox: BoxModel = {
        marginBox: { top: 90, right: 220, bottom: 330, left: 10, width: 210, height: 240, x: 10, y: 90 },
        borderBox: { top: 100, right: 200, bottom: 300, left: 50, width: 150, height: 200, x: 50, y: 100 },
        paddingBox: { top: 101, right: 198, bottom: 297, left: 54, width: 144, height: 196, x: 54, y: 101 },
        contentBox: { top: 106, right: 192, bottom: 290, left: 62, width: 132, height: 184, x: 62, y: 106 },
      }

      const windowScroll: Position = { x: 100, y: 200 }

      const pageBox = transformBoxToPageCoordinates(clientBox, windowScroll)

      // Check that all coordinates are offset by the window scroll
      expect(pageBox.marginBox).toEqual({
        top: 290, // 90 + 200
        right: 320, // 220 + 100
        bottom: 530, // 330 + 200
        left: 110, // 10 + 100
        width: 210, // unchanged
        height: 240, // unchanged
        x: 110, // 10 + 100
        y: 290, // 90 + 200
      })

      expect(pageBox.borderBox).toEqual({
        top: 300, // 100 + 200
        right: 300, // 200 + 100
        bottom: 500, // 300 + 200
        left: 150, // 50 + 100
        width: 150, // unchanged
        height: 200, // unchanged
        x: 150, // 50 + 100
        y: 300, // 100 + 200
      })

      expect(pageBox.paddingBox).toEqual({
        top: 301, // 101 + 200
        right: 298, // 198 + 100
        bottom: 497, // 297 + 200
        left: 154, // 54 + 100
        width: 144, // unchanged
        height: 196, // unchanged
        x: 154, // 54 + 100
        y: 301, // 101 + 200
      })

      expect(pageBox.contentBox).toEqual({
        top: 306, // 106 + 200
        right: 292, // 192 + 100
        bottom: 490, // 290 + 200
        left: 162, // 62 + 100
        width: 132, // unchanged
        height: 184, // unchanged
        x: 162, // 62 + 100
        y: 306, // 106 + 200
      })
    })
  })

  describe('offsetRect', () => {
    it('should correctly offset a rectangle by a position', () => {
      const rect: Rect = {
        top: 100,
        right: 200,
        bottom: 300,
        left: 50,
        width: 150,
        height: 200,
        x: 50,
        y: 100,
      }

      const position: Position = { x: 10, y: 20 }

      const offsetResult = offsetRect(rect, position)

      expect(offsetResult).toEqual({
        top: 120, // 100 + 20
        right: 210, // 200 + 10
        bottom: 320, // 300 + 20
        left: 60, // 50 + 10
        width: 150, // unchanged
        height: 200, // unchanged
        x: 60, // 50 + 10
        y: 120, // 100 + 20
      })
    })
  })

  describe('isElementVisible', () => {
    it('should return false when element has display: none', () => {
      const element = document.createElement('div')

      // 直接模拟 getComputedStyle
      const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle')
      getComputedStyleSpy.mockReturnValue({ display: 'none' } as any)

      expect(isElementVisible(element)).toBe(false)

      getComputedStyleSpy.mockRestore()
    })
  })
})
