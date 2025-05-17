import type { DragData, DropOptions } from '@/types/dnd'
import type { MaybeRefOrGetter } from 'vue'
import { isClient } from '@/utils'
import dragStore from '@/utils/dragStore'
import { tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, onMounted, shallowRef, toValue, watch } from 'vue'

/**
 * Hook for creating a drop zone that can receive dragged items
 * @param target - Reference to the element to make a drop zone
 * @param options - Configuration options for drop behavior
 * @returns Object containing drop state and methods
 */
export function useDrop<T = unknown>(
  target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>,
  options: DropOptions<T> = {},
) {
  const {
    accept,
    dropEffect = 'move',
    allowFallbackDrags = true,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  } = options

  // State
  const isDragOver = shallowRef(false)
  const isValidDrop = shallowRef(false)
  const currentData = shallowRef<DragData<T> | null>(null)

  // Computed values
  const acceptValue = computed(() => toValue(accept))
  const dropEffectValue = computed(() => toValue(dropEffect))
  const allowFallbackDragsValue = computed(() => toValue(allowFallbackDrags))

  // Helper functions
  const validateDrop = (dataToValidate: DragData<T>): boolean => {
    const acceptConfig = acceptValue.value
    if (!acceptConfig)
      return true

    // If acceptConfig is a function, use it to validate the types
    if (typeof acceptConfig === 'function') {
      return acceptConfig([dataToValidate.type])
    }

    // If acceptConfig is an array, check if it includes the data type
    if (Array.isArray(acceptConfig)) {
      return acceptConfig.includes(dataToValidate.type)
    }

    return true
  }

  /**
   * Extract drag data from dataTransfer object
   * This should only be called during the drop event
   */
  const extractDragData = (event: DragEvent): DragData<T> | null => {
    if (!event.dataTransfer)
      return null

    try {
      const types = event.dataTransfer.types
      let data: DragData<T> | null = null
      let dragId: string | null = null

      // Step 1: Try to get the drag ID from our custom MIME type
      if (types.includes('application/x-vue-dndnr-id')) {
        dragId = event.dataTransfer.getData('application/x-vue-dndnr-id')
        if (dragId && dragStore.hasDataById(dragId)) {
          data = dragStore.getDataById<T>(dragId)
          if (data) {
            return data
          }
        }
      }

      // Step 2: If custom MIME type not found, try text/plain format
      if (!dragId && types.includes('text/plain')) {
        const textData = event.dataTransfer.getData('text/plain')

        // Check if it's our formatted text representation "type:dragId"
        const match = textData.match(/^([^:]+):([^:]+)$/)
        if (match && match[2] && match[2].startsWith('drag-')) {
          // Extract the drag ID from the formatted text
          dragId = match[2]
          if (dragStore.hasDataById(dragId)) {
            data = dragStore.getDataById<T>(dragId)
            if (data) {
              return data
            }
          }
        }
        // For backward compatibility, check if it's just a drag ID
        else if (textData && textData.startsWith('drag-')) {
          dragId = textData
          if (dragStore.hasDataById(dragId)) {
            data = dragStore.getDataById<T>(dragId)
            if (data) {
              return data
            }
          }
        }
      }

      // Step 3: If not found in store, try to parse JSON data
      if (!data && types.includes('application/json')) {
        try {
          const jsonData = event.dataTransfer.getData('application/json')
          if (jsonData) {
            data = JSON.parse(jsonData) as DragData<T>
            if (data && typeof data === 'object' && 'type' in data && 'payload' in data) {
              return data
            }
          }
        }
        catch (e) {
          console.warn('Error parsing JSON data:', e)
          // Continue to other formats
        }
      }

      // Step 4: Handle other data types as fallback
      if (!data) {
        // Check for text content (using text/plain-content if available)
        if (types.includes('text/plain-content')) {
          const textContent = event.dataTransfer.getData('text/plain-content')
          if (textContent) {
            return {
              type: 'text',
              payload: textContent,
            } as unknown as DragData<T>
          }
        }
        // Fallback to text/plain if it doesn't match our format patterns
        else if (types.includes('text/plain')) {
          const textData = event.dataTransfer.getData('text/plain')
          // Only use as plain text if it doesn't match our special formats
          if (textData && !textData.startsWith('drag-') && !textData.includes(':drag-')) {
            return {
              type: 'text',
              payload: textData,
            } as unknown as DragData<T>
          }
        }

        // Check for URL data
        if (types.includes('text/uri-list')) {
          const urlData = event.dataTransfer.getData('text/uri-list')
          if (urlData) {
            return {
              type: 'url',
              payload: urlData,
            } as unknown as DragData<T>
          }
        }

        // Check for HTML content
        if (types.includes('text/html')) {
          const htmlData = event.dataTransfer.getData('text/html')
          if (htmlData) {
            return {
              type: 'html',
              payload: htmlData,
            } as unknown as DragData<T>
          }
        }

        // Check for file data
        if (types.includes('Files') && event.dataTransfer.files.length > 0) {
          return {
            type: 'files',
            payload: Array.from(event.dataTransfer.files) as unknown as T,
          }
        }
      }

      return null
    }
    catch (error) {
      console.error('Error extracting drag data:', error)
      return null
    }
  }

  // Event handlers
  const handleNativeDragEnter = (event: DragEvent) => {
    if (!event.dataTransfer)
      return

    // Prevent default to allow drop
    event.preventDefault()

    // Check for potential compatibility without trying to access data
    // We can only check the types that are available
    const types = event.dataTransfer.types

    // Determine if this might be a valid drop based on types
    let potentiallyValid = false

    // Check if this is likely from our drag system
    if (types.includes('application/x-vue-dndnr-id')
      || types.includes('text/plain')
      || types.includes('application/json')) {
      potentiallyValid = true

      // If we have accept criteria, we can only make a preliminary guess
      const acceptConfig = acceptValue.value
      if (acceptConfig) {
        // We can't know for sure without the data, so we'll be optimistic
        // The actual validation will happen on drop
        potentiallyValid = true
      }
    }

    // Update state based on our best guess
    isDragOver.value = true
    isValidDrop.value = potentiallyValid
    currentData.value = null

    // Set drop effect based on our validation
    event.dataTransfer.dropEffect = isValidDrop.value ? dropEffectValue.value : 'none'

    // Call user-provided callback if available
    if (onDragEnter)
      onDragEnter(currentData.value, event)
  }

  const handleNativeDragOver = (event: DragEvent) => {
    if (!event.dataTransfer)
      return

    // Prevent default to allow drop
    event.preventDefault()

    // Update drop effect
    event.dataTransfer.dropEffect = isValidDrop.value ? dropEffectValue.value : 'none'

    // Call user-provided callback if available
    if (onDragOver)
      onDragOver(currentData.value, event)
  }

  const handleNativeDragLeave = (event: DragEvent) => {
    // Check if we're actually leaving the element
    const el = toValue(target)
    const relatedTarget = event.relatedTarget as Node | null
    if (el && relatedTarget && el.contains(relatedTarget))
      return

    // Reset state
    isDragOver.value = false
    isValidDrop.value = false
    currentData.value = null

    // Call user-provided callback if available
    if (onDragLeave)
      onDragLeave(currentData.value, event)
  }

  const handleNativeDrop = (event: DragEvent) => {
    if (!event.dataTransfer)
      return

    // Prevent default to handle the drop
    event.preventDefault()

    try {
      // Extract the drag data using our helper function
      const extractedData = extractDragData(event)

      // Validate the drop if we have data
      let isValid = false
      if (extractedData) {
        isValid = validateDrop(extractedData)

        // Update our data state
        currentData.value = extractedData
        isValidDrop.value = isValid

        // Set drop effect in dataTransfer if needed
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = isValid ? dropEffectValue.value : 'none'
        }

        // Call the drop handler if valid
        if (isValid && onDrop) {
          onDrop(extractedData, event)
        }
      }
    }
    catch (error) {
      console.error('Error handling drop:', error)
    }

    // Reset state
    isDragOver.value = false
    isValidDrop.value = false
    currentData.value = null
  }

  // --- Fallback Event Handlers ---
  const handlePointerEnterForDrop = (event: PointerEvent) => {
    if (!allowFallbackDragsValue.value)
      return

    const activeDrag = dragStore.getActiveDrag<T>()
    if (activeDrag && activeDrag.isFallback) {
      const el = toValue(target)
      if (!el || !(el instanceof HTMLElement || el instanceof SVGElement) || !el.contains(event.target as Node)) {
        // If pointerenter is on a child, but we want to ensure it's for the drop target itself.
        // This check might be redundant if useEventListener is attached directly to target.
      }

      isDragOver.value = true
      currentData.value = activeDrag.data
      isValidDrop.value = validateDrop(activeDrag.data)
      onDragEnter?.(activeDrag.data, event as any) // Pass PointerEvent, cast as any for now
    }
  }

  const handlePointerMoveForDrop = (event: PointerEvent) => {
    if (!allowFallbackDragsValue.value || !isDragOver.value)
      return

    const activeDrag = dragStore.getActiveDrag<T>()
    if (activeDrag && activeDrag.isFallback) {
      // currentData.value should already be set by pointerenter
      // isValidCurrentDrop.value should also be set
      onDragOver?.(currentData.value, event as any) // Pass PointerEvent
    }
  }

  const handlePointerLeaveForDrop = (event: PointerEvent) => {
    if (!allowFallbackDragsValue.value || !isDragOver.value)
      return

    const activeDrag = dragStore.getActiveDrag<T>()
    // Only trigger leave if the drag was a fallback drag and we are actually over
    if (activeDrag && activeDrag.isFallback) {
      const el = toValue(target)
      const relatedTargetNode = event.relatedTarget as Node | null

      // Check if the pointer is leaving to outside the target element
      if (el && relatedTargetNode && el.contains(relatedTargetNode)) {
        return // Still within the drop target or its children
      }

      // The core logic for resetting state when leaving the drop zone:
      isDragOver.value = false
      isValidDrop.value = false
      currentData.value = null
      onDragLeave?.(null, event as any) // Pass PointerEvent
    }
  }

  const handlePointerUpForDrop = (event: PointerEvent) => {
    if (!allowFallbackDragsValue.value || !isDragOver.value)
      return

    const activeDrag = dragStore.getActiveDrag<T>()
    if (activeDrag && activeDrag.isFallback) {
      if (isValidDrop.value && currentData.value) {
        onDrop?.(currentData.value, event as any) // Pass PointerEvent
      }
      // Reset state regardless of successful drop, dragend from useDrag will clear store
      isDragOver.value = false
      isValidDrop.value = false
      currentData.value = null
    }
  }

  // Setup drop zone attributes
  const setupDropZoneAttributes = () => {
    const el = toValue(target)
    if (!el)
      return

    el.setAttribute('aria-droptarget', 'true')
  }

  // Setup event listeners
  if (isClient) {
    // Native HTML5 Drag and Drop events
    useEventListener(target, 'dragenter', handleNativeDragEnter)
    useEventListener(target, 'dragover', handleNativeDragOver)
    useEventListener(target, 'dragleave', handleNativeDragLeave)
    useEventListener(target, 'drop', handleNativeDrop)

    // Fallback pointer event listeners for drop zone interaction
    // These are attached to the drop target element itself
    useEventListener(target, 'pointerenter', handlePointerEnterForDrop, { capture: true })
    useEventListener(target, 'pointerleave', handlePointerLeaveForDrop, { capture: true })
    // For pointermove and pointerup during a fallback drag, we might need to listen on a broader scope (e.g., document or draggingElement from useDrag)
    // However, for simply handling the drop (pointerup over the target), this should be sufficient.
    // We also listen on document for pointermove to update dragOver state when pointer is over the element during fallback drag
    useEventListener(target, 'pointermove', handlePointerMoveForDrop, { capture: true, passive: true })
    useEventListener(target, 'pointerup', handlePointerUpForDrop, { capture: true, passive: false })

    // Initial setup
    onMounted(() => {
      setupDropZoneAttributes()
    })

    // Watch for target changes to re-apply attributes if necessary
    watch(
      () => toValue(target),
      (newTarget) => {
        if (newTarget)
          setupDropZoneAttributes()
      },
    )
  } // End of isClient block

  // Cleanup on unmount
  tryOnUnmounted(() => {
    // Reset state variables
    isDragOver.value = false
    isValidDrop.value = false
    currentData.value = null
  })

  return {
    isDragOver,
    isValidDrop,
    data: currentData,
  }
}

export default useDrop
