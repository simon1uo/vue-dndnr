import type { MaybeRefOrGetter } from 'vue'
import type { DraggableOptions } from './draggable'
import type { ResizableOptions } from './resizable'

/**
 * Combined options for DnR (Drag and Resize)
 */
export interface DnROptions extends DraggableOptions, ResizableOptions {
  bounds: MaybeRefOrGetter<
    HTMLElement | 'parent'
  >
}
