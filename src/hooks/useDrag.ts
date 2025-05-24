import type { DragOptions, DragPreviewOptions, DragStateStyles } from '@/types'
import type { Position } from '@/types/common'
import type { MaybeRefOrGetter } from 'vue'
import { DragMode } from '@/types'
import { defaultWindow, isClient } from '@/utils'
import dragStore, { generateDragId } from '@/utils/dragStore'
import { tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, shallowRef, toValue, watch } from 'vue'
import { useDragPreview } from './useDragPreview'

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
    dragMode = DragMode.Native,
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
  const delayTimeout = shallowRef<number | null>(null)
  const initialPointerPosition = shallowRef<Position | null>(null)
  const activeDragId = shallowRef<string | null>(null)
  const eventListeners = shallowRef<(() => void)[]>([])
  const debugMode = shallowRef(false)

  // Computed values
  const dragPreviewValue = computed(() => toValue(dragPreview))
  const stateStylesValue = computed(() => toValue(stateStyles))
  const dragModeValue = computed(() => toValue(dragMode))

  // Initialize useDragPreview for internal use
  const internalPreviewOptions = computed(() => {
    return {
      element: dragPreviewValue.value?.element || target,
      offset: dragPreviewValue.value?.offset,
      container: document.body,
      zIndex: 1000,
      dragMode: dragModeValue,
    } as DragPreviewOptions
  })

  // Use drag preview hook internally
  const { updatePreview, isVisible: previewVisible, hidePreview, removePreview, handleDragStartEvent: previewHandleDragStart, handleDragEndEvent: previewHandleDragEnd } = useDragPreview(internalPreviewOptions.value)

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

  // Debug utility function
  const logDebug = (message: string, ...args: any[]) => {
    if (debugMode.value) {
      console.warn(`[useDrag:${dragId}] ${message}`, ...args)
    }
  }

  /**
   * Apply styles to the target element based on current drag state
   */
  const applyDragStyles = () => {
    const el = toValue(target)
    if (!el)
      return

    // Reset all styles first
    const resetStyles = (styleObj: Record<string, string> | undefined) => {
      if (!styleObj)
        return

      Object.keys(styleObj).forEach((key) => {
        (el as HTMLElement).style[key as any] = ''
      })
    }

    const applyStyles = (styleObj: Record<string, string> | undefined) => {
      if (!styleObj)
        return

      Object.entries(styleObj).forEach(([key, value]) => {
        (el as HTMLElement).style[key as any] = value
      })
    }

    // Reset and apply normal styles
    resetStyles(mergedStateStyles.value.dragging)
    applyStyles(mergedStateStyles.value.normal)

    // Apply dragging styles if needed
    if (isDragging.value) {
      applyStyles(mergedStateStyles.value.dragging)
    }
  }

  /**
   * Check if setDragImage is supported in the current browser
   */
  const isSetDragImageSupported = (): boolean => {
    return typeof DataTransfer.prototype.setDragImage === 'function'
  }

  /**
   * Setup native drag image when drag starts
   */
  const setupNativeDragImage = (event: DragEvent) => {
    const dragPreview = toValue(dragPreviewValue)
    const element = toValue(dragPreview?.element)

    if (!event.dataTransfer || !element)
      return

    if (!isSetDragImageSupported())
      return

    try {
      const elementToClone = element
      if (!elementToClone)
        return

      const offset = dragPreview?.offset || { x: 0, y: 0 }
      event.dataTransfer.setDragImage(elementToClone, offset.x, offset.y)
    }
    catch (error) {
      console.error('[useDrag] Failed to set drag image:', error)
    }
  }

  /**
   * Setup pointer mode drag preview
   */
  const setupPointerModeDragPreview = (position?: Position) => {
    if (dragModeValue.value !== DragMode.Pointer)
      return

    const currentPosition = position || dragStore.getPosition().value

    setTimeout(() => {
      updatePreview(true, undefined, currentPosition)
    }, 0)
  }

  /**
   * Clean up the current drag operation
   */
  const cleanupDragOperation = () => {
    if (delayTimeout.value) {
      window.clearTimeout(delayTimeout.value)
      delayTimeout.value = null
    }

    const currentActiveDrag = dragStore.getActiveDrag().value
    if (activeDragId.value && currentActiveDrag && activeDragId.value === currentActiveDrag.id) {
      dragStore.clearActiveDrag(activeDragId.value)
    }

    previewHandleDragEnd()

    isDragging.value = false
    activeDragId.value = null
    applyDragStyles()
  }
  /**
   * Start a drag operation
   */
  const startDrag = (event: DragEvent | PointerEvent, initialPosition?: Position) => {
    const dragOpId = generateDragId()
    activeDragId.value = dragOpId

    previewHandleDragStart()

    const position = initialPosition || {
      x: 'clientX' in event ? event.clientX : 0,
      y: 'clientY' in event ? event.clientY : 0,
    }

    // Resolve the target element to be used as sourceNode
    const sourceEl = toValue(target)
    // console.warn('[useDrag] Starting drag. Source Element:', sourceEl, 'Initial Pointer Position:', position) // DEBUG_LOG

    dragStore.setActiveDrag({
      id: dragOpId,
      dragId,
      index,
      type,
      dragMode: dragModeValue.value,
      initialPosition: position,
      sourceNode: sourceEl instanceof HTMLElement ? sourceEl : undefined,
      initialPointerPosition: position,
    })

    // For native drag events, set data transfer
    if ('dataTransfer' in event && event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'all'
      event.dataTransfer.setData('application/x-vue-dndnr-id', dragId)
      event.dataTransfer.setData('application/x-vue-dndnr-index', String(index))
      event.dataTransfer.setData('application/x-vue-dndnr-type', type)
      event.dataTransfer.setData('text/plain', `${type}:${dragId}:${index}`)

      if (dragModeValue.value === DragMode.Native) {
        setupNativeDragImage(event as DragEvent)
      }
    }

    // For pointer events, update position and setup preview
    if (dragModeValue.value === DragMode.Pointer) {
      dragStore.updatePosition(position)

      if ('clientX' in event) {
        setupPointerModeDragPreview(position)
      }
    }

    isDragging.value = true
    applyDragStyles()
    onDragStart?.({ dragId, index, type }, event)
  }

  const handleDragStart = (event: DragEvent) => {
    if (!event.dataTransfer)
      return

    startDrag(event)
  }

  const handleDrag = (event: DragEvent) => {
    if (!isDragging.value)
      return

    if (event.clientX !== 0 || event.clientY !== 0) {
      dragStore.updatePosition({ x: event.clientX, y: event.clientY })
    }

    onDrag?.({ dragId, index, type }, event)
  }

  const handleDragEnd = (event: DragEvent | PointerEvent) => {
    if (!isDragging.value && activeDragId.value !== dragStore.getActiveDrag().value?.id) {
      return
    }

    cleanupDragOperation()
    onDragEnd?.({ dragId, index, type }, event)
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging.value) {
      if (initialPointerPosition.value) {
        if (delayTimeout.value) {
          window.clearTimeout(delayTimeout.value)
          delayTimeout.value = null
        }

        const el = toValue(target)
        if (!el)
          return

        startDrag(event, { x: event.clientX, y: event.clientY })
      }
    }

    if (isDragging.value) {
      const position = { x: event.clientX, y: event.clientY }
      dragStore.updatePosition(position)

      if (dragModeValue.value === DragMode.Pointer && !previewVisible.value) {
        setupPointerModeDragPreview(position)
      }

      onDrag?.({ dragId, index, type }, event)
    }
  }

  const handlePointerUp = (event: PointerEvent) => {
    handleDragEnd(event)
    initialPointerPosition.value = null
  }

  const handlePointerDown = (event: PointerEvent) => {
    const el = toValue(draggingHandle)
    if (!el || event.button !== 0)
      return

    // Check if the target is within the handle element
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

    initialPointerPosition.value = { x: event.clientX, y: event.clientY }
    event.preventDefault()

    const startDragFn = () => {
      startDrag(event, { x: event.clientX, y: event.clientY })
    }

    if (delay > 0) {
      isDragging.value = false
      delayTimeout.value = window.setTimeout(startDragFn, delay)
    }
    else {
      startDragFn()
    }
  }

  /**
   * Clean up all event listeners
   */
  const cleanupEventListeners = () => {
    logDebug(`Cleaning up ${eventListeners.value.length} event listeners`)
    eventListeners.value.forEach(removeListener => removeListener())
    eventListeners.value = []
  }

  /**
   * Setup event listeners based on the current drag mode
   */
  const setupEventListeners = (mode: DragMode) => {
    if (!isClient)
      return

    logDebug(`Setting up event listeners for ${mode} mode`)

    cleanupEventListeners()

    if (mode === DragMode.Pointer) {
      const removePointerDown = useEventListener(draggingElement, 'pointerdown', handlePointerDown)
      const removePointerMove = useEventListener(draggingElement, 'pointermove', handlePointerMove)
      const removePointerUp = useEventListener(draggingElement, 'pointerup', handlePointerUp)

      eventListeners.value.push(removePointerDown, removePointerMove, removePointerUp)
    }
    else {
      const removeDragStart = useEventListener(draggingHandle, 'dragstart', handleDragStart)
      const removeDrag = useEventListener(draggingHandle, 'drag', handleDrag)
      const removeDragEnd = useEventListener(draggingHandle, 'dragend', handleDragEnd)

      eventListeners.value.push(removeDragStart, removeDrag, removeDragEnd)
    }
  }

  /**
   * Reset all drag state when mode is switching or component is unmounting
   */
  const resetDragState = () => {
    logDebug('Resetting drag state')

    // If currently dragging, abort the drag operation
    if (isDragging.value) {
      cleanupDragOperation()
    }

    // Reset initial pointer position
    initialPointerPosition.value = null

    // Reapply styles to ensure visual consistency
    applyDragStyles()
  }

  // Setup drag attributes
  const setupDragAttributes = () => {
    const el = toValue(draggingHandle)
    if (!el)
      return

    // First remove any existing attributes to ensure clean state
    el.removeAttribute('draggable')

    // Set attributes based on current mode
    if (dragModeValue.value === DragMode.Native) {
      el.setAttribute('draggable', 'true')
    }

    // Set common attributes
    (el as HTMLElement).style.cursor = 'grab'
    el.setAttribute('aria-grabbed', 'false')
  }

  // Initialize event listeners based on initial mode
  setupEventListeners(dragModeValue.value)

  // Watch for dragMode changes and handle preview accordingly
  watch(() => toValue(dragMode), (newMode, oldMode) => {
    if (newMode === oldMode)
      return

    // Reset drag state when mode changes
    resetDragState()

    // If switching from pointer to native, hide and remove preview
    if (oldMode === DragMode.Pointer && newMode === DragMode.Native) {
      setTimeout(() => {
        hidePreview()
        removePreview()
      })
    }

    // Set up new event listeners
    setupEventListeners(newMode)
    setupDragAttributes()
  }, { immediate: false, deep: true })

  // Watch draggingHandle changes
  watch(() => toValue(draggingHandle), (el, oldEl) => {
    if (oldEl && (oldEl as HTMLElement).style) {
      try {
        (oldEl as HTMLElement).style.cursor = ''
        oldEl.removeAttribute('draggable')
        oldEl.removeAttribute('aria-grabbed')
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

  // Cleanup on unmount
  if (isClient) {
    const cleanup = () => {
      resetDragState()
      cleanupEventListeners()
    }

    tryOnUnmounted(cleanup)
  }

  // Create a diagnostics function for debugging
  const getDiagnostics = () => {
    return {
      currentMode: dragModeValue.value,
      isDragging: isDragging.value,
      activeDragId: activeDragId.value,
      globalDragState: dragStore.getActiveDrag().value,
      eventListenersCount: eventListeners.value.length,
      target: toValue(target),
      handle: toValue(draggingHandle),
    }
  }

  // Programmatically switch mode (for external control)
  const switchMode = (newMode: DragMode) => {
    if (newMode === dragModeValue.value)
      return

    logDebug(`Manually switching mode to ${newMode}`)

    // Reset state
    resetDragState()

    // Clean up event listeners
    cleanupEventListeners()

    // Setup new event listeners
    setupEventListeners(newMode)

    // Update element attributes
    setupDragAttributes()
  }

  // Return API
  return {
    isDragging,
    style: computed(() => {
      const computedStyle: Record<string, string> = {}
      if (isDragging.value && mergedStateStyles.value.dragging) {
        Object.assign(computedStyle, mergedStateStyles.value.dragging)
      }
      return computedStyle
    }),

    // Advanced API for debugging and control
    setDebugMode: (enabled: boolean) => { debugMode.value = enabled },
    getDiagnostics,
    switchMode,
  }
}

export default useDrag
