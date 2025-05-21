import type { DataItem, DragData, DragItemContext, ProcessedDataItem, SortableDragData, UseDnDOptions, UseDnDReturn } from '@/types/dnd' // DragItemContext might be unused from here, added ProcessedDataItem
import type { MaybeRefOrGetter } from 'vue'
import { tryOnUnmounted } from '@vueuse/core'
import { computed, markRaw, shallowRef, toValue, watch } from 'vue'
import { useDrag } from './useDrag'
import { useDrop } from './useDrop'

/**
 * A hook for creating sortable lists and grids with drag and drop functionality.
 * @param containerTarget - The ref to the container element
 * @param options - Configuration options for the useDnD hook
 * @returns An object containing the state and methods for managing the sortable list/grid
 */
export function useDnD<T = unknown>(
  containerTarget: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseDnDOptions<T>,
): UseDnDReturn<T> {
  // --- Options ---
  const groupName = computed(() => toValue(options.group))
  const userDragOptions = computed(() => toValue(options.dragOptions) || {})
  const userDropOptions = computed(() => toValue(options.dropOptions) || {})
  const ghostClassValue = computed(() => toValue(options.ghostClass))

  const animationOptions = computed(() => {
    const userAnimationOptions = toValue(options.animation)
    const defaultAnimationOptions = {
      disabled: false,
      duration: 150,
      easing: 'cubic-bezier(0.33, 1, 0.68, 1)', // easeOutCubic
    }

    if (typeof userAnimationOptions === 'boolean') {
      return { ...defaultAnimationOptions, disabled: !userAnimationOptions }
    }
    if (typeof userAnimationOptions === 'object' && userAnimationOptions !== null) {
      return { ...defaultAnimationOptions, ...userAnimationOptions }
    }
    return defaultAnimationOptions
  })

  // --- State Management ---
  const isDragging = shallowRef(false)
  const draggingItemData = shallowRef<(ProcessedDataItem<T>) | null>(null)
  const draggingItem = computed(() => {
    if (!draggingItemData.value)
      return null
    return {
      id: draggingItemData.value.id,
      data: draggingItemData.value.data,
    } as DataItem<T>
  })

  const selectedItems = shallowRef<DataItem<T>[]>([])
  const currentDropData = shallowRef<SortableDragData<T> | null>(null)

  const itemPositionsMap = shallowRef(new Map<string | number, DOMRect>())
  const placeholderIndex = shallowRef<number | null>(null)
  const isExternalDragOverContainer = shallowRef<boolean>(false)

  // --- Item-specific Drag and Drop Contexts ---
  const itemContextsMap = shallowRef<Map<string | number, DragItemContext<T>>>(new Map())

  // Process items with internal state (defined before watchers that use it)
  const processedItems = computed(() => {
    const currentItems = toValue(options.initialItems)
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
      const context = itemContextsMap.value.get(processedItem.id)
      if (context?.itemRef.value) {
        newPositions.set(processedItem.id, context.itemRef.value.getBoundingClientRect())
      }
    })
    itemPositionsMap.value = newPositions
  }

  const createItemContext = (processedDataItem: ProcessedDataItem<T>): DragItemContext<T> => {
    const itemRef = shallowRef<HTMLElement | null>(null)
    const itemElement = computed(() => itemRef.value)
    const itemDataRef = shallowRef(processedDataItem)
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
        isDragging.value = true
        draggingItemData.value = itemDataRef.value // Use the full item data from ref
        userDragOptions.value.onDragStart?.(event)
      },
      onDragEnd: (event) => {
        isDragging.value = false
        draggingItemData.value = null
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

        const currentItems = toValue(options.initialItems) // Use original options.initialItems for findIndex
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

    return markRaw({
      itemRef,
      isDragging: dragHook.isDragging,
      itemStyle,
      isDropTarget: dropHook.isDragOver,
      itemDataRef,
      flipTransform,
      flipTransition,
    })
  }

  watch(processedItems, (newProcessedItems, oldProcessedItems) => {
    const newItemsMap = new Map(newProcessedItems.map(item => [item.id, item]))
    const currentContextMap = itemContextsMap.value

    // Add/Update contexts
    for (const newItem of newProcessedItems) {
      let context = currentContextMap.get(newItem.id)
      if (!context) {
        context = createItemContext(newItem)
        currentContextMap.set(newItem.id, context)
      }
      else {
        context.itemDataRef.value = newItem
      }
    }

    // Remove contexts for items no longer present
    const idsToRemove: (string | number)[] = []
    if (oldProcessedItems) {
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
          currentContextMap.delete(id)
        }
      })
    }

    //
  }, { immediate: true })

  watch([processedItems, animationOptions], ([newItems]) => {
    if (animationOptions.value.disabled || itemPositionsMap.value.size === 0) {
      itemPositionsMap.value.clear()
      if (animationOptions.value.disabled) {
        placeholderIndex.value = null
        isExternalDragOverContainer.value = false
      }
      return
    }

    const newPositionsMap = new Map<string | number, DOMRect>()
    newItems.forEach((item) => {
      const context = itemContextsMap.value.get(item.id)
      if (context?.itemRef.value) {
        newPositionsMap.set(item.id, context.itemRef.value.getBoundingClientRect())
      }
    })

    newItems.forEach((item) => {
      const context = itemContextsMap.value.get(item.id)
      const oldRect = itemPositionsMap.value.get(item.id)
      const newRect = newPositionsMap.get(item.id)

      if (context && oldRect && newRect) {
        const deltaX = oldRect.left - newRect.left
        const deltaY = oldRect.top - newRect.top

        if (deltaX !== 0 || deltaY !== 0) {
          context.flipTransform.value = `translate(${deltaX}px, ${deltaY}px)`
          context.flipTransition.value = 'none'

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Double requestAnimationFrame for robustness in Vue
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
    itemPositionsMap.value.clear()
  }, { flush: 'post' })

  // --- Drop Zone Logic (for the container) ---
  const { isDragOver: isDropTarget, data: dropZoneEventDataRef } = useDrop<SortableDragData<T>>(containerTarget, {
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
        currentDropData.value = null
        return
      }

      const currentItems = toValue(options.initialItems)
      const draggedItemId = sortablePayload.id
      const fromIndex = currentItems.findIndex(i => i.id === draggedItemId)

      if (fromIndex === -1) {
        currentDropData.value = null
        return
      }

      const itemToMove = currentItems[fromIndex]
      const newItemsState = [...currentItems]
      newItemsState.splice(fromIndex, 1) // Remove item from its original position

      // This will be the index in newItemsState where itemToMove is inserted
      let finalNewIndex: number

      if (newItemsState.length === 0) {
        // If list becomes empty after removing dragged item, insert at start
        finalNewIndex = 0
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
            const itemContext = itemContextsMap.value.get(currentItemToCompare.id)
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

      currentDropData.value = null
    },
    onDragEnter: (dragEventData, event) => {
      userDropOptions.value.onDragEnter?.(dragEventData, event)
      currentDropData.value = dragEventData ? dragEventData.payload : null
      // Potentially set placeholder for drag entering the main container if empty or to the end
      if (!itemContextsMap.value.size) {
        placeholderIndex.value = 0
        isExternalDragOverContainer.value = true
      }
    },
    onDragOver: (dragEventData, event) => {
      userDropOptions.value.onDragOver?.(dragEventData, event)
      const containerTargetValue = toValue(containerTarget)
      const anyItemIsDropTarget = Array.from(itemContextsMap.value.values()).some(ctx => ctx.isDropTarget.value)
      if (!anyItemIsDropTarget && containerTargetValue && event) {
        const containerRect = containerTargetValue.getBoundingClientRect()
        if (processedItems.value.length === 0) {
          placeholderIndex.value = 0
          isExternalDragOverContainer.value = true
        }
        else {
          // Check if cursor is below the midpoint of the last item or near container bottom
          const lastItemContext = itemContextsMap.value.get(processedItems.value[processedItems.value.length - 1].id)
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
      const containerTargetValue = toValue(containerTarget)
      const trulyLeftContainer = !event.relatedTarget || (containerTargetValue && !containerTargetValue.contains(event.relatedTarget as Node))

      if (trulyLeftContainer) {
        placeholderIndex.value = null
        isExternalDragOverContainer.value = false
        if (dragEventData && (!dragEventData.payload || typeof (dragEventData.payload as SortableDragData<T>).id === 'undefined')) {
          currentDropData.value = null
        }
      }
    },
  })

  watch(dropZoneEventDataRef, (newFullDragData) => {
    if (isDropTarget.value && newFullDragData?.payload) {
      currentDropData.value = newFullDragData.payload
    }
    else {
      currentDropData.value = null
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
    const allItems = toValue(options.initialItems) // use options.initialItems to get raw DataItem<T>
    selectedItems.value = allItems.map(item => markRaw(item) as DataItem<T>)
    options.onSelectionChange?.(selectedItems.value)
  }

  const deselectAll = () => {
    selectedItems.value = []
    options.onSelectionChange?.(selectedItems.value)
  }

  // --- Item Props (Drag Logic per item) ---
  const getItemProps = (item: ProcessedDataItem<T>): Record<string, any> => {
    const itemWithMeta = item
    const itemId = itemWithMeta.id

    const currentContext = itemContextsMap.value.get(itemId)

    const setElementRef = (el: HTMLElement | SVGElement | Element | null) => {
      const contextAtRefTime = itemContextsMap.value.get(itemId)
      if (contextAtRefTime && contextAtRefTime.itemRef) {
        contextAtRefTime.itemRef.value = el as HTMLElement | null
      }
      else if (el) {
        console.warn(
          `[useDnD] setElementRef called for item '${itemId}', but its DragItemContext or itemRef was not found. Drag/drop may not work.`,
          { allContextIds: Array.from(itemContextsMap.value.keys()) },
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

  tryOnUnmounted(() => {
    itemContextsMap.value.clear()
    itemPositionsMap.value.clear()
  })

  return {
    processedItems,
    selectedItems,
    isDragging,
    draggingItem,
    isDropTarget,
    selectItem,
    deselectItem,
    toggleSelectItem,
    selectAll,
    deselectAll,
    containerProps,
    getItemProps,
    getPlaceholderProps,
  }
}
