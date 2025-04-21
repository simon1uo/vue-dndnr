/**
 * Types for the DnR (Drag and Resize) component
 */

import type { DraggableOptions, Position } from './draggable'
import type { ResizableOptions, Size } from './resizable'

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
