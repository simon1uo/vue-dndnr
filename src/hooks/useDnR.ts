import type { MaybeRefOrGetter } from 'vue'
import type { DnROptions, Position, Size } from '../types'
import { computed, ref, toValue, watch } from 'vue'
import { useDraggable } from './useDraggable'
import { useResizable } from './useResizable'

/**
 * Combined hook for draggable and resizable functionality
 * @param target Element to make draggable and resizable
 * @param options Options for draggable and resizable behavior
 * @returns Combined state and methods for draggable and resizable functionality
 */
export function useDnR(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: DnROptions = {}) {
  const {
    draggable: draggableOptions = {},
    resizable: resizableOptions = {},
    disabled = false,
  } = options

  // Apply disabled state to both draggable and resizable options
  const mergedDraggableOptions = {
    ...draggableOptions,
    disabled: disabled || draggableOptions.disabled,
  }

  const mergedResizableOptions = {
    ...resizableOptions,
    disabled: disabled || resizableOptions.disabled,
  }

  // Initialize draggable functionality
  const {
    position,
    isDragging,
    style: draggableStyle,
    setPosition,
    onDragStart,
    onDrag,
    onDragEnd,
  } = useDraggable(target, mergedDraggableOptions)

  // Initialize resizable functionality
  const {
    size,
    isResizing,
    style: resizableStyle,
    activeHandle,
    setSize,
    onResizeStart,
    onResize,
    onResizeEnd,
  } = useResizable(target, mergedResizableOptions)

  // Track whether the element is being interacted with
  const isActive = computed(() => isDragging.value || isResizing.value)

  // Combine styles from both hooks
  const style = computed(() => {
    return {
      ...draggableStyle.value,
      ...resizableStyle.value,
      // Override position to be absolute for proper dragging and resizing
      position: 'absolute' as const,
    }
  })

  // Watch for changes in position and size to update the element
  watch(
    [position, size],
    () => {
      // This watch is just to ensure reactivity between the two hooks
      // The actual updates are handled by the individual hooks
    },
    { deep: true },
  )

  // Return combined state and methods
  return {
    // State
    position,
    size,
    isDragging,
    isResizing,
    isActive,
    activeHandle,
    style,

    // Methods
    setPosition,
    setSize,
    onDragStart,
    onDrag,
    onDragEnd,
    onResizeStart,
    onResize,
    onResizeEnd,
  }
}

export default useDnR
