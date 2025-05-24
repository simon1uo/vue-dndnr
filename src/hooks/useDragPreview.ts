import type { ActiveDragContext, DragPreviewOptions } from '@/types'
import type { Position } from '@/types/common'
import { DragMode } from '@/types'
import { isClient } from '@/utils'
import dragStore from '@/utils/dragStore'
import { tryOnUnmounted, useWindowScroll } from '@vueuse/core'
import { computed, nextTick, shallowRef, toValue, watch, watchEffect } from 'vue'

/**
 * Drag preview layer hook, provides unified preview layer implementation
 * @param options Preview layer configuration options
 */
export function useDragPreview(options: DragPreviewOptions = {}) {
  const container = computed(() => toValue(options.container) || (isClient ? document.body : null))
  const zIndex = computed(() => toValue(options.zIndex) || 1000)
  const element = computed(() => toValue(options.element))
  const offset = computed(() => toValue(options.offset) || { x: 0, y: 0 })
  const dragMode = computed(() => toValue(options.dragMode))

  const isVisible = shallowRef(false)
  const currentItem = shallowRef<ActiveDragContext | null>(null)
  const currentOffset = shallowRef<Position | null>(null)
  const previewRef = shallowRef<HTMLElement | null>(null)
  const previewContainer = shallowRef<HTMLElement | null>(null)
  const previewElement = shallowRef<HTMLElement | null>(null)
  const isInitialized = shallowRef(false)
  /**
   * Stores the initial offset of the pointer within the source element when a drag operation begins.
   * This is used in `DragMode.Pointer` to ensure the preview element is positioned relative to the initial grab point on the source, similar to native drag behavior.
   * It's calculated based on `activeDrag.sourceNode` and `activeDrag.initialPointerPosition`.
   * Defaults to { x: 0, y: 0 } if necessary data is unavailable or not in Pointer mode.
   */
  const initialPointerOffsetWithinSource = shallowRef<Position>({ x: 0, y: 0 })
  const initialOffsetCalculated = shallowRef(false) // Flag to ensure offset is calculated only once per drag

  const { x: scrollX, y: scrollY } = useWindowScroll()

  const activeDragRef = dragStore.getActiveDrag()
  const currentPositionFromStoreRef = dragStore.getPosition()

  const shouldRenderPreview = computed(() => {
    const currentActiveDrag = activeDragRef.value
    const currentDragMode = currentActiveDrag?.dragMode || dragMode.value
    return currentDragMode === DragMode.Pointer && !!element.value
  })

  const hidePreview = () => {
    isVisible.value = false
    if (previewElement.value) {
      previewElement.value.style.display = 'none'
    }
  }

  const removePreview = () => {
    if (previewElement.value && previewElement.value.parentElement) {
      previewElement.value.parentElement.removeChild(previewElement.value)
      previewElement.value = null
    }
  }

  const createPreviewContainer = () => {
    if (!isClient || !shouldRenderPreview.value)
      return null

    if (previewContainer.value)
      return previewContainer.value

    const targetContainer = container.value
    if (!targetContainer)
      return null

    const div = document.createElement('div')
    div.className = 'vue-dndnr-preview-container'
    div.style.position = 'fixed'
    div.style.top = '0'
    div.style.left = '0'
    div.style.width = '0'
    div.style.height = '0'
    div.style.overflow = 'visible'
    div.style.pointerEvents = 'none'
    div.style.zIndex = String(zIndex.value)

    targetContainer.appendChild(div)
    previewContainer.value = div

    return div
  }

  const createPreviewElement = () => {
    if (!shouldRenderPreview.value || !isClient || !element.value || !previewContainer.value)
      return null

    if (previewElement.value && previewElement.value.parentElement) {
      previewElement.value.parentElement.removeChild(previewElement.value)
      previewElement.value = null
    }

    const elementValue = element.value
    if (!elementValue || typeof elementValue !== 'object' || !('cloneNode' in elementValue))
      return null

    const preview = elementValue.cloneNode(true) as HTMLElement
    preview.style.position = 'absolute'
    preview.style.margin = '0'
    preview.style.pointerEvents = 'none'
    preview.style.zIndex = String(zIndex.value)
    preview.style.boxSizing = 'border-box'
    preview.style.transition = 'none'
    preview.style.display = 'block'

    previewContainer.value.appendChild(preview)
    previewElement.value = preview

    return preview
  }

  const ensurePreviewCreated = () => {
    if (shouldRenderPreview.value) {
      createPreviewContainer()

      if (!previewElement.value) {
        createPreviewElement()
      }
      else if (previewElement.value) {
        previewElement.value.style.display = 'block'
      }
    }
  }

  const updatePreviewPosition = () => {
    if (!shouldRenderPreview.value || !previewElement.value)
      return

    const positionToUse = currentOffset.value || currentPositionFromStoreRef.value
    if (!positionToUse) {
      return
    }

    const { x, y } = positionToUse
    const { x: offsetX, y: offsetY } = offset.value
    const { x: initialX, y: initialY } = initialPointerOffsetWithinSource.value

    const finalX = x + offsetX - initialX
    const finalY = y + offsetY - initialY

    previewElement.value.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`
  }

  const handlePositionChange = (position: Position, dragContext: ActiveDragContext) => {
    currentOffset.value = position
    currentItem.value = dragContext

    if (!initialOffsetCalculated.value && dragContext.dragMode === DragMode.Pointer) {
      const actualDraggedElement = dragContext.sourceNode
      const previewMaterialElement = element.value

      const shouldUseRelativeOffset = previewMaterialElement && actualDraggedElement && previewMaterialElement === actualDraggedElement

      if (shouldUseRelativeOffset) {
        if (dragContext.initialPointerPosition) {
          const rect = actualDraggedElement.getBoundingClientRect()
          initialPointerOffsetWithinSource.value = {
            x: dragContext.initialPointerPosition.x - rect.left,
            y: dragContext.initialPointerPosition.y - rect.top,
          }
        }
        else {
          initialPointerOffsetWithinSource.value = { x: 0, y: 0 }
        }
      }
      else {
        initialPointerOffsetWithinSource.value = { x: 0, y: 0 }
      }
      initialOffsetCalculated.value = true
    }
  }

  const handleDragModeChange = (currentActiveDragMode: DragMode | undefined) => {
    if (currentActiveDragMode === DragMode.Native) {
      hidePreview()
      removePreview()
    }
    else if (currentActiveDragMode === DragMode.Pointer && activeDragRef.value) {
      isVisible.value = shouldRenderPreview.value

      if (shouldRenderPreview.value) {
        nextTick(() => {
          ensurePreviewCreated()
          updatePreviewPosition()
        })
      }
    }
  }

  const handleDragStartEvent = () => {
    initialOffsetCalculated.value = false
  }

  const handleDragEndEvent = () => {
    initialPointerOffsetWithinSource.value = { x: 0, y: 0 }
    initialOffsetCalculated.value = false
    isVisible.value = false
    if (previewElement.value) {
      previewElement.value.style.display = 'none'
    }
    currentItem.value = null
    currentOffset.value = null
  }

  if (isClient) {
    if (dragMode.value === DragMode.Pointer) {
      createPreviewContainer()
    }

    isInitialized.value = true
  }

  watchEffect(() => {
    const activeDrag = activeDragRef.value
    const currentPosition = currentPositionFromStoreRef.value

    if (activeDrag) {
      currentItem.value = { ...activeDrag } as ActiveDragContext
      if (currentPosition) {
        currentOffset.value = currentPosition
      }

      if (activeDrag.dragMode === DragMode.Pointer) {
        if (currentPosition) {
          handlePositionChange(currentPosition, { ...activeDrag } as ActiveDragContext)
        }
        isVisible.value = shouldRenderPreview.value
        if (isVisible.value) {
          nextTick(() => {
            ensurePreviewCreated()
            updatePreviewPosition()
          })
        }
      }
      else {
        hidePreview()
      }
    }
    else {
      if (currentItem.value !== null) {
        handleDragEndEvent()
      }
    }
  })

  watch(isVisible, (visible) => {
    const currentActiveDrag = activeDragRef.value
    const currentActiveDragMode = currentActiveDrag?.dragMode || dragMode.value
    if (currentActiveDragMode !== DragMode.Pointer)
      return

    if (visible) {
      nextTick(() => {
        ensurePreviewCreated()
        updatePreviewPosition()
      })
    }
    else if (previewElement.value) {
      previewElement.value.style.display = 'none'
    }
  }, { immediate: false })

  watch(element, () => {
    const currentActiveDrag = activeDragRef.value
    const currentActiveDragMode = currentActiveDrag?.dragMode || dragMode.value
    if (currentActiveDragMode === DragMode.Pointer && isVisible.value) {
      nextTick(() => {
        createPreviewElement()
        updatePreviewPosition()
      })
    }
  })

  watch([() => activeDragRef.value?.dragMode, dragMode], ([itemDragMode, optionDragMode]) => {
    const currentActiveDragMode = itemDragMode || optionDragMode
    handleDragModeChange(currentActiveDragMode)
  }, { deep: true })

  watch([scrollX, scrollY], () => {
    if (isVisible.value && shouldRenderPreview.value && (currentOffset.value || currentPositionFromStoreRef.value)) {
      nextTick(updatePreviewPosition)
    }
  })

  const updatePreview = (visible?: boolean, item?: ActiveDragContext | null, position?: Position | null) => {
    const itemToUse = item === undefined ? activeDragRef.value : item
    const mutableItemToUse = itemToUse ? { ...itemToUse } as ActiveDragContext : null

    const currentActiveDragMode = mutableItemToUse?.dragMode || dragMode.value

    if (currentActiveDragMode === DragMode.Native) {
      hidePreview()
      return
    }

    if (visible !== undefined) {
      if (currentActiveDragMode === DragMode.Pointer) {
        isVisible.value = visible
      }
      else if (visible) {
        return
      }
    }

    const positionToUse = position === undefined ? currentPositionFromStoreRef.value : position
    if (positionToUse) {
      currentOffset.value = positionToUse
    }

    if (isVisible.value && currentActiveDragMode === DragMode.Pointer) {
      nextTick(() => {
        ensurePreviewCreated()
        if (currentOffset.value && shouldRenderPreview.value) {
          updatePreviewPosition()
        }
      })
    }
  }

  const cleanup = () => {
    if (previewContainer.value && previewContainer.value.parentElement) {
      previewContainer.value.parentElement.removeChild(previewContainer.value)
      previewContainer.value = null
    }

    removePreview()
  }

  tryOnUnmounted(cleanup)

  return {
    previewRef,
    isVisible,
    currentItem,
    currentOffset,
    element,
    offset,
    previewContainer,
    previewElement,
    isInitialized,
    updatePreview,
    hidePreview,
    removePreview,
    handleDragStartEvent,
    handleDragEndEvent,
  }
}

export default useDragPreview
