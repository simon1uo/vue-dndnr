import type { ActivationTrigger, DnROptions } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { useDnR } from '@/hooks/useDnR'
import { computed } from 'vue'

/**
 * Hook that adds drag functionality to an element
 * @param target - Reference to the element to make draggable
 * @param options - Configuration options for draggable behavior
 * @returns Object containing draggable state and methods
 */
export function useDraggable(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: DnROptions = {}) {
  const {
    initialPosition = { x: 0, y: 0 },
    handle = target,
    draggingElement,
    containerElement,
    grid,
    axis = 'both',
    scale = 1,
    disabled = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
    capture = true,
    initialActive = false,
    activeOn = 'none' as ActivationTrigger,
    preventDeactivation = false,
    onDragStart,
    onDrag,
    onDragEnd,
    onActiveChange,
    throttleDelay = 16, // Default to ~60fps
  } = options

  // Use useDnR with resize disabled
  const {
    position,
    isDragging,
    isActive,
    setPosition,
    setActive,
  } = useDnR(target, {
    initialPosition,
    handle,
    draggingElement,
    containerElement,
    grid,
    axis,
    scale,
    disabled,
    disableResize: true, // Disable resize functionality
    pointerTypes,
    preventDefault,
    stopPropagation,
    capture,
    initialActive,
    activeOn,
    preventDeactivation,
    onDragStart,
    onDrag,
    onDragEnd,
    onActiveChange,
    throttleDelay,
    // Set default position type to absolute for draggable
    positionType: 'absolute',
  })

  // Create a style object that matches the original useDraggable API
  const style = computed(() => ({
    position: 'absolute' as const,
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    touchAction: 'none' as const,
    userSelect: 'none' as const,
  }))

  // Expose the same API as the original useDraggable
  return {
    position,
    isDragging,
    isActive,
    style,
    setPosition,
    setActive,
  }
}

export default useDraggable
