import type { MaybeRefOrGetter } from 'vue'
import type { DraggableOptions } from './draggable'
import type { ResizableOptions } from './resizable'

/**
 * Combined configuration options for Drag and Resize (DnR) functionality
 * Extends both DraggableOptions and ResizableOptions with additional constraints
 */
export interface DnROptions extends DraggableOptions, ResizableOptions {
  /**
   * Required bounds for the DnR element
   * Must be either an HTML element or 'parent'
   */
  bounds?: MaybeRefOrGetter<
    HTMLElement | 'parent' | null | undefined
  >
}
