import type { MaybeRefOrGetter } from 'vue'
import type { DraggableOptions } from './draggable'
import type { ResizableOptions } from './resizable'

/**
 * Combined configuration options for Drag and Resize (DnR) functionality
 * Extends both DraggableOptions and ResizableOptions with additional constraints
 */
export interface DnROptions extends DraggableOptions, ResizableOptions {
  /**
   * Initial active state of the element
   * Only active elements can be dragged/resized when activeOn is not 'none'
   * @default false
   */
  initialActive?: boolean

  /**
   * Required bounds for the DnR element
   * Must be either an HTML element or 'parent'
   */
  bounds?: MaybeRefOrGetter<
    HTMLElement | 'parent' | null | undefined
  >
}
