import type { SortableEvent, SortableEventData, SortableEventType } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { UseSortableOptions } from './useSortable'
import type { SortableStateInternal } from './useSortableState'
import { IOS } from '@/utils'
import { tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, ref, toValue, watch } from 'vue'
import { useEventDispatcher } from './useEventDispatcher'

export interface UseSortableDragOptions extends UseSortableOptions {
  state: SortableStateInternal
  /**
   * Callback function to be called when items are updated
   * @returns void
   */
  onItemsUpdate?: () => void
  /**
   * Callback to capture animation state before DOM changes
   * @returns void
   */
  onAnimationCapture?: () => void
  /**
   * Callback to trigger animation after DOM changes
   * @returns void
   */
  onAnimationTrigger?: () => void
}

/**
 * Return type for useSortableDrag composable
 */
export interface UseSortableDragReturn {
  /**
   * Start dragging programmatically
   * @param element - Element to start dragging
   */
  startDrag: (element: HTMLElement) => void

  /**
   * Stop dragging programmatically
   */
  stopDrag: () => void

  /**
   * Pause drag functionality (temporarily disable)
   */
  pause: () => void

  /**
   * Resume drag functionality
   */
  resume: () => void

  /**
   * Destroy and cleanup all resources
   */
  destroy: () => void
}

/**
 * Sortable drag functionality composable following @vueuse/core patterns.
 *
 * Provides essential drag and drop functionality with:
 * - Reactive options support with MaybeRefOrGetter
 * - Native and fallback drag mode support
 * - Cross-browser compatibility
 * - SSR-safe implementation
 * - Automatic cleanup on unmount
 * - Event handling for mouse, touch, and native drag events
 * - Ghost element management
 * - Unified state management
 *
 * @param target - Target container element (ref, getter, or element)
 * @param options - Reactive drag configuration options
 * @returns Sortable drag functionality and state
 */
export function useSortableDrag(
  target: MaybeRefOrGetter<HTMLElement | null>,
  options: MaybeRefOrGetter<UseSortableDragOptions>,
): UseSortableDragReturn {
  // Initialize unified event dispatcher
  const { dispatch } = useEventDispatcher(target)

  // Core Internal State
  const startIndex = ref(-1)
  const currentTouchEvent = ref<{ clientX: number, clientY: number } | undefined>()
  const isUsingFallback = ref(false)
  const cleanupFunctions = ref<Array<() => void>>([])
  const dragCleanupFunctions = ref<Array<() => void>>([])

  // Fallback drag state
  const tapEvt = ref<{ clientX: number, clientY: number } | undefined>()
  const isFallbackActive = ref(false)
  const loopTimer = ref<NodeJS.Timeout | undefined>()
  const ghostMatrix = ref<DOMMatrix | undefined>()
  const lastDx = ref(0)
  const lastDy = ref(0)
  const scaleX = ref(1)
  const scaleY = ref(1)
  const ghostRelativeParent = ref<HTMLElement | undefined>()
  const ghostRelativeParentInitialScroll = ref<[number, number]>([0, 0])
  const positionGhostAbsolutely = computed(() => IOS)

  // Drag Delay management
  const delayTimer = ref<NodeJS.Timeout | undefined>()
  const awaitingDragStarted = ref(false)
  const delayedDragEvents = ref<Array<() => void>>([])

  // Touch and pointer state
  const touchStartThreshold = ref(1)
  const isTouchInteraction = ref(false)
  const lastX = ref(0)
  const lastY = ref(0)
  const supportPointer = computed(() => typeof window !== 'undefined' && 'PointerEvent' in window)

  // Event listener state
  const isListenersSetup = ref(false)

  const targetElement = computed(() => toValue(target))

  const {
    state,
    draggable = '> *',
    handle,
    filter,
    disabled = false,
    delay = 0,
    delayOnTouchOnly = false,
    ghostClass = 'sortable-ghost',
    chosenClass = 'sortable-chosen',
    dragClass = 'sortable-drag',
    forceFallback = false,
    fallbackClass = 'sortable-fallback',
    fallbackOnBody = false,
    fallbackOffset = { x: 0, y: 0 },
    swapThreshold = 1,
    preventOnFilter = true,
    immediate = true,
    onStart,
    onEnd,
    onUpdate,
    onFilter,
    onItemsUpdate,
    onAnimationCapture,
    onAnimationTrigger,
    setData,
  } = toValue(options)

  // Threshold detection state
  const dragStartThreshold = computed(() => {
    // native draggable uses threshold 1, fallback uses configured value
    if (state.nativeDraggable.value) {
      return 1
    }
    return Math.floor(toValue(touchStartThreshold) / ((state.nativeDraggable.value && window.devicePixelRatio) || 1))
  })

  /**
   * Parse scale transform when DOMMatrix is not available
   * Handles simple scale() transforms for test environments
   */
  const parseScaleTransform = (transform: string): { scaleX: number, scaleY: number } => {
    // Handle scale(x) and scale(x, y) patterns
    const scaleMatch = transform.match(/scale\(([^)]+)\)/)
    if (scaleMatch) {
      const values = scaleMatch[1].split(',').map(v => Number.parseFloat(v.trim()))
      if (values.length === 1) {
        // scale(x) - uniform scaling
        return { scaleX: values[0], scaleY: values[0] }
      }
      else if (values.length === 2) {
        // scale(x, y) - non-uniform scaling
        return { scaleX: values[0], scaleY: values[1] }
      }
    }

    // Handle scaleX() and scaleY() patterns
    const scaleXMatch = transform.match(/scaleX\(([^)]+)\)/)
    const scaleYMatch = transform.match(/scaleY\(([^)]+)\)/)

    let scaleXValue = 1
    let scaleYValue = 1

    if (scaleXMatch) {
      scaleXValue = Number.parseFloat(scaleXMatch[1])
    }
    if (scaleYMatch) {
      scaleYValue = Number.parseFloat(scaleYMatch[1])
    }

    // If we found individual scale functions, use them
    if (scaleXMatch || scaleYMatch) {
      return { scaleX: scaleXValue, scaleY: scaleYValue }
    }

    // Default to no scaling if we can't parse
    return { scaleX: 1, scaleY: 1 }
  }

  /**
   * Get window scrolling element
   */
  const getWindowScrollingElement = (): HTMLElement => {
    return document.scrollingElement as HTMLElement || document.documentElement
  }

  /**
   * Get computed style property
   */
  const getComputedStyleProperty = (element: HTMLElement, property: string): string => {
    try {
      return window.getComputedStyle(element)[property as any] || ''
    }
    catch {
      return ''
    }
  }

  /**
   * Get relative scroll offset for an element
   */
  const getRelativeScrollOffset = (element: HTMLElement): [number, number] => {
    let offsetLeft = 0
    let offsetTop = 0
    const winScroller = getWindowScrollingElement()

    let current: HTMLElement | null = element
    while (current && current !== winScroller) {
      offsetLeft += current.scrollLeft * (scaleX.value || 1)
      offsetTop += current.scrollTop * (scaleY.value || 1)
      current = current.parentElement
    }

    return [offsetLeft, offsetTop]
  }

  /**
   * Calculate scale factors for accurate positioning
   */
  const calculateScaleFactors = (): void => {
    const containerElement = targetElement.value
    if (!containerElement)
      return

    try {
      // Get computed style to check for transforms
      const containerStyle = window.getComputedStyle(containerElement)
      const transform = containerStyle.transform

      if (transform && transform !== 'none') {
        try {
          // Try to use DOMMatrix first
          const matrix = new DOMMatrix(transform)
          scaleX.value = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b)
          scaleY.value = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d)
        }
        catch {
          // Fallback for test environments - parse simple scale transforms
          const scaleFactors = parseScaleTransform(transform)
          scaleX.value = scaleFactors.scaleX
          scaleY.value = scaleFactors.scaleY
        }
      }
      else {
        scaleX.value = 1
        scaleY.value = 1
      }
    }
    catch {
      // Handle getComputedStyle errors gracefully
      scaleX.value = 1
      scaleY.value = 1
    }
  }

  /**
   * Initialize ghost relative parent for positioning calculations
   */
  const initializeGhostRelativeParent = (): void => {
    const containerElement = targetElement.value
    if (!containerElement)
      return

    // Use the container as the initial relative parent
    ghostRelativeParent.value = containerElement

    // Store initial scroll position
    ghostRelativeParentInitialScroll.value = getRelativeScrollOffset(ghostRelativeParent.value)
  }

  /**
   * Set ghost relative parent for absolute positioning
   */
  const setGhostRelativeParent = (ghost: HTMLElement, container: HTMLElement): void => {
    if (!positionGhostAbsolutely.value) {
      return
    }

    // Start with the container
    ghostRelativeParent.value = container

    while (
      ghostRelativeParent.value
      && getComputedStyleProperty(ghostRelativeParent.value, 'position') === 'static'
      && getComputedStyleProperty(ghostRelativeParent.value, 'transform') === 'none'
      && ghostRelativeParent.value !== document.documentElement
    ) {
      ghostRelativeParent.value = ghostRelativeParent.value.parentElement || document.documentElement
    }

    // Handle special cases
    if (ghostRelativeParent.value !== document.body && ghostRelativeParent.value !== document.documentElement) {
      if (ghostRelativeParent.value === document.documentElement) {
        ghostRelativeParent.value = getWindowScrollingElement()
      }
    }
    else {
      // Use window scrolling element as fallback
      ghostRelativeParent.value = getWindowScrollingElement()
    }

    // Store initial scroll position for later offset calculations
    ghostRelativeParentInitialScroll.value = getRelativeScrollOffset(ghostRelativeParent.value)
  }

  /**
   * Find the draggable element from the event target
   * @param target - Event target element
   * @returns Draggable element or null
   */
  const findDraggableTarget = (target: HTMLElement): HTMLElement | null => {
    const el = targetElement.value
    if (!el)
      return null

    let current: HTMLElement | null = target
    const draggableSelector = toValue(draggable)

    while (current && current !== el) {
      if (current.matches && current.matches(draggableSelector)) {
        return current
      }
      current = current.parentElement
    }

    return null
  }

  /**
   * Fallback method to find element by position (for test environments)
   * @param clientX - X coordinate of the mouse pointer
   * @param clientY - Y coordinate of the mouse pointer
   * @returns Element at the given point or null if no element is found
   */
  const findElementByPosition = (clientX: number, clientY: number): HTMLElement | null => {
    const el = targetElement.value
    if (!el)
      return null

    const children = Array.from(el.children) as HTMLElement[]
    const draggableSelector = toValue(draggable)

    for (const child of children) {
      if (child === state.dragElement.value)
        continue
      if (!child.matches(draggableSelector))
        continue

      const rect = child.getBoundingClientRect()
      if (
        clientX >= rect.left && clientX <= rect.right
        && clientY >= rect.top && clientY <= rect.bottom
      ) {
        return child
      }
    }

    return null
  }

  /**
   * Get element from point, handling touch events and shadow DOM
   * @param clientX - X coordinate of the mouse pointer
   * @param clientY - Y coordinate of the mouse pointer
   * @returns Element at the given point or null if no element is found
   */
  const getElementFromPoint = (clientX: number, clientY: number): HTMLElement | null => {
    const el = targetElement.value
    if (!el)
      return null

    // Check if elementFromPoint is available (not in all test environments)
    if (typeof document.elementFromPoint !== 'function') {
      return findElementByPosition(clientX, clientY)
    }

    // Hide ghost element temporarily to get accurate elementFromPoint
    const ghostElement = state.ghostElement.value
    let ghostDisplay = ''
    if (ghostElement) {
      ghostDisplay = ghostElement.style.display
      ghostElement.style.display = 'none'
    }

    let target = document.elementFromPoint(clientX, clientY) as HTMLElement | null

    // Handle shadow DOM
    while (target && target.shadowRoot) {
      const shadowTarget = target.shadowRoot.elementFromPoint(clientX, clientY) as HTMLElement
      if (shadowTarget === target)
        break
      target = shadowTarget
    }

    // Restore ghost element display
    if (ghostElement) {
      ghostElement.style.display = ghostDisplay
    }

    return target
  }

  /**
   * Get element index within its parent
   * @param element - Element to get the index of
   * @returns Index of the element or -1 if not found
   */
  const getElementIndex = (element: HTMLElement): number => {
    const parent = element.parentElement
    if (!parent)
      return -1

    const children = Array.from(parent.children) as HTMLElement[]
    const draggableSelector = toValue(draggable)

    let index = 0
    for (const child of children) {
      if (child === element)
        return index
      if (child.matches(draggableSelector))
        index++
    }

    return -1
  }

  /**
   * Dispatch a sortable event with proper callback handling using unified event dispatcher
   */
  const dispatchEvent = (eventType: SortableEventType, data: Partial<SortableEvent> = {}) => {
    const el = targetElement.value
    const dragElement = state.dragElement.value
    if (!el || !dragElement)
      return

    // Extract only the properties that are compatible with SortableEventData
    const compatibleData: Partial<SortableEventData> = {
      to: data.to,
      from: data.from,
      item: data.item,
      clone: data.clone,
      oldIndex: data.oldIndex,
      newIndex: data.newIndex,
      oldDraggableIndex: data.oldDraggableIndex,
      newDraggableIndex: data.newDraggableIndex,
      originalEvent: data.originalEvent,
      pullMode: data.pullMode,
      related: data.related,
      willInsertAfter: data.willInsertAfter,
    }

    // Prepare event data with defaults
    const eventData: Partial<SortableEventData> = {
      to: el,
      from: el,
      item: dragElement,
      oldIndex: startIndex.value,
      newIndex: startIndex.value,
      ...compatibleData,
    }

    // Get appropriate callback based on event type
    let callback: ((evt: SortableEvent) => void) | undefined
    switch (eventType) {
      case 'start':
        callback = onStart
        break
      case 'end':
        callback = onEnd
        break
      case 'update':
        callback = onUpdate
        break
      case 'filter':
        callback = onFilter
        break
      case 'choose':
        // Choose event doesn't have a direct callback in options, but we dispatch it
        break
    }

    // Dispatch event using unified event dispatcher
    dispatch(eventType, eventData, callback)
  }

  /**
   * Check if element should be filtered (not draggable)
   * @param evt - Event object
   * @param item - Item element
   * @param target - Target element
   * @returns True if element should be filtered, false otherwise
   */
  const shouldFilterElement = (evt: Event, item: HTMLElement, target: HTMLElement): boolean => {
    const currentFilter = toValue(filter)

    if (typeof currentFilter === 'string') {
      if (target.matches(currentFilter)) {
        dispatchEvent('filter', { item, related: target })
        if (toValue(preventOnFilter)) {
          evt.preventDefault()
        }
        return true
      }
    }
    else if (typeof currentFilter === 'function') {
      if (currentFilter(evt, item, target)) {
        dispatchEvent('filter', { item, related: target })
        if (toValue(preventOnFilter)) {
          evt.preventDefault()
        }
        return true
      }
    }

    return false
  }

  /**
   * Check if target is a valid handle
   * @param target - Target element
   * @param handleSelector - Handle selector
   * @returns True if target is a valid handle, false otherwise
   */
  const isValidHandle = (target: HTMLElement, handleSelector: string): boolean => {
    return target.matches(handleSelector) || target.closest(handleSelector) !== null
  }

  /**
   * Check if drag operation can be started
   * @returns True if drag operation can be started, false otherwise
   */
  const canStartDrag = (): boolean => {
    if (!state._canPerformOperation('startDrag')) {
      return false
    }

    if (toValue(disabled)) {
      return false
    }

    if (state.isDragging.value) {
      return false
    }

    return true
  }

  /**
   * Detect layout direction (vertical or horizontal)
   * @returns 'vertical' | 'horizontal'
   */
  const detectDirection = (): 'vertical' | 'horizontal' => {
    const el = targetElement.value
    if (!el)
      return 'vertical'

    const children = Array.from(el.children) as HTMLElement[]
    const draggableSelector = toValue(draggable)
    const draggableChildren = children.filter(child => child.matches(draggableSelector))

    if (draggableChildren.length < 2)
      return 'vertical'

    const first = draggableChildren[0]
    const second = draggableChildren[1]
    const firstRect = first.getBoundingClientRect()
    const secondRect = second.getBoundingClientRect()

    // Check container styles for explicit direction
    const containerStyle = getComputedStyle(el)
    if (containerStyle.display === 'flex') {
      const flexDirection = containerStyle.flexDirection
      if (flexDirection === 'row' || flexDirection === 'row-reverse') {
        return 'horizontal'
      }
      if (flexDirection === 'column' || flexDirection === 'column-reverse') {
        return 'vertical'
      }
    }

    // Check relative positions of elements
    if (secondRect.left >= firstRect.right - 5) {
      return 'horizontal'
    }

    if (secondRect.top >= firstRect.bottom - 5) {
      return 'vertical'
    }

    return 'vertical'
  }

  /**
   * Calculate insertion position based on mouse position and target element
   * @param pointer - Pointer object containing clientX and clientY coordinates
   * @param {number} pointer.clientX - The X coordinate of the pointer
   * @param {number} pointer.clientY - The Y coordinate of the pointer
   * @param target - Target element
   * @returns Insertion position or null if no position is found
   */
  const calculateInsertPosition = (
    pointer: { clientX: number, clientY: number },
    target: HTMLElement,
  ): number | null => {
    const targetRect = target.getBoundingClientRect()
    const vertical = detectDirection() === 'vertical'
    const mouseOnAxis = vertical ? pointer.clientY : pointer.clientX
    const targetLength = vertical ? targetRect.height : targetRect.width
    const targetStart = vertical ? targetRect.top : targetRect.left
    const targetCenter = targetStart + targetLength / 2

    const currentSwapThreshold = toValue(swapThreshold)

    // For full threshold (1), always allow swapping
    if (currentSwapThreshold >= 1) {
      return mouseOnAxis > targetCenter ? 1 : -1
    }

    // For partial threshold, create dead zone in the middle
    const threshold = targetLength * (1 - currentSwapThreshold) / 2
    const deadZoneStart = targetStart + threshold
    const deadZoneEnd = targetStart + targetLength - threshold

    // Check if mouse is in the middle area (no swap)
    if (mouseOnAxis > deadZoneStart && mouseOnAxis < deadZoneEnd) {
      return null
    }

    // Determine direction: 1 for after, -1 for before
    return mouseOnAxis > targetCenter ? 1 : -1
  }
  /**
   * Perform the actual DOM insertion
   * @param target - Target element
   * @param direction - Direction of the insertion
   */
  const performInsertion = (target: HTMLElement, direction: number) => {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    const parent = target.parentNode
    if (!parent)
      return

    // Capture animation state before DOM changes
    if (onAnimationCapture) {
      onAnimationCapture()
    }

    if (direction === 1) {
      // Insert after target
      const nextSibling = target.nextSibling
      if (nextSibling) {
        parent.insertBefore(dragElement, nextSibling)
      }
      else {
        parent.appendChild(dragElement)
      }
    }
    else {
      // Insert before target
      parent.insertBefore(dragElement, target)
    }

    // Update current index after DOM changes
    const newCurrentIndex = getElementIndex(dragElement)
    state._setCurrentIndex(newCurrentIndex)

    // Immediately notify about DOM changes for responsive data updates
    if (onItemsUpdate) {
      onItemsUpdate()
    }

    // Trigger animation after DOM changes
    if (onAnimationTrigger) {
      onAnimationTrigger()
    }
  }
  /**
   * Update ghost element position during drag
   * @param ghost - Ghost element
   * @param evt - Event object
   */
  const updateGhostPosition = (ghost: HTMLElement, evt: MouseEvent | TouchEvent): void => {
    if (!tapEvt.value) {
      return
    }

    // Get current touch/mouse position
    const touch = 'touches' in evt ? evt.touches[0] : evt
    if (!touch) {
      return
    }

    // Get current fallback offset
    const currentFallbackOffset = toValue(fallbackOffset) || { x: 0, y: 0 }

    // Recalculate scale factors to handle dynamic transforms
    calculateScaleFactors()

    // Calculate relative scroll offset if positioning absolutely
    const relativeScrollOffset = positionGhostAbsolutely.value && ghostRelativeParent.value
      ? getRelativeScrollOffset(ghostRelativeParent.value)
      : [0, 0]

    // Calculate movement delta from initial tap position
    const rawDx = (touch.clientX - tapEvt.value.clientX) + currentFallbackOffset.x
    const rawDy = (touch.clientY - tapEvt.value.clientY) + currentFallbackOffset.y

    // Apply scale factors and scroll offset adjustments
    const dx = rawDx / (scaleX.value || 1)
      + (relativeScrollOffset ? (relativeScrollOffset[0] - ghostRelativeParentInitialScroll.value[0]) : 0) / (scaleX.value || 1)
    const dy = rawDy / (scaleY.value || 1)
      + (relativeScrollOffset ? (relativeScrollOffset[1] - ghostRelativeParentInitialScroll.value[1]) : 0) / (scaleY.value || 1)

    // Create transform matrix
    // Use absolute positioning to prevent cumulative errors
    ghostMatrix.value = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: dx,
      f: dy,
    } as DOMMatrix

    // Apply the matrix transform
    const cssMatrix = `matrix(${ghostMatrix.value.a},${ghostMatrix.value.b},${ghostMatrix.value.c},${ghostMatrix.value.d},${ghostMatrix.value.e},${ghostMatrix.value.f})`

    // Set transform with vendor prefixes for better compatibility
    ghost.style.webkitTransform = cssMatrix
    ghost.style.transform = cssMatrix

    // Store current position for reference
    lastDx.value = dx
    lastDy.value = dy
  }

  /**
   * Stop fallback mode and clean up resources
   */
  const stopFallbackMode = (): void => {
    if (loopTimer.value) {
      clearInterval(loopTimer.value)
      loopTimer.value = undefined
    }
    tapEvt.value = undefined
    ghostMatrix.value = undefined
    lastDx.value = 0
    lastDy.value = 0
    isFallbackActive.value = false
    state._setFallbackActive(false)
  }

  /**
   * Remove ghost element
   */
  const removeGhost = () => {
    const ghostElement = state.ghostElement.value
    if (ghostElement) {
      ghostElement.remove()
      state._setGhostElement(null)
    }

    if (state.dragElement.value && toValue(ghostClass)) {
      state.dragElement.value.classList.remove(toValue(ghostClass))
    }
  }

  /**
   * Reset drag state to initial values
   */
  const resetDragState = () => {
    state._setDragElement(null)
    state._setCurrentIndex(null)
    startIndex.value = -1
    isUsingFallback.value = false
    tapEvt.value = undefined
    currentTouchEvent.value = undefined

    // Clean up only drag-specific listeners (not base listeners)
    dragCleanupFunctions.value.forEach(cleanup => cleanup())
    dragCleanupFunctions.value = []
  }

  /**
   * Handle HTML5 dragover event on container
   */
  const handleDragOver = (evt: DragEvent) => {
    evt.preventDefault()
    evt.dataTransfer!.dropEffect = 'move'
  }

  /**
   * Handle HTML5 dragenter event on container
   */
  const handleDragEnter = (evt: DragEvent) => {
    evt.preventDefault()
  }

  /**
   * Handle document-level dragover for native mode
   */
  const handleDocumentDragOver = (evt: DragEvent) => {
    if (!state.isDragging.value || !state.dragElement.value)
      return

    evt.preventDefault()

    // Find target element under cursor
    const target = getElementFromPoint(evt.clientX, evt.clientY)
    if (!target)
      return

    // Find the closest draggable element
    const draggableTarget = findDraggableTarget(target)
    if (!draggableTarget || draggableTarget === state.dragElement.value)
      return

    // Calculate insertion position
    const insertPosition = calculateInsertPosition(
      { clientX: evt.clientX, clientY: evt.clientY },
      draggableTarget,
    )

    if (insertPosition !== null) {
      performInsertion(draggableTarget, insertPosition)
    }
  }

  /**
   * Handle drag move events (fallback mode only)
   */
  const handleDragMove = (evt: MouseEvent | TouchEvent) => {
    if (!state.isDragging.value || !state.dragElement.value)
      return

    evt.preventDefault()

    const touch = 'touches' in evt ? evt.touches[0] : evt
    if (touch) {
      currentTouchEvent.value = touch
    }

    const ghostElement = state.ghostElement.value
    if (ghostElement && isUsingFallback.value) {
      updateGhostPosition(ghostElement, evt)
    }

    // Get current mouse/touch position
    const clientX = touch.clientX
    const clientY = touch.clientY

    // Find target element under cursor
    const target = getElementFromPoint(clientX, clientY)
    if (!target)
      return

    // Find the closest draggable element
    const draggableTarget = findDraggableTarget(target)
    if (!draggableTarget || draggableTarget === state.dragElement.value)
      return

    // Calculate insertion position
    const insertPosition = calculateInsertPosition(
      { clientX, clientY },
      draggableTarget,
    )

    if (insertPosition !== null) {
      performInsertion(draggableTarget, insertPosition)
    }
  }

  /**
   * Handle drag end events
   */
  const handleDragEnd = (_evt: MouseEvent | TouchEvent | DragEvent) => {
    if (!state.isDragging.value && !state.dragElement.value)
      return

    const dragElement = state.dragElement.value

    state._setDragging(false)

    // Stop fallback mode if active
    if (isUsingFallback.value) {
      stopFallbackMode()
    }

    // Remove classes if element exists
    if (dragElement) {
      const currentChosenClass = toValue(chosenClass)
      if (currentChosenClass) {
        dragElement.classList.remove(currentChosenClass)
      }

      const currentDragClass = toValue(dragClass)
      if (currentDragClass) {
        dragElement.classList.remove(currentDragClass)
      }

      const currentGhostClass = toValue(ghostClass)
      if (currentGhostClass) {
        dragElement.classList.remove(currentGhostClass)
      }

      // Reset draggable attribute for native mode
      if (state.nativeDraggable.value) {
        dragElement.draggable = false
      }

      // Calculate final index
      const newIndex = getElementIndex(dragElement)

      // Dispatch appropriate events
      if (newIndex !== startIndex.value) {
        dispatchEvent('update', {
          item: dragElement,
          oldIndex: startIndex.value,
          newIndex,
        })
      }

      dispatchEvent('end', {
        item: dragElement,
        oldIndex: startIndex.value,
        newIndex,
      })
    }

    // Remove ghost
    removeGhost()

    resetDragState()
  }

  /**
   * Handle native HTML5 dragstart event
   */
  const handleNativeDragStart = (evt: DragEvent) => {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    // Now we're actually dragging
    state._setDragging(true)
    // Set current index when drag actually starts
    state._setCurrentIndex(startIndex.value)

    // Set up data transfer for native drag
    if (evt.dataTransfer) {
      evt.dataTransfer.effectAllowed = 'move'

      // Set custom data if provided
      if (setData) {
        setData(evt.dataTransfer, dragElement)
      }
      else {
        // Default data transfer
        evt.dataTransfer.setData('text/plain', dragElement.textContent || '')
      }
    }

    // Apply drag class
    const currentDragClass = toValue(dragClass)
    if (currentDragClass) {
      dragElement.classList.add(currentDragClass)
    }

    // Dispatch start event
    dispatchEvent('start', {
      item: dragElement,
      oldIndex: startIndex.value,
    })

    // Set up document-level dragover listener for native mode
    const onDocumentDragOver = handleDocumentDragOver
    const cleanup = useEventListener(document, 'dragover', onDocumentDragOver)

    dragCleanupFunctions.value.push(cleanup)
  }

  /**
   * Disable delayed drag and clear timers
   */
  const disableDelayedDrag = () => {
    if (delayTimer.value) {
      clearTimeout(delayTimer.value)
      delayTimer.value = undefined
    }
    awaitingDragStarted.value = false

    // Clean up delayed drag listeners using dedicated array
    delayedDragEvents.value.forEach(cleanup => cleanup())
    delayedDragEvents.value = []
  }

  /**
   * Disable delayed drag events
   */
  const disableDelayedDragEvents = () => {
    // Clean up delayed drag listeners
    delayedDragEvents.value.forEach(cleanup => cleanup())
    delayedDragEvents.value = []
  }

  /**
   * Handle delayed drag touch move for threshold detection
   */
  const handleDelayedDragTouchMove = (evt: TouchEvent | PointerEvent | MouseEvent) => {
    const touch = 'touches' in evt ? evt.touches[0] : evt
    if (!touch)
      return

    // Use computed threshold for more accurate detection
    const threshold = dragStartThreshold.value

    if (Math.max(
      Math.abs(touch.clientX - lastX.value),
      Math.abs(touch.clientY - lastY.value),
    ) >= threshold) {
      disableDelayedDrag()
    }
  }

  /**
   * Start fallback mode for drag operation
   */
  const startFallbackMode = (dragEl: HTMLElement, tapEvent: { clientX: number, clientY: number }): void => {
    tapEvt.value = tapEvent
    lastDx.value = 0
    lastDy.value = 0

    try {
      ghostMatrix.value = new DOMMatrix()
    }
    catch {
      // Fallback for test environments - create a simple matrix-like object
      ghostMatrix.value = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
      } as DOMMatrix
    }

    // Calculate scale factors for accurate positioning
    calculateScaleFactors()

    if (positionGhostAbsolutely.value) {
      initializeGhostRelativeParent()
    }

    // Set active state
    isFallbackActive.value = true
    state._setFallbackActive(true)

    // Start periodic drag over emulation
    loopTimer.value = setInterval(() => {
      // Emulate drag over events for fallback mode
    }, 50)
  }

  /**
   * Create ghost element for fallback mode
   */
  const createGhost = () => {
    const dragElement = state.dragElement.value
    if (!dragElement || !tapEvt.value)
      return

    // Get element rect at the time of drag start
    const rect = dragElement.getBoundingClientRect()

    const tapDistance = {
      left: tapEvt.value.clientX - rect.left,
      top: tapEvt.value.clientY - rect.top,
    }

    // Simple ghost creation - clone the element
    const ghostElement = dragElement.cloneNode(true) as HTMLElement

    // Apply fallback class
    const currentFallbackClass = toValue(fallbackClass)
    if (currentFallbackClass) {
      ghostElement.classList.add(currentFallbackClass)
    }

    // Position the ghost element
    ghostElement.style.position = 'fixed'
    ghostElement.style.top = `${rect.top}px`
    ghostElement.style.left = `${rect.left}px`
    ghostElement.style.width = `${rect.width}px`
    ghostElement.style.height = `${rect.height}px`
    ghostElement.style.pointerEvents = 'none'
    ghostElement.style.zIndex = '100000'

    // Set transform-origin based on tap distance (where user clicked)
    // This ensures the ghost rotates/scales around the click point, following SortableJS behavior
    if (rect.width > 0 && rect.height > 0) {
      const originX = Math.max(0, Math.min(100, (tapDistance.left / rect.width * 100)))
      const originY = Math.max(0, Math.min(100, (tapDistance.top / rect.height * 100)))
      ghostElement.style.transformOrigin = `${originX}% ${originY}%`
    }

    // Choose container based on fallbackOnBody option
    const container = toValue(fallbackOnBody)
      ? document.body
      : dragElement.parentNode as HTMLElement

    // Insert ghost element into the appropriate container
    if (container && ghostElement) {
      if (toValue(fallbackOnBody)) {
        container.appendChild(ghostElement)
      }
      else {
        container.insertBefore(ghostElement, dragElement.nextSibling)
      }
      state._setGhostElement(ghostElement)
    }

    // Set up ghost relative parent for absolute positioning
    if (ghostElement && container) {
      setGhostRelativeParent(ghostElement, container)
    }
  }

  /**
   * Handle fallback drag start
   */
  const handleFallbackDragStart = (_evt: Event) => {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    // Set dragging state
    state._setDragging(true)
    state._setFallbackActive(true)
    // Set current index when drag actually starts
    state._setCurrentIndex(startIndex.value)

    // Add drag class
    const currentDragClass = toValue(dragClass)
    if (currentDragClass) {
      dragElement.classList.add(currentDragClass)
    }

    // Apply ghost class to original element
    const currentGhostClass = toValue(ghostClass)
    if (currentGhostClass) {
      dragElement.classList.add(currentGhostClass)
    }

    // Create and append ghost element immediately
    createGhost()

    // Dispatch start event
    dispatchEvent('start', {
      item: dragElement,
      oldIndex: startIndex.value,
    })
  }

  /**
   * Setup listeners for fallback drag events
   */
  const setupFallbackDragListeners = () => {
    const onMouseMove = handleDragMove
    const onMouseUp = handleDragEnd
    const onTouchMove = handleDragMove
    const onTouchEnd = handleDragEnd

    if (supportPointer.value) {
      // Use pointer events for unified handling
      const pointerMoveEvent = useEventListener(document, 'pointermove', onMouseMove)
      const pointerUpEvent = useEventListener(document, 'pointerup', onMouseUp)
      const pointerCancelEvent = useEventListener(document, 'pointercancel', onMouseUp)

      dragCleanupFunctions.value.push(pointerMoveEvent, pointerUpEvent, pointerCancelEvent)
    }
    else {
      // Fallback to separate mouse and touch events
      const mouseMoveEvent = useEventListener(document, 'mousemove', onMouseMove)
      const mouseUpEvent = useEventListener(document, 'mouseup', onMouseUp)
      const touchMoveEvent = useEventListener(document, 'touchmove', onTouchMove, { passive: false })
      const touchEndEvent = useEventListener(document, 'touchend', onTouchEnd)
      const touchCancelEvent = useEventListener(document, 'touchcancel', onTouchEnd)

      dragCleanupFunctions.value.push(mouseMoveEvent, mouseUpEvent, touchMoveEvent, touchEndEvent, touchCancelEvent)
    }
  }

  /**
   * Setup listeners for native HTML5 drag events
   */
  const setupNativeDragListeners = () => {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    const onDragEnd = handleDragEnd
    const onDragStart = handleNativeDragStart

    const dragEndEvent = useEventListener(dragElement, 'dragend', onDragEnd)
    const dragStartEvent = useEventListener(dragElement, 'dragstart', onDragStart)

    dragCleanupFunctions.value.push(dragEndEvent, dragStartEvent)
  }

  /**
   * Start the actual drag operation
   */
  const startDragOperation = (evt: Event) => {
    const dragElement = state.dragElement.value
    if (!dragElement) {
      return
    }

    // Disable delayed drag events
    disableDelayedDragEvents()

    // Clear text selection if exists
    try {
      if ((document as any).selection) {
        // IE
        setTimeout(() => {
          (document as any).selection.empty()
        }, 0)
      }
      else {
        window.getSelection()?.removeAllRanges()
      }
    }
    catch { }

    const isTouch = evt.type.startsWith('touch')
      || (evt instanceof PointerEvent && evt.pointerType === 'touch')

    const shouldUseFallbackMode = !state.nativeDraggable.value || isTouch || toValue(forceFallback)

    if (shouldUseFallbackMode) {
      isUsingFallback.value = true
      setupFallbackDragListeners()

      // Start fallback mode
      if (tapEvt.value) {
        startFallbackMode(dragElement, tapEvt.value)
      }

      handleFallbackDragStart(evt)
    }
    else {
      isUsingFallback.value = false
      setupNativeDragListeners()
    }
  }

  /**
   * Prepare to start dragging
   */
  const prepareDragStart = (evt: Event, dragElement: HTMLElement) => {
    if (!state._canPerformOperation('startDrag')) {
      return
    }

    state._setDragElement(dragElement)
    startIndex.value = getElementIndex(dragElement)

    // Record initial tap/click position for fallback mode (enhanced following SortableJS)
    if (evt instanceof MouseEvent) {
      tapEvt.value = { clientX: evt.clientX, clientY: evt.clientY }
      lastX.value = evt.clientX
      lastY.value = evt.clientY
      isTouchInteraction.value = false
    }
    else if (evt instanceof PointerEvent) {
      tapEvt.value = { clientX: evt.clientX, clientY: evt.clientY }
      lastX.value = evt.clientX
      lastY.value = evt.clientY
      isTouchInteraction.value = evt.pointerType === 'touch'
    }
    else if (evt instanceof TouchEvent && evt.touches.length > 0) {
      const touch = evt.touches[0]
      tapEvt.value = { clientX: touch.clientX, clientY: touch.clientY }
      lastX.value = touch.clientX
      lastY.value = touch.clientY
      isTouchInteraction.value = true
    }

    // Add chosen class
    const currentChosenClass = toValue(chosenClass)
    if (currentChosenClass) {
      dragElement.classList.add(currentChosenClass)
    }

    const isTouch = evt.type.startsWith('touch')
      || (evt instanceof PointerEvent && (evt as PointerEvent).pointerType === 'touch')

    // Set draggable attribute for native mode (non-touch events)
    if (state.nativeDraggable.value && !isTouch) {
      dragElement.draggable = true
    }

    // Handle delay
    const currentDelay = toValue(delay)
    const currentDelayOnTouchOnly = toValue(delayOnTouchOnly)

    if (currentDelay && (!currentDelayOnTouchOnly || isTouch)) {
      awaitingDragStarted.value = true

      // Create drag start function
      const dragStartFn = () => {
        if (state.dragElement.value === dragElement && awaitingDragStarted.value) {
          awaitingDragStarted.value = false

          // Disable delayed drag events
          disableDelayedDragEvents()

          // Dispatch choose event
          dispatchEvent('choose', {
            item: dragElement,
            oldIndex: startIndex.value,
            originalEvent: evt,
          })

          // Add chosen class if not already added
          const currentChosenClass = toValue(chosenClass)
          if (currentChosenClass && !dragElement.classList.contains(currentChosenClass)) {
            dragElement.classList.add(currentChosenClass)
          }

          startDragOperation(evt)
        }
      }

      // Set up delayed drag listeners for threshold detection using dedicated array
      if (supportPointer.value) {
        // Use pointer events for unified handling
        const pointerMoveEvent = useEventListener(document, 'pointermove', handleDelayedDragTouchMove)
        const pointerUpEvent = useEventListener(document, 'pointerup', disableDelayedDrag)
        const pointerCancelEvent = useEventListener(document, 'pointercancel', disableDelayedDrag)
        delayedDragEvents.value.push(pointerMoveEvent, pointerUpEvent, pointerCancelEvent)
      }
      else if (isTouch) {
        const touchMoveEvent = useEventListener(document, 'touchmove', handleDelayedDragTouchMove, { passive: false })
        const touchEndEvent = useEventListener(document, 'touchend', disableDelayedDrag)
        const touchCancelEvent = useEventListener(document, 'touchcancel', disableDelayedDrag)
        delayedDragEvents.value.push(touchMoveEvent, touchEndEvent, touchCancelEvent)
      }
      else {
        const mouseMoveEvent = useEventListener(document, 'mousemove', handleDelayedDragTouchMove)
        const mouseUpEvent = useEventListener(document, 'mouseup', disableDelayedDrag)
        delayedDragEvents.value.push(mouseMoveEvent, mouseUpEvent)
      }

      delayTimer.value = setTimeout(dragStartFn, currentDelay)
    }
    else {
      // Start immediately
      startDragOperation(evt)
    }
  }

  /**
   * Handle mouse down event to initiate drag
   */
  const handleMouseDown = (evt: MouseEvent) => {
    if (!canStartDrag())
      return

    const target = evt.target as HTMLElement
    const draggableElement = findDraggableTarget(target)

    if (!draggableElement)
      return
    if (shouldFilterElement(evt, draggableElement, target))
      return

    const currentHandle = toValue(handle)
    if (currentHandle && !isValidHandle(target, currentHandle))
      return

    prepareDragStart(evt, draggableElement)
  }
  /**
   * Handle touch start event for mobile drag
   */
  const handleTouchStart = (evt: TouchEvent) => {
    if (!canStartDrag())
      return

    const target = evt.target as HTMLElement
    const draggableElement = findDraggableTarget(target)

    if (!draggableElement)
      return
    if (shouldFilterElement(evt, draggableElement, target))
      return

    const currentHandle = toValue(handle)
    if (currentHandle && !isValidHandle(target, currentHandle))
      return

    // Store last position for threshold detection
    const touch = evt.touches[0]
    if (touch) {
      lastX.value = touch.clientX
      lastY.value = touch.clientY
      isTouchInteraction.value = true
    }

    prepareDragStart(evt, draggableElement)
  }

  /**
   * Handle pointer start event
   */
  const handlePointerStart = (evt: PointerEvent) => {
    if (!canStartDrag())
      return

    const target = evt.target as HTMLElement
    const draggableElement = findDraggableTarget(target)

    if (!draggableElement)
      return
    if (shouldFilterElement(evt, draggableElement, target))
      return

    const currentHandle = toValue(handle)
    if (currentHandle && !isValidHandle(target, currentHandle))
      return

    // Store last position for threshold detection
    lastX.value = evt.clientX
    lastY.value = evt.clientY
    isTouchInteraction.value = evt.pointerType === 'touch'

    prepareDragStart(evt, draggableElement)
  }

  /**
   * Setup event listeners for drag operations
   */
  const setupEventListeners = () => {
    const el = targetElement.value
    if (!el || isListenersSetup.value)
      return

    // Pointer events (unified touch/mouse handling) or fallback to separate events
    if (supportPointer.value) {
      const pointerDownEvent = useEventListener(el, 'pointerdown', handlePointerStart)
      cleanupFunctions.value.push(pointerDownEvent)
    }
    else {
      // Mouse events
      const mouseDownEvent = useEventListener(el, 'mousedown', handleMouseDown)
      cleanupFunctions.value.push(mouseDownEvent)

      // Touch events for mobile support
      const touchStartEvent = useEventListener(el, 'touchstart', handleTouchStart, { passive: false })
      cleanupFunctions.value.push(touchStartEvent)
    }

    // Native HTML5 drag events for native mode
    if (state.nativeDraggable.value) {
      const dragOverEvent = useEventListener(el, 'dragover', handleDragOver)
      const dragEnterEvent = useEventListener(el, 'dragenter', handleDragEnter)

      cleanupFunctions.value.push(dragOverEvent, dragEnterEvent)
    }

    isListenersSetup.value = true
  }

  /**
   * Initialize drag functionality
   */
  const initialize = () => {
    const el = targetElement.value
    if (!el)
      return

    // Setup event listeners
    setupEventListeners()
  }

  /**
   * Start dragging programmatically
   */
  const startDrag = (element: HTMLElement) => {
    if (!canStartDrag())
      return

    if (state.dragElement.value)
      return

    // Create a synthetic mouse event
    const syntheticEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 0,
      clientY: 0,
    })

    prepareDragStart(syntheticEvent, element)
  }

  /**
   * Stop dragging programmatically
   */
  const stopDrag = () => {
    if (!state.isDragging.value && !state.dragElement.value)
      return

    // Create a synthetic mouse event
    const syntheticEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
    })

    handleDragEnd(syntheticEvent)
  }

  /**
   * Pause drag functionality (temporarily disable)
   */
  const pause = () => {
    state._setPaused(true)

    if (state.isDragging.value) {
      stopDrag()
    }
  }

  /**
   * Resume drag functionality
   */
  const resume = () => {
    if (!state._canPerformOperation('resume')) {
      return
    }

    state._setPaused(false)
  }

  /**
   * Destroy and cleanup all resources
   */
  const destroy = () => {
    // Clean up all event listeners (both base and drag-specific)
    cleanupFunctions.value.forEach(cleanup => cleanup())
    cleanupFunctions.value = []

    dragCleanupFunctions.value.forEach(cleanup => cleanup())
    dragCleanupFunctions.value = []

    // Remove ghost if exists
    removeGhost()

    // Stop fallback mode if active
    stopFallbackMode()

    // Clear timers and delayed events
    if (delayTimer.value) {
      clearTimeout(delayTimer.value)
      delayTimer.value = undefined
    }

    // Clean up delayed drag events
    delayedDragEvents.value.forEach(cleanup => cleanup())
    delayedDragEvents.value = []

    // Reset state
    state._resetState()
    resetDragState()
    isListenersSetup.value = false
  }

  // Watch target changes and reinitialize
  watch(targetElement, (newTarget, oldTarget) => {
    if (oldTarget !== newTarget) {
      destroy()
      if (newTarget && toValue(immediate)) {
        initialize()
      }
    }
  }, { immediate: toValue(immediate) })

  // Watch for state changes that affect drag operations
  watch(() => state.isDisabled.value, (isDisabled) => {
    if (isDisabled && state.isDragging.value) {
      stopDrag()
    }
  })

  watch(() => state.isPaused.value, (isPaused) => {
    if (isPaused && state.isDragging.value) {
      stopDrag()
    }
  })

  // Watch for native draggable changes and update listeners
  watch(() => state.nativeDraggable.value, (newNativeDraggable, oldNativeDraggable) => {
    if (newNativeDraggable !== oldNativeDraggable && targetElement.value) {
      // Only reinitialize if not currently dragging to avoid disruption
      if (!state.isDragging.value) {
        // Clean up current listeners
        cleanupFunctions.value.forEach(cleanup => cleanup())
        cleanupFunctions.value = []
        isListenersSetup.value = false

        // Setup new listeners
        setupEventListeners()
      }
    }
  })

  // Cleanup on unmount
  tryOnUnmounted(() => {
    destroy()
  })

  return {
    startDrag,
    stopDrag,
    pause,
    resume,
    destroy,
  }
}

export default useSortableDrag
