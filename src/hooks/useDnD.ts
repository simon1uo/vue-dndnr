import type { DataItem, DragData, SortableDragData, UseDnDOptions, UseDnDReturn } from '@/types/dnd'
import type { Ref } from 'vue'
import { computed, markRaw, shallowRef, toValue, watch } from 'vue'
import { useDrag } from './useDrag'
import { useDrop } from './useDrop'

/**
 * A hook for creating sortable lists and grids with drag and drop functionality.
 *
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
  const dragClassToApply = computed(() =>
    toValue(userDragOptions.value.dragClass) || toValue(options.dragClass),
  )

  // --- State Management ---
  const selectedItems = shallowRef<DataItem<T>[]>([]) as Ref<DataItem<T>[]>
  const isDraggingGlobal = shallowRef(false)
  const draggedItemInternal = shallowRef<DataItem<T> | null>(null) as Ref<DataItem<T> | null>
  const currentDropPayloadInternal = shallowRef<SortableDragData<T> | null>(null)

  // Process items with internal state
  const processedItems = computed(() => {
    const currentItems = toValue(options.items)
    const currentSelectedIds = selectedItems.value.map(si => si.id)
    return currentItems.map(item => ({
      ...item,
      selected: currentSelectedIds.includes(item.id),
    }))
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
      userDropOptions.value.onDrop?.(dragEventData, event)
      // Explicitly type payload, it's SortableDragData<T> from our useDrag
      const sortablePayload = dragEventData.payload as SortableDragData<T> | undefined

      if (!sortablePayload || typeof sortablePayload.id === 'undefined' || typeof sortablePayload.index === 'undefined') {
        console.warn('[useDnD] Invalid or incomplete sortable payload received on drop.', sortablePayload)
        currentDropPayloadInternal.value = null
        return
      }

      const currentItems = toValue(options.items)
      const draggedItemId = sortablePayload.id
      const oldIndex = currentItems.findIndex(i => i.id === draggedItemId)

      if (oldIndex === -1) {
        console.warn(`[useDnD] Dragged item with id '${draggedItemId}' not found in current items.`)
        currentDropPayloadInternal.value = null
        return
      }

      const itemToMove = currentItems[oldIndex]

      // Simulate the move to create the new items array
      const newItemsState = [...currentItems]
      const [movedItemActualData] = newItemsState.splice(oldIndex, 1) // Remove item from old position

      // Determine newIndex:
      // For a drop directly onto the container, without specific item-target logic yet,
      // a common interpretation is to move the item to the end of the list,
      // or to a position indicated by a placeholder if that logic were more advanced.
      // The original code used `processedItems.value.length` as a target,
      // which implies adding to the end of the list *as it was before removal*.

      // Let's calculate newIndex as the index where the item is inserted into the modified list.
      // If the intent is to move to the logical "end" of the list:
      const newIndex = newItemsState.length // This will be the index if appended

      // Insert the item at the calculated newIndex
      newItemsState.splice(newIndex, 0, movedItemActualData)

      // Ensure the newIndex correctly reflects the position in the final newItemsState
      const finalNewIndex = newItemsState.findIndex(i => i.id === draggedItemId)

      if (finalNewIndex !== -1) {
        options.onSort?.({
          oldIndex,
          newIndex: finalNewIndex,
          item: itemToMove, // Original item data (DataItem<T>)
          items: newItemsState, // The new, reordered array
        })
        options.onChange?.(newItemsState, 'sort')
      }
      else {
        // This case should ideally not be reached if logic is sound.
        // It means the item was removed but not successfully re-inserted.
        console.warn('[useDnD] Failed to re-insert item during sort simulation. Reverting to original items for onChange.')
        // Call onChange with original items and a specific event type if sort fails
        options.onChange?.(currentItems, 'sort')
      }

      currentDropPayloadInternal.value = null
    },
    onDragEnter: (dragEventData, event) => {
      userDropOptions.value.onDragEnter?.(dragEventData, event)
      currentDropPayloadInternal.value = dragEventData ? dragEventData.payload : null
    },
    onDragOver: (dragEventData, event) => {
      userDropOptions.value.onDragOver?.(dragEventData, event)
    },
    onDragLeave: (dragEventData, event) => {
      userDropOptions.value.onDragLeave?.(dragEventData, event)
      currentDropPayloadInternal.value = null
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
    const allItems = toValue(options.items)
    selectedItems.value = allItems.map(item => markRaw(item) as DataItem<T>)
    options.onSelectionChange?.(selectedItems.value)
  }

  const deselectAll = () => {
    selectedItems.value = []
    options.onSelectionChange?.(selectedItems.value)
  }

  // --- Item Props (Drag Logic per item) ---
  const getItemProps = (item: DataItem<T>, index: number) => {
    const itemRef = shallowRef<HTMLElement | null>(null)

    const sortableItemPayload = computed((): SortableDragData<T> => ({
      type: groupName.value ? `sortable-item-${groupName.value}` : 'sortable-item',
      payload: item.data,
      id: item.id,
      index,
      containerId: groupName.value,
    }))

    const { isDragging: isItemDragging, style: itemStyle } = useDrag<SortableDragData<T>>(itemRef, {
      ...userDragOptions.value,
      data: computed((): DragData<SortableDragData<T>> => ({
        type: toValue(sortableItemPayload).type,
        payload: toValue(sortableItemPayload),
      })),
      onDragStart: (event) => {
        isDraggingGlobal.value = true
        draggedItemInternal.value = item
        userDragOptions.value.onDragStart?.(event)
        if (dragClassToApply.value && itemRef.value) {
          itemRef.value.classList.add(dragClassToApply.value)
        }
      },
      onDragEnd: (event) => {
        isDraggingGlobal.value = false
        draggedItemInternal.value = null
        userDragOptions.value.onDragEnd?.(event)
        if (dragClassToApply.value && itemRef.value) {
          itemRef.value.classList.remove(dragClassToApply.value)
        }
      },
    })

    return {
      key: options.getKey ? options.getKey(item) : item.id,
      ref: (el: any) => { itemRef.value = el as HTMLElement | null },
      style: itemStyle.value,
      draggable: toValue(options.disabled) ? false : isItemDragging.value,
    }
  }

  const containerProps = computed(() => ({
  }))

  // Placeholder for getPlaceholderProps
  const getPlaceholderProps = (_index: number) => {
    return {
      class: ghostClassValue.value,
      style: { display: isDropTarget.value && currentDropPayloadInternal.value ? 'block' : 'none' },
    }
  }

  return {
    processedItems,
    selectedItems,
    isDragging: isDraggingGlobal,
    draggedItem: draggedItemInternal,
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
