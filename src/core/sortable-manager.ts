import type { SortableEvent, SortableEventCallbacks, SortableOptions } from '@/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import { getDraggableChildren } from '@/utils/sortable-dom'
import { nextTick, ref, shallowRef, toValue, watch } from 'vue'
import { CustomDragInstance } from './custom-drag-instance'

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

  // Internal state
  private dragInstance: CustomDragInstance | null = null
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

    // TODO: Implement animation capture if needed
    if (useAnimation) {
      // Animation will be implemented in later phases
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

    // TODO: Trigger animation if needed
    if (useAnimation) {
      // Animation will be implemented in later phases
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

    // Call user callback
    const options = this.resolveOptions()
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

    // Call user callback
    const options = this.resolveOptions()
    options.onEnd?.(evt)
  }

  /**
   * Handle item added to list.
   */
  private handleAdd(evt: SortableEvent): void {
    this.updateItems()
    const options = this.resolveOptions()
    options.onAdd?.(evt)
  }

  /**
   * Handle item removed from list.
   */
  private handleRemove(evt: SortableEvent): void {
    this.updateItems()
    const options = this.resolveOptions()
    options.onRemove?.(evt)
  }

  /**
   * Handle item position updated within list.
   */
  private handleUpdate(evt: SortableEvent): void {
    this.updateItems()
    const options = this.resolveOptions()
    options.onUpdate?.(evt)
  }

  /**
   * Handle any sort operation (add, remove, or update).
   */
  private handleSort(evt: SortableEvent): void {
    this.updateItems()
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
  }
}
