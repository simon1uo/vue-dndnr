/**
 * Types for the DnR (Drag and Resize) component
 */

import type { DraggableOptions } from './draggable'
import type { ResizableOptions } from './resizable'

/**
 * Combined options for DnR (Drag and Resize)
 */
export interface DnROptions {
  /**
   * Draggable options
   */
  draggable?: DraggableOptions

  /**
   * Resizable options
   */
  resizable?: ResizableOptions

  /**
   * Whether DnR functionality is disabled
   * @default false
   */
  disabled?: boolean
}
