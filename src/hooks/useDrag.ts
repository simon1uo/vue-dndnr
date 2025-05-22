import type { DragOptions, DragStateStyles } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { defaultWindow, isClient } from '@/utils'
import dragStore, { generateDragId } from '@/utils/dragStore'
import { tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, shallowRef, toValue, watch } from 'vue'

/**
 * Hook for making an element draggable with HTML5 Drag and Drop API (ID-based, no payload)
 * @param target - Reference to the element to make draggable
 * @param options - Configuration options for drag behavior (must include dragId, index)
 * @returns Object containing drag state and methods
 */
export function useDrag(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
  options: DragOptions = {} as DragOptions,
) {
  const {
    dragId,
    index,
    type = 'default',
    dragPreview,
    handle: draggingHandle = target,
    draggingElement = defaultWindow,
    forceFallback = false,
    fallbackClass = 'dndnr-fallback',
    fallbackOnBody = true,
    fallbackTolerance = 0,
    delay = 0,
    stateStyles = {},
    onDragStart,
    onDrag,
    onDragEnd,
  } = options

  if (!dragId || typeof index !== 'number') {
    throw new Error('[useDrag] dragId and index are required in options')
  }

  // State
  const isDragging = shallowRef(false)
  const dragPreviewElement = shallowRef<HTMLElement | null>(null)
  const fallbackElement = shallowRef<HTMLElement | null>(null)
  const dragTimeout = shallowRef<number | null>(null)
  const delayTimeout = shallowRef<number | null>(null)
  const initialPointerPosition = shallowRef<{ x: number, y: number } | null>(null)
  const activeDragId = shallowRef<string | null>(null)
  const activeDragImageOffset = shallowRef({ x: 0, y: 0 })
  // Computed values
  const dragPreviewValue = computed(() => toValue(dragPreview))
  const stateStylesValue = computed(() => toValue(stateStyles))

  // Default state styles for dragging
  const DEFAULT_DRAG_STATE_STYLES: DragStateStyles = {
    normal: {
      cursor: 'grab',
    },
    dragging: {
      opacity: '0.5',
      cursor: 'grabbing',
    },
  }

  // Merge default state styles with user-provided styles
  const mergedStateStyles = computed(() => {
    const userStyles = stateStylesValue.value
    return {
      normal: { ...DEFAULT_DRAG_STATE_STYLES.normal, ...(userStyles?.normal || {}) },
      dragging: { ...DEFAULT_DRAG_STATE_STYLES.dragging, ...(userStyles?.dragging || {}) },
    }
  })

  /**
   * Apply styles to the target element based on current drag state
   */
  const applyDragStyles = () => {
    const el = toValue(target)
    if (!el)
      return

    // Reset all styles first
    if (mergedStateStyles.value.dragging) {
      Object.keys(mergedStateStyles.value.dragging).forEach((key) => {
        (el as HTMLElement).style[key as any] = ''
      })
    }

    if (mergedStateStyles.value.normal) {
      Object.keys(mergedStateStyles.value.normal).forEach((key) => {
        (el as HTMLElement).style[key as any] = mergedStateStyles.value.normal[key as any]
      })
    }

    // Then apply new styles based on state
    if (isDragging.value && mergedStateStyles.value.dragging) {
      Object.entries(mergedStateStyles.value.dragging).forEach(([key, value]) => {
        (el as HTMLElement).style[key as any] = value
      })
    }
  }

  /**
   * Check if setDragImage is supported in the current browser
   */
  const isSetDragImageSupported = (): boolean => {
    return typeof DataTransfer.prototype.setDragImage === 'function'
  }

  /**
   * Create a custom drag image for the native drag operation
   */
  const createNativeDragImage = (event: DragEvent) => {
    if (!event.dataTransfer)
      return
    const previewOptions = toValue(dragPreviewValue)
    if (!previewOptions?.element)
      return
    const elementToClone = toValue(previewOptions.element)
    if (!elementToClone)
      return
    if (!isSetDragImageSupported()) {
      return
    }
    try {
      const rect = elementToClone.getBoundingClientRect()
      const offset = previewOptions.offset || { x: 0, y: 0 }
      const scale = previewOptions.scale || 1
      const clone = elementToClone.cloneNode(true) as HTMLElement
      const computedStyle = window.getComputedStyle(elementToClone)
      clone.style.position = 'fixed'
      clone.style.left = '0'
      clone.style.top = '0'
      clone.style.width = `${rect.width}px`
      clone.style.height = `${rect.height}px`
      clone.style.transform = `scale(${scale})`
      clone.style.transformOrigin = '0 0'
      clone.style.pointerEvents = 'none'
      clone.style.zIndex = '-999'
      clone.style.opacity = '1'
      for (const prop of ['backgroundColor', 'color', 'border', 'borderRadius', 'padding', 'margin', 'boxShadow', 'fontSize', 'fontFamily']) {
        clone.style[prop as any] = computedStyle[prop as any]
      }
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '-9999px'
      container.style.pointerEvents = 'none'
      container.appendChild(clone)
      document.body.appendChild(container)
      dragPreviewElement.value = container
      event.dataTransfer.setDragImage(clone, offset.x, offset.y)
      dragTimeout.value = window.setTimeout(() => {
        if (dragPreviewElement.value && dragPreviewElement.value.parentElement) {
          document.body.removeChild(dragPreviewElement.value)
          dragPreviewElement.value = null
        }
      }, 0)
    }
    catch {
      if (dragPreviewElement.value && dragPreviewElement.value.parentElement) {
        document.body.removeChild(dragPreviewElement.value)
        dragPreviewElement.value = null
      }
    }
  }
  const removeFallbackDragImage = () => {
    if (fallbackElement.value) {
      if (fallbackElement.value.parentElement) {
        fallbackElement.value.remove()
      }
      fallbackElement.value = null
    }
  }

  const createFallbackDragImage = (originalTargetElement: HTMLElement, event: PointerEvent) => {
    removeFallbackDragImage()

    const previewOpts = toValue(dragPreviewValue)
    let elementToClone: HTMLElement
    let offsetX: number
    let offsetY: number

    if (previewOpts?.element) {
      const previewSourceEl = toValue(previewOpts.element)
      if (previewSourceEl) {
        elementToClone = previewSourceEl.cloneNode(true) as HTMLElement
        const previewSourceRect = previewSourceEl.getBoundingClientRect()
        elementToClone.style.width = `${previewSourceRect.width}px`
        elementToClone.style.height = `${previewSourceRect.height}px`

        const offsetFromPreviewOpts = previewOpts.offset || { x: 0, y: 0 }
        offsetX = offsetFromPreviewOpts.x
        offsetY = offsetFromPreviewOpts.y

        const scale = previewOpts.scale || 1
        if (scale !== 1) {
          elementToClone.style.transform = `scale(${scale})`
          elementToClone.style.transformOrigin = '0 0'
        }

        const computedStyle = window.getComputedStyle(previewSourceEl)
        for (const prop of ['backgroundColor', 'color', 'border', 'borderRadius', 'padding', 'margin', 'boxShadow', 'fontSize', 'fontFamily']) {
          (elementToClone.style as any)[prop] = computedStyle[prop as any]
        }
      }
      else {
        elementToClone = originalTargetElement.cloneNode(true) as HTMLElement
        const targetRect = originalTargetElement.getBoundingClientRect()
        elementToClone.style.width = `${targetRect.width}px`
        elementToClone.style.height = `${targetRect.height}px`
        if (initialPointerPosition.value) {
          offsetX = initialPointerPosition.value.x - targetRect.left
          offsetY = initialPointerPosition.value.y - targetRect.top
        }
        else {
          offsetX = 0
          offsetY = 0
        }
      }
    }
    else {
      elementToClone = originalTargetElement.cloneNode(true) as HTMLElement
      const targetRect = originalTargetElement.getBoundingClientRect()
      elementToClone.style.width = `${targetRect.width}px`
      elementToClone.style.height = `${targetRect.height}px`
      if (initialPointerPosition.value) {
        offsetX = initialPointerPosition.value.x - targetRect.left
        offsetY = initialPointerPosition.value.y - targetRect.top
      }
      else {
        offsetX = 0
        offsetY = 0
      }
    }

    activeDragImageOffset.value = { x: offsetX, y: offsetY }

    elementToClone.classList.add(fallbackClass)
    elementToClone.style.position = 'fixed'
    elementToClone.style.left = `${event.clientX - activeDragImageOffset.value.x}px`
    elementToClone.style.top = `${event.clientY - activeDragImageOffset.value.y}px`
    elementToClone.style.pointerEvents = 'none'
    elementToClone.style.zIndex = '9999'

    if (fallbackOnBody) {
      document.body.appendChild(elementToClone)
    }
    else {
      originalTargetElement.parentElement?.appendChild(elementToClone)
    }
    fallbackElement.value = elementToClone
    // Initial position is set, no need to call updateFallbackPosition(event) here
  }

  /**
   * Update the fallback element's position so that the point (activeDragImageOffset.x, activeDragImageOffset.y)
   * on the fallback element stays under the cursor.
   */
  const updateFallbackPosition = (event: PointerEvent) => {
    if (!fallbackElement.value)
      return

    // Position the fallback element so that the point (activeDragImageOffset.x, activeDragImageOffset.y)
    // on the fallback element stays under the cursor.
    fallbackElement.value.style.left = `${event.clientX - activeDragImageOffset.value.x}px`
    fallbackElement.value.style.top = `${event.clientY - activeDragImageOffset.value.y}px`
  }
  // --- Drag Event Handlers ---
  const handleDragStart = (event: DragEvent) => {
    const el = toValue(target)
    if (!el || !event.dataTransfer)
      return
    event.dataTransfer.effectAllowed = 'all'
    const dragOpId = generateDragId()
    activeDragId.value = dragOpId
    dragStore.setActiveDrag(dragOpId, dragId, index, type, false)
    // Set drag data (ID, index, type) in various formats
    event.dataTransfer.setData('application/x-vue-dndnr-id', dragId)
    event.dataTransfer.setData('application/x-vue-dndnr-index', String(index))
    event.dataTransfer.setData('application/x-vue-dndnr-type', type)
    event.dataTransfer.setData('text/plain', `${type}:${dragId}:${index}`)
    createNativeDragImage(event)
    isDragging.value = true
    applyDragStyles()
    onDragStart?.(event)
  }

  const handleDrag = (event: DragEvent) => {
    if (!isDragging.value)
      return
    onDrag?.(event)
  }

  const handleDragEnd = (event: DragEvent | PointerEvent) => {
    if (!isDragging.value && activeDragId.value !== dragStore.getActiveDrag()?.id) {
      return
    }
    if (dragTimeout.value) {
      window.clearTimeout(dragTimeout.value)
      dragTimeout.value = null
    }
    if (delayTimeout.value) {
      window.clearTimeout(delayTimeout.value)
      delayTimeout.value = null
    }
    const currentActiveDrag = dragStore.getActiveDrag()
    if (activeDragId.value && currentActiveDrag && activeDragId.value === currentActiveDrag.id) {
      if (event.type === 'drop' || event.type === 'dragend') {
        if (dragPreviewElement.value && dragPreviewElement.value.parentElement) {
          document.body.removeChild(dragPreviewElement.value)
          dragPreviewElement.value = null
        }
      }
      else if (event.type === 'pointerup') {
        removeFallbackDragImage()
      }
      dragStore.clearActiveDrag(activeDragId.value)
    }
    else if (event.type === 'pointerup' && fallbackElement.value) {
      removeFallbackDragImage()
    }
    onDragEnd?.(event)
    isDragging.value = false
    activeDragId.value = null
    applyDragStyles()
  }

  // --- Fallback Mode Event Handlers ---
  let isPointerDown = false
  let hasMovedEnoughForFallbackDrag = false

  const handlePointerMove = (event: PointerEvent) => {
    if (!isPointerDown)
      return
    if (!isDragging.value) {
      if (initialPointerPosition.value && fallbackTolerance > 0) {
        const dx = event.clientX - initialPointerPosition.value.x
        const dy = event.clientY - initialPointerPosition.value.y
        if (Math.sqrt(dx * dx + dy * dy) >= fallbackTolerance) {
          hasMovedEnoughForFallbackDrag = true
          if (delayTimeout.value) {
            window.clearTimeout(delayTimeout.value)
            delayTimeout.value = null
          }
          const el = toValue(target)
          if (!el)
            return
          isDragging.value = true
          const dragOpId = generateDragId()
          activeDragId.value = dragOpId
          dragStore.setActiveDrag(dragOpId, dragId, index, type, true)
          createFallbackDragImage(el as HTMLElement, event)
          applyDragStyles()
          onDragStart?.(event)
        }
      }
      if (!hasMovedEnoughForFallbackDrag)
        return
    }
    if (isDragging.value) {
      updateFallbackPosition(event)
      onDrag?.(event)
    }
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!isPointerDown)
      return
    isPointerDown = false
    hasMovedEnoughForFallbackDrag = false
    handleDragEnd(event)
    initialPointerPosition.value = null
  }

  const handlePointerDown = (event: PointerEvent) => {
    const el = toValue(draggingHandle)
    if (!el || event.button !== 0)
      return
    let currentElement = event.target as Node | null
    let isTargetInHandle = false
    while (currentElement) {
      if (currentElement === el) {
        isTargetInHandle = true
        break
      }
      currentElement = currentElement.parentNode
    }
    if (!isTargetInHandle)
      return
    isPointerDown = true
    initialPointerPosition.value = { x: event.clientX, y: event.clientY }
    hasMovedEnoughForFallbackDrag = fallbackTolerance === 0
    event.preventDefault()
    const startDrag = () => {
      if (!isPointerDown)
        return
      isDragging.value = true
      const dragOpId = generateDragId()
      activeDragId.value = dragOpId
      dragStore.setActiveDrag(dragOpId, dragId, index, type, true)
      createFallbackDragImage(el as HTMLElement, event)
      applyDragStyles()
      onDragStart?.(event)
    }
    if (delay > 0) {
      isDragging.value = false
      delayTimeout.value = window.setTimeout(() => {
        delayTimeout.value = null
        if (initialPointerPosition.value) {
          const dx = event.clientX - initialPointerPosition.value.x
          const dy = event.clientY - initialPointerPosition.value.y
          if (Math.sqrt(dx * dx + dy * dy) >= fallbackTolerance)
            startDrag()
          else
            initialPointerPosition.value = null
        }
      }, delay)
    }
    else {
      if (hasMovedEnoughForFallbackDrag) {
        startDrag()
      }
    }
  }

  // Setup drag attributes
  const setupDragAttributes = () => {
    const el = toValue(draggingHandle)
    if (!el)
      return
    if (!forceFallback) {
      el.setAttribute('draggable', 'true')
    }
    else {
      el.removeAttribute('draggable')
    }
    (el as HTMLElement).style.cursor = 'grab'
    el.setAttribute('aria-grabbed', 'false')
  }

  watch(() => toValue(draggingHandle), (el, oldEl) => {
    if (oldEl && (oldEl as HTMLElement).style) {
      try {
        (oldEl as HTMLElement).style.cursor = ''
      }
      catch { }
    }
    if (el) {
      setupDragAttributes()
      watch(isDragging, (dragging) => {
        el.setAttribute('aria-grabbed', dragging ? 'true' : 'false')
        applyDragStyles()
      }, { immediate: true })
    }
  }, { immediate: true, deep: true })

  if (isClient) {
    if (forceFallback) {
      useEventListener(draggingElement, 'pointerdown', handlePointerDown)
      useEventListener(draggingElement, 'pointermove', handlePointerMove)
      useEventListener(draggingElement, 'pointerup', handlePointerUp)
    }
    else {
      const draggingElementValue = toValue(draggingElement) || defaultWindow
      useEventListener(draggingElementValue, 'dragstart', handleDragStart)
      useEventListener(draggingElementValue, 'drag', handleDrag)
      useEventListener(draggingElementValue, 'dragend', handleDragEnd)
    }
    tryOnUnmounted(() => {
      if (dragTimeout.value) {
        window.clearTimeout(dragTimeout.value)
        dragTimeout.value = null
      }
      if (delayTimeout.value) {
        window.clearTimeout(delayTimeout.value)
        delayTimeout.value = null
      }
      if (dragPreviewElement.value && dragPreviewElement.value.parentElement) {
        try {
          document.body.removeChild(dragPreviewElement.value)
        }
        catch {
        }
        finally {
          dragPreviewElement.value = null
        }
      }
      removeFallbackDragImage()
      const el = toValue(draggingHandle)
      if (el && mergedStateStyles.value.dragging) {
        Object.keys(mergedStateStyles.value.dragging).forEach((key) => {
          try {
            (el as HTMLElement).style[key as any] = ''
          }
          catch { }
        })
      }
      const currentActiveDrag = dragStore.getActiveDrag()
      if (activeDragId.value && currentActiveDrag && activeDragId.value === currentActiveDrag.id) {
        dragStore.clearActiveDrag(activeDragId.value)
      }
      activeDragId.value = null
    })
  }

  const style = computed(() => {
    const computedStyle: Record<string, string> = {}
    if (isDragging.value && mergedStateStyles.value.dragging) {
      Object.assign(computedStyle, mergedStateStyles.value.dragging)
    }
    return computedStyle
  })

  return {
    isDragging,
    style,
  }
}

export default useDrag
