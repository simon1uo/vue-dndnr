import type {
  GhostElementOptions,
  SortableEvent,
  SortableEventCallbacks,
  SortableEventData,
  SortableEventType,
  SortableOptions,
} from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import {
  createGhostElement,
  findDraggableElement,
  getDraggableChildren,
  getElementIndex,
} from '@/utils/sortable-dom'
import { dispatchSortableEvent, getCallbackName, normalizeEventData } from '@/utils/sortable-event'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, ref, toValue, watch } from 'vue'
import { useSortableState } from './useSortableState'

/**
 * Options for useDragCore composable
 */
export interface UseDragCoreOptions extends SortableOptions, SortableEventCallbacks {
  /** Whether to initialize immediately */
  immediate?: boolean
  /** Callback to notify when items should be updated after DOM manipulation */
  onItemsUpdate?: () => void
}

/**
 * Return type for useDragCore composable
 */
export interface UseDragCoreReturn {
  /** Unified sortable state */
  state: ReturnType<typeof useSortableState>
  /** Start dragging programmatically */
  startDrag: (element: HTMLElement) => void
  /** Stop dragging programmatically */
  stopDrag: () => void
  /** Update options */
  updateOptions: (options: Partial<UseDragCoreOptions>) => void
  /** Destroy and cleanup */
  destroy: () => void
}

/**
 * Core drag functionality composable.
 * Replaces CustomDragInstance class with Vue 3 Composition API.
 *
 * This composable provides:
 * - Native and fallback drag mode support
 * - Event handling for mouse and touch events
 * - Ghost element management
 * - Integrated fallback drag functionality
 * - Unified state management through useSortableState
 *
 * @param target - Target container element
 * @param options - Drag configuration options
 * @returns Drag core functionality and state
 */
export function useDragCore(
  target: MaybeRefOrGetter<HTMLElement | null>,
  options: MaybeRefOrGetter<UseDragCoreOptions> = {},
): UseDragCoreReturn {
  // Initialize state management
  const state = useSortableState()

  // Internal state
  const startIndex = ref(-1)
  const tapEvt = ref<{ clientX: number, clientY: number } | undefined>()
  const currentTouchEvent = ref<{ clientX: number, clientY: number } | undefined>()
  const isUsingFallback = ref(false)
  const cleanupFunctions = ref<Array<() => void>>([])
  const dragCleanupFunctions = ref<Array<() => void>>([])

  // Fallback drag state (integrated from useFallbackDrag)
  const isFallbackActive = ref(false)
  const loopTimer = ref<NodeJS.Timeout | undefined>()
  const ghostMatrix = ref<DOMMatrix | undefined>()
  const lastDx = ref(0)
  const lastDy = ref(0)
  const scaleX = ref(1)
  const scaleY = ref(1)
  const ghostRelativeParent = ref<HTMLElement | undefined>()
  const ghostRelativeParentInitialScroll = ref<[number, number]>([0, 0])
  const positionGhostAbsolutely = ref(false)

  // Computed options
  const resolvedOptions = computed(() => {
    const opts = toValue(options)
    return {
      draggable: '> *',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      disabled: false,
      sort: true,
      delay: 0,
      delayOnTouchOnly: false,
      animation: 150,
      preventOnFilter: true,
      immediate: true,
      ...opts,
    }
  })

  // Computed target element
  const targetElement = computed(() => toValue(target))

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
   * Get element's transform matrix
   */
  const getElementMatrix = (element: HTMLElement, selfOnly = false): DOMMatrix | null => {
    try {
      let appliedTransforms = ''

      if (selfOnly) {
        // Only get the element's own transform
        const computedStyle = window.getComputedStyle(element)
        const transform = computedStyle.transform
        if (transform && transform !== 'none') {
          appliedTransforms = transform
        }
      }
      else {
        // Get all transforms up the parent chain
        let current: HTMLElement | null = element
        while (current) {
          const computedStyle = window.getComputedStyle(current)
          const transform = computedStyle.transform
          if (transform && transform !== 'none') {
            appliedTransforms = `${transform} ${appliedTransforms}`
          }
          current = current.parentElement
        }
      }

      if (appliedTransforms) {
        const MatrixFn = window.DOMMatrix || (window as any).WebKitCSSMatrix || (window as any).CSSMatrix || (window as any).MSCSSMatrix
        return MatrixFn ? new MatrixFn(appliedTransforms) : null
      }
    }
    catch { }
    return null
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
      const elMatrix = getElementMatrix(current, false)
      const scaleXValue = elMatrix ? elMatrix.a : 1
      const scaleYValue = elMatrix ? elMatrix.d : 1

      offsetLeft += current.scrollLeft * scaleXValue
      offsetTop += current.scrollTop * scaleYValue

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
   * Determine if fallback mode should be used
   */
  const shouldUseFallback = (): boolean => {
    const opts = resolvedOptions.value

    // Force fallback if explicitly requested
    if (opts.forceFallback) {
      return true
    }

    // SSR compatibility check
    if (typeof window === 'undefined') {
      return false
    }

    // Check for touch device
    const isTouchDevice = ('ontouchstart' in window)
      || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)

    // Check for native draggable support
    const testDiv = document.createElement('div')
    const supportsDraggable = 'draggable' in testDiv

    // Use fallback for touch devices or browsers without native drag support
    return isTouchDevice || !supportsDraggable
  }

  /**
   * Determine if ghost should be positioned absolutely
   */
  const shouldPositionGhostAbsolutely = (): boolean => /iPad|iPhone|iPod/.test(navigator.userAgent)

  /**
   * Emulate drag over events for fallback mode
   */
  const emulateDragOver = (): void => {
    // This method will be integrated with the existing drag logic
    // For now, it serves as a placeholder for the periodic drag over simulation
    // The actual implementation will coordinate with the drag core system
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

    positionGhostAbsolutely.value = shouldPositionGhostAbsolutely()

    if (positionGhostAbsolutely.value) {
      initializeGhostRelativeParent()
    }

    // Set active state
    isFallbackActive.value = true
    state._setFallbackActive(true)

    // Start periodic drag over emulation
    loopTimer.value = setInterval(() => {
      emulateDragOver()
    }, 50)
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
   * Update ghost element position during drag
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

    // Calculate movement delta with fallback offset
    const opts = resolvedOptions.value
    const fallbackOffset = opts.fallbackOffset || { x: 0, y: 0 }

    // Recalculate scale factors to handle dynamic transforms
    calculateScaleFactors()

    // Calculate relative scroll offset if positioning absolutely
    const relativeScrollOffset = positionGhostAbsolutely.value && ghostRelativeParent.value
      ? getRelativeScrollOffset(ghostRelativeParent.value)
      : [0, 0]

    // Calculate absolute movement from initial tap position
    // Use absolute positioning instead of incremental to avoid cumulative errors
    const rawDx = (touch.clientX - tapEvt.value.clientX) + fallbackOffset.x
    const rawDy = (touch.clientY - tapEvt.value.clientY) + fallbackOffset.y

    // Apply scale factors
    const dx = rawDx / (scaleX.value || 1)
      + (relativeScrollOffset ? (relativeScrollOffset[0] - ghostRelativeParentInitialScroll.value[0]) : 0) / (scaleX.value || 1)
    const dy = rawDy / (scaleY.value || 1)
      + (relativeScrollOffset ? (relativeScrollOffset[1] - ghostRelativeParentInitialScroll.value[1]) : 0) / (scaleY.value || 1)

    // Use absolute matrix positioning instead of incremental updates to prevent drift
    // This ensures the ghost position always matches the cursor position exactly
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

    // Store current position for debugging/reference
    lastDx.value = dx
    lastDy.value = dy
  }

  /**
   * Set ghost relative parent for absolute positioning
   */
  const setGhostRelativeParent = (ghost: HTMLElement, container: HTMLElement): void => {
    if (!positionGhostAbsolutely.value) {
      return
    }

    // Find relatively positioned parent
    ghostRelativeParent.value = container

    while (
      getComputedStyleProperty(ghostRelativeParent.value, 'position') === 'static'
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
      ghostRelativeParent.value = getWindowScrollingElement()
    }

    // Store initial scroll position
    ghostRelativeParentInitialScroll.value = getRelativeScrollOffset(ghostRelativeParent.value)
  }

  /**
   * Dispatch a sortable event
   */
  const dispatchEvent = (eventType: SortableEventType, data: Partial<SortableEvent> = {}) => {
    const el = targetElement.value
    const dragElement = state.dragElement.value
    if (!el || !dragElement)
      return

    const opts = resolvedOptions.value

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

    // Normalize event data with defaults
    const eventData = normalizeEventData(eventType, {
      to: el,
      from: el,
      item: dragElement,
      oldIndex: startIndex.value,
      newIndex: startIndex.value,
      ...compatibleData,
    })

    // Get callback function
    const callbackName = getCallbackName(eventType) as keyof SortableEventCallbacks
    const callback = opts[callbackName] as ((evt: SortableEvent) => void) | undefined

    // Dispatch event using the utility function
    dispatchSortableEvent(el, eventType, eventData, callback)
  }

  /**
   * Find the draggable element from the event target
   */
  const findDraggableTarget = (target: HTMLElement): HTMLElement | null => {
    const el = targetElement.value
    if (!el)
      return null

    const opts = resolvedOptions.value
    return findDraggableElement(target, el, opts.draggable || '> *')
  }

  /**
   * Check if element should be filtered (not draggable)
   */
  const shouldFilterElement = (evt: Event, item: HTMLElement, target: HTMLElement): boolean => {
    const opts = resolvedOptions.value
    const filter = opts.filter

    if (typeof filter === 'string') {
      if (target.matches(filter)) {
        dispatchEvent('filter', { item, related: target })
        if (opts.preventOnFilter) {
          evt.preventDefault()
        }
        return true
      }
    }
    else if (typeof filter === 'function') {
      if (filter(evt, item, target)) {
        dispatchEvent('filter', { item, related: target })
        if (opts.preventOnFilter) {
          evt.preventDefault()
        }
        return true
      }
    }

    return false
  }

  /**
   * Check if target is a valid handle
   */
  const isValidHandle = (target: HTMLElement, handle: string): boolean => {
    return target.matches(handle) || target.closest(handle) !== null
  }

  /**
   * Fallback method to find element by position (for test environments)
   */
  const findElementByPosition = (clientX: number, clientY: number): HTMLElement | null => {
    const el = targetElement.value
    if (!el)
      return null

    const opts = resolvedOptions.value
    const children = getDraggableChildren(el, opts.draggable || '> *')

    for (const child of children) {
      if (child === state.dragElement.value)
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
   */
  const getElementFromPoint = (clientX: number, clientY: number): HTMLElement | null => {
    const el = targetElement.value
    if (!el)
      return null

    // Check if elementFromPoint is available (not in all test environments)
    if (typeof document.elementFromPoint !== 'function') {
      // Fallback for test environments - find element by position
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
   * Detect layout direction (vertical or horizontal)
   */
  const detectDirection = (): 'vertical' | 'horizontal' => {
    const el = targetElement.value
    if (!el)
      return 'vertical'

    const opts = resolvedOptions.value
    const children = getDraggableChildren(el, opts.draggable || '> *')
    if (children.length < 2)
      return 'vertical'

    const first = children[0]
    const second = children[1]
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
    // If second element is significantly to the right of first, it's horizontal
    if (secondRect.left >= firstRect.right - 5) {
      return 'horizontal'
    }

    // If second element is significantly below first, it's vertical
    if (secondRect.top >= firstRect.bottom - 5) {
      return 'vertical'
    }

    // Default to vertical for ambiguous cases
    return 'vertical'
  }

  /**
   * Get swap direction
   */
  const getSwapDirection = (
    pointer: { clientX: number, clientY: number },
    target: HTMLElement,
    targetRect: DOMRect,
    vertical: boolean,
  ): number | null => {
    const opts = resolvedOptions.value
    const mouseOnAxis = vertical ? pointer.clientY : pointer.clientX
    const targetLength = vertical ? targetRect.height : targetRect.width
    const targetStart = vertical ? targetRect.top : targetRect.left
    const targetCenter = targetStart + targetLength / 2

    const swapThreshold = opts.swapThreshold || 1

    // For full threshold (1), always allow swapping
    if (swapThreshold >= 1) {
      return mouseOnAxis > targetCenter ? 1 : -1
    }

    // For partial threshold, create dead zone in the middle
    const threshold = targetLength * (1 - swapThreshold) / 2
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
   * Calculate insertion position based on mouse position and target element
   * Returns 1 for after, -1 for before, null for no insertion
   */
  const calculateInsertPosition = (
    pointer: { clientX: number, clientY: number },
    target: HTMLElement,
  ): number | null => {
    const targetRect = target.getBoundingClientRect()
    const vertical = detectDirection() === 'vertical'

    return getSwapDirection(pointer, target, targetRect, vertical)
  }

  /**
   * Perform the actual DOM insertion
   */
  const performInsertion = (target: HTMLElement, direction: number) => {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    const parent = target.parentNode
    if (!parent)
      return

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

    // Immediately notify about DOM changes for responsive data updates
    const opts = resolvedOptions.value
    if (opts.onItemsUpdate) {
      opts.onItemsUpdate()
    }
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
  }

  /**
   * Reset drag state to initial values
   */
  const resetDragState = () => {
    state._setDragElement(null)
    startIndex.value = -1
    isUsingFallback.value = false
    tapEvt.value = undefined
    currentTouchEvent.value = undefined

    // Clean up only drag-specific listeners (not base listeners)
    dragCleanupFunctions.value.forEach(cleanup => cleanup())
    dragCleanupFunctions.value = []
  }

  /**
   * Create ghost element for fallback mode
   */
  const createGhost = () => {
    const dragElement = state.dragElement.value
    if (!dragElement || !tapEvt.value)
      return

    const opts = resolvedOptions.value
    const rect = dragElement.getBoundingClientRect()
    const tapDistance = {
      left: tapEvt.value.clientX - rect.left,
      top: tapEvt.value.clientY - rect.top,
    }

    // Prepare ghost element options for fallback mode
    const ghostOptions: GhostElementOptions = {
      ghostClass: opts.ghostClass || 'sortable-ghost',
      fallbackClass: opts.fallbackClass || 'sortable-fallback',
      fallbackOnBody: opts.fallbackOnBody || false,
      fallbackOffset: opts.fallbackOffset || { x: 0, y: 0 },
      useFallback: true,
      nativeDraggable: false,
      tapDistance,
      initialRect: rect,
    }

    const ghostElement = createGhostElement(dragElement, ghostOptions)
    state._setGhostElement(ghostElement)

    // Choose container for fallback mode
    const container = opts.fallbackOnBody
      ? document.body
      : dragElement.parentNode

    // Insert ghost element for fallback mode
    if (container && ghostElement) {
      if (opts.fallbackOnBody) {
        container.appendChild(ghostElement)
      }
      else {
        container.insertBefore(ghostElement, dragElement.nextSibling)
      }
    }

    // Set up ghost relative parent for absolute positioning
    if (ghostElement) {
      setGhostRelativeParent(ghostElement, container as HTMLElement)
    }
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
    const opts = resolvedOptions.value

    state._setDragging(false)

    // Stop fallback mode if active
    if (isUsingFallback.value) {
      stopFallbackMode()
    }

    // Remove classes if element exists
    if (dragElement) {
      if (opts.chosenClass) {
        dragElement.classList.remove(opts.chosenClass)
      }
      if (opts.dragClass) {
        dragElement.classList.remove(opts.dragClass)
      }
      if (opts.ghostClass) {
        dragElement.classList.remove(opts.ghostClass)
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

    const opts = resolvedOptions.value

    // Now we're actually dragging
    state._setDragging(true)

    // Set up data transfer for native drag
    if (evt.dataTransfer) {
      evt.dataTransfer.effectAllowed = 'move'

      // Set custom data if provided
      if (opts.setData) {
        opts.setData(evt.dataTransfer, dragElement)
      }
      else {
        // Default data transfer
        evt.dataTransfer.setData('text/plain', dragElement.textContent || '')
      }
    }

    // Apply drag class
    if (opts.dragClass) {
      dragElement.classList.add(opts.dragClass)
    }

    // Dispatch start event
    dispatchEvent('start', {
      item: dragElement,
      oldIndex: startIndex.value,
    })

    // Set up document-level dragover listener for native mode
    const onDocumentDragOver = handleDocumentDragOver
    document.addEventListener('dragover', onDocumentDragOver)

    dragCleanupFunctions.value.push(() => {
      document.removeEventListener('dragover', onDocumentDragOver)
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

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)

    dragCleanupFunctions.value.push(() => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    })
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

    dragElement.addEventListener('dragend', onDragEnd)
    dragElement.addEventListener('dragstart', onDragStart)

    dragCleanupFunctions.value.push(() => {
      if (dragElement) {
        dragElement.removeEventListener('dragend', onDragEnd)
        dragElement.removeEventListener('dragstart', onDragStart)
      }
    })
  }

  /**
   * Handle fallback drag start
   */
  const handleFallbackDragStart = (_evt: Event) => {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    const opts = resolvedOptions.value

    // Set dragging state
    state._setDragging(true)
    state._setFallbackActive(true)

    // Add drag class
    if (opts.dragClass) {
      dragElement.classList.add(opts.dragClass)
    }

    // Apply ghost class to original element
    if (opts.ghostClass) {
      dragElement.classList.add(opts.ghostClass)
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
   * Start the actual drag operation
   */
  const startDragOperation = (evt: Event) => {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    const isTouch = evt.type.startsWith('touch')
      || (evt instanceof PointerEvent && evt.pointerType === 'touch')

    const shouldUseFallbackMode = !state.nativeDraggable.value || isTouch

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
    const opts = resolvedOptions.value

    state._setDragElement(dragElement)
    startIndex.value = getElementIndex(dragElement)

    // Record initial tap/click position for fallback mode
    if (evt instanceof MouseEvent) {
      tapEvt.value = { clientX: evt.clientX, clientY: evt.clientY }
    }
    else if (evt instanceof TouchEvent && evt.touches.length > 0) {
      const touch = evt.touches[0]
      tapEvt.value = { clientX: touch.clientX, clientY: touch.clientY }
    }

    // Add chosen class
    if (opts.chosenClass) {
      dragElement.classList.add(opts.chosenClass)
    }

    const isTouch = evt.type.startsWith('touch')
      || (evt instanceof PointerEvent && (evt as PointerEvent).pointerType === 'touch')

    // Set draggable attribute for native mode (non-touch events)
    if (state.nativeDraggable.value && !isTouch) {
      dragElement.draggable = true
    }

    // Handle delay
    if (opts.delay && (!opts.delayOnTouchOnly || isTouch)) {
      setTimeout(() => {
        if (state.dragElement.value === dragElement) {
          startDragOperation(evt)
        }
      }, opts.delay)
    }
    else {
      // Start immediately for programmatic calls or when no delay
      if (evt.type === 'mousedown' && (evt as MouseEvent).clientX === 0 && (evt as MouseEvent).clientY === 0) {
        // This is a programmatic call, start immediately
        startDragOperation(evt)
      }
      else {
        startDragOperation(evt)
      }
    }
  }

  /**
   * Handle mouse down event to initiate drag
   */
  const handleMouseDown = (evt: MouseEvent) => {
    const opts = resolvedOptions.value
    if (opts.disabled || state.isDragging.value)
      return

    const target = evt.target as HTMLElement
    const draggableElement = findDraggableTarget(target)

    if (!draggableElement)
      return
    if (shouldFilterElement(evt, draggableElement, target))
      return
    if (opts.handle && !isValidHandle(target, opts.handle))
      return

    prepareDragStart(evt, draggableElement)
  }

  /**
   * Handle touch start event for mobile drag
   */
  const handleTouchStart = (evt: TouchEvent) => {
    const opts = resolvedOptions.value
    if (opts.disabled || state.isDragging.value)
      return

    const target = evt.target as HTMLElement
    const draggableElement = findDraggableTarget(target)

    if (!draggableElement)
      return
    if (shouldFilterElement(evt, draggableElement, target))
      return
    if (opts.handle && !isValidHandle(target, opts.handle))
      return

    prepareDragStart(evt, draggableElement)
  }

  /**
   * Setup event listeners for drag operations
   */
  const setupEventListeners = () => {
    const el = targetElement.value
    if (!el)
      return

    // Mouse events
    const onMouseDown = handleMouseDown
    el.addEventListener('mousedown', onMouseDown)
    cleanupFunctions.value.push(() => {
      el.removeEventListener('mousedown', onMouseDown)
    })

    // Touch events for mobile support
    const onTouchStart = handleTouchStart
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    cleanupFunctions.value.push(() => {
      el.removeEventListener('touchstart', onTouchStart)
    })

    // Native HTML5 drag events for native mode
    if (state.nativeDraggable.value) {
      const onDragOver = handleDragOver
      const onDragEnter = handleDragEnter

      el.addEventListener('dragover', onDragOver)
      el.addEventListener('dragenter', onDragEnter)

      cleanupFunctions.value.push(() => {
        el.removeEventListener('dragover', onDragOver)
        el.removeEventListener('dragenter', onDragEnter)
      })
    }
  }

  /**
   * Initialize drag functionality
   */
  const initialize = () => {
    const el = targetElement.value
    if (!el)
      return

    // Update native draggable state
    state._setNativeDraggable(!shouldUseFallback())

    // Setup event listeners
    setupEventListeners()
  }

  /**
   * Start dragging programmatically
   */
  const startDrag = (element: HTMLElement) => {
    if (state.isDragging.value || state.dragElement.value)
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
   * Update options
   */
  const updateOptions = (_newOptions: Partial<UseDragCoreOptions>) => {
    // Options are reactive through computed, so they will update automatically
    // Additional logic can be added here if needed
  }

  /**
   * Destroy and cleanup
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

    // Reset state
    state._resetState()
    resetDragState()
  }

  // Watch target changes and reinitialize
  watch(targetElement, (newTarget, oldTarget) => {
    if (oldTarget !== newTarget) {
      destroy()
      if (newTarget && resolvedOptions.value.immediate) {
        initialize()
      }
    }
  }, { immediate: true })

  // Cleanup on unmount
  tryOnUnmounted(() => {
    destroy()
  })

  return {
    state,
    startDrag,
    stopDrag,
    updateOptions,
    destroy,
  }
}

export default useDragCore
