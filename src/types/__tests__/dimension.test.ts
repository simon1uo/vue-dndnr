import type { DragId, DropId } from '../core'
import type {
  BoxModel,
  DragDimension,
  DropDimension,
  Rect,
} from '../dimension'

describe('dimension Types', () => {
  it('should define correct Rect type', () => {
    const rect: Rect = {
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    }

    expect(rect).toBeDefined()
  })

  it('should define correct BoxModel type', () => {
    const createRect = (): Rect => ({
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    })

    const boxModel: BoxModel = {
      marginBox: createRect(),
      borderBox: createRect(),
      paddingBox: createRect(),
      contentBox: createRect(),
    }

    expect(boxModel).toBeDefined()
  })

  it('should define correct DragDimension type', () => {
    const createBoxModel = (): BoxModel => {
      const createRect = (): Rect => ({
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      })

      return {
        marginBox: createRect(),
        borderBox: createRect(),
        paddingBox: createRect(),
        contentBox: createRect(),
      }
    }

    const dragDimension: DragDimension = {
      id: 'drag-1' as DragId,
      dropId: 'drop-1' as DropId,
      client: createBoxModel(),
      page: createBoxModel(),
      windowScroll: { x: 0, y: 0 },
    }

    expect(dragDimension).toBeDefined()
  })

  it('should define correct DropDimension type', () => {
    const createBoxModel = (): BoxModel => {
      const createRect = (): Rect => ({
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      })

      return {
        marginBox: createRect(),
        borderBox: createRect(),
        paddingBox: createRect(),
        contentBox: createRect(),
      }
    }

    const createDragDimension = (): DragDimension => ({
      id: 'drag-1' as DragId,
      dropId: 'drop-1' as DropId,
      client: createBoxModel(),
      page: createBoxModel(),
      windowScroll: { x: 0, y: 0 },
    })

    const dropDimension: DropDimension = {
      id: 'drop-1' as DropId,
      client: createBoxModel(),
      page: createBoxModel(),
      windowScroll: { x: 0, y: 0 },
      frame: {
        scroll: { x: 0, y: 0 },
        scrollSize: { x: 1000, y: 1000 },
        clientHeight: 500,
        clientWidth: 500,
      },
      subject: {
        page: createBoxModel(),
        withDroppableDisplacement: createBoxModel(),
        activities: [createDragDimension()],
      },
    }

    expect(dropDimension).toBeDefined()
  })

  it('should allow optional frame property in DropDimension', () => {
    const createBoxModel = (): BoxModel => {
      const createRect = (): Rect => ({
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      })

      return {
        marginBox: createRect(),
        borderBox: createRect(),
        paddingBox: createRect(),
        contentBox: createRect(),
      }
    }

    const dropDimension: DropDimension = {
      id: 'drop-1' as DropId,
      client: createBoxModel(),
      page: createBoxModel(),
      windowScroll: { x: 0, y: 0 },
      subject: {
        page: createBoxModel(),
        withDroppableDisplacement: createBoxModel(),
        activities: [],
      },
    }

    expect(dropDimension).toBeDefined()
  })
})
