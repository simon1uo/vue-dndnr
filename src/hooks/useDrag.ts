import type { DragData, DragOptions, DragStateStyles } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { defaultWindow, isClient } from '@/utils'
import dragStore, { generateDragId } from '@/utils/dragStore'
import { tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, shallowRef, toValue, watch } from 'vue'

/**
 * Hook for making an element draggable with HTML5 Drag and Drop API
 * @param target - Reference to the element to make draggable
 * @param options - Configuration options for drag behavior
 * @returns Object containing drag state and methods
 */
export function useDrag<T = unknown>(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
  options: DragOptions<T> = {},
) {
  const {
    data = () => ({ type: 'default', payload: null as unknown as T }),
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

  // State
  const isDragging = shallowRef(false)
  const dragData = shallowRef<DragData<T> | null>(null)
  const dragPreviewElement = shallowRef<HTMLElement | null>(null)
  const fallbackElement = shallowRef<HTMLElement | null>(null)
  const dragTimeout = shallowRef<number | null>(null)
  const delayTimeout = shallowRef<number | null>(null)
  const initialPointerPosition = shallowRef<{ x: number, y: number } | null>(null)
  const activeDragImageOffset = shallowRef({ x: 0, y: 0 })
  const activeDragId = shallowRef<string | null>(null)

  // Computed values
  const dataValue = computed(() => toValue(data))
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
    // Early return if dataTransfer is not available
    if (!event.dataTransfer)
      return

    const previewOptions = toValue(dragPreviewValue)
    if (!previewOptions?.element)
      return

    const elementToClone = toValue(previewOptions.element)
    if (!elementToClone)
      return

    // Check if setDragImage is supported
    if (!isSetDragImageSupported()) {
      console.warn('setDragImage is not supported in this browser, native drag preview might not work as expected.')
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
      clone.style.opacity = '1' // Ensure clone is visible for setDragImage

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
      dragPreviewElement.value = container // Store the container, not the clone

      event.dataTransfer.setDragImage(clone, offset.x, offset.y)

      // Schedule cleanup. It needs to be slightly delayed for the browser to capture the image.
      dragTimeout.value = window.setTimeout(() => {
        if (dragPreviewElement.value && dragPreviewElement.value.parentElement) {
          document.body.removeChild(dragPreviewElement.value)
          dragPreviewElement.value = null
        }
      }, 0)
    }
    catch (error) {
      console.error('Error creating native drag image:', error)
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
      if (previewSourceEl) { // Successfully got the preview element
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

        // Copy visual styles from the source preview element, similar to createNativeDragImage
        const computedStyle = window.getComputedStyle(previewSourceEl)
        for (const prop of ['backgroundColor', 'color', 'border', 'borderRadius', 'padding', 'margin', 'boxShadow', 'fontSize', 'fontFamily']) {
          (elementToClone.style as any)[prop] = computedStyle[prop as any]
        }
      }
      else { // previewOpts.element was defined but resolved to null/undefined, fallback to original target
        elementToClone = originalTargetElement.cloneNode(true) as HTMLElement
        const targetRect = originalTargetElement.getBoundingClientRect()
        elementToClone.style.width = `${targetRect.width}px`
        elementToClone.style.height = `${targetRect.height}px`
        // Calculate offset to maintain grab position relative to original target
        if (initialPointerPosition.value) {
          offsetX = initialPointerPosition.value.x - targetRect.left
          offsetY = initialPointerPosition.value.y - targetRect.top
        }
        else { // Should ideally not happen if initialPointerPosition is always set before this
          offsetX = 0
          offsetY = 0
        }
      }
    }
    else { // No dragPreview.element specified, clone original target
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

    // Common styling for the fallback element
    elementToClone.classList.add(fallbackClass)
    elementToClone.style.position = 'fixed'
    elementToClone.style.left = `${event.clientX - activeDragImageOffset.value.x}px`
    elementToClone.style.top = `${event.clientY - activeDragImageOffset.value.y}px`
    elementToClone.style.pointerEvents = 'none'
    elementToClone.style.zIndex = '9999'
    // Opacity etc. can be controlled by fallbackClass or copied styles if using previewElement

    if (fallbackOnBody) {
      document.body.appendChild(elementToClone)
    }
    else {
      originalTargetElement.parentElement?.appendChild(elementToClone)
    }
    fallbackElement.value = elementToClone
    // Initial position is set, no need to call updateFallbackPosition(event) here
  }

  const updateFallbackPosition = (event: PointerEvent) => {
    if (!fallbackElement.value)
      return

    // Position the fallback element so that the point (activeDragImageOffset.x, activeDragImageOffset.y)
    // on the fallback element stays under the cursor.
    fallbackElement.value.style.left = `${event.clientX - activeDragImageOffset.value.x}px`
    fallbackElement.value.style.top = `${event.clientY - activeDragImageOffset.value.y}px`
  }

  // Event handlers
  const handleDragStart = (event: DragEvent) => {
    const el = toValue(target)
    if (!el || !event.dataTransfer)
      return

    // Set drag data
    const currentDragData = dataValue.value
    event.dataTransfer.effectAllowed = 'all'

    // Generate a unique ID for this drag operation
    const dragId = generateDragId()

    // Store the drag data in the global store
    activeDragId.value = dragId
    dragStore.setActiveDrag(dragId, currentDragData, false)

    // Check browser capabilities for optimized data transfer
    const hasCustomMimeTypeSupport = (() => {
      try {
        // Test if we can set and get a custom MIME type
        const testType = 'application/x-test'
        const testData = 'test'
        event.dataTransfer.setData(testType, testData)
        return event.dataTransfer.getData(testType) === testData
      }
      catch {
        return false
      }
    })()

    // Set multiple data formats for better compatibility and cross-window/cross-application support

    // 1. Set the drag ID using an appropriate format
    if (hasCustomMimeTypeSupport) {
      // Use custom MIME type if supported
      // Use a vendor-prefixed MIME type to avoid conflicts
      event.dataTransfer.setData('application/x-vue-dndnr-id', dragId)
    }

    // 2. Set the JSON data for direct access when possible
    try {
      event.dataTransfer.setData('application/json', JSON.stringify(currentDragData))
    }
    catch {
      // Some browsers may not support this format
    }

    // 3. Always set text/plain for universal compatibility
    // Use a descriptive text representation that includes both ID and basic info
    const textRepresentation = `${currentDragData.type}:${dragId}`
    event.dataTransfer.setData('text/plain', textRepresentation)

    // 4. Set additional formats based on payload type
    if (currentDragData.type === 'text' && typeof currentDragData.payload === 'string') {
      // For text content, we need to be careful not to override text/plain
      // Only set direct text content if we have custom MIME type support
      if (hasCustomMimeTypeSupport) {
        event.dataTransfer.setData('text/plain-content', currentDragData.payload as string)
      }
    }
    else if (currentDragData.type === 'url' && typeof currentDragData.payload === 'string') {
      // For URL content
      event.dataTransfer.setData('text/uri-list', currentDragData.payload as string)
    }

    // 5. Add HTML format if the payload has HTML content
    if (currentDragData.type === 'html' && typeof currentDragData.payload === 'string') {
      event.dataTransfer.setData('text/html', currentDragData.payload as string)
    }

    // 6. Support for file data if available
    if (currentDragData.type === 'files' && currentDragData.payload instanceof FileList) {
      // Files are automatically added to dataTransfer.files
      // No need to explicitly set data
    }

    // Create native drag image if configured and not in fallback mode
    createNativeDragImage(event)

    // Set up drag state
    dragData.value = currentDragData
    isDragging.value = true
    // Apply styles when drag starts
    applyDragStyles()

    // Call the user's drag start handler if provided
    onDragStart?.(event)
  }

  const handleDrag = (event: DragEvent) => {
    if (!isDragging.value || !dragData.value)
      return

    // Call the user's drag handler if provided
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

    // Call the user's drag end handler if provided
    onDragEnd?.(event)

    // Reset state for this instance
    isDragging.value = false
    dragData.value = null
    activeDragId.value = null
    applyDragStyles()
  }

  // --- Fallback Mode Event Handlers ---
  let isPointerDown = false
  let hasMovedEnoughForFallbackDrag = false

  // Define the handlers in the correct order to avoid circular references

  // Define the pointer move handler
  const handlePointerMove = (event: PointerEvent) => {
    if (!isPointerDown)
      return

    if (!isDragging.value) {
      if (initialPointerPosition.value && fallbackTolerance > 0) {
        const dx = event.clientX - initialPointerPosition.value.x
        const dy = event.clientY - initialPointerPosition.value.y
        if (Math.sqrt(dx * dx + dy * dy) >= fallbackTolerance) {
          hasMovedEnoughForFallbackDrag = true
          // Clear delay timeout if drag starts due to tolerance breach
          if (delayTimeout.value) {
            window.clearTimeout(delayTimeout.value)
            delayTimeout.value = null
          }
          // Effectively call startDrag logic part here, but without the delay itself
          const el = toValue(target)
          if (!el)
            return

          isDragging.value = true
          const currentDragData = dataValue.value
          dragData.value = currentDragData

          const dragId = generateDragId()
          activeDragId.value = dragId // Store the generated ID
          dragStore.setActiveDrag(dragId, currentDragData, true) // Set as active fallback drag

          createFallbackDragImage(el as HTMLElement, event) // Create with current event for position
          applyDragStyles()
          onDragStart?.(event)

          // We don't need to add listeners here since they're already added in handlePointerDown
        }
      }
      if (!hasMovedEnoughForFallbackDrag)
        return // Not dragging yet
    }

    // If dragging has started
    if (isDragging.value) {
      updateFallbackPosition(event)
      // position.value could be updated to reflect pointer, but its meaning differs from native
      // dragEffect.value would need to be derived from modifier keys on PointerEvent
      // For simplicity, dragEffect is not fully implemented for fallback in this pass

      onDrag?.(event) // Pass PointerEvent
    }
  }

  const stopPointerMoveListeners = useEventListener(draggingElement, 'pointermove', handlePointerMove, { capture: true, passive: false })

  const handlePointerUp = (event: PointerEvent) => {
    stopPointerMoveListeners()
    isPointerDown = false

    if (delayTimeout.value) {
      window.clearTimeout(delayTimeout.value)
      delayTimeout.value = null
    }

    if (!isDragging.value && initialPointerPosition.value) {
      initialPointerPosition.value = null
      return
    }

    if (isDragging.value) {
      handleDragEnd(event)
    }
    else if (fallbackElement.value) {
      removeFallbackDragImage()
      const currentActiveDrag = dragStore.getActiveDrag()
      if (activeDragId.value && currentActiveDrag && activeDragId.value === currentActiveDrag.id && currentActiveDrag.isFallback) {
        dragStore.clearActiveDrag(activeDragId.value)
      }
      activeDragId.value = null
    }

    isDragging.value = false
    applyDragStyles()
    initialPointerPosition.value = null
    const currentActiveDragAfterEnd = dragStore.getActiveDrag()
    if (activeDragId.value && currentActiveDragAfterEnd && activeDragId.value === currentActiveDragAfterEnd.id) {
      dragStore.clearActiveDrag(activeDragId.value)
      activeDragId.value = null
    }
  }

  const handlePointerDown = (event: PointerEvent) => {
    const el = toValue(draggingHandle)
    if (!el || event.button !== 0)
      return // Only main button

    // Check if the event target is within the dragHandle
    // This is important if the handle is a child of the target, or vice-versa, or they are different elements.
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

    // Prevent text selection and other default behaviors
    event.preventDefault()

    const startDrag = () => {
      if (!isPointerDown)
        return // If pointerup occurred during delay

      isDragging.value = true
      const currentDragData = dataValue.value
      dragData.value = currentDragData
      // dragEffect and position are handled by pointermove in fallback

      // Store data in dragStore (no DataTransfer object here)
      const dragId = generateDragId()
      activeDragId.value = dragId // Store the generated ID
      dragStore.setActiveDrag(dragId, currentDragData, true)

      createFallbackDragImage(el as HTMLElement, event)
      applyDragStyles() // Apply styles for fallback drag start

      // Call user's onDragStart
      onDragStart?.(event) // Pass PointerEvent
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
      el.removeAttribute('draggable') // Not needed for fallback
    }
    // Always set cursor to grab for draggable elements
    (el as HTMLElement).style.cursor = 'grab'

    // aria-grabbed might still be relevant for both, but usually on the main target
    el.setAttribute('aria-grabbed', 'false') // Will be updated during drag
  }

  // Watch for target changes to update attributes
  watch(() => toValue(draggingHandle), (el, oldEl) => {
    if (oldEl && (oldEl as HTMLElement).style) { // Cleanup old styles if target changes
      try { // oldEl might not be in DOM or style could be null
        (oldEl as HTMLElement).style.cursor = ''
      }
      catch { }
    }
    if (el) {
      setupDragAttributes()
      // Update aria-grabbed based on isDragging state on the target element
      watch(isDragging, (dragging) => {
        el.setAttribute('aria-grabbed', dragging ? 'true' : 'false')
        // Apply styles to target when isDragging changes
        applyDragStyles()
      }, { immediate: true })
    }
  }, { immediate: true, deep: true })

  // Setup event listeners
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

    // Cleanup
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

      // Reset styles on unmount
      const el = toValue(draggingHandle)

      if (el && mergedStateStyles.value.dragging) {
        Object.keys(mergedStateStyles.value.dragging).forEach((key) => {
          try { // Element might not be in DOM or style could be null
            (el as HTMLElement).style[key as any] = ''
          }
          catch { }
        })
      }

      // Clean up global store if this instance was the active dragger
      const currentActiveDrag = dragStore.getActiveDrag()
      if (activeDragId.value && currentActiveDrag && activeDragId.value === currentActiveDrag.id) {
        dragStore.clearActiveDrag(activeDragId.value)
      }
      activeDragId.value = null // Clear local ref
    })
  }

  // Computed style based on current drag state
  const style = computed(() => {
    const computedStyle: Record<string, string> = {}
    if (isDragging.value && mergedStateStyles.value.dragging) {
      Object.assign(computedStyle, mergedStateStyles.value.dragging)
    }
    return computedStyle
  })

  return {
    isDragging,
    dragData,
    style,
  }
}

export default useDrag
