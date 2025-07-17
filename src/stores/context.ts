import type { Position, PublicState, ResizeHandle, Size } from '@/types'
import { createGlobalState } from '@vueuse/core'
import { reactive } from 'vue'

export const usePublicState = createGlobalState(() => {
  const state = reactive<PublicState>({
    activeId: null,
    activeElement: null,
    isDragging: false,
    dragPosition: { x: 0, y: 0 },
    isResizing: false,
    resizeSize: { width: 'auto', height: 'auto' },
    activeHandle: null,
    hoverHandle: null,
  })

  const setActiveElement = (element: HTMLElement | null, id: string | null = null) => {
    if (state.activeElement === element && state.activeId === id)
      return

    if (state.activeElement !== element) {
      state.isDragging = false
      state.isResizing = false
      state.activeHandle = null
      state.hoverHandle = null
    }
    state.activeElement = element
    state.activeId = id
  }

  const setDragging = (isDragging: boolean) => {
    if (state.isDragging === isDragging)
      return

    if (isDragging && state.isResizing)
      return
    state.isDragging = isDragging
    if (isDragging) {
      state.isResizing = false
      state.activeHandle = null
    }
  }

  const setPosition = (position: Position) => {
    if (state.dragPosition.x === position.x && state.dragPosition.y === position.y)
      return

    state.dragPosition = { ...position }
  }

  const setResizing = (isResizing: boolean) => {
    if (state.isResizing === isResizing)
      return

    if (isResizing && state.isDragging)
      return
    state.isResizing = isResizing
    if (isResizing)
      state.isDragging = false
  }

  const setSize = (size: Size) => {
    if ((state.resizeSize.width === size.width) && (state.resizeSize.height === size.height))
      return

    state.resizeSize = { ...size }
  }

  const setActiveHandle = (handle: ResizeHandle | null) => {
    if (state.activeHandle === handle)
      return

    state.activeHandle = handle
  }

  const setHoverHandle = (handle: ResizeHandle | null) => {
    if (state.hoverHandle === handle)
      return

    state.hoverHandle = handle
  }

  return {
    state,
    setActiveElement,
    setDragging,
    setPosition,
    setResizing,
    setSize,
    setActiveHandle,
    setHoverHandle,
  }
})
