import type { SortableEvent, SortableEventCallbacks, SortableEventData, SortableEventListener, SortableEventType, SortableOptions } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { AnimationOptions } from './animation-manager'
import { getDraggableChildren } from '@/utils/sortable-dom'
import { nextTick, ref, shallowRef, toValue, watch } from 'vue'
import { AnimationManager } from './animation-manager'
import { CustomDragInstance } from './custom-drag-instance'
import { EventDispatcher } from './event-dispatcher'

/**
 * Core sortable manager class.
 * Manages the sortable functionality for a container element.
 * Based on SortableJS architecture with Vue3 reactivity.
 */
export class SortableManager {
  private target: MaybeRefOrGetter<HTMLElement | string | null>
  private options: MaybeRefOrGetter<SortableOptions & SortableEventCallbacks>

  // Reactive state - public readonly
  public readonly isDragging = ref(false)
  public readonly dragElement = shallowRef<HTMLElement | null>(null)
  public readonly ghostElement = shallowRef<HTMLElement | null>(null)
  public readonly currentIndex = ref<number | null>(null)
  public readonly items = shallowRef<HTMLElement[]>([])
  public readonly isAnimating = ref(false)
  public readonly animatingElements = shallowRef<HTMLElement[]>([])

  // Internal state
  private dragInstance: CustomDragInstance | null = null
  private eventDispatcher: EventDispatcher = new EventDispatcher()
  private animationManager: AnimationManager = new AnimationManager()
  private isInitialized = false
  private unwatchTarget?: () => void
  private unwatchOptions?: () => void

  /**
   * Create a new SortableManager instance.
   *
   * @param target - Target element or selector, can be reactive
   * @param options - Sortable options and event callbacks, can be reactive
   */
  constructor(
    target: MaybeRefOrGetter<HTMLElement | string | null>,
    options: MaybeRefOrGetter<SortableOptions & SortableEventCallbacks> = {},
  ) {
    this.target = target
    this.options = options

    this.setupWatchers()
  }

  /**
   * Initialize the sortable instance.
   * Sets up drag instance and updates items.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized)
      return

    const el = this.resolveTarget()
    if (!el)
      return

    const options = this.resolveOptions()

    // Create custom drag instance with merged options and event handlers
    this.dragInstance = new CustomDragInstance(el, {
      ...options,
      ...this.getEventHandlers(),
    })

    // Initialize animation manager
    this.animationManager.setContainer(el)
    this.animationManager.updateOptions(this.getAnimationOptions(options))

    // Update items list
    this.updateItems()
    this.isInitialized = true
  }

  /**
   * Wait for the next tick and a small delay to ensure async operations complete.
   * This is a utility method for testing scenarios where reactive changes need time to propagate.
   *
   * @param delay - Additional delay in milliseconds (default: 10ms)
   */
  async waitForUpdate(delay = 10): Promise<void> {
    await nextTick()
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  /**
   * Destroy the sortable instance.
   * Cleans up drag instance and resets state.
   */
  destroy(): void {
    if (this.dragInstance) {
      this.dragInstance.destroy()
      this.dragInstance = null
    }

    // Clean up animation manager
    this.animationManager.destroy()

    this.resetState()
    this.isInitialized = false

    // Note: Don't clean up watchers here as they need to persist
    // for reactive target/options changes
  }

  /**
   * Complete cleanup including watchers.
   * Call this when the manager is no longer needed.
   */
  cleanup(): void {
    this.destroy()

    // Clean up event listeners
    this.eventDispatcher.removeAllListeners()

    // Clean up watchers
    this.unwatchTarget?.()
    this.unwatchOptions?.()
  }

  /**
   * Update the items array based on current DOM state.
   * Filters elements using the draggable selector.
   */
  updateItems(): void {
    const el = this.resolveTarget()
    if (!el) {
      this.items.value = []
      return
    }

    const options = this.resolveOptions()
    const selector = options.draggable || '> *'
    this.items.value = getDraggableChildren(el, selector)
  }

  /**
   * Sort items programmatically.
   *
   * @param order - Array of item IDs in desired order
   * @param useAnimation - Whether to use animation during sorting
   */
  sort(order: string[], useAnimation = true): void {
    const el = this.resolveTarget()
    if (!el)
      return

    const options = this.resolveOptions()
    const dataIdAttr = options.dataIdAttr || 'data-id'

    // Create mapping of IDs to elements
    const items: Record<string, HTMLElement> = {}
    this.items.value.forEach((item) => {
      const id = item.getAttribute(dataIdAttr)
      if (id) {
        items[id] = item
      }
    })

    // Capture animation state before DOM changes
    if (useAnimation && options.animation) {
      this.animationManager.captureAnimationState()
    }

    // Reorder elements according to the order array
    order.forEach((id) => {
      if (items[id]) {
        el.removeChild(items[id])
        el.appendChild(items[id])
      }
    })

    // Update items after reordering
    this.updateItems()

    // Trigger animation after DOM changes
    if (useAnimation && options.animation) {
      this.animationManager.animateAll(() => {
        // Animation completed callback
        this.updateAnimationState()
      })
    }
  }

  // Private methods

  /**
   * Resolve the target element from the reactive reference.
   */
  private resolveTarget(): HTMLElement | null {
    const el = toValue(this.target)
    if (!el)
      return null

    return typeof el === 'string'
      ? document.querySelector(el) as HTMLElement
      : el
  }

  /**
   * Resolve the current options from the reactive reference.
   */
  private resolveOptions(): SortableOptions & SortableEventCallbacks {
    return toValue(this.options)
  }

  /**
   * Set up watchers for reactive target and options.
   */
  private setupWatchers(): void {
    // Watch for target changes
    this.unwatchTarget = watch(
      () => toValue(this.target),
      async (newTarget) => {
        if (this.isInitialized) {
          this.destroy()
        }

        if (newTarget) {
          await nextTick()
          await this.initialize()
        }
      },
      { immediate: true },
    )

    // Watch for options changes
    this.unwatchOptions = watch(
      () => toValue(this.options),
      (newOptions) => {
        if (this.dragInstance) {
          this.dragInstance.updateOptions(newOptions)
        }
        // Update animation manager options
        this.animationManager.updateOptions(this.getAnimationOptions(newOptions))
      },
      { deep: true },
    )
  }

  /**
   * Get event handlers that bridge between drag instance and manager state.
   */
  private getEventHandlers(): Record<string, (evt: SortableEvent) => void> {
    return {
      onStart: this.handleStart.bind(this),
      onEnd: this.handleEnd.bind(this),
      onAdd: this.handleAdd.bind(this),
      onRemove: this.handleRemove.bind(this),
      onUpdate: this.handleUpdate.bind(this),
      onSort: this.handleSort.bind(this),
    }
  }

  // Event handlers

  /**
   * Handle drag start event.
   */
  private handleStart(evt: SortableEvent): void {
    this.isDragging.value = true
    this.currentIndex.value = evt.oldIndex ?? null
    this.dragElement.value = evt.item

    // Capture animation state before drag starts
    const options = this.resolveOptions()
    if (options.animation) {
      this.animationManager.captureAnimationState()
    }

    // Dispatch event through event system
    this.eventDispatcher.dispatch('start', this.convertEventToData('start', evt))

    // Call user callback
    options.onStart?.(evt)
  }

  /**
   * Handle drag end event.
   */
  private handleEnd(evt: SortableEvent): void {
    this.isDragging.value = false
    this.dragElement.value = null
    this.ghostElement.value = null

    // Update items after drag
    this.updateItems()

    // Dispatch event through event system
    this.eventDispatcher.dispatch('end', this.convertEventToData('end', evt))

    // Call user callback
    const options = this.resolveOptions()
    options.onEnd?.(evt)
  }

  /**
   * Handle item added to list.
   */
  private handleAdd(evt: SortableEvent): void {
    this.updateItems()

    // Dispatch event through event system
    this.eventDispatcher.dispatch('add', this.convertEventToData('add', evt))

    const options = this.resolveOptions()
    options.onAdd?.(evt)
  }

  /**
   * Handle item removed from list.
   */
  private handleRemove(evt: SortableEvent): void {
    this.updateItems()

    // Dispatch event through event system
    this.eventDispatcher.dispatch('remove', this.convertEventToData('remove', evt))

    const options = this.resolveOptions()
    options.onRemove?.(evt)
  }

  /**
   * Handle item position updated within list.
   */
  private handleUpdate(evt: SortableEvent): void {
    this.updateItems()

    // Trigger animation for position changes
    const options = this.resolveOptions()
    if (options.animation) {
      this.animationManager.animateAll(() => {
        this.updateAnimationState()
      })
    }

    // Dispatch event through event system
    this.eventDispatcher.dispatch('update', this.convertEventToData('update', evt))

    options.onUpdate?.(evt)
  }

  /**
   * Handle any sort operation (add, remove, or update).
   */
  private handleSort(evt: SortableEvent): void {
    this.updateItems()

    // Dispatch event through event system
    this.eventDispatcher.dispatch('sort', this.convertEventToData('sort', evt))

    const options = this.resolveOptions()
    options.onSort?.(evt)
  }

  /**
   * Reset all reactive state to initial values.
   */
  private resetState(): void {
    this.isDragging.value = false
    this.dragElement.value = null
    this.ghostElement.value = null
    this.currentIndex.value = null
    this.items.value = []
    this.isAnimating.value = false
    this.animatingElements.value = []
  }

  /**
   * Extract animation options from sortable options.
   *
   * @param options - Sortable options
   * @returns Animation options
   */
  private getAnimationOptions(options: SortableOptions & SortableEventCallbacks): AnimationOptions {
    return {
      animation: options.animation,
      easing: options.easing,
      disabled: options.disabled,
    }
  }

  /**
   * Update animation state from animation manager.
   */
  private updateAnimationState(): void {
    this.isAnimating.value = this.animationManager.isAnimating.value
    this.animatingElements.value = this.animationManager.animatingElements.value
  }

  /**
   * Convert SortableEvent to SortableEventData for event dispatcher.
   *
   * @param eventType - The event type
   * @param evt - The sortable event
   * @returns Event data for dispatcher
   */
  private convertEventToData(eventType: SortableEventType, evt: SortableEvent): SortableEventData {
    return {
      type: eventType,
      to: evt.to,
      from: evt.from,
      item: evt.item,
      clone: evt.clone,
      oldIndex: evt.oldIndex,
      newIndex: evt.newIndex,
      oldDraggableIndex: evt.oldDraggableIndex,
      newDraggableIndex: evt.newDraggableIndex,
      originalEvent: evt.originalEvent,
      pullMode: evt.pullMode,
      related: evt.related,
      willInsertAfter: evt.willInsertAfter,
    }
  }

  // Event system methods

  /**
   * Register an event listener.
   *
   * @param eventType - The type of event to listen for
   * @param listener - The callback function to execute
   * @returns Cleanup function to remove the listener
   */
  on(eventType: SortableEventType, listener: SortableEventListener): () => void {
    return this.eventDispatcher.on(eventType, listener)
  }

  /**
   * Register a one-time event listener.
   *
   * @param eventType - The type of event to listen for
   * @param listener - The callback function to execute once
   * @returns Cleanup function to remove the listener
   */
  once(eventType: SortableEventType, listener: SortableEventListener): () => void {
    return this.eventDispatcher.once(eventType, listener)
  }

  /**
   * Remove an event listener.
   *
   * @param eventType - The type of event to stop listening for
   * @param listener - The callback function to remove
   */
  off(eventType: SortableEventType, listener: SortableEventListener): void {
    this.eventDispatcher.off(eventType, listener)
  }

  /**
   * Check if there are any listeners for a specific event type.
   *
   * @param eventType - The type of event to check
   * @returns Whether there are any listeners for this event type
   */
  hasListeners(eventType: SortableEventType): boolean {
    return this.eventDispatcher.hasListeners(eventType)
  }

  /**
   * Get the number of listeners for a specific event type.
   *
   * @param eventType - The type of event to count listeners for
   * @returns The total number of listeners (regular + once)
   */
  getListenerCount(eventType: SortableEventType): number {
    return this.eventDispatcher.getListenerCount(eventType)
  }
}
