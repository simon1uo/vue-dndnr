import type { SortableData, SortableEventData, SortableEventType } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { UseSortableOptions } from './useSortable'
import type { SortableStateInternal } from './useSortableState'
import { findClosestElementBySelector, getElementRect, getElementStyleValue, IE, IOS, matchesSelector, Safari } from '@/utils'
import { globalGroupManager } from '@/utils/group-manager'
import { isClient, tryOnUnmounted, useEventListener } from '@vueuse/core'
import { computed, ref, toValue, watch } from 'vue'
import { useEventDispatcher } from './useEventDispatcher'
import { useSortableAutoScroll } from './useSortableAutoScroll'

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

  const { handleAutoScroll, stop: stopAutoScroll } = useSortableAutoScroll(toValue(options))

  // Core Internal State
  const startIndex = ref(-1)
  const currentTouchEvent = ref<{ clientX: number, clientY: number } | undefined>()
  const isUsingFallback = ref(false)
  const cleanupFunctions = ref<Array<() => void>>([])
  const dragCleanupFunctions = ref<Array<() => void>>([])

  // Fallback drag state
  const tapEvt = ref<{ clientX: number, clientY: number } | undefined>()
  const isFallbackActive = ref(false)
  const loopTimer = ref<ReturnType<typeof setTimeout> | undefined>()
  const ghostMatrix = ref<DOMMatrix | undefined>()
  const lastDx = ref(0)
  const lastDy = ref(0)
  const scaleX = ref(1)
  const scaleY = ref(1)
  const ghostRelativeParent = ref<HTMLElement | undefined>()
  const ghostRelativeParentInitialScroll = ref<[number, number]>([0, 0])
  const positionGhostAbsolutely = computed(() => IOS)

  // Drag Delay management
  const delayTimer = ref<ReturnType<typeof setTimeout> | undefined>()
  const awaitingDragStarted = ref(false)
  const delayedDragEvents = ref<Array<() => void>>([])

  // Touch and pointer state
  const touchStartThreshold = ref(1)
  const isTouchInteraction = ref(false)
  const lastX = ref(0)
  const lastY = ref(0)

  // Event listener state
  const isListenersSetup = ref(false)
  const globalTouchMoveCleanup = ref<(() => void) | undefined>()

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
    fallbackTolerance = 0,
    swapThreshold = 1,
    invertSwap = false,
    invertedSwapThreshold,
    preventOnFilter = true,
    onStart,
    onEnd,
    onAdd,
    onRemove,
    onUpdate,
    onSort,
    onFilter,
    onChoose,
    onUnchoose,
    onMove,
    onClone,
    onChange,
    onSpill,
    onSelect,
    onDeselect,
    onItemsUpdate,
    onAnimationCapture,
    onAnimationTrigger,
    setData,
    revertOnSpill = false,
    removeOnSpill = false,
  } = toValue(options)

  // Computed properties for reactive options
  const supportPointer = computed(() => typeof window !== 'undefined' && 'PointerEvent' in window && (!Safari || IOS))
  const supportCssPointerEvents = computed(() => {
    if (!isClient || IE)
      return false

    const el = document.createElement('x')
    el.style.cssText = 'pointer-events:auto'
    return el.style.pointerEvents === 'auto'
  })

  // Threshold detection state
  const dragStartThreshold = computed(() => {
    // native draggable uses threshold 1, fallback uses configured value
    if (state.nativeDraggable.value) {
      return 1
    }
    return Math.floor(toValue(touchStartThreshold) / ((state.nativeDraggable.value && window.devicePixelRatio) || 1))
  })

  /**
   * Get the child element at the specified index
   * @param element - The parent element
   * @param childNum - The index of the child
   * @param selector - Selector for children elements.
   * @param includeDragElement - Whether to include the currently dragged element
   * @returns The child at index childNum, or null if not found
   */
  function getElementChild(
    element: HTMLElement,
    childNum: number,
    selector: string,
    includeDragElement?: boolean,
  ): HTMLElement | null {
    let currentChild = 0
    let i = 0
    const children = Array.from(element.children) as HTMLElement[]

    while (i < children.length) {
      if (
        children[i].style.display !== 'none'
        && children[i] !== state.ghostElement.value
        && (includeDragElement || children[i] !== state.dragElement.value)
        && findClosestElementBySelector(children[i], selector, element, false)
      ) {
        if (currentChild === childNum) {
          return children[i]
        }
        currentChild++
      }

      i++
    }

    return null
  }

  /**
   * Get the last child in the element, ignoring ghost elements or invisible elements
   * @param el - Parent element
   * @param selector - Draggable selector to filter children
   * @returns The last child, or null if not found
   */
  function findElementLastChild(element: HTMLElement, selector?: string): HTMLElement | null {
    for (
      let last = element.lastElementChild as HTMLElement | null;
      last;
      last = last.previousElementSibling as HTMLElement | null
    ) {
      if (
        last !== state.ghostElement.value
        && last.style.display !== 'none'
        && (!selector || matchesSelector(last, selector))
      ) {
        return last
      }
    }

    return null
  }

  function getDraggableChildren(
    container: HTMLElement,
    selector: string,
  ): HTMLElement[] {
    if (!container)
      return []

    const children = Array.from(container.children) as HTMLElement[]

    return children.filter((child) => {
      // Skip hidden elements and templates
      if (
        getElementStyleValue(child, 'display') === 'none'
        || child === state.ghostElement.value
        || child.nodeName.toUpperCase() === 'TEMPLATE'
      ) {
        return false
      }

      // Apply selector filter
      return findClosestElementBySelector(child, selector)
    })
  }

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
      && getElementStyleValue(ghostRelativeParent.value, 'position') === 'static'
      && getElementStyleValue(ghostRelativeParent.value, 'transform') === 'none'
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
    const container = targetElement.value
    if (!container)
      return null

    const draggableSelector = toValue(draggable)

    return findClosestElementBySelector(target, draggableSelector, container, false)
  }

  /**
   * Find the sortable container for a given element (for cross-list detection)
   * @param target - Event target element
   * @returns Sortable container element or null
   */
  const findSortableContainer = (target: HTMLElement): HTMLElement | null => {
    let current: HTMLElement | null = target

    while (current) {
      // Check if this element is registered as a sortable container
      if (current.hasAttribute('data-sortable-group')) {
        return current
      }
      current = current.parentElement
    }

    return null
  }

  /**
   * Check if target is an empty container or container's empty area
   * @param target - Event target element
   * @param container - Sortable container element
   * @returns Whether target represents an empty insertion point
   */
  const isEmptyContainerTarget = (target: HTMLElement, container: HTMLElement): boolean => {
    // Direct container click
    if (target === container) {
      return true
    }

    // Check if container has no draggable children
    const draggableSelector = toValue(draggable)
    const draggableChildren = container.querySelectorAll(draggableSelector)

    return draggableChildren.length === 0
  }

  /**
   * Find draggable element in any sortable container (for cross-list detection)
   * @param target - Event target element
   * @param container - Sortable container element
   * @returns Draggable element or null
   */
  const findCrossListDraggableTarget = (target: HTMLElement, container: HTMLElement): HTMLElement | null => {
    if (!container)
      return null

    let current: HTMLElement | null = target
    const draggableSelector = toValue(draggable)

    while (current && current !== container) {
      if (matchesSelector(current, draggableSelector)) {
        return current
      }
      current = current.parentElement
    }

    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const isWithinContainer = (
      targetRect.left >= containerRect.left
      && targetRect.right <= containerRect.right
      && targetRect.top >= containerRect.top
      && targetRect.bottom <= containerRect.bottom
    )

    if (isWithinContainer || target === container) {
      const pointerX = targetRect.left + targetRect.width / 2
      const pointerY = targetRect.top + targetRect.height / 2

      const draggableElements = getDraggableChildren(container, draggableSelector)

      if (draggableElements.length > 0) {
        let nearestElement: HTMLElement | null = null
        let minDistance = Infinity

        for (const element of draggableElements) {
          const rect = element.getBoundingClientRect()
          const elementCenterX = rect.left + rect.width / 2
          const elementCenterY = rect.top + rect.height / 2

          // 计算欧几里得距离（平方）
          const dx = pointerX - elementCenterX
          const dy = pointerY - elementCenterY
          const distance = dx * dx + dy * dy

          if (distance < minDistance) {
            minDistance = distance
            nearestElement = element
          }
        }

        if (nearestElement) {
          return nearestElement
        }
      }
    }

    return null
  }

  /**
   * Fallback method to find element by position
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
      if (!matchesSelector(child, draggableSelector))
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
    let index = 0

    if (!element || !element.parentNode)
      return -1

    const draggableSelector = toValue(draggable)
    let prevElement = element.previousElementSibling

    while (prevElement) {
      if ((prevElement.nodeName.toUpperCase() !== 'TEMPLATE') && prevElement !== state.cloneEl.value && (!draggableSelector || matchesSelector(prevElement as HTMLElement, draggableSelector))) {
        index++
      }
      prevElement = prevElement.previousElementSibling
    }

    return index
  }

  /**
   * Detect layout direction (vertical or horizontal)
   * @returns 'vertical' | 'horizontal'
   */
  const detectDirection = (): 'vertical' | 'horizontal' => {
    const containerEl = targetElement.value
    if (!containerEl)
      return 'vertical'

    const draggableSelector = toValue(draggable)

    const firstChild = getElementChild(containerEl, 0, draggableSelector)
    const secondChild = getElementChild(containerEl, 1, draggableSelector)

    const firstChildCss = firstChild ? getElementStyleValue(firstChild) as CSSStyleDeclaration : null
    const secondChildCss = secondChild ? getElementStyleValue(secondChild) as CSSStyleDeclaration : null

    const containerStyle = getElementStyleValue(containerEl) as CSSStyleDeclaration
    if (containerStyle.display === 'flex') {
      return containerStyle.flexDirection === 'column' || containerStyle.flexDirection === 'column-reverse' ? 'vertical' : 'horizontal'
    }
    else if (containerStyle.display === 'grid') {
      return containerStyle.gridTemplateColumns.split(' ').length <= 1 ? 'vertical' : 'horizontal'
    }

    if (firstChild) {
      if (firstChildCss && firstChildCss.float && firstChildCss.float !== 'none') {
        const touchingSideChild2 = firstChildCss.float === 'left' ? 'left' : 'right'

        return (secondChildCss && (secondChildCss.clear === 'both' || secondChildCss.clear === touchingSideChild2))
          ? 'vertical'
          : 'horizontal'
      }
    }

    return (firstChild
      && (
        (firstChildCss && (firstChildCss.display === 'block'
          || firstChildCss.display === 'flex'
          || firstChildCss.display === 'table'
          || firstChildCss.display === 'grid'))
        || (firstChildCss && firstChildCss.width >= containerStyle.width
          && containerStyle.float === 'none')
        || (secondChild && firstChildCss && secondChildCss
          && containerStyle.float === 'none'
          && firstChildCss.width + secondChildCss.width > containerStyle.width))
      ? 'vertical'
      : 'horizontal'
    )
  }

  /**
   * Find the nearest draggable element to a point
   * @param pointer - Pointer object containing clientX and clientY coordinates.
   * @param container - Container element
   * @returns Nearest element and relative position or null
   */
  const findNearestElement = (
    pointer: { clientX: number, clientY: number },
    container: HTMLElement,
  ): { element: HTMLElement, position: number } | null => {
    const vertical = detectDirection() === 'vertical'
    const draggableSelector = toValue(draggable)
    const pointerPos = vertical ? pointer.clientY : pointer.clientX

    const draggableElements = getDraggableChildren(container, draggableSelector)

    if (draggableElements.length === 0) {
      return null
    }

    // Calculate distance and find the nearest element
    let nearestElement: HTMLElement | null = null
    let minDistance = Infinity
    let position = 0

    for (const element of draggableElements) {
      const rect = element.getBoundingClientRect()
      const elementPos = vertical
        ? (rect.top + rect.height / 2)
        : (rect.left + rect.width / 2)

      const distance = Math.abs(pointerPos - elementPos)

      if (distance < minDistance) {
        minDistance = distance
        nearestElement = element
        position = pointerPos > elementPos ? 1 : -1
      }
    }

    // If we found a nearest element, return it with the position
    if (nearestElement) {
      return { element: nearestElement, position }
    }

    return null
  }

  /**
   * Dispatch a move event with special handling for onMove callback signature
   */
  const dispatchMoveEvent = (data: Partial<SortableEventData> = {}, originalEvent?: Event): boolean => {
    const el = targetElement.value
    const dragElement = state.dragElement.value
    if (!el || !dragElement)
      return true

    // Extract only the properties that are compatible with SortableEventData
    const compatibleData: Partial<SortableEventData> = {
      to: data.to,
      from: data.from,
      item: data.item,
      dragged: data.dragged,
      draggedRect: data.draggedRect,
      clone: data.clone,
      oldIndex: data.oldIndex,
      newIndex: data.newIndex,
      oldDraggableIndex: data.oldDraggableIndex,
      newDraggableIndex: data.newDraggableIndex,
      originalEvent: data.originalEvent || originalEvent,
      pullMode: data.pullMode,
      related: data.related,
      relatedRect: data.relatedRect,
      willInsertAfter: data.willInsertAfter,
    }

    // Prepare event data with defaults
    const eventData: Partial<SortableEventData> = {
      to: el,
      from: el,
      item: dragElement,
      dragged: dragElement,
      oldIndex: startIndex.value,
      newIndex: startIndex.value,
      ...compatibleData,
    }

    // Dispatch event using unified event dispatcher
    const result = dispatch('move', eventData, (nativeEvent, sortableData) => {
      // Call onMove callback with new two-parameter signature if provided
      if (onMove) {
        return onMove(nativeEvent, sortableData)
      }
      return true
    })

    return result
  }

  /**
   * Dispatch a sortable event with proper callback handling using unified event dispatcher
   */
  const dispatchEvent = (eventType: SortableEventType, data: Partial<SortableEventData> = {}): boolean => {
    const el = targetElement.value
    const dragElement = state.dragElement.value
    if (!el || !dragElement)
      return false

    // Extract only the properties that are compatible with SortableEventData
    const compatibleData: Partial<SortableEventData> = {
      to: data.to,
      from: data.from,
      item: data.item,
      dragged: data.dragged,
      draggedRect: data.draggedRect,
      clone: data.clone,
      oldIndex: data.oldIndex,
      newIndex: data.newIndex,
      oldDraggableIndex: data.oldDraggableIndex,
      newDraggableIndex: data.newDraggableIndex,
      originalEvent: data.originalEvent,
      pullMode: data.pullMode,
      related: data.related,
      relatedRect: data.relatedRect,
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
    let callback: ((event: PointerEvent | DragEvent, sortableData: SortableData) => void | boolean) | undefined
    switch (eventType) {
      case 'start':
        callback = onStart
        break
      case 'end':
        callback = onEnd
        break
      case 'add':
        callback = onAdd
        break
      case 'remove':
        callback = onRemove
        break
      case 'update':
        callback = onUpdate
        break
      case 'sort':
        callback = onSort
        break
      case 'filter':
        callback = onFilter
        break
      case 'choose':
        callback = onChoose
        break
      case 'unchoose':
        callback = onUnchoose
        break
      case 'clone':
        callback = onClone
        break
      case 'change':
        callback = onChange
        break
      case 'spill':
        callback = onSpill
        break
      case 'select':
        callback = onSelect
        break
      case 'deselect':
        callback = onDeselect
        break
    }

    // Dispatch event using unified event dispatcher and return the result
    return dispatch(eventType, eventData, callback)
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
      if (matchesSelector(target, currentFilter)) {
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
    return matchesSelector(target, handleSelector) || findClosestElementBySelector(target, handleSelector) !== null
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
   * Check if the ghost element is at the first position in the container
   * @param evt - Drag event with coordinates
   * @param {number} evt.clientX - The X coordinate of the pointer.
   * @param {number} evt.clientY - The Y coordinate of the pointer.
   * @param vertical - Whether the layout is vertical
   * @param container - Container element
   * @returns Whether the ghost is at the first position
   */
  const isGhostElementFirst = (evt: { clientX: number, clientY: number }, vertical: boolean, container: HTMLElement): boolean => {
    const draggableSelector = toValue(draggable)
    const firstEl = getElementChild(container, 0, draggableSelector, true)

    if (!firstEl) {
      return false
    }

    const firstElRect = getElementRect(firstEl)
    const containerRect = getElementRect(container)

    // Make sure the pointer is within the container bounds in the non-primary axis
    const isWithinContainerBounds = vertical
      ? (evt.clientX >= containerRect!.left && evt.clientX <= containerRect!.right)
      : (evt.clientY >= containerRect!.top && evt.clientY <= containerRect!.bottom)

    if (!isWithinContainerBounds) {
      return false
    }

    return vertical
      ? (evt.clientY < firstElRect!.top + (firstElRect!.height / 3)) // Top third of first element
      : (evt.clientX < firstElRect!.left + (firstElRect!.width / 3)) // Left third of first element
  }

  /**
   * Check if the ghost element is at the last position in the container
   * @param evt - Drag event with coordinates
   * @param {number} evt.clientX - The X coordinate of the pointer.
   * @param {number} evt.clientY - The Y coordinate of the pointer.
   * @param vertical - Whether the layout is vertical
   * @param container - Container element
   * @returns Whether the ghost is at the last position
   */
  const isGhostElementLast = (evt: { clientX: number, clientY: number }, vertical: boolean, container: HTMLElement): boolean => {
    const draggableSelector = toValue(draggable)
    const lastEl = findElementLastChild(container, draggableSelector)

    if (!lastEl) {
      return false
    }

    const lastElRect = getElementRect(lastEl)
    const containerRect = getElementRect(container)

    // Make sure the pointer is within the container bounds in the non-primary axis
    const isWithinContainerBounds = vertical
      ? (evt.clientX >= containerRect!.left && evt.clientX <= containerRect!.right)
      : (evt.clientY >= containerRect!.top && evt.clientY <= containerRect!.bottom)

    if (!isWithinContainerBounds) {
      return false
    }

    return vertical
      ? (evt.clientY > lastElRect!.bottom - (lastElRect!.height / 3)) // Bottom third of last element
      : (evt.clientX > lastElRect!.right - (lastElRect!.width / 3)) // Right third of last element
  }

  /**
   * Detect if the cursor is in a gap between elements or at container boundaries
   * @param evt - Drag event with coordinates
   * @param {number} evt.clientX - The X coordinate of the pointer.
   * @param {number} evt.clientY - The Y coordinate of the pointer.
   * @param container - Container element
   * @returns Object with insertion info or null
   */
  const detectContainerBoundaryInsertion = (
    evt: { clientX: number, clientY: number },
    container: HTMLElement,
  ): { insertAtEnd: boolean, insertAtStart: boolean, nearestElement?: HTMLElement, position?: number } | null => {
    const vertical = detectDirection() === 'vertical'

    // Check if at first position
    const isAtFirst = isGhostElementFirst(evt, vertical, container)
    if (isAtFirst) {
      return { insertAtEnd: false, insertAtStart: true }
    }

    // Check if at last position
    const isAtLast = isGhostElementLast(evt, vertical, container)
    if (isAtLast) {
      return { insertAtEnd: true, insertAtStart: false }
    }

    const containerRect = container.getBoundingClientRect()
    const isWithinContainer = (
      evt.clientX >= containerRect.left
      && evt.clientX <= containerRect.right
      && evt.clientY >= containerRect.top
      && evt.clientY <= containerRect.bottom
    )

    if (isWithinContainer) {
      const nearestResult = findNearestElement(evt, container)
      if (nearestResult) {
        return {
          insertAtEnd: nearestResult.position > 0,
          insertAtStart: nearestResult.position < 0,
          nearestElement: nearestResult.element,
          position: nearestResult.position,
        }
      }
    }

    return null
  }

  /**
   * Perform boundary insertion (at start or end of container)
   * @param container - Target container
   * @param insertAtEnd - Whether to insert at the end
   * @param insertAtStart - Whether to insert at the start
   */
  const performBoundaryInsertion = (container: HTMLElement, insertAtEnd: boolean, insertAtStart: boolean) => {
    const dragElement = state.dragElement.value
    if (!dragElement) {
      return
    }

    // Capture animation state before DOM changes
    if (onAnimationCapture) {
      onAnimationCapture()
    }

    if (insertAtEnd) {
      // Insert at the end of the container
      container.appendChild(dragElement)
    }
    else if (insertAtStart) {
      // Insert at the beginning of the container
      const firstChild = container.firstElementChild
      if (firstChild) {
        container.insertBefore(dragElement, firstChild)
      }
      else {
        container.appendChild(dragElement)
      }
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
   * Perform cross-list boundary insertion
   * @param container - Target container
   * @param insertAtEnd - Whether to insert at the end
   * @param insertAtStart - Whether to insert at the start
   */
  const performCrossListBoundaryInsertion = (container: HTMLElement, insertAtEnd: boolean, insertAtStart: boolean) => {
    const dragElement = state.dragElement.value
    const sourceContainer = targetElement.value

    if (!dragElement || !container || !sourceContainer) {
      return
    }

    // Check drop permission
    const dropResult = globalGroupManager.canAcceptDrop(
      sourceContainer,
      container,
      dragElement,
    )

    if (!dropResult.allowed) {
      return
    }

    // In clone mode, still move the original element during drag
    // The clone logic will be handled at drag end
    const elementToInsert = dragElement
    const targetAnimation = globalGroupManager.getAnimation(container)

    // Capture animation state on both lists before DOM changes
    if (onAnimationCapture) {
      onAnimationCapture()
    }
    if (targetAnimation) {
      targetAnimation.captureAnimationState()
    }

    // Perform the insertion
    if (insertAtEnd) {
      container.appendChild(elementToInsert)
    }
    else if (insertAtStart) {
      const firstChild = container.firstElementChild
      if (firstChild) {
        container.insertBefore(elementToInsert, firstChild)
      }
      else {
        container.appendChild(elementToInsert)
      }
    }

    // Calculate new indices
    const targetItems = Array.from(container.children) as HTMLElement[]
    const newIndex = targetItems.indexOf(elementToInsert)

    // Update current index for the moved/cloned element
    if (dropResult.pullMode !== 'clone') {
      state._setCurrentIndex(newIndex)
    }

    // Immediately notify about DOM changes for responsive data updates
    if (onItemsUpdate) {
      onItemsUpdate()
    }

    // Trigger animation on both lists after DOM changes
    if (onAnimationTrigger) {
      onAnimationTrigger()
    }
    if (targetAnimation) {
      targetAnimation.animateAll()
    }
  }

  /**
   * Calculate insertion position based on mouse position and target element
   * @param {object} pointer - Pointer object containing clientX and clientY coordinates.
   * @param {number} pointer.clientX - The X coordinate of the pointer.
   * @param {number} pointer.clientY - The Y coordinate of the pointer.
   * @param {HTMLElement} target - Target element.
   * @returns {number | null} Insertion position or null if no position is found.
   */
  const calculateInsertPosition = (
    pointer: { clientX: number, clientY: number },
    target: HTMLElement,
  ): number => {
    const targetRect = target.getBoundingClientRect()
    const vertical = detectDirection() === 'vertical'
    const mouseOnAxis = vertical ? pointer.clientY : pointer.clientX
    const targetLength = vertical ? targetRect.height : targetRect.width
    const targetStart = vertical ? targetRect.top : targetRect.left
    const targetEnd = vertical ? targetRect.bottom : targetRect.right

    const currentInvertSwap = toValue(invertSwap)
    const currentSwapThreshold = toValue(swapThreshold)
    const currentInvertedSwapThreshold = toValue(invertedSwapThreshold) ?? currentSwapThreshold

    if (currentInvertSwap) {
      if (
        mouseOnAxis < targetStart + (targetLength * currentInvertedSwapThreshold / 2)
        || mouseOnAxis > targetEnd - (targetLength * currentInvertedSwapThreshold / 2)
      ) {
        return mouseOnAxis > targetStart + targetLength / 2 ? 1 : -1
      }
    }
    else {
      const deadZoneStart = targetStart + (targetLength * (1 - currentSwapThreshold) / 2)
      const deadZoneEnd = targetEnd - (targetLength * (1 - currentSwapThreshold) / 2)

      if (mouseOnAxis > deadZoneStart && mouseOnAxis < deadZoneEnd) {
        const dragElement = state.dragElement.value
        if (!dragElement)
          return 0
        const dragIndex = getElementIndex(dragElement)
        const targetIndex = getElementIndex(target)

        return dragIndex < targetIndex ? 1 : -1
      }
    }

    return 0
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
   * Perform cross-list DOM insertion with proper event handling
   * @param target - Target element in the destination container
   * @param direction - Direction of the insertion
   * @param targetContainer - Destination container element
   */
  const performCrossListInsertion = (target: HTMLElement, direction: number, targetContainer: HTMLElement | null) => {
    const dragElement = state.dragElement.value
    const sourceContainer = targetElement.value

    if (!dragElement || !targetContainer || !sourceContainer)
      return

    // Check drop permission again to be safe
    const dropResult = globalGroupManager.canAcceptDrop(
      sourceContainer,
      targetContainer,
      dragElement,
    )

    if (!dropResult.allowed) {
      return
    }

    const parent = target.parentNode
    if (!parent)
      return

    // In clone mode, still move the original element during drag
    // The clone logic will be handled at drag end
    const elementToInsert = dragElement
    const targetAnimation = globalGroupManager.getAnimation(targetContainer)

    // Capture animation state on both lists before DOM changes
    if (onAnimationCapture) {
      onAnimationCapture()
    }
    if (targetAnimation) {
      targetAnimation.captureAnimationState()
    }

    // Perform the actual insertion
    if (direction === 1) {
      // Insert after target
      const nextSibling = target.nextSibling
      if (nextSibling) {
        parent.insertBefore(elementToInsert, nextSibling)
      }
      else {
        parent.appendChild(elementToInsert)
      }
    }
    else {
      // Insert before target
      parent.insertBefore(elementToInsert, target)
    }

    // Calculate new indices
    const targetItems = Array.from(targetContainer.children) as HTMLElement[]
    const newIndex = targetItems.indexOf(elementToInsert)

    // Update current index for the moved/cloned element
    if (dropResult.pullMode !== 'clone') {
      state._setCurrentIndex(newIndex)
    }

    // Immediately notify about DOM changes for responsive data updates
    if (onItemsUpdate) {
      onItemsUpdate()
    }

    // Trigger animation on both lists after DOM changes
    if (onAnimationTrigger) {
      onAnimationTrigger()
    }
    if (targetAnimation) {
      targetAnimation.animateAll()
    }
  }

  /**
   * Perform insertion into empty container
   * @param targetContainer - Empty target container element
   */
  const performEmptyContainerInsertion = (targetContainer: HTMLElement) => {
    const dragElement = state.dragElement.value
    const sourceContainer = targetElement.value

    if (!dragElement || !targetContainer || !sourceContainer)
      return

    // Check drop permission again to be safe
    const dropResult = globalGroupManager.canAcceptDrop(
      sourceContainer,
      targetContainer,
      dragElement,
    )

    if (!dropResult.allowed) {
      return
    }

    // In clone mode, still move the original element during drag
    // The clone logic will be handled at drag end
    const elementToInsert = dragElement
    const targetAnimation = globalGroupManager.getAnimation(targetContainer)

    // Capture animation state on both lists before DOM changes
    if (onAnimationCapture) {
      onAnimationCapture()
    }
    if (targetAnimation) {
      targetAnimation.captureAnimationState()
    }

    // Insert into empty container (append to end)
    targetContainer.appendChild(elementToInsert)

    // Calculate new indices
    const targetItems = Array.from(targetContainer.children) as HTMLElement[]
    const newIndex = targetItems.indexOf(elementToInsert)

    // Update current index for the moved/cloned element
    if (dropResult.pullMode !== 'clone') {
      state._setCurrentIndex(newIndex)
    }

    // Immediately notify about DOM changes for responsive data updates
    if (onItemsUpdate) {
      onItemsUpdate()
    }

    // Trigger animation on both lists after DOM changes
    if (onAnimationTrigger) {
      onAnimationTrigger()
    }
    if (targetAnimation) {
      targetAnimation.animateAll()
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
    // Clean up clone element
    if (state.cloneEl.value) {
      if (state.cloneEl.value.parentNode) {
        state.cloneEl.value.parentNode.removeChild(state.cloneEl.value)
      }
      state._setCloneEl(null)
      state._setCloneHidden(false)
    }

    state._setDragElement(null)
    state._setCurrentIndex(null)
    state._setIsActive(false)

    // Reset cross-list drag states
    state._setPutSortable(null)
    state._setActiveGroup(null)
    state._setLastPutMode(null)
    state._setIsOwner(false)
    state._setRevert(false)

    startIndex.value = -1
    isUsingFallback.value = false
    tapEvt.value = undefined
    currentTouchEvent.value = undefined

    // Clean up only drag-specific listeners (not base listeners)
    dragCleanupFunctions.value.forEach(cleanup => cleanup())
    dragCleanupFunctions.value = []
  }

  /**
   * Cleanup global touch move event listener
   */
  const cleanupGlobalTouchMoveListener = () => {
    if (globalTouchMoveCleanup.value) {
      globalTouchMoveCleanup.value()
      globalTouchMoveCleanup.value = undefined
    }
  }

  /**
   * Disable delayed drag and clear timers
   */
  const disableDelayedDrag = (shouldDispatchUnchoose = true) => {
    const wasAwaitingDragStarted = awaitingDragStarted.value
    const dragElement = state.dragElement.value

    if (delayTimer.value) {
      clearTimeout(delayTimer.value)
      delayTimer.value = undefined
    }
    awaitingDragStarted.value = false

    // Dispatch unchoose event if we were waiting for drag to start and should dispatch unchoose
    if (shouldDispatchUnchoose && wasAwaitingDragStarted && dragElement) {
      dispatchEvent('unchoose', {
        item: dragElement,
        oldIndex: startIndex.value,
      })

      // Remove chosen class when unchoosing
      const currentChosenClass = toValue(chosenClass)
      if (currentChosenClass) {
        dragElement.classList.remove(currentChosenClass)
      }
    }

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

  // Clone state management with debouncing to prevent flickering
  const cloneStateTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const lastCloneAction = ref<'show' | 'hide' | null>(null)

  /**
   * Actually perform the hide clone operation
   */
  const performHideClone = (): void => {
    if (state.cloneEl.value && !state.cloneHidden.value) {
      state.cloneEl.value.style.display = 'none'
      state._setCloneHidden(true)
    }
  }

  /**
   * Hide clone element with debouncing to prevent flickering
   */
  const hideClone = (): void => {
    if (!state.cloneEl.value) {
      return
    }

    // If clone is already hidden and we're not switching from show action, no need to hide it again
    if (state.cloneHidden.value && lastCloneAction.value !== 'show') {
      return
    }

    // Clear any pending show action
    if (cloneStateTimeout.value) {
      clearTimeout(cloneStateTimeout.value)
      cloneStateTimeout.value = null
    }

    // Debounce hide action to prevent flickering
    if (lastCloneAction.value === 'show') {
      cloneStateTimeout.value = setTimeout(() => {
        performHideClone()
        lastCloneAction.value = 'hide'
        cloneStateTimeout.value = null
      }, 10) // Small delay to prevent flickering
    }
    else {
      performHideClone()
      lastCloneAction.value = 'hide'
    }
  }

  const performShowClone = (): void => {
    if (!state.cloneEl.value || state.lastPutMode.value !== 'clone') {
      return
    }

    const { dragElement, rootEl, nextEl } = state

    // Get revertClone option from group configuration
    const currentGroup = toValue(options).group
    const revertClone = typeof currentGroup === 'object' && currentGroup && 'revertClone' in currentGroup
      ? currentGroup.revertClone
      : false

    // First, ensure clone is in the DOM if not already
    if (!state.cloneEl.value.parentNode) {
      if (nextEl.value && nextEl.value.parentNode === rootEl.value) {
        // Place clone at original position using nextEl
        rootEl.value?.insertBefore(state.cloneEl.value, nextEl.value)
      }
      else {
        // Append to end of original container
        rootEl.value?.appendChild(state.cloneEl.value)
      }
    }

    // Handle revertClone animation if needed
    if (revertClone && dragElement.value && onAnimationTrigger) {
      // Trigger animation from dragEl to cloneEl position
      onAnimationTrigger()
    }

    // Restore display
    state.cloneEl.value.style.display = ''
    state._setCloneHidden(false)
  }

  /**
   * Show clone element with debouncing to prevent flickering
   */
  const showClone = (): void => {
    if (!state.cloneEl.value) {
      return
    }

    // Only show clone in clone mode
    if (state.lastPutMode.value !== 'clone') {
      hideClone()
      return
    }

    // If clone is already visible and we're not switching from hide action, no need to show it again
    if (!state.cloneHidden.value && lastCloneAction.value !== 'hide') {
      return
    }

    // Clear any pending hide action
    if (cloneStateTimeout.value) {
      clearTimeout(cloneStateTimeout.value)
      cloneStateTimeout.value = null
    }

    // Debounce show action to prevent flickering
    if (lastCloneAction.value === 'hide') {
      cloneStateTimeout.value = setTimeout(() => {
        performShowClone()
        lastCloneAction.value = 'show'
        cloneStateTimeout.value = null
      }, 10) // Small delay to prevent flickering
    }
    else {
      performShowClone()
      lastCloneAction.value = 'show'
    }
  }

  /**
   * Actually perform the show clone operation
   */

  /**
   * Handle revert logic when dragging back to original container
   */
  const handleRevert = (): boolean => {
    const { parentEl, rootEl, nextEl, dragElement } = state

    if (!parentEl.value || !rootEl.value || !dragElement.value) {
      return false
    }

    // Update parentEl to rootEl
    state._setParentEl(rootEl.value)

    // Trigger animation capture before DOM changes
    if (onAnimationCapture) {
      onAnimationCapture()
    }

    hideClone()

    // Restore element to original position
    if (nextEl.value) {
      rootEl.value.insertBefore(dragElement.value, nextEl.value)
    }
    else {
      rootEl.value.appendChild(dragElement.value)
    }

    // Trigger animation after DOM changes
    if (onAnimationTrigger) {
      onAnimationTrigger()
    }

    return true
  }

  /**
   * Handle document-level dragover for native mode
   */
  const handleDocumentDragOver = (evt: DragEvent) => {
    if (!state.isDragging.value || !state.dragElement.value || state.isPaused.value)
      return

    handleAutoScroll(evt)

    evt.preventDefault()

    // Find target element under cursor
    const target = getElementFromPoint(evt.clientX, evt.clientY)
    if (!target)
      return

    // Find the actual container under the cursor first
    let targetContainer = findSortableContainer(target) || targetElement.value
    let draggableTarget = findDraggableTarget(target)
    let isEmptyTarget = false

    // Determine isOwner and revert states based on the actual target container
    const currentActiveGroup = state.activeGroup.value
    const targetGroup = targetContainer?.getAttribute('data-sortable-group') || null
    const isOwner = currentActiveGroup === targetGroup
    const revert = targetContainer === state.rootEl.value && !!state.putSortable.value

    state._setIsOwner(isOwner)
    state._setRevert(revert)

    // Handle revert case first
    if (revert) {
      const reverted = handleRevert()
      if (reverted) {
        state._setPutSortable(null)
        // Trigger animation after revert
        if (onAnimationTrigger) {
          onAnimationTrigger()
        }
        return
      }
    }

    // Clone element management: if isOwner, hide clone; else show clone
    if (state.lastPutMode.value === 'clone' && state.cloneEl.value) {
      if (isOwner) {
        // When in owner container, hide clone
        hideClone()
      }
      else {
        // When in different container, show clone
        showClone()
      }
    }

    // Check for cross-list drag if target container is different from source
    if (targetContainer && targetContainer !== targetElement.value) {
      const dropResult = globalGroupManager.canAcceptDrop(
        targetElement.value!,
        targetContainer,
        state.dragElement.value,
        evt,
      )

      if (dropResult.allowed) {
        draggableTarget = findCrossListDraggableTarget(target, targetContainer)

        if (state.putSortable.value !== targetContainer && targetContainer !== state.rootEl.value) {
          state._setPutSortable(targetContainer)
        }
        else if (targetContainer === state.rootEl.value && state.putSortable.value) {
          state._setPutSortable(null)
        }

        let pullMode: boolean | 'clone' | null = null
        if (dropResult.pullMode === true || dropResult.pullMode === false) {
          pullMode = dropResult.pullMode
        }
        else if (dropResult.pullMode === 'clone') {
          pullMode = 'clone'
        }
        else if (typeof dropResult.pullMode === 'function') {
          pullMode = dropResult.pullMode(
            targetContainer,
            targetElement.value!,
            state.dragElement.value!,
            evt,
          )
        }
        state._setLastPutMode(pullMode)

        // If still no draggable target, check for empty container
        if (!draggableTarget && isEmptyContainerTarget(target, targetContainer)) {
          isEmptyTarget = true
        }
      }
      else {
        // If drop is not allowed, we still need to handle animation properly
        // Reset target container to source for animation purposes
        targetContainer = targetElement.value
        draggableTarget = null
        isEmptyTarget = false
      }
    }

    // Handle empty container insertion
    if (isEmptyTarget && targetContainer) {
      // Dispatch move event for empty container
      const containerRect = targetContainer.getBoundingClientRect()
      const dragRect = state.dragElement.value?.getBoundingClientRect()

      const moveResult = dispatchMoveEvent({
        to: targetContainer || undefined,
        from: targetElement.value || undefined,
        item: state.dragElement.value || undefined,
        dragged: state.dragElement.value || undefined,
        draggedRect: dragRect,
        related: targetContainer,
        relatedRect: containerRect,
        willInsertAfter: true,
        originalEvent: evt,
      }, evt)

      if (moveResult !== false) {
        performEmptyContainerInsertion(targetContainer)
      }
      return
    }

    // Check for boundary insertion when no specific draggable target is found
    // But ONLY if the pointer is within the container bounds
    if (!draggableTarget && targetContainer) {
      // First check if the pointer is actually within the container bounds
      const containerRect = targetContainer.getBoundingClientRect()
      const isWithinContainer = (
        evt.clientX >= containerRect.left
        && evt.clientX <= containerRect.right
        && evt.clientY >= containerRect.top
        && evt.clientY <= containerRect.bottom
      )

      // Only handle boundary insertion if pointer is within container bounds
      if (isWithinContainer) {
        const boundaryInsertion = detectContainerBoundaryInsertion(
          { clientX: evt.clientX, clientY: evt.clientY },
          targetContainer,
        )

        if (boundaryInsertion) {
          if (boundaryInsertion.nearestElement && boundaryInsertion.position !== undefined) {
            const moveResult = dispatchMoveEvent({
              to: targetContainer || undefined,
              from: targetElement.value || undefined,
              item: state.dragElement.value || undefined,
              dragged: state.dragElement.value || undefined,
              draggedRect: state.dragElement.value?.getBoundingClientRect(),
              related: boundaryInsertion.nearestElement,
              relatedRect: boundaryInsertion.nearestElement.getBoundingClientRect(),
              willInsertAfter: boundaryInsertion.position > 0,
              originalEvent: evt,
            }, evt)

            if (moveResult !== false) {
              if (targetContainer === targetElement.value) {
                performInsertion(boundaryInsertion.nearestElement, boundaryInsertion.position)
              }
              else {
                performCrossListInsertion(boundaryInsertion.nearestElement, boundaryInsertion.position, targetContainer)
              }
            }
            return
          }

          const dragRect = state.dragElement.value?.getBoundingClientRect()

          const moveResult = dispatchMoveEvent({
            to: targetContainer || undefined,
            from: targetElement.value || undefined,
            item: state.dragElement.value || undefined,
            dragged: state.dragElement.value || undefined,
            draggedRect: dragRect,
            related: targetContainer,
            relatedRect: containerRect,
            willInsertAfter: boundaryInsertion.insertAtEnd,
            originalEvent: evt,
          }, evt)

          if (moveResult !== false) {
            if (targetContainer === targetElement.value) {
              performBoundaryInsertion(targetContainer, boundaryInsertion.insertAtEnd, boundaryInsertion.insertAtStart)
            }
            else {
              performCrossListBoundaryInsertion(targetContainer, boundaryInsertion.insertAtEnd, boundaryInsertion.insertAtStart)
            }
          }
          return
        }
      }
    }

    if (!draggableTarget || draggableTarget === state.dragElement.value) {
      if (onAnimationTrigger) {
        onAnimationTrigger()
      }
      return
    }

    // Calculate insertion position
    const insertPosition = calculateInsertPosition(
      { clientX: evt.clientX, clientY: evt.clientY },
      draggableTarget,
    )

    if (insertPosition !== 0) {
      // Dispatch move event before performing insertion
      const targetRect = draggableTarget.getBoundingClientRect()
      const dragRect = state.dragElement.value?.getBoundingClientRect()

      const moveResult = dispatchMoveEvent({
        to: targetContainer || undefined,
        from: targetElement.value || undefined,
        item: state.dragElement.value || undefined,
        dragged: state.dragElement.value || undefined,
        draggedRect: dragRect,
        related: draggableTarget,
        relatedRect: targetRect,
        willInsertAfter: insertPosition === 1,
        originalEvent: evt,
      }, evt)

      // Only perform insertion if move event wasn't cancelled
      if (moveResult !== false) {
        // Check if this is a cross-list operation and verify permissions
        if (targetContainer && targetContainer !== targetElement.value) {
          // Cross-list operation - use performCrossListInsertion which has permission checks
          performCrossListInsertion(draggableTarget, insertPosition, targetContainer)
        }
        else {
          // Same container operation - use performInsertion which handles animation properly
          performInsertion(draggableTarget, insertPosition)
        }
      }
    }
  }

  /**
   * Emulate drag over events for fallback mode
   */
  const emulateDragOver = (): void => {
    const touch = currentTouchEvent.value
    if (!touch)
      return

    // Hide ghost element temporarily to get accurate elementFromPoint
    const ghostElement = state.ghostElement.value
    let ghostDisplay = ''
    if (ghostElement && !supportCssPointerEvents.value) {
      ghostDisplay = ghostElement.style.display
      ghostElement.style.display = 'none'
    }

    // Get target element under current touch position
    let target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null

    handleAutoScroll(touch as MouseEvent)

    // Handle shadow DOM
    while (target && target.shadowRoot) {
      const shadowTarget = target.shadowRoot.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement
      if (shadowTarget === target)
        break
      target = shadowTarget
    }

    // Restore ghost element display
    if (ghostElement && !supportCssPointerEvents.value) {
      ghostElement.style.display = ghostDisplay
    }

    if (!target)
      return

    // Find the actual container under the cursor first
    let targetContainer = findSortableContainer(target) || targetElement.value
    let draggableTarget = findDraggableTarget(target)
    let isEmptyTarget = false

    // Check for cross-list drag if target container is different from source
    if (targetContainer && targetContainer !== targetElement.value) {
      // Check if cross-list drop is allowed
      const dropResult = globalGroupManager.canAcceptDrop(
        targetElement.value!,
        targetContainer,
        state.dragElement.value!,
      )

      if (dropResult.allowed) {
        draggableTarget = findCrossListDraggableTarget(target, targetContainer)

        // Update putSortable state
        state._updatePutSortable(targetContainer)

        let pullMode: boolean | 'clone' | null = null
        if (dropResult.pullMode === true || dropResult.pullMode === false) {
          pullMode = dropResult.pullMode
        }
        else if (dropResult.pullMode === 'clone') {
          pullMode = 'clone'
        }
        else if (typeof dropResult.pullMode === 'function') {
          pullMode = dropResult.pullMode(
            targetContainer,
            targetElement.value!,
            state.dragElement.value!,
            undefined,
          )
        }
        state._setLastPutMode(pullMode)

        // If still no draggable target, check for empty container
        if (!draggableTarget && isEmptyContainerTarget(target, targetContainer)) {
          isEmptyTarget = true
        }
      }
      else {
        // If drop is not allowed, revert to source container
        targetContainer = targetElement.value
      }
    }

    // Set isOwner and revert states
    const currentActiveGroup = state.activeGroup.value
    const targetGroup = targetContainer?.getAttribute('data-sortable-group') || null
    const isOwner = currentActiveGroup === targetGroup
    const revert = targetContainer === state.rootEl.value && !!state.putSortable.value

    state._setIsOwner(isOwner)
    state._setRevert(revert)

    // Handle revert case first
    if (revert) {
      const reverted = handleRevert()
      if (reverted) {
        state._setPutSortable(null)
        if (onAnimationTrigger) {
          onAnimationTrigger()
        }
        return
      }
    }

    // Clone element management: if isOwner, hide clone; else show clone
    if (state.lastPutMode.value === 'clone' && state.cloneEl.value) {
      if (isOwner) {
        // When in owner container, hide clone
        hideClone()
      }
      else {
        // When in different container, show clone
        showClone()
      }
    }

    // Handle empty container insertion
    if (isEmptyTarget && targetContainer) {
      // Dispatch move event for empty container
      const containerRect = targetContainer.getBoundingClientRect()
      const dragRect = state.dragElement.value?.getBoundingClientRect()

      const moveResult = dispatchMoveEvent({
        to: targetContainer || undefined,
        from: targetElement.value || undefined,
        item: state.dragElement.value || undefined,
        dragged: state.dragElement.value || undefined,
        draggedRect: dragRect,
        related: targetContainer,
        relatedRect: containerRect,
        willInsertAfter: true,
        originalEvent: undefined,
      })

      if (moveResult !== false) {
        performEmptyContainerInsertion(targetContainer)
      }
      return
    }

    // Check for boundary insertion when no specific draggable target is found
    // But ONLY if the pointer is within the container bounds
    if (!draggableTarget && targetContainer) {
      // First check if the pointer is actually within the container bounds
      const containerRect = targetContainer.getBoundingClientRect()
      const isWithinContainer = (
        touch.clientX >= containerRect.left
        && touch.clientX <= containerRect.right
        && touch.clientY >= containerRect.top
        && touch.clientY <= containerRect.bottom
      )

      // Only handle boundary insertion if pointer is within container bounds
      if (isWithinContainer) {
        const boundaryInsertion = detectContainerBoundaryInsertion(
          { clientX: touch.clientX, clientY: touch.clientY },
          targetContainer,
        )

        if (boundaryInsertion) {
          if (boundaryInsertion.nearestElement && boundaryInsertion.position !== undefined) {
            const moveResult = dispatchMoveEvent({
              to: targetContainer || undefined,
              from: targetElement.value || undefined,
              item: state.dragElement.value || undefined,
              dragged: state.dragElement.value || undefined,
              draggedRect: state.dragElement.value?.getBoundingClientRect(),
              related: boundaryInsertion.nearestElement,
              relatedRect: boundaryInsertion.nearestElement.getBoundingClientRect(),
              willInsertAfter: boundaryInsertion.position > 0,
              originalEvent: undefined,
            })

            if (moveResult !== false) {
              if (targetContainer === targetElement.value) {
                performInsertion(boundaryInsertion.nearestElement, boundaryInsertion.position)
              }
              else {
                performCrossListInsertion(boundaryInsertion.nearestElement, boundaryInsertion.position, targetContainer)
              }
            }
            return
          }

          const dragRect = state.dragElement.value?.getBoundingClientRect()

          const moveResult = dispatchMoveEvent({
            to: targetContainer || undefined,
            from: targetElement.value || undefined,
            item: state.dragElement.value || undefined,
            dragged: state.dragElement.value || undefined,
            draggedRect: dragRect,
            related: targetContainer,
            relatedRect: containerRect,
            willInsertAfter: boundaryInsertion.insertAtEnd,
            originalEvent: undefined,
          })

          if (moveResult !== false) {
            if (targetContainer === targetElement.value) {
              performBoundaryInsertion(targetContainer, boundaryInsertion.insertAtEnd, boundaryInsertion.insertAtStart)
            }
            else {
              performCrossListBoundaryInsertion(targetContainer, boundaryInsertion.insertAtEnd, boundaryInsertion.insertAtStart)
            }
          }
          return
        }
      }
    }

    if (!draggableTarget || draggableTarget === state.dragElement.value) {
      return
    }

    // Calculate insertion position
    const insertPosition = calculateInsertPosition(
      { clientX: touch.clientX, clientY: touch.clientY },
      draggableTarget,
    )

    if (insertPosition !== 0) {
      // Dispatch move event before performing insertion
      const targetRect = draggableTarget.getBoundingClientRect()
      const dragRect = state.dragElement.value?.getBoundingClientRect()

      const moveResult = dispatchMoveEvent({
        to: targetContainer || undefined,
        from: targetElement.value || undefined,
        item: state.dragElement.value || undefined,
        dragged: state.dragElement.value || undefined,
        draggedRect: dragRect,
        related: draggableTarget,
        relatedRect: targetRect,
        willInsertAfter: insertPosition === 1,
        originalEvent: undefined, // No original event in emulated drag over
      })

      // Only perform insertion if move event wasn't cancelled
      if (moveResult !== false) {
        if (targetContainer === targetElement.value) {
          performInsertion(draggableTarget, insertPosition)
        }
        else {
          performCrossListInsertion(draggableTarget, insertPosition, targetContainer)
        }
      }
    }
  }

  /**
   * Start the actual drag operation
   */
  function startDragOperation(evt: Event) {
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
   * Handle drag move events (fallback mode only)
   */
  function handleDragMove(evt: MouseEvent | TouchEvent) {
    const touch = 'touches' in evt ? evt.touches[0] : evt
    if (touch) {
      currentTouchEvent.value = touch
    }

    // Check if we need to start dragging when not yet dragging
    if (!state.isDragging.value && state.dragElement.value && !awaitingDragStarted.value) {
      const currentFallbackTolerance = toValue(fallbackTolerance)

      // Check fallback tolerance
      if (currentFallbackTolerance && Math.max(
        Math.abs(touch.clientX - lastX.value),
        Math.abs(touch.clientY - lastY.value),
      ) < currentFallbackTolerance) {
        return
      }

      startDragOperation(evt)
      return
    }

    // If we're not dragging yet, return early
    if (!state.isDragging.value || !state.dragElement.value)
      return

    const ghostElement = state.ghostElement.value
    if (ghostElement && isUsingFallback.value) {
      updateGhostPosition(ghostElement, evt)
    }

    // This prevents premature event cancellation that could limit touch drag range
    if (evt.cancelable) {
      evt.preventDefault()
    }

    // Get current mouse/touch position
    const clientX = touch.clientX
    const clientY = touch.clientY

    // Find target element under cursor
    const target = getElementFromPoint(clientX, clientY)
    if (!target)
      return

    // Find the actual container under the cursor first
    let targetContainer = findSortableContainer(target) || targetElement.value
    let draggableTarget = findDraggableTarget(target)
    let isEmptyTarget = false

    // Check for cross-list drag if target container is different from source
    if (targetContainer && targetContainer !== targetElement.value) {
      // Check if cross-list drop is allowed
      const dropResult = globalGroupManager.canAcceptDrop(
        targetElement.value!,
        targetContainer,
        state.dragElement.value!,
        evt,
      )

      if (dropResult.allowed) {
        draggableTarget = findCrossListDraggableTarget(target, targetContainer)

        // Update putSortable state
        state._updatePutSortable(targetContainer)

        let pullMode: boolean | 'clone' | null = null
        if (dropResult.pullMode === true || dropResult.pullMode === false) {
          pullMode = dropResult.pullMode
        }
        else if (dropResult.pullMode === 'clone') {
          pullMode = 'clone'
        }
        else if (typeof dropResult.pullMode === 'function') {
          pullMode = dropResult.pullMode(
            targetContainer,
            targetElement.value!,
            state.dragElement.value!,
            evt,
          )
        }
        state._setLastPutMode(pullMode)

        // If still no draggable target, check for empty container
        if (!draggableTarget && isEmptyContainerTarget(target, targetContainer)) {
          isEmptyTarget = true
        }
      }
      else {
        // If drop is not allowed, revert to source container
        targetContainer = targetElement.value
      }
    }

    // Set isOwner and revert states
    const currentActiveGroup = state.activeGroup.value
    const targetGroup = targetContainer?.getAttribute('data-sortable-group') || null
    const isOwner = currentActiveGroup === targetGroup
    const revert = targetContainer === state.rootEl.value && !!state.putSortable.value

    state._setIsOwner(isOwner)
    state._setRevert(revert)

    // Handle revert case first
    if (revert) {
      const reverted = handleRevert()
      if (reverted) {
        state._setPutSortable(null)
        if (onAnimationTrigger) {
          onAnimationTrigger()
        }
        return
      }
    }

    // Clone element management: if isOwner, hide clone; else show clone
    if (state.lastPutMode.value === 'clone' && state.cloneEl.value) {
      if (isOwner) {
        // When in owner container, hide clone
        hideClone()
      }
      else {
        // When in different container, show clone
        showClone()
      }
    }

    // Handle empty container insertion
    if (isEmptyTarget && targetContainer) {
      // Dispatch move event for empty container
      const containerRect = targetContainer.getBoundingClientRect()
      const dragRect = state.dragElement.value?.getBoundingClientRect()

      const moveResult = dispatchMoveEvent({
        to: targetContainer || undefined,
        from: targetElement.value || undefined,
        item: state.dragElement.value || undefined,
        dragged: state.dragElement.value || undefined,
        draggedRect: dragRect,
        related: targetContainer,
        relatedRect: containerRect,
        willInsertAfter: true,
        originalEvent: evt,
      }, evt)

      if (moveResult !== false) {
        performEmptyContainerInsertion(targetContainer)
      }
      return
    }

    // Check for boundary insertion when no specific draggable target is found
    // But ONLY if the pointer is within the container bounds
    if (!draggableTarget && targetContainer) {
      // First check if the pointer is actually within the container bounds
      const containerRect = targetContainer.getBoundingClientRect()
      const isWithinContainer = (
        clientX >= containerRect.left
        && clientX <= containerRect.right
        && clientY >= containerRect.top
        && clientY <= containerRect.bottom
      )

      // Only handle boundary insertion if pointer is within container bounds
      if (isWithinContainer) {
        const boundaryInsertion = detectContainerBoundaryInsertion(
          { clientX, clientY },
          targetContainer,
        )

        if (boundaryInsertion) {
          // Dispatch move event for boundary insertion
          const dragRect = state.dragElement.value?.getBoundingClientRect()

          const moveResult = dispatchMoveEvent({
            to: targetContainer || undefined,
            from: targetElement.value || undefined,
            item: state.dragElement.value || undefined,
            dragged: state.dragElement.value || undefined,
            draggedRect: dragRect,
            related: targetContainer,
            relatedRect: containerRect,
            willInsertAfter: boundaryInsertion.insertAtEnd,
            originalEvent: evt,
          }, evt)

          if (moveResult !== false) {
            if (targetContainer === targetElement.value) {
              performBoundaryInsertion(targetContainer, boundaryInsertion.insertAtEnd, boundaryInsertion.insertAtStart)
            }
            else {
              performCrossListBoundaryInsertion(targetContainer, boundaryInsertion.insertAtEnd, boundaryInsertion.insertAtStart)
            }
          }
          return
        }
      }
    }

    if (!draggableTarget || draggableTarget === state.dragElement.value)
      return

    // Calculate insertion position
    const insertPosition = calculateInsertPosition(
      { clientX, clientY },
      draggableTarget,
    )

    if (insertPosition !== 0) {
      // Dispatch move event before performing insertion
      const targetRect = draggableTarget.getBoundingClientRect()
      const dragRect = state.dragElement.value?.getBoundingClientRect()

      const moveResult = dispatchMoveEvent({
        to: targetContainer || undefined,
        from: targetElement.value || undefined,
        item: state.dragElement.value || undefined,
        dragged: state.dragElement.value || undefined,
        draggedRect: dragRect,
        related: draggableTarget,
        relatedRect: targetRect,
        willInsertAfter: insertPosition === 1,
        originalEvent: evt,
      }, evt)

      // Only perform insertion if move event wasn't cancelled
      if (moveResult !== false) {
        // Check if this is a cross-list operation and verify permissions
        if (targetContainer && targetContainer !== targetElement.value) {
          // Cross-list operation - use performCrossListInsertion which has permission checks
          performCrossListInsertion(draggableTarget, insertPosition, targetContainer)
        }
        else {
          // Same container operation - use performInsertion which handles animation properly
          performInsertion(draggableTarget, insertPosition)
        }
      }
    }
  }

  /**
   * Detect if element was spilled (dropped outside valid containers)
   */
  function detectSpill(evt: MouseEvent | TouchEvent | DragEvent, _dragElement: HTMLElement): boolean {
    if (!evt)
      return false

    // Get the touch/mouse position from the event
    const touch = 'changedTouches' in evt && evt.changedTouches && evt.changedTouches.length
      ? evt.changedTouches[0]
      : evt as MouseEvent

    if (!touch || typeof touch.clientX !== 'number' || typeof touch.clientY !== 'number') {
      return false
    }

    // Temporarily hide ghost element to get accurate elementFromPoint result
    const ghost = state.ghostElement.value
    let ghostDisplay: string | undefined
    if (ghost && !supportCssPointerEvents.value) {
      ghostDisplay = ghost.style.display
      ghost.style.display = 'none'
    }

    // Get element at the drop position
    const target = document.elementFromPoint(touch.clientX, touch.clientY)

    // Restore ghost element visibility (unhideGhostForTarget)
    if (ghost && !supportCssPointerEvents.value && ghostDisplay !== undefined) {
      ghost.style.display = ghostDisplay
    }

    if (!target) {
      return true // No target found, consider it spilled
    }

    // Check if target is within any valid sortable container
    const targetSortable = state.putSortable.value || targetElement.value

    // Only consider it spilled if the target is not within the active sortable container
    if (!targetSortable || !targetSortable.contains(target)) {
      return true // Target is not within a valid container - spilled
    }

    return false // Target is within a valid container - not spilled
  }

  /**
   * Handle spill event - revert or remove element based on options
   */
  function handleSpill(evt: MouseEvent | TouchEvent | DragEvent, dragElement: HTMLElement): boolean {
    const currentRevertOnSpill = toValue(revertOnSpill)
    const currentRemoveOnSpill = toValue(removeOnSpill)

    // Skip if neither option is enabled
    if (!currentRevertOnSpill && !currentRemoveOnSpill) {
      return false
    }

    if (currentRevertOnSpill) {
      const originalParent = state.parentEl.value
      const originalNextSibling = state.nextEl.value

      if (originalParent) {
        // Capture animation state before reverting
        if (onAnimationCapture) {
          onAnimationCapture()
        }

        // Revert element to original position
        if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
          originalParent.insertBefore(dragElement, originalNextSibling)
        }
        else {
          originalParent.appendChild(dragElement)
        }

        // Trigger animation after reverting
        if (onAnimationTrigger) {
          onAnimationTrigger()
        }

        // Dispatch revert event
        dispatchEvent('revert', {
          item: dragElement,
          oldIndex: startIndex.value,
          newIndex: getElementIndex(dragElement),
          from: state.putSortable.value || originalParent,
          to: originalParent,
          originalEvent: evt,
        })

        return true // Spill was handled by reverting
      }
    }
    // Handle remove on spill (only if revert isn't enabled)
    else if (currentRemoveOnSpill) {
      const parentElement = dragElement.parentElement
      if (parentElement) {
        // Capture animation state before removing
        if (onAnimationCapture) {
          onAnimationCapture()
        }

        // Get final index before removal for event
        const finalIndex = getElementIndex(dragElement)

        // Remove element from DOM
        parentElement.removeChild(dragElement)

        // Trigger animation after removing
        if (onAnimationTrigger) {
          onAnimationTrigger()
        }

        // Dispatch remove event
        dispatchEvent('remove', {
          item: dragElement,
          oldIndex: startIndex.value,
          newIndex: finalIndex,
          from: parentElement,
          originalEvent: evt,
        })

        return true // Spill was handled by removing
      }
    }

    return false // Spill was not handled
  }

  /**
   * Handle drag end events
   */
  function handleDragEnd(evt: MouseEvent | TouchEvent | DragEvent) {
    stopAutoScroll()

    if (!state.isDragging.value && !state.dragElement.value)
      return

    const dragElement = state.dragElement.value

    // Clear clone state debouncing timeout
    if (cloneStateTimeout.value) {
      clearTimeout(cloneStateTimeout.value)
      cloneStateTimeout.value = null
    }
    lastCloneAction.value = null

    state._setDragging(false)
    state._setIsActive(false)

    // Clean up global touch move listener when drag ends
    cleanupGlobalTouchMoveListener()

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

      const originalParent = state.parentEl.value // This was set when drag started
      const currentParent = dragElement.parentElement // Where element is now
      const isCloneMode = state.lastPutMode.value === 'clone'

      // Check if this was a cross-list drag by comparing original and current parents
      const wasCrossListDrag = originalParent !== currentParent && originalParent && currentParent

      // In clone mode, handle the cloning process
      if (isCloneMode && wasCrossListDrag && originalParent && currentParent) {
        // Get the position where the original element currently is (this is where the clone should go)
        const clonePosition = getElementIndex(dragElement)

        // Create the actual clone element
        const cloneElement = dragElement.cloneNode(true) as HTMLElement
        cloneElement.removeAttribute('id')

        // Move the original element back to its original position
        const originalNextSibling = state.nextEl.value
        if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
          originalParent.insertBefore(dragElement, originalNextSibling)
        }
        else {
          originalParent.appendChild(dragElement)
        }

        // Insert the clone at the target position
        const targetChildren = Array.from(currentParent.children) as HTMLElement[]
        if (clonePosition < targetChildren.length) {
          currentParent.insertBefore(cloneElement, targetChildren[clonePosition])
        }
        else {
          currentParent.appendChild(cloneElement)
        }

        // Dispatch add event for the clone
        dispatchEvent('add', {
          item: cloneElement,
          from: originalParent,
          to: currentParent,
          oldIndex: startIndex.value,
          newIndex: getElementIndex(cloneElement),
          clone: cloneElement,
          pullMode: 'clone',
        })

        // Dispatch clone event
        dispatchEvent('clone', {
          item: cloneElement,
          clone: cloneElement,
          from: originalParent,
          to: currentParent,
          oldIndex: startIndex.value,
          oldDraggableIndex: startIndex.value,
        })

        // Update parentEl state to reflect the restored position
        state._setParentEl(originalParent)
      }
      else {
        // For non-clone mode, update parentEl state to reflect final position
        const finalParentEl = dragElement.parentElement
        if (finalParentEl) {
          state._setParentEl(finalParentEl)
        }
      }

      // Calculate final index based on current position
      const newIndex = getElementIndex(dragElement)

      // Check for spill before dispatching events - only at drop time, not during drag
      // Only checks for spill on drop
      const isSpilled = detectSpill(evt, dragElement)
      if (isSpilled) {
        // Dispatch spill event before handling
        dispatchEvent('spill', {
          item: dragElement,
          oldIndex: startIndex.value,
          newIndex: -1, // Element was spilled
          originalEvent: evt,
        })

        const spillHandled = handleSpill(evt, dragElement)
        if (spillHandled) {
          // Spill was handled (element reverted or removed), skip normal event dispatching
          // Remove ghost and reset state
          removeGhost()
          resetDragState()
          return
        }
      }

      // Dispatch cross-list events if needed (but not for clone mode since original element didn't move)
      if (wasCrossListDrag && newIndex >= 0 && !isCloneMode) {
        // Dispatch add event for target container first
        dispatchEvent('add', {
          item: dragElement,
          from: originalParent,
          to: currentParent,
          oldIndex: startIndex.value,
          newIndex,
          clone: state.cloneEl.value || undefined,
          pullMode: state.lastPutMode.value || undefined,
        })

        // Dispatch remove event for source container
        dispatchEvent('remove', {
          item: dragElement,
          from: originalParent,
          to: currentParent,
          oldIndex: startIndex.value,
          newIndex: -1, // Element removed from source
          clone: state.cloneEl.value || undefined,
          pullMode: state.lastPutMode.value || undefined,
        })

        // Dispatch sort events for both containers
        // Target container sort event
        dispatchEvent('sort', {
          item: dragElement,
          from: originalParent,
          to: currentParent,
          oldIndex: startIndex.value,
          newIndex,
          clone: state.cloneEl.value || undefined,
          pullMode: state.lastPutMode.value || undefined,
        })

        // Source container sort event
        dispatchEvent('sort', {
          item: dragElement,
          from: originalParent,
          to: currentParent,
          oldIndex: startIndex.value,
          newIndex: -1,
          clone: state.cloneEl.value || undefined,
          pullMode: state.lastPutMode.value || undefined,
        })
      }

      // For same-container drags or clone mode, dispatch update event if position changed
      if (!wasCrossListDrag || isCloneMode) {
        if (currentParent && newIndex !== startIndex.value) {
          // Dispatch update event for same-container reordering
          dispatchEvent('update', {
            item: dragElement,
            oldIndex: startIndex.value,
            newIndex,
          })

          // Dispatch sort event for same-container reordering
          dispatchEvent('sort', {
            item: dragElement,
            from: currentParent,
            to: currentParent,
            oldIndex: startIndex.value,
            newIndex,
            clone: state.cloneEl.value || undefined,
            pullMode: state.lastPutMode.value || undefined,
          })
        }
      }

      dispatchEvent('end', {
        item: dragElement,
        oldIndex: startIndex.value,
        newIndex,
      })

      // Dispatch unchoose event when drag ends
      dispatchEvent('unchoose', {
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
  function handleNativeDragStart(evt: DragEvent) {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    // Now we're actually dragging
    state._setDragging(true)
    // Set current index when drag actually starts
    state._setCurrentIndex(startIndex.value)

    state._setIsActive(true)

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
    const cleanup = useEventListener(document, 'dragover', handleDocumentDragOver)

    dragCleanupFunctions.value.push(cleanup)
  }

  /**
   * Setup global touch move event listener to prevent touch drag range limitation
   */
  function setupGlobalTouchMoveListener() {
    if (globalTouchMoveCleanup.value) {
      return
    }

    const handleGlobalTouchMove = (evt: TouchEvent) => {
      if ((state.isDragging.value || awaitingDragStarted.value) && evt.cancelable) {
        evt.preventDefault()
      }
    }

    globalTouchMoveCleanup.value = useEventListener(document, 'touchmove', handleGlobalTouchMove, { passive: false })
  }

  /**
   * Setup listeners for fallback drag events
   */
  function setupFallbackDragListeners() {
    const onMouseMove = handleDragMove
    const onMouseUp = handleDragEnd
    const onTouchMove = handleDragMove
    const onTouchEnd = handleDragEnd

    // Set up global touch move listener for proper touch drag support
    setupGlobalTouchMoveListener()

    if (supportPointer.value) {
      // Use pointer events for unified handling
      const pointerMoveEvent = useEventListener(document, 'pointermove', onMouseMove, { passive: false })
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
  function setupNativeDragListeners() {
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
   * Start fallback mode for drag operation
   */
  function startFallbackMode(dragEl: HTMLElement, tapEvent: { clientX: number, clientY: number }): void {
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
    loopTimer.value = setInterval(emulateDragOver, 50)
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
    // This ensures the ghost rotates/scales around the click point
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
  function handleFallbackDragStart(_evt: Event) {
    const dragElement = state.dragElement.value
    if (!dragElement)
      return

    // Set dragging state
    state._setDragging(true)
    state._setFallbackActive(true)
    // Set current index when drag actually starts
    state._setCurrentIndex(startIndex.value)

    state._setIsActive(true)

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
   * Handle delayed drag touch move for threshold detection
   */
  function handleDelayedDragTouchMove(evt: TouchEvent | PointerEvent | MouseEvent) {
    const touch = 'touches' in evt ? evt.touches[0] : evt
    if (!touch)
      return

    // Use computed threshold for more accurate detection
    const threshold = dragStartThreshold.value

    if (Math.max(
      Math.abs(touch.clientX - lastX.value),
      Math.abs(touch.clientY - lastY.value),
    ) >= threshold) {
      // When threshold is exceeded, cancel the delayed drag
      disableDelayedDrag(false)
    }
  }

  /**
   * Create clone element
   * @param dragElement - The element to clone
   */
  const createCloneElement = (dragElement: HTMLElement) => {
    const cloneElement = dragElement.cloneNode(true) as HTMLElement

    cloneElement.removeAttribute('id')
    cloneElement.draggable = false
    cloneElement.style.willChange = ''

    // Set clone element in state
    state._setCloneEl(cloneElement)

    hideClone()

    const currentChosenClass = toValue(chosenClass)
    if (currentChosenClass) {
      cloneElement.classList.remove(currentChosenClass)
    }

    // Insert clone into DOM but keep it hidden
    setTimeout(() => {
      const rootEl = state.rootEl.value
      const nextEl = state.nextEl.value
      if (rootEl && cloneElement && state.lastPutMode.value === 'clone') {
        // Insert clone at original position using nextEl, not current dragElement position
        if (nextEl && nextEl.parentNode === rootEl) {
          rootEl.insertBefore(cloneElement, nextEl)
        }
        else {
          rootEl.appendChild(cloneElement)
        }
        hideClone() // Ensure it stays hidden
      }
    }, 0)
  }

  /**
   * Prepare to start dragging
   */
  const prepareDragStart = (evt: Event, dragElement: HTMLElement) => {
    if (!state._canPerformOperation('startDrag')) {
      return
    }

    // Check pull permission before starting drag
    const sourceContainer = targetElement.value
    if (sourceContainer) {
      const sourceGroup = globalGroupManager.findTargetGroup(sourceContainer)
      if (sourceGroup && sourceGroup.pull === false) {
        // Pull is disabled for this container - prevent drag start
        return
      }
    }

    // Set drag element (this automatically sets parentEl and nextEl in useSortableState)
    state._setDragElement(dragElement)
    startIndex.value = getElementIndex(dragElement)

    // Set root element (current sortable container)
    state._setRootEl(targetElement.value)

    // Set active group from options and determine initial lastPutMode
    const currentGroup = toValue(options).group
    if (typeof currentGroup === 'string') {
      state._setActiveGroup(currentGroup)
      // For string groups, default pull mode is true
      state._setLastPutMode(true)
    }
    else if (currentGroup && typeof currentGroup === 'object') {
      // Handle both direct SortableGroup object and Ref<SortableGroup>
      const groupValue = toValue(currentGroup)
      if (typeof groupValue === 'string') {
        state._setActiveGroup(groupValue)
        state._setLastPutMode(true)
      }
      else if (groupValue && typeof groupValue === 'object' && 'name' in groupValue) {
        state._setActiveGroup(groupValue.name || null)
        // Set lastPutMode based on pull configuration
        const pullMode = groupValue.pull
        if (pullMode === 'clone') {
          state._setLastPutMode('clone')
        }
        else if (pullMode === true || pullMode === false) {
          state._setLastPutMode(pullMode)
        }
        else if (typeof pullMode === 'function') {
          // For function pull modes, we'll evaluate them later during cross-list operations
          state._setLastPutMode(true) // Default to true for now
        }
        else {
          state._setLastPutMode(true) // Default
        }
      }
    }
    else {
      // No group specified, default to true
      state._setLastPutMode(true)
    }

    // Mark this sortable instance as active
    state._setIsActive(true)

    // Set initial isOwner to true (dragging within same container initially)
    state._setIsOwner(true)

    // Create clone element
    createCloneElement(dragElement)

    // Record initial tap/click position for fallback mode
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

    // Dispatch choose event immediately when element is chosen
    dispatchEvent('choose', {
      item: dragElement,
      oldIndex: startIndex.value,
      originalEvent: evt,
    })

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
        const pointerMoveEvent = useEventListener(document, 'pointermove', handleDelayedDragTouchMove, { passive: false })
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
      const pointerDownEvent = useEventListener(el, 'pointerdown', handlePointerStart, { passive: false })
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
    stopAutoScroll()

    // Clean up all event listeners (both base and drag-specific)
    cleanupFunctions.value.forEach(cleanup => cleanup())
    cleanupFunctions.value = []

    dragCleanupFunctions.value.forEach(cleanup => cleanup())
    dragCleanupFunctions.value = []

    // Clean up global touch move listener
    cleanupGlobalTouchMoveListener()

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
      if (newTarget) {
        initialize()
      }
    }
  }, { immediate: true, flush: 'sync' })

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
