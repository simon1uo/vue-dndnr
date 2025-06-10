import type { SortableEvent, SortableEventCallbacks, SortableEventData, SortableEventType, SortableOptions } from '@/types'
import {
  createGhostElement,
  findDraggableElement,
  getDraggableChildren,
  getElementIndex,
} from '@/utils/sortable-dom'
import { dispatchSortableEvent, getCallbackName, normalizeEventData } from '@/utils/sortable-event'
import { FallbackDragManager } from './fallback-drag-manager'

/**
 * Custom drag instance class.
 * Handles the low-level drag and drop functionality.
 */
export class CustomDragInstance {
  private el: HTMLElement
  private options: SortableOptions & SortableEventCallbacks

  // Drag state
  private isDragging = false
  private dragElement: HTMLElement | null = null
  private ghostElement: HTMLElement | null = null
  private startIndex = -1

  // Fallback drag management
  private nativeDraggable: boolean
  private fallbackManager: FallbackDragManager
  private tapEvt?: { clientX: number, clientY: number }
  private currentTouchEvent?: { clientX: number, clientY: number }
  private isUsingFallback: boolean = false

  // Event listeners cleanup
  private cleanupFunctions: Array<() => void> = []

  /**
   * Create a new CustomDragInstance.
   *
   * @param el - Container element
   * @param options - Sortable options and callbacks
   */
  constructor(el: HTMLElement, options: SortableOptions & SortableEventCallbacks) {
    this.el = el
    this.options = { ...this.getDefaultOptions(), ...options }

    // Initialize fallback drag manager
    this.fallbackManager = new FallbackDragManager(el, this.options)
    this.nativeDraggable = !this.fallbackManager.shouldUseFallback()

    this.setupEventListeners()
  }

  /**
   * Update options for the drag instance.
   *
   * @param options - New options to merge
   */
  updateOptions(options: SortableOptions & SortableEventCallbacks): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Destroy the drag instance and clean up event listeners.
   */
  destroy(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.cleanupFunctions = []

    if (this.ghostElement) {
      this.removeGhost()
    }

    // Stop fallback mode if active
    this.fallbackManager.stopFallbackMode()

    this.resetDragState()
  }

  /**
   * Get default options.
   */
  private getDefaultOptions(): Partial<SortableOptions> {
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
    }
  }

  /**
   * Set up event listeners for drag operations.
   */
  private setupEventListeners(): void {
    // Mouse events
    const onMouseDown = this.handleMouseDown.bind(this)
    this.el.addEventListener('mousedown', onMouseDown)
    this.cleanupFunctions.push(() => {
      this.el.removeEventListener('mousedown', onMouseDown)
    })

    // Touch events for mobile support
    const onTouchStart = this.handleTouchStart.bind(this)
    this.el.addEventListener('touchstart', onTouchStart, { passive: false })
    this.cleanupFunctions.push(() => {
      this.el.removeEventListener('touchstart', onTouchStart)
    })

    // Native HTML5 drag events for native mode
    if (this.nativeDraggable) {
      const onDragOver = this.handleDragOver.bind(this)
      const onDragEnter = this.handleDragEnter.bind(this)

      this.el.addEventListener('dragover', onDragOver)
      this.el.addEventListener('dragenter', onDragEnter)

      this.cleanupFunctions.push(() => {
        this.el.removeEventListener('dragover', onDragOver)
        this.el.removeEventListener('dragenter', onDragEnter)
      })
    }
  }

  /**
   * Handle mouse down event to initiate drag.
   */
  private handleMouseDown(evt: MouseEvent): void {
    if (this.options.disabled || this.isDragging)
      return

    const target = evt.target as HTMLElement
    const draggableElement = this.findDraggableTarget(target)

    if (!draggableElement)
      return
    if (this.shouldFilterElement(evt, draggableElement, target))
      return
    if (this.options.handle && !this.isValidHandle(target))
      return

    this.prepareDragStart(evt, draggableElement)
  }

  /**
   * Handle touch start event for mobile drag.
   */
  private handleTouchStart(evt: TouchEvent): void {
    if (this.options.disabled || this.isDragging)
      return

    const target = evt.target as HTMLElement
    const draggableElement = this.findDraggableTarget(target)

    if (!draggableElement)
      return
    if (this.shouldFilterElement(evt, draggableElement, target))
      return
    if (this.options.handle && !this.isValidHandle(target))
      return

    this.prepareDragStart(evt, draggableElement)
  }

  /**
   * Find the draggable element from the event target.
   */
  private findDraggableTarget(target: HTMLElement): HTMLElement | null {
    return findDraggableElement(target, this.el, this.options.draggable || '> *')
  }

  /**
   * Check if element should be filtered (not draggable).
   */
  private shouldFilterElement(evt: Event, item: HTMLElement, target: HTMLElement): boolean {
    const filter = this.options.filter

    if (typeof filter === 'string') {
      if (target.matches(filter)) {
        this.dispatchEvent('filter', { item, related: target })
        if (this.options.preventOnFilter) {
          evt.preventDefault()
        }
        return true
      }
    }
    else if (typeof filter === 'function') {
      if (filter(evt, item, target)) {
        this.dispatchEvent('filter', { item, related: target })
        if (this.options.preventOnFilter) {
          evt.preventDefault()
        }
        return true
      }
    }

    return false
  }

  /**
   * Check if target is a valid drag handle.
   */
  private isValidHandle(target: HTMLElement): boolean {
    if (!this.options.handle)
      return true

    let current: HTMLElement | null = target
    while (current && current !== this.el) {
      if (current.matches(this.options.handle)) {
        return true
      }
      current = current.parentElement
    }

    return false
  }

  /**
   * Prepare to start dragging.
   */
  private prepareDragStart(evt: Event, dragElement: HTMLElement): void {
    this.dragElement = dragElement
    this.startIndex = getElementIndex(dragElement)

    // Record initial tap/click position for fallback mode
    if (evt instanceof MouseEvent) {
      this.tapEvt = { clientX: evt.clientX, clientY: evt.clientY }
    }
    else if (evt instanceof TouchEvent && evt.touches.length > 0) {
      const touch = evt.touches[0]
      this.tapEvt = { clientX: touch.clientX, clientY: touch.clientY }
    }

    // Add chosen class
    if (this.options.chosenClass) {
      dragElement.classList.add(this.options.chosenClass)
    }

    const isTouch = evt.type.startsWith('touch')
      || (evt instanceof PointerEvent && (evt as PointerEvent).pointerType === 'touch')

    if (this.nativeDraggable && !isTouch) {
      dragElement.draggable = true
    }

    // Set up drag start with delay if specified
    if (this.options.delay && this.options.delay > 0) {
      const isTouch = evt.type.startsWith('touch')
      if (!this.options.delayOnTouchOnly || isTouch) {
        setTimeout(() => {
          this.startDrag(evt)
        }, this.options.delay)
        return
      }
    }

    this.startDrag(evt)
  }

  /**
   * Start the actual drag operation.
   */
  private startDrag(evt: Event): void {
    if (!this.dragElement)
      return

    const isTouch = evt.type.startsWith('touch')
      || (evt instanceof PointerEvent && evt.pointerType === 'touch')

    const shouldUseFallback = !this.nativeDraggable || isTouch

    if (shouldUseFallback) {
      this.isUsingFallback = true

      this.setupFallbackDragListeners()

      // Start fallback mode manager
      if (this.tapEvt) {
        this.fallbackManager.startFallbackMode(this.dragElement, this.tapEvt)
      }

      this.handleFallbackDragStart(evt)
    }
    else {
      this.isUsingFallback = false

      this.setupNativeDragListeners()
    }
  }

  /**
   * Create ghost element for visual feedback.
   * Only creates ghost for fallback mode - native mode uses browser's built-in drag image.
   */
  private createGhost(): void {
    if (!this.dragElement)
      return

    // Only create custom ghost when using fallback mode
    if (!this.isUsingFallback) {
      return
    }

    const rect = this.dragElement.getBoundingClientRect()

    const tapDistance = this.tapEvt
      ? {
          left: this.tapEvt.clientX - rect.left,
          top: this.tapEvt.clientY - rect.top,
        }
      : { left: rect.width / 2, top: rect.height / 2 }

    // Prepare ghost element options for fallback mode
    const ghostOptions = {
      ghostClass: this.options.ghostClass || 'sortable-ghost',
      fallbackClass: this.options.fallbackClass || 'sortable-fallback',
      fallbackOnBody: this.options.fallbackOnBody || false,
      fallbackOffset: this.options.fallbackOffset || { x: 0, y: 0 },
      useFallback: true, // Always true for fallback mode
      nativeDraggable: false, // Always false for fallback mode
      tapDistance,
      // Pass initial position for proper ghost setup
      initialRect: rect,
    }

    this.ghostElement = createGhostElement(this.dragElement, ghostOptions)

    // Choose container for fallback mode
    const container = this.options.fallbackOnBody
      ? document.body
      : this.dragElement.parentNode

    // Insert ghost element for fallback mode
    if (container) {
      if (this.options.fallbackOnBody) {
        // For fallback mode with body container, append to body
        container.appendChild(this.ghostElement)
      }
      else {
        // For fallback mode with local container, insert after original element
        container.insertBefore(this.ghostElement, this.dragElement.nextSibling)
      }
    }

    // Set up ghost relative parent for absolute positioning
    this.fallbackManager.setGhostRelativeParent(this.ghostElement, container as HTMLElement)
  }

  /**
   * Remove ghost element.
   */
  private removeGhost(): void {
    if (this.ghostElement) {
      this.ghostElement.remove()
      this.ghostElement = null
    }
  }

  /**
   * Set up listeners for native HTML5 drag events.
   */
  private setupNativeDragListeners(): void {
    if (!this.dragElement)
      return

    const onDragEnd = this.handleDragEnd.bind(this)
    const onDragStart = this.handleNativeDragStart.bind(this)

    this.dragElement.addEventListener('dragend', onDragEnd)
    this.dragElement.addEventListener('dragstart', onDragStart)

    this.cleanupFunctions.push(() => {
      if (this.dragElement) {
        this.dragElement.removeEventListener('dragend', onDragEnd)
        this.dragElement.removeEventListener('dragstart', onDragStart)
      }
    })
  }

  /**
   * Set up listeners for fallback drag events.
   */
  private setupFallbackDragListeners(): void {
    const onMouseMove = this.handleDragMove.bind(this)
    const onMouseUp = this.handleDragEnd.bind(this)
    const onTouchMove = this.handleDragMove.bind(this)
    const onTouchEnd = this.handleDragEnd.bind(this)

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)

    // Store cleanup functions
    const cleanup = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }

    this.cleanupFunctions.push(cleanup)
  }

  /**
   * Handle fallback drag start.
   */
  private handleFallbackDragStart(_evt: Event): void {
    if (!this.dragElement)
      return

    // Set dragging state
    this.isDragging = true

    // Add drag class
    if (this.options.dragClass) {
      this.dragElement.classList.add(this.options.dragClass)
    }

    // Apply ghost class to original element
    if (this.options.ghostClass) {
      this.dragElement.classList.add(this.options.ghostClass)
    }

    // Create and append ghost element immediately
    this.createGhost()

    // Dispatch start event
    this.dispatchEvent('start', {
      item: this.dragElement,
      oldIndex: this.startIndex,
    })
  }

  /**
   * Handle native HTML5 dragstart event.
   */
  private handleNativeDragStart(evt: DragEvent): void {
    if (!this.dragElement)
      return

    // Now we're actually dragging
    this.isDragging = true

    // Set up data transfer for native drag
    if (evt.dataTransfer) {
      evt.dataTransfer.effectAllowed = 'move'

      // Set custom data if provided
      if (this.options.setData) {
        this.options.setData(evt.dataTransfer, this.dragElement)
      }
      else {
        // Default data transfer
        evt.dataTransfer.setData('text/plain', this.dragElement.textContent || '')
      }
    }

    // Apply drag class
    if (this.options.dragClass) {
      this.dragElement.classList.add(this.options.dragClass)
    }

    // Dispatch start event
    this.dispatchEvent('start', {
      item: this.dragElement,
      oldIndex: this.startIndex,
    })

    // Set up document-level dragover listener for native mode
    const onDocumentDragOver = this.handleDocumentDragOver.bind(this)
    document.addEventListener('dragover', onDocumentDragOver)

    this.cleanupFunctions.push(() => {
      document.removeEventListener('dragover', onDocumentDragOver)
    })
  }

  /**
   * Handle document-level dragover for native mode.
   */
  private handleDocumentDragOver(evt: DragEvent): void {
    if (!this.isDragging || !this.dragElement)
      return

    evt.preventDefault()

    // Find target element under cursor
    const target = this.getElementFromPoint(evt.clientX, evt.clientY)
    if (!target)
      return

    // Find the closest draggable element
    const draggableTarget = this.findDraggableTarget(target)
    if (!draggableTarget || draggableTarget === this.dragElement)
      return

    // Calculate insertion position
    const insertPosition = this.calculateInsertPosition(
      { clientX: evt.clientX, clientY: evt.clientY },
      draggableTarget,
    )

    if (insertPosition !== null) {
      this.performInsertion(draggableTarget, insertPosition)
    }
  }

  /**
   * Handle HTML5 dragover event on container.
   */
  private handleDragOver(evt: DragEvent): void {
    evt.preventDefault()
    evt.dataTransfer!.dropEffect = 'move'
  }

  /**
   * Handle HTML5 dragenter event on container.
   */
  private handleDragEnter(evt: DragEvent): void {
    evt.preventDefault()
  }

  /**
   * Handle drag move events (fallback mode only).
   */
  private handleDragMove(evt: MouseEvent | TouchEvent): void {
    if (!this.isDragging || !this.dragElement)
      return

    evt.preventDefault()

    const touch = 'touches' in evt ? evt.touches[0] : evt
    if (touch) {
      this.currentTouchEvent = touch
    }

    if (this.ghostElement && this.isUsingFallback) {
      this.fallbackManager.updateGhostPosition(this.ghostElement, evt)
    }

    // Get current mouse/touch position
    const clientX = touch.clientX
    const clientY = touch.clientY

    // Find target element under cursor
    const target = this.getElementFromPoint(clientX, clientY)
    if (!target)
      return

    // Find the closest draggable element
    const draggableTarget = this.findDraggableTarget(target)
    if (!draggableTarget || draggableTarget === this.dragElement)
      return

    // Calculate insertion position
    const insertPosition = this.calculateInsertPosition(
      { clientX, clientY },
      draggableTarget,
    )

    if (insertPosition !== null) {
      this.performInsertion(draggableTarget, insertPosition)
    }
  }

  /**
   * Handle drag end events.
   */
  private handleDragEnd(_evt: MouseEvent | TouchEvent | DragEvent): void {
    if (!this.isDragging || !this.dragElement)
      return

    this.isDragging = false

    // Stop fallback mode if active
    if (this.isUsingFallback) {
      this.fallbackManager.stopFallbackMode()
    }

    // Remove classes
    if (this.options.chosenClass) {
      this.dragElement.classList.remove(this.options.chosenClass)
    }
    if (this.options.dragClass) {
      this.dragElement.classList.remove(this.options.dragClass)
    }

    // Reset draggable attribute for native mode
    if (this.nativeDraggable) {
      this.dragElement.draggable = false
    }

    // Remove ghost
    this.removeGhost()

    // Calculate final index
    const newIndex = getElementIndex(this.dragElement)

    // Dispatch appropriate events
    if (newIndex !== this.startIndex) {
      this.dispatchEvent('update', {
        item: this.dragElement,
        oldIndex: this.startIndex,
        newIndex,
      })
    }

    this.dispatchEvent('end', {
      item: this.dragElement,
      oldIndex: this.startIndex,
      newIndex,
    })

    this.resetDragState()
  }

  /**
   * Dispatch a sortable event.
   */
  private dispatchEvent(eventType: SortableEventType, data: Partial<SortableEvent> = {}): void {
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
      to: this.el,
      from: this.el,
      item: this.dragElement!,
      oldIndex: this.startIndex,
      newIndex: this.startIndex,
      ...compatibleData,
    })

    // Get callback function
    const callbackName = getCallbackName(eventType) as keyof SortableEventCallbacks
    const callback = this.options[callbackName] as ((evt: SortableEvent) => void) | undefined

    // Dispatch event using the utility function
    dispatchSortableEvent(this.el, eventType, eventData, callback)
  }

  /**
   * Reset drag state to initial values.
   */
  private resetDragState(): void {
    this.isDragging = false
    this.dragElement = null
    this.startIndex = -1
    this.isUsingFallback = false

    // Clean up drag-specific listeners
    this.cleanupFunctions = this.cleanupFunctions.filter((cleanup, index) => {
      if (index >= this.cleanupFunctions.length - 1) {
        cleanup()
        return false
      }
      return true
    })
  }

  /**
   * Get element from point, handling touch events and shadow DOM.
   */
  private getElementFromPoint(clientX: number, clientY: number): HTMLElement | null {
    // Check if elementFromPoint is available (not in all test environments)
    if (typeof document.elementFromPoint !== 'function') {
      // Fallback for test environments - find element by position
      return this.findElementByPosition(clientX, clientY)
    }

    // Hide ghost element temporarily to get accurate elementFromPoint
    let ghostDisplay = ''
    if (this.ghostElement) {
      ghostDisplay = this.ghostElement.style.display
      this.ghostElement.style.display = 'none'
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
    if (this.ghostElement) {
      this.ghostElement.style.display = ghostDisplay
    }

    return target
  }

  /**
   * Fallback method to find element by position (for test environments).
   */
  private findElementByPosition(clientX: number, clientY: number): HTMLElement | null {
    const children = getDraggableChildren(this.el, this.options.draggable || '> *')

    for (const child of children) {
      if (child === this.dragElement)
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
   * Calculate insertion position based on mouse position and target element.
   * Returns 1 for after, -1 for before, null for no insertion.
   */
  private calculateInsertPosition(
    pointer: { clientX: number, clientY: number },
    target: HTMLElement,
  ): number | null {
    const targetRect = target.getBoundingClientRect()
    const vertical = this.detectDirection() === 'vertical'

    return this.getSwapDirection(pointer, target, targetRect, vertical)
  }

  /**
   * Detect layout direction (vertical or horizontal).
   */
  private detectDirection(): 'vertical' | 'horizontal' {
    const children = getDraggableChildren(this.el, this.options.draggable || '> *')
    if (children.length < 2)
      return 'vertical'

    const first = children[0]
    const second = children[1]
    const firstRect = first.getBoundingClientRect()
    const secondRect = second.getBoundingClientRect()

    // Check container styles for explicit direction
    const containerStyle = getComputedStyle(this.el)
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
   * Get swap direction.
   */
  private getSwapDirection(
    pointer: { clientX: number, clientY: number },
    target: HTMLElement,
    targetRect: DOMRect,
    vertical: boolean,
  ): number | null {
    const mouseOnAxis = vertical ? pointer.clientY : pointer.clientX
    const targetLength = vertical ? targetRect.height : targetRect.width
    const targetStart = vertical ? targetRect.top : targetRect.left
    const targetCenter = targetStart + targetLength / 2

    const swapThreshold = this.options.swapThreshold || 1

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
   * Perform the actual DOM insertion.
   */
  private performInsertion(target: HTMLElement, direction: number): void {
    if (!this.dragElement)
      return

    const parent = target.parentNode
    if (!parent)
      return

    if (direction === 1) {
      // Insert after target
      const nextSibling = target.nextSibling
      if (nextSibling) {
        parent.insertBefore(this.dragElement, nextSibling)
      }
      else {
        parent.appendChild(this.dragElement)
      }
    }
    else {
      // Insert before target
      parent.insertBefore(this.dragElement, target)
    }
  }
}
