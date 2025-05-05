import type { DnROptions, Position, Size } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import useDraggable from '@/hooks/useDraggable'
import useResizable from '@/hooks/useResizable'
import { computed, ref, watch } from 'vue'

/**
 * Combined hook for draggable and resizable functionality (DnR)
 * @param target - Reference to the element to make draggable and resizable
 * @param options - Combined configuration options for drag and resize behavior
 * @returns {object} Object containing:
 *   - position: Current position of the element
 *   - size: Current size of the element
 *   - isDragging: Whether the element is being dragged
 *   - isResizing: Whether the element is being resized
 *   - interactionMode: Current interaction state ('idle', 'dragging', or 'resizing')
 *   - style: Combined style object for positioning and sizing
 *   - setPosition: Function to programmatically set position
 *   - setSize: Function to programmatically set size
 *   - Additional event handlers and utility methods
 */
export function useDnR(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: DnROptions) {
  const interactionMode = ref<'idle' | 'dragging' | 'resizing'>('idle')
  const isNearResizeHandle = ref(false)
  const isActive = ref(options.initialActive ?? false)

  /**
   * Set the active state and trigger callback
   * @param value - New active state
   */
  const setActive = (value: boolean) => {
    if (value === isActive.value)
      return

    // Call the callback and check if we should prevent the change
    if (options.onActiveChange?.(value) === false)
      return

    isActive.value = value
  }

  const draggableOptions = computed(() => {
    const {
      onDragStart: originalDragStart,
      onDrag: originalDrag,
      onDragEnd: originalDragEnd,
      onActiveChange: originalActiveChange,
      initialActive,
      activeOn = 'none',
      ...restOptions
    } = options

    return {
      ...restOptions,
      initialActive,
      activeOn,
      disabled: options.disabled || interactionMode.value === 'resizing' || isNearResizeHandle.value,
      onDragStart: (position: Position, event: PointerEvent) => {
        if (interactionMode.value === 'resizing' || isNearResizeHandle.value)
          return false

        interactionMode.value = 'dragging'
        return originalDragStart?.(position, event)
      },
      onDrag: (position: Position, event: PointerEvent) => {
        if (interactionMode.value !== 'dragging')
          return false
        return originalDrag?.(position, event)
      },
      onDragEnd: (position: Position, event: PointerEvent) => {
        if (interactionMode.value !== 'dragging')
          return false
        interactionMode.value = 'idle'
        return originalDragEnd?.(position, event)
      },
      onActiveChange: (active: boolean) => {
        setActive(active)
        return originalActiveChange?.(active)
      },
    }
  })

  const resizableOptions = computed(() => {
    const {
      onResizeStart: originalResizeStart,
      onResize: originalResize,
      onResizeEnd: originalResizeEnd,
      onActiveChange: originalActiveChange,
      initialActive,
      activeOn = 'none',
      ...restOptions
    } = options

    return {
      ...restOptions,
      initialActive,
      activeOn,
      disabled: options.disabled || interactionMode.value === 'dragging',
      onResizeStart: (size: Size, event: PointerEvent) => {
        if (interactionMode.value === 'dragging')
          return

        interactionMode.value = 'resizing'
        originalResizeStart?.(size, event)
      },
      onResize: (size: Size, event: PointerEvent) => {
        if (interactionMode.value !== 'resizing')
          return
        originalResize?.(size, event)
      },
      onResizeEnd: (size: Size, event: PointerEvent) => {
        if (interactionMode.value !== 'resizing')
          return
        interactionMode.value = 'idle'
        originalResizeEnd?.(size, event)
      },
      onActiveChange: (active: boolean) => {
        setActive(active)
        return originalActiveChange?.(active)
      },
    }
  })

  const {
    position,
    isDragging,
    isActive: draggableIsActive,
    style: draggableStyle,
    setPosition,
    setActive: _setDraggableActive, // Unused but needed for destructuring
    onDragStart,
    onDrag,
    onDragEnd,
  } = useDraggable(target, draggableOptions.value)

  const {
    size,
    position: resizablePosition,
    isResizing,
    isActive: resizableIsActive,
    activeHandle,
    hoverHandle,
    isAbsolutePositioned,
    style: resizableStyle,
    setSize,
    setPosition: setResizablePosition,
    setActive: _setResizableActive, // Unused but needed for destructuring
    onResizeStart,
    onResize,
    onResizeEnd,
    detectBoundary,
    handleType,
    registerHandle,
    unregisterHandle,
    setupHandleElements,
  } = useResizable(target, resizableOptions.value)

  watch(hoverHandle, (newHandle) => {
    isNearResizeHandle.value = newHandle !== null
  })

  watch(position, (newPosition) => {
    if (interactionMode.value === 'dragging' && isAbsolutePositioned.value) {
      setResizablePosition(newPosition)
    }
  }, { deep: true })

  watch(resizablePosition, (newPosition) => {
    if (interactionMode.value === 'resizing') {
      setPosition(newPosition)
    }
  }, { deep: true })

  // Sync active state between draggable and resizable
  watch(draggableIsActive, (newActive) => {
    if (newActive !== isActive.value) {
      setActive(!!newActive)
    }
  })

  watch(resizableIsActive, (newActive) => {
    if (newActive !== isActive.value) {
      setActive(!!newActive)
    }
  })

  const style = computed(() => {
    return {
      ...draggableStyle.value,
      ...resizableStyle.value,
    }
  })

  return {
    position,
    size,
    isDragging,
    isResizing,
    isActive,
    interactionMode,
    activeHandle,
    hoverHandle,
    isAbsolutePositioned,
    isNearResizeHandle,
    handleType,

    style,

    setPosition,
    setSize,
    setActive,

    onDragStart,
    onDrag,
    onDragEnd,
    onResizeStart,
    onResize,
    onResizeEnd,
    detectBoundary,
    registerHandle,
    unregisterHandle,
    setupHandleElements,
  }
}

export default useDnR
