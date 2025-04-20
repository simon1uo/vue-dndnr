/**
 * Hook for creating a context for drag and drop operations
 */

import type { InjectionKey } from 'vue'
import type { DraggableElement } from '../types'
import { inject, provide, ref } from 'vue'

// Create a symbol for the injection key
export const DndContextKey: InjectionKey<ReturnType<typeof useDndContext>> = Symbol('DndContext')

export function useDndContext() {
  // Create map to store draggable elements
  const draggableElements = ref<Map<string, DraggableElement>>(new Map())

  // Methods for registration and communication
  const registerDraggable = (id: string, element: DraggableElement) => {
    draggableElements.value.set(id, element)
  }

  const unregisterDraggable = (id: string) => {
    draggableElements.value.delete(id)
  }

  // Return context
  return {
    draggableElements,
    registerDraggable,
    unregisterDraggable,
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
