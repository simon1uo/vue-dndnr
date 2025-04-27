declare module 'vue-dndnr' {
  import type { Component } from 'vue'

  export const Draggable: Component
  export const Resizable: Component
  export const DnR: Component

  export function useDraggable(
    target: any,
    options?: any
  ): {
    position: any
    isDragging: any
    [key: string]: any
  }

  export function useResizable(
    target: any,
    options?: any
  ): {
    size: any
    isResizing: any
    [key: string]: any
  }

  export function useDnR(
    target: any,
    options?: any
  ): {
    position: any
    size: any
    isDragging: any
    isResizing: any
    [key: string]: any
  }
}
