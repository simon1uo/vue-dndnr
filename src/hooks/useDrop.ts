import type { DropItemData, DropOptions } from '@/types/dnd'
import type { MaybeRefOrGetter } from 'vue'
import { DragMode } from '@/types'
import { isClient } from '@/utils'
import dragStore from '@/utils/dragStore'
import { tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, onMounted, shallowRef, toValue, watch } from 'vue'

/**
 * Hook for creating a drop zone that can receive dragged items (ID/type based)
 * @param target - Reference to the element to make a drop zone
 * @param options - Configuration options for drop behavior
 * @returns Object containing drop state and methods
 */
export function useDrop(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
  options: DropOptions,
) {
  const {
    dropId,
    accept,
    dropEffect = 'move',
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  } = options

  if (!dropId) {
    throw new Error('[useDrop] dropId is required in options')
  }

  // State
  const isDragOver = shallowRef(false)
  const isValidDrop = shallowRef(false)
  const data = shallowRef<DropItemData | null>(null)

  // Computed values
  const acceptValue = computed(() => toValue(accept))
  const dropEffectValue = computed(() => toValue(dropEffect))

  // Helper: validate type
  const validateDrop = (type: string): boolean => {
    const acceptConfig = acceptValue.value
    if (!acceptConfig)
      return true
    if (typeof acceptConfig === 'function')
      return acceptConfig(type)
    if (Array.isArray(acceptConfig))
      return acceptConfig.includes(type)
    return acceptConfig === type
  }

  // Extract drag info from DataTransfer
  const extractDragInfo = (event: DragEvent): DropItemData | null => {
    if (!event.dataTransfer) {
      return null
    }
    const types = event.dataTransfer.types

    let dragId: string | null = null
    let index: number | null = null
    let type: string | null = null

    // Try custom MIME types
    if (types.includes('application/x-vue-dndnr-id')) {
      dragId = event.dataTransfer.getData('application/x-vue-dndnr-id')
    }
    if (types.includes('application/x-vue-dndnr-index')) {
      const idx = event.dataTransfer.getData('application/x-vue-dndnr-index')
      if (idx && !Number.isNaN(Number(idx)))
        index = Number(idx)
    }
    if (types.includes('application/x-vue-dndnr-type')) {
      type = event.dataTransfer.getData('application/x-vue-dndnr-type')
    }

    // Fallback: text/plain (format: type:dragId:index)
    if ((!dragId || !type || index == null) && types.includes('text/plain')) {
      const text = event.dataTransfer.getData('text/plain')
      const match = text.match(/^([^:]+):([^:]+):(\d+)$/)
      if (match) {
        type = match[1]
        dragId = match[2]
        index = Number(match[3])
      }
    }

    if (dragId && type && index != null) {
      return { dragId, index, type }
    }
    return null
  }

  // --- Native DnD Event Handlers ---
  const handleNativeDragEnter = (event: DragEvent) => {
    if (!event.dataTransfer) {
      return
    }
    event.preventDefault()

    const activeDrag = dragStore.getActiveDrag()
    let valid = false
    let dragInfoForCallback: DropItemData | null = null

    if (activeDrag) {
      valid = validateDrop(activeDrag.type)
      data.value = { dragId: activeDrag.dragId, index: activeDrag.index, type: activeDrag.type }
      dragInfoForCallback = data.value
    }
    else {
      valid = false
      data.value = null
    }

    isDragOver.value = true
    isValidDrop.value = valid
    event.dataTransfer.dropEffect = valid ? dropEffectValue.value : 'none'
    onDragEnter?.(dragInfoForCallback, event)
  }

  const handleNativeDragOver = (event: DragEvent) => {
    if (!event.dataTransfer)
      return
    event.preventDefault()
    event.dataTransfer.dropEffect = isValidDrop.value ? dropEffectValue.value : 'none'
    onDragOver?.(data.value, event)
  }

  const handleNativeDragLeave = (event: DragEvent) => {
    const el = toValue(target)
    const relatedTarget = event.relatedTarget as Node | null
    if (el && relatedTarget && el.contains(relatedTarget))
      return
    isDragOver.value = false
    isValidDrop.value = false
    data.value = null
    onDragLeave?.(null, event)
  }

  const handleNativeDrop = (event: DragEvent) => {
    if (!event.dataTransfer) {
      return
    }
    event.preventDefault()
    const info = extractDragInfo(event)
    let valid = false
    if (info) {
      valid = validateDrop(info.type)
      data.value = info
      isValidDrop.value = valid
      event.dataTransfer.dropEffect = valid ? dropEffectValue.value : 'none'
      if (valid && onDrop)
        onDrop(info, event)
    }
    isDragOver.value = false
    isValidDrop.value = false
    data.value = null
  }

  const handlePointerEnterForDrop = (event: PointerEvent) => {
    const activeDrag = dragStore.getActiveDrag()
    if (activeDrag && activeDrag.dragMode === DragMode.Pointer) {
      const info: DropItemData = { dragId: activeDrag.dragId, index: activeDrag.index, type: activeDrag.type }
      isDragOver.value = true
      data.value = info
      isValidDrop.value = validateDrop(info.type)
      onDragEnter?.(info, event)
    }
  }

  const handlePointerMoveForDrop = (event: PointerEvent) => {
    if (!isDragOver.value)
      return
    onDragOver?.(data.value, event)
  }

  const handlePointerLeaveForDrop = (event: PointerEvent) => {
    if (!isDragOver.value)
      return
    isDragOver.value = false
    isValidDrop.value = false
    data.value = null
    onDragLeave?.(null, event)
  }

  const handlePointerUpForDrop = (event: PointerEvent) => {
    if (!isDragOver.value)
      return
    if (isValidDrop.value && data.value) {
      onDrop?.(data.value, event)
    }
    isDragOver.value = false
    isValidDrop.value = false
    data.value = null
  }

  // Setup drop zone attributes
  const setupDropZoneAttributes = () => {
    const el = toValue(target)
    if (!el)
      return
    el.setAttribute('aria-droptarget', 'true')
  }

  if (isClient) {
    useEventListener(target, 'dragenter', handleNativeDragEnter)
    useEventListener(target, 'dragover', handleNativeDragOver)
    useEventListener(target, 'dragleave', handleNativeDragLeave)
    useEventListener(target, 'drop', handleNativeDrop)
    useEventListener(target, 'pointerenter', handlePointerEnterForDrop, { capture: true })
    useEventListener(target, 'pointerleave', handlePointerLeaveForDrop, { capture: true })
    useEventListener(target, 'pointermove', handlePointerMoveForDrop, { capture: true, passive: true })
    useEventListener(target, 'pointerup', handlePointerUpForDrop, { capture: true, passive: false })
    onMounted(() => {
      setupDropZoneAttributes()
    })
    watch(() => toValue(target), (newTarget) => {
      if (newTarget)
        setupDropZoneAttributes()
    })
  }

  tryOnUnmounted(() => {
    isDragOver.value = false
    isValidDrop.value = false
    data.value = null
  })

  return {
    isDragOver,
    isValidDrop,
    data,
  }
}

export default useDrop
