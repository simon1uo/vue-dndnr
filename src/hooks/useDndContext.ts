/**
 * Hook for creating a context for drag and drop operations
 */

import type { InjectionKey } from 'vue'
import type { DraggableElement, DroppableElement } from '../types'
import { inject, provide, ref } from 'vue'

// Create a symbol for the injection key
export const DndContextKey: InjectionKey<ReturnType<typeof useDndContext>> = Symbol('DndContext')

export function useDndContext() {
  // Create maps to store draggable and droppable elements
  const draggableElements = ref<Map<string, DraggableElement>>(new Map())
  const droppableElements = ref<Map<string, DroppableElement>>(new Map())

  // Methods for registration and communication
  const registerDraggable = (id: string, element: DraggableElement) => {
    draggableElements.value.set(id, element)
  }

  const registerDroppable = (id: string, element: DroppableElement) => {
    droppableElements.value.set(id, element)
  }

  const unregisterDraggable = (id: string) => {
    draggableElements.value.delete(id)
  }

  const unregisterDroppable = (id: string) => {
    droppableElements.value.delete(id)
  }

  // Return context
  return {
    draggableElements,
    droppableElements,
    registerDraggable,
    registerDroppable,
    unregisterDraggable,
    unregisterDroppable,
  }
}

// Provider function to provide the context
export function provideDndContext() {
  const context = useDndContext()
  provide(DndContextKey, context)
  return context
}

// Consumer function to use the context
export function injectDndContext() {
  const context = inject(DndContextKey)
  if (!context) {
    throw new Error('useDndContext must be used within a DndContext provider')
  }
  return context
}
