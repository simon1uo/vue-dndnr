import type { DnROptions, Position, Size } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import useDraggable from '@/hooks/useDraggable'
import useResizable from '@/hooks/useResizable'
import { computed, ref, watch } from 'vue'

/**
 * Combined hook for draggable and resizable functionality
 */
export function useDnR(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: DnROptions) {
  const interactionMode = ref<'idle' | 'dragging' | 'resizing'>('idle')
  const isNearResizeHandle = ref(false)

  const draggableOptions = computed(() => {
    const {
      onDragStart: originalDragStart,
      onDrag: originalDrag,
      onDragEnd: originalDragEnd,
      ...restOptions
    } = options

    return {
      ...restOptions,
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
    }
  })

  const resizableOptions = computed(() => {
    const {
      onResizeStart: originalResizeStart,
      onResize: originalResize,
      onResizeEnd: originalResizeEnd,
      ...restOptions
    } = options

    return {
      ...restOptions,
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
    }
  })

  const {
    position,
    isDragging,
    style: draggableStyle,
    setPosition,
    onDragStart,
    onDrag,
    onDragEnd,
  } = useDraggable(target, draggableOptions.value)

  const {
    size,
    position: resizablePosition,
    isResizing,
    activeHandle,
    hoverHandle,
    isAbsolutePositioned,
    setSize,
    setPosition: setResizablePosition,
    onResizeStart,
    onResize,
    onResizeEnd,
    detectBoundary,
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

  const style = computed(() => {
    return {
      ...draggableStyle.value,
      width: typeof size.value.width === 'number' ? `${size.value.width}px` : size.value.width,
      height: typeof size.value.height === 'number' ? `${size.value.height}px` : size.value.height,
    }
  })

  return {
    position,
    size,
    isDragging,
    isResizing,
    interactionMode,
    activeHandle,
    hoverHandle,
    isAbsolutePositioned,
    isNearResizeHandle,

    style,

    setPosition,
    setSize,

    onDragStart,
    onDrag,
    onDragEnd,
    onResizeStart,
    onResize,
    onResizeEnd,
    detectBoundary,
  }
}

export default useDnR
