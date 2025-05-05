import type { ResizableOptions } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { useDnR } from '@/hooks/useDnR'

/**
 * Hook that adds resize functionality to an element
 * @param target - Reference to the element to make resizable
 * @param options - Configuration options for resizable behavior
 * @returns Object containing resizable state and methods
 */
export function useResizable(target: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>, options: ResizableOptions = {}) {
  // Use useDnR with drag disabled
  const {
    size,
    position,
    isResizing,
    isActive,
    style,
    activeHandle,
    hoverHandle,
    setPosition,
    setActive,
    setSize,
    registerHandle,
    unregisterHandle,
    setupHandleElements,
  } = useDnR(target, {
    ...options,
    disableDrag: true,
  })

  return {
    size,
    position,
    isActive,
    isResizing,
    activeHandle,
    hoverHandle,
    style,
    setPosition,
    setSize,
    setActive,
    registerHandle,
    unregisterHandle,
    setupHandleElements,
  }
}

export default useResizable
