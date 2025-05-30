import { describe, expect, it } from 'vitest'
import { getCenter, getCorners, getDistance, isPositionInRect } from '../position'

describe('position utils', () => {
  describe('getCenter', () => {
    it('should calculate the center of a rectangle', () => {
      const rect = { width: 100, height: 200, left: 50, top: 100 }
      const center = getCenter(rect)

      expect(center.x).toBe(100) // 50 + 100/2
      expect(center.y).toBe(200) // 100 + 200/2
    })
  })

  describe('getCorners', () => {
    it('should return all corners of a rectangle', () => {
      const rect = { width: 100, height: 200, left: 50, top: 100 }
      const corners = getCorners(rect)

      expect(corners.topLeft).toEqual({ x: 50, y: 100 })
      expect(corners.topRight).toEqual({ x: 150, y: 100 })
      expect(corners.bottomLeft).toEqual({ x: 50, y: 300 })
      expect(corners.bottomRight).toEqual({ x: 150, y: 300 })
    })
  })

  describe('getDistance', () => {
    it('should calculate distance between two positions', () => {
      const pos1 = { x: 0, y: 0 }
      const pos2 = { x: 3, y: 4 }

      const distance = getDistance(pos1, pos2)
      expect(distance).toBe(5) // Pythagorean theorem: 3-4-5 triangle
    })

    it('should return 0 for identical positions', () => {
      const pos = { x: 10, y: 20 }
      const distance = getDistance(pos, pos)
      expect(distance).toBe(0)
    })
  })

  describe('isPositionInRect', () => {
    it('should return true when position is inside rectangle', () => {
      const position = { x: 75, y: 150 }
      const rect = { left: 50, top: 100, right: 150, bottom: 300 }

      expect(isPositionInRect(position, rect)).toBe(true)
    })

    it('should return true when position is on the edge of rectangle', () => {
      const position = { x: 50, y: 100 }
      const rect = { left: 50, top: 100, right: 150, bottom: 300 }

      expect(isPositionInRect(position, rect)).toBe(true)
    })

    it('should return false when position is outside rectangle', () => {
      const position = { x: 40, y: 150 }
      const rect = { left: 50, top: 100, right: 150, bottom: 300 }

      expect(isPositionInRect(position, rect)).toBe(false)
    })
  })
})
