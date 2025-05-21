import type { AnimationConfig, DataItem, DragData, ProcessedDataItem, SortableDragData, UseDnDOptions, UseDnDReturn } from '@/types/dnd' // DragItemContext might be unused from here, added ProcessedDataItem
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, markRaw, shallowRef, toValue, watch } from 'vue' // Removed watchEffect
import { useDrag } from './useDrag'
import { useDrop } from './useDrop'

// Define internal context type
interface ManagedDragItemContext<ItemType> {
  itemRef: Ref<HTMLElement | null>
  isDragging: Ref<boolean>
  itemStyle: ComputedRef<any> // CSSProperties
  isDropTarget: Ref<boolean>
  itemDataRef: ShallowRef<(DataItem<ItemType> & { originalIndex: number, selected: boolean })>
  flipTransform: ShallowRef<string | null>
  flipTransition: ShallowRef<string | null>
}

/**
 * A hook for creating sortable lists and grids with drag and drop functionality.
 * @param targetRef - The ref to the container element
 * @param options - Configuration options for the useDnD hook
 * @returns An object containing the state and methods for managing the sortable list/grid
 */
export function useDnD<T = unknown>(
  targetRef: Ref<HTMLElement | null>,
  options: UseDnDOptions<T>,
): UseDnDReturn<T> {
  // --- Options ---
  const groupName = computed(() => toValue(options.group))
  const userDragOptions = computed(() => toValue(options.dragOptions) || {})
  const userDropOptions = computed(() => toValue(options.dropOptions) || {})
  const ghostClassValue = computed(() => toValue(options.ghostClass))

  const animationOptions = computed((): Required<AnimationConfig> => {
    const userAnimationOpts = toValue(options.animation)
    const defaults: Required<AnimationConfig> = {
      disabled: false,
      duration: 150,
      easing: 'cubic-bezier(0.33, 1, 0.68, 1)', // easeOutCubic
    }

    if (typeof userAnimationOpts === 'boolean') {
      return { ...defaults, disabled: !userAnimationOpts }
    }
    if (typeof userAnimationOpts === 'object' && userAnimationOpts !== null) {
      return { ...defaults, ...userAnimationOpts }
    }
    return defaults // Default to enabled with default values if undefined or invalid
  })

  // --- State Management ---
  const selectedItems = shallowRef<DataItem<T>[]>([]) as Ref<DataItem<T>[]>
  const isDraggingGlobal = shallowRef(false)
  const draggedItemInternal = shallowRef<(DataItem<T> & { originalIndex: number, selected: boolean }) | null>(null)
  const currentDropPayloadInternal = shallowRef<SortableDragData<T> | null>(null)
  const previousItemPositions = shallowRef(new Map<string | number, DOMRect>())
  const placeholderIndex = shallowRef<number | null>(null)
  const isExternalDragOverContainer = shallowRef<boolean>(false) // To handle drags to container end

  // --- Item-specific Drag and Drop Contexts ---
  const itemContextsInternal = shallowRef<Map<string | number, ManagedDragItemContext<T>>>(new Map())

  // Process items with internal state (defined before watchers that use it)
  const processedItems = computed(() => {
    const currentItems = toValue(options.items)
    const currentSelectedIds = selectedItems.value.map(si => si.id)
    return currentItems.map((item, index) => ({
      ...item,
      originalIndex: index,
      selected: currentSelectedIds.includes(item.id),
    }))
  })

  const captureCurrentItemPositions = () => {
    if (animationOptions.value.disabled)
      return
    const newPositions = new Map<string | number, DOMRect>()
    // Use processedItems here to ensure we are iterating over the most current list of items
    // that have corresponding contexts and DOM elements.
    processedItems.value.forEach((processedItem) => {
      const context = itemContextsInternal.value.get(processedItem.id)
      if (context?.itemRef.value) {
        newPositions.set(processedItem.id, context.itemRef.value.getBoundingClientRect())
      }
    })
    previousItemPositions.value = newPositions
  }

  const createInternalContextForItem = (itemWithMeta: DataItem<T> & { originalIndex: number, selected: boolean }): ManagedDragItemContext<T> => {
    const itemRef = shallowRef<HTMLElement | null>(null)
    const itemElement = computed(() => itemRef.value)
    const itemDataRef = shallowRef(itemWithMeta)
    const flipTransform = shallowRef<string | null>(null)
    const flipTransition = shallowRef<string | null>(null)

    const sortableItemPayload = computed((): SortableDragData<T> => ({
      type: groupName.value ? `sortable-item-${groupName.value}` : 'sortable-item',
      payload: itemDataRef.value.data,
      id: itemDataRef.value.id,
      index: itemDataRef.value.originalIndex,
      containerId: groupName.value,
    }))

    const dragHook = useDrag<SortableDragData<T>>(itemRef, {
      ...userDragOptions.value,
      data: computed((): DragData<SortableDragData<T>> => ({
        type: toValue(sortableItemPayload).type,
        payload: toValue(sortableItemPayload),
      })),
      onDragStart: (event) => {
        isDraggingGlobal.value = true
        draggedItemInternal.value = itemDataRef.value // Use the full item data from ref
        userDragOptions.value.onDragStart?.(event)
      },
      onDragEnd: (event) => {
        isDraggingGlobal.value = false
        draggedItemInternal.value = null
        placeholderIndex.value = null
        isExternalDragOverContainer.value = false
        userDragOptions.value.onDragEnd?.(event)
      },
    })

    const itemStyle = computed(() => {
      const styles: Record<string, any> = { ...dragHook.style.value }
      if (flipTransform.value) {
        styles.transform = flipTransform.value
      }
      if (flipTransition.value) {
        styles.transition = flipTransition.value
      }
      // Ensure previous transform from dragHook is not overridden if flipTransform is not set
      // or merge them if necessary (though typically FLIP overrides drag transforms temporarily)
      if (!flipTransform.value && dragHook.style.value?.transform) {
        styles.transform = dragHook.style.value.transform
      }
      return styles
    })

    const dropHook = useDrop<SortableDragData<T>>(itemElement, {
      ...userDropOptions.value,
      accept: computed(() => {
        const baseAccept = toValue(userDropOptions.value.accept)
        const itemType = groupName.value ? `sortable-item-${groupName.value}` : 'sortable-item'
        if (Array.isArray(baseAccept)) {
          return [...baseAccept, itemType].filter((value, idx, self) => self.indexOf(value) === idx)
        }
        else if (typeof baseAccept === 'function') {
          return types => baseAccept(types) || types.includes(itemType)
        }
        return [itemType]
      }),
      onDrop: (dragEventData, event) => {
        userDropOptions.value.onDrop?.(dragEventData, event)
        placeholderIndex.value = null
        isExternalDragOverContainer.value = false

        const droppedPayload = dragEventData.payload as SortableDragData<T> | undefined

        if (!droppedPayload || typeof droppedPayload.id === 'undefined' || typeof droppedPayload.index === 'undefined') {
          console.warn('[useDnD] Invalid or incomplete sortable payload received on item drop.', droppedPayload)
          return
        }
        if (droppedPayload.id === itemDataRef.value.id) {
          // Dropped on itself
          if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation() // Prevent container from moving it
          }
          return
        }

        const currentItems = toValue(options.items) // Use original options.items for findIndex
        const fromIndex = currentItems.findIndex(i => i.id === droppedPayload.id)

        if (fromIndex === -1) {
          console.warn(`[useDnD] Dragged item (id: ${droppedPayload.id}) not found in current items.`)
          return
        }

        let targetIndex = itemDataRef.value.originalIndex // Base target index is the item we dropped on

        // Refine targetIndex based on drop position relative to the target item's midpoint
        if (event && itemRef.value) {
          const targetElement = itemRef.value
          const targetRect = targetElement.getBoundingClientRect()
          const dropClientY = event.clientY
          const targetMidpointY = targetRect.top + targetRect.height / 2

          if (dropClientY > targetMidpointY) {
            // If dropped on the bottom half of the target item, insert after it
            targetIndex += 1
          }
        }

        // Ensure targetIndex is within bounds if moving an item downwards past itself
        // This is important if targetIndex was incremented.
        // If fromIndex < targetIndex (moving down), and original target was before fromIndex,
        // the effective targetIndex after removal of fromIndex needs to be decremented by 1.
        const effectiveTargetIndex = (fromIndex < targetIndex) ? targetIndex - 1 : targetIndex

        const itemToMove = currentItems[fromIndex]
        const newItemsState = [...currentItems]
        newItemsState.splice(fromIndex, 1)
        // Use effectiveTargetIndex for splice
        newItemsState.splice(effectiveTargetIndex, 0, itemToMove)

        captureCurrentItemPositions() // Capture positions before emitting sort
        options.onSort?.({
          oldIndex: fromIndex,
          newIndex: effectiveTargetIndex, // Use effectiveTargetIndex
          item: itemToMove,
          items: newItemsState,
        })
        options.onChange?.(newItemsState, 'sort')

        if (event && typeof event.stopPropagation === 'function') {
          event.stopPropagation()
        }
      },
      onDragOver: (dragEventData, event) => {
        userDropOptions.value.onDragOver?.(dragEventData, event)
        if (event && itemRef.value) {
          // Determine if over top or bottom half of the item
          const rect = itemRef.value.getBoundingClientRect()
          const isOverTopHalf = event.clientY < rect.top + rect.height / 2
          placeholderIndex.value = itemDataRef.value.originalIndex + (isOverTopHalf ? 0 : 1)
          isExternalDragOverContainer.value = false // Drag is over an item, not just container
        }
      },
      onDragLeave: (dragEventData, event) => {
        userDropOptions.value.onDragLeave?.(dragEventData, event)
        // placeholderIndex.value = null; // Let container onDragOver handle it if moving to container edge
      },
    })

    return markRaw({ // markRaw for the context object itself
      itemRef,
      isDragging: dragHook.isDragging,
      itemStyle, // Use the new computed itemStyle
      isDropTarget: dropHook.isDragOver,
      itemDataRef,
      flipTransform,
      flipTransition,
    })
  }

  watch(processedItems, (newProcessedItems, oldProcessedItems) => {
    const newItemsMap = new Map(newProcessedItems.map(item => [item.id, item]))
    const currentContextMap = itemContextsInternal.value

    // Add/Update contexts
    for (const newItem of newProcessedItems) {
      let context = currentContextMap.get(newItem.id)
      if (!context) {
        context = createInternalContextForItem(newItem)
        currentContextMap.set(newItem.id, context)
      }
      else {
        // Update existing context's item data
        context.itemDataRef.value = newItem
      }
    }

    // Remove contexts for items no longer present
    const idsToRemove: (string | number)[] = []
    if (oldProcessedItems) { // Compare with old items if available
      for (const oldItem of oldProcessedItems) {
        if (!newItemsMap.has(oldItem.id)) {
          idsToRemove.push(oldItem.id)
        }
      }
    }
    else if (newProcessedItems.length === 0 && currentContextMap.size > 0) {
      // This case handles if the list becomes empty and previously wasn't (e.g. initial non-empty then cleared)
      // However, if oldProcessedItems is null (initial run) and newProcessedItems is empty, idsToRemove remains empty.
      currentContextMap.forEach((_context, id) => idsToRemove.push(id))
    }

    if (idsToRemove.length > 0) {
      idsToRemove.forEach((id) => {
        const contextToClean = currentContextMap.get(id)
        if (contextToClean) {
          // contextToClean.cleanupDragDrop?.(); // If specific cleanup was needed
          currentContextMap.delete(id)
        }
      })
    }

    // If the map instance itself needs to be replaced for reactivity (usually not for .set/.delete)
    // itemContextsInternal.value = new Map(currentContextMap);
  }, { immediate: true })

  watch(processedItems, (newItems, _oldItems) => {
    if (animationOptions.value.disabled || previousItemPositions.value.size === 0) {
      previousItemPositions.value.clear() // Clear if animations disabled or no prev positions
      // Also clear placeholder if animations are off and list changes
      if (animationOptions.value.disabled) {
        placeholderIndex.value = null
        isExternalDragOverContainer.value = false
      }
      return
    }

    const newPositionsMap = new Map<string | number, DOMRect>()
    newItems.forEach((item) => {
      const context = itemContextsInternal.value.get(item.id)
      if (context?.itemRef.value) {
        newPositionsMap.set(item.id, context.itemRef.value.getBoundingClientRect())
      }
    })

    newItems.forEach((item) => {
      const context = itemContextsInternal.value.get(item.id)
      const oldRect = previousItemPositions.value.get(item.id)
      const newRect = newPositionsMap.get(item.id)

      if (context && oldRect && newRect) {
        const deltaX = oldRect.left - newRect.left
        const deltaY = oldRect.top - newRect.top

        if (deltaX !== 0 || deltaY !== 0) {
          context.flipTransform.value = `translate(${deltaX}px, ${deltaY}px)`
          context.flipTransition.value = 'none'

          requestAnimationFrame(() => {
            requestAnimationFrame(() => { // Double requestAnimationFrame for robustness in Vue
              context.flipTransform.value = null // Animate to natural position
              context.flipTransition.value = `transform ${animationOptions.value.duration}ms ${animationOptions.value.easing}`
              // Optional: Clear transition after animation to prevent re-triggering on other style changes
              setTimeout(() => {
                if (context.flipTransition.value?.startsWith('transform')) { // Check if it's our transition
                  context.flipTransition.value = null
                }
              }, animationOptions.value.duration)
            })
          })
        }
      }
    })
    previousItemPositions.value.clear() // Clear after use
  }, { flush: 'post' })

  tryOnUnmounted(() => {
    itemContextsInternal.value.clear()
    previousItemPositions.value.clear()
  })

  // --- Drop Zone Logic (for the container) ---
  const { isDragOver: isDropTarget, data: dropZoneEventDataRef } = useDrop<SortableDragData<T>>(targetRef, {
    ...userDropOptions.value,
    accept: computed(() => {
      const baseAccept = toValue(userDropOptions.value.accept)
      const itemType = groupName.value ? `sortable-item-${groupName.value}` : 'sortable-item'
      if (Array.isArray(baseAccept)) {
        return [...baseAccept, itemType]
      }
      else if (typeof baseAccept === 'function') {
        return types => baseAccept(types) || types.includes(itemType)
      }
      return [itemType]
    }),
    onDrop: (dragEventData, event) => {
      // Reset placeholder states immediately on container drop
      placeholderIndex.value = null
      isExternalDragOverContainer.value = false

      userDropOptions.value.onDrop?.(dragEventData, event)
      const sortablePayload = dragEventData.payload as SortableDragData<T> | undefined

      if (!sortablePayload || typeof sortablePayload.id === 'undefined' || typeof sortablePayload.index === 'undefined') {
        currentDropPayloadInternal.value = null
        return
      }

      const currentItems = toValue(options.items)
      const draggedItemId = sortablePayload.id
      const fromIndex = currentItems.findIndex(i => i.id === draggedItemId)

      if (fromIndex === -1) {
        currentDropPayloadInternal.value = null
        return
      }

      const itemToMove = currentItems[fromIndex]
      const newItemsState = [...currentItems]
      newItemsState.splice(fromIndex, 1) // Remove item from its original position

      let finalNewIndex: number // This will be the index in newItemsState where itemToMove is inserted

      if (newItemsState.length === 0) {
        finalNewIndex = 0 // If list becomes empty after removing dragged item, insert at start
      }
      else {
        let dropClientY: number | undefined
        // Correctly determine clientY from DragEvent or PointerEvent
        // The 'event' parameter type is DragEvent | PointerEvent | undefined from useDrop
        if (event && 'clientY' in event) {
          dropClientY = event.clientY
        }

        if (typeof dropClientY === 'number') {
          finalNewIndex = newItemsState.length // Default to appending to the end

          for (let i = 0; i < newItemsState.length; i++) {
            const currentItemToCompare = newItemsState[i]
            const itemContext = itemContextsInternal.value.get(currentItemToCompare.id)
            const itemElement = itemContext?.itemRef?.value

            if (itemElement) {
              const itemRect = itemElement.getBoundingClientRect()
              const itemMidpointY = itemRect.top + itemRect.height / 2

              if (dropClientY < itemMidpointY) {
                finalNewIndex = i // Found the insertion point
                break
              }
            }
          }
        }
        else {
          // Fallback: if no valid event clientY, or other issues, append to the end
          finalNewIndex = newItemsState.length
        }
      }

      newItemsState.splice(finalNewIndex, 0, itemToMove) // Insert itemToMove into its new position

      captureCurrentItemPositions() // Capture positions before emitting sort
      options.onSort?.({
        oldIndex: fromIndex,
        newIndex: finalNewIndex, // finalNewIndex is the index in the newItemsState
        item: itemToMove,
        items: newItemsState,
      })
      options.onChange?.(newItemsState, 'sort')

      currentDropPayloadInternal.value = null
    },
    onDragEnter: (dragEventData, event) => {
      userDropOptions.value.onDragEnter?.(dragEventData, event)
      currentDropPayloadInternal.value = dragEventData ? dragEventData.payload : null
      // Potentially set placeholder for drag entering the main container if empty or to the end
      if (!itemContextsInternal.value.size) { // If list is empty
        placeholderIndex.value = 0
        isExternalDragOverContainer.value = true
      }
    },
    onDragOver: (dragEventData, event) => {
      userDropOptions.value.onDragOver?.(dragEventData, event)
      const anyItemIsDropTarget = Array.from(itemContextsInternal.value.values()).some(ctx => ctx.isDropTarget.value)
      if (!anyItemIsDropTarget && targetRef.value && event) {
        const containerRect = targetRef.value.getBoundingClientRect()
        if (processedItems.value.length === 0) {
          placeholderIndex.value = 0
          isExternalDragOverContainer.value = true
        }
        else {
          // Check if cursor is below the midpoint of the last item or near container bottom
          const lastItemContext = itemContextsInternal.value.get(processedItems.value[processedItems.value.length - 1].id)
          if (lastItemContext?.itemRef?.value) {
            const lastItemRect = lastItemContext.itemRef.value.getBoundingClientRect()
            if (event.clientY > lastItemRect.top + lastItemRect.height / 2) {
              placeholderIndex.value = processedItems.value.length
              isExternalDragOverContainer.value = true
            }
          }
          else if (event.clientY > containerRect.top + containerRect.height / 2) {
            // Fallback if last item rect not available, consider if over bottom half of container
            placeholderIndex.value = processedItems.value.length
            isExternalDragOverContainer.value = true
          }
        }
      }
    },
    onDragLeave: (dragEventData, event) => {
      userDropOptions.value.onDragLeave?.(dragEventData, event)
      const trulyLeftContainer = !event.relatedTarget || (targetRef.value && !targetRef.value.contains(event.relatedTarget as Node))

      if (trulyLeftContainer) {
        placeholderIndex.value = null
        isExternalDragOverContainer.value = false
        if (dragEventData && (!dragEventData.payload || typeof (dragEventData.payload as SortableDragData<T>).id === 'undefined')) {
          currentDropPayloadInternal.value = null
        }
      }
    },
  })

  watch(dropZoneEventDataRef, (newFullDragData) => {
    if (isDropTarget.value && newFullDragData?.payload) {
      currentDropPayloadInternal.value = newFullDragData.payload
    }
    else {
      currentDropPayloadInternal.value = null
    }
  })

  // Helper to find item index in selectedItems
  const findSelectedItemIndex = (itemToFind: DataItem<T>): number => {
    return selectedItems.value.findIndex(item => item.id === itemToFind.id)
  }

  const selectItem = (item: DataItem<T>) => {
    if (findSelectedItemIndex(item) === -1) {
      selectedItems.value = [...selectedItems.value, markRaw(item) as DataItem<T>]
      options.onSelectionChange?.(selectedItems.value)
    }
  }

  const deselectItem = (item: DataItem<T>) => {
    const index = findSelectedItemIndex(item)
    if (index > -1) {
      const newSelectedItems = [...selectedItems.value]
      newSelectedItems.splice(index, 1)
      selectedItems.value = newSelectedItems
      options.onSelectionChange?.(selectedItems.value)
    }
  }

  const toggleSelectItem = (item: DataItem<T>) => {
    if (findSelectedItemIndex(item) > -1) {
      deselectItem(item)
    }
    else {
      selectItem(item)
    }
  }

  const selectAll = () => {
    const allItems = toValue(options.items) // use options.items to get raw DataItem<T>
    selectedItems.value = allItems.map(item => markRaw(item) as DataItem<T>)
    options.onSelectionChange?.(selectedItems.value)
  }

  const deselectAll = () => {
    selectedItems.value = []
    options.onSelectionChange?.(selectedItems.value)
  }

  // --- Item Props (Drag Logic per item) ---
  const getItemProps = (
    item: ProcessedDataItem<T>,
    _index: number,
  ): Record<string, any> => {
    const itemWithMeta = item as (DataItem<T> & { originalIndex: number, selected: boolean })
    const itemId = itemWithMeta.id

    const currentContext = itemContextsInternal.value.get(itemId)

    const setElementRef = (el: HTMLElement | SVGElement | Element | null) => {
      const contextAtRefTime = itemContextsInternal.value.get(itemId)
      if (contextAtRefTime && contextAtRefTime.itemRef) {
        contextAtRefTime.itemRef.value = el as HTMLElement | null
      }
      else if (el) {
        console.warn(
          `[useDnD] setElementRef called for item '${itemId}', but its DragItemContext or itemRef was not found. Drag/drop may not work.`,
          { allContextIds: Array.from(itemContextsInternal.value.keys()) },
        )
      }
    }

    return {
      'key': itemId,
      'ref': setElementRef,
      'draggable': true,
      'data-dndnr-item-id': itemId,
      'aria-grabbed': currentContext?.isDragging?.value ? 'true' : 'false',
      'style': currentContext?.itemStyle?.value || {},
      'data-is-item-drop-target': currentContext?.isDropTarget?.value ?? false,
    }
  }

  const containerProps = computed(() => ({}))

  const getPlaceholderProps = (index: number) => {
    return {
      key: `dndnr-ph-${index}`,
      class: toValue(ghostClassValue),
      style: { display: placeholderIndex.value === index ? 'block' : 'none' },
    }
  }

  return {
    processedItems,
    selectedItems,
    isDragging: isDraggingGlobal,
    draggedItem: computed(() => {
      if (!draggedItemInternal.value)
        return null
      return {
        id: draggedItemInternal.value.id,
        data: draggedItemInternal.value.data,
      } as DataItem<T>
    }),
    isDropTarget,
    selectItem,
    deselectItem,
    toggleSelectItem,
    selectAll,
    deselectAll,
    containerProps,
    getItemProps: getItemProps as (item: DataItem<T>, index: number) => Record<string, any>,
    getPlaceholderProps,
  }
}
