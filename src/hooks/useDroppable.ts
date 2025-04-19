/**
 * Hook for adding droppable functionality to an element
 */

import type { DroppableOptions } from '../types'
import { onMounted, onUnmounted, ref } from 'vue'

export function useDroppable(options: DroppableOptions = {}) {
  const {
    accept,
    disabled = false,
    greedy = false,
  } = options

  // State
  const isOver = ref(false)
  const elementRef = ref<HTMLElement | null>(null)

  // Event handlers
  const onDragEnter = (event: DragEvent) => {
    if (disabled)
      return

    event.preventDefault()

    // Check if the dragged element is acceptable
    if (accept) {
      const draggedElement = event.target as HTMLElement

      if (typeof accept === 'string') {
        // Check if the dragged element matches the selector
        if (!draggedElement.matches(accept))
          return
      }
      else if (typeof accept === 'function') {
        // Check if the dragged element passes the function check
        if (!accept(draggedElement))
          return
      }
    }

    isOver.value = true

    // Stop propagation if greedy
    if (greedy) {
      event.stopPropagation()
    }
  }

  const onDragOver = (event: DragEvent) => {
    if (disabled || !isOver.value)
      return

    event.preventDefault()

    // Stop propagation if greedy
    if (greedy) {
      event.stopPropagation()
    }
  }

  const onDragLeave = (event: DragEvent) => {
    if (disabled || !isOver.value)
      return

    // Check if the leave event is for this element or a child element
    const relatedTarget = event.relatedTarget as Node
    if (elementRef.value && elementRef.value.contains(relatedTarget)) {
      return
    }

    isOver.value = false
  }

  const onDrop = (event: DragEvent) => {
    if (disabled || !isOver.value)
      return

    event.preventDefault()
    isOver.value = false

    // Stop propagation if greedy
    if (greedy) {
      event.stopPropagation()
    }
  }

  // Setup and cleanup
  onMounted(() => {
    if (elementRef.value) {
      // Add event listeners
      elementRef.value.addEventListener('dragenter', onDragEnter)
      elementRef.value.addEventListener('dragover', onDragOver)
      elementRef.value.addEventListener('dragleave', onDragLeave)
      elementRef.value.addEventListener('drop', onDrop)
    }
  })

  onUnmounted(() => {
    if (elementRef.value) {
      // Remove event listeners
      elementRef.value.removeEventListener('dragenter', onDragEnter)
      elementRef.value.removeEventListener('dragover', onDragOver)
      elementRef.value.removeEventListener('dragleave', onDragLeave)
      elementRef.value.removeEventListener('drop', onDrop)
    }
  })

  // Methods
  const setAccept = (newAccept: string | ((draggedElement: HTMLElement) => boolean)) => {
    options.accept = newAccept
  }

  // Return values and methods
  return {
    isOver,
    elementRef,
    setAccept,
  }
}
