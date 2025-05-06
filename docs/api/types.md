# Type Definitions

Vue DNDNR provides a comprehensive set of TypeScript type definitions to ensure type safety when using the library.

## Core Types

### Position

```typescript
interface Position {
  /** The horizontal coordinate */
  x: number
  /** The vertical coordinate */
  y: number
}
```

### Size

```typescript
interface Size {
  /** The width value (can be a number in pixels or a CSS string value) */
  width: number | string
  /** The height value (can be a number in pixels or a CSS string value) */
  height: number | string
}
```

### PointerType

```typescript
type PointerType = 'mouse' | 'touch' | 'pen'
```

### ActivationTrigger

```typescript
/**
 * Type for activation trigger
 * - 'click': Element becomes active when clicked
 * - 'hover': Element becomes active when hovered
 * - 'none': Element is always active (traditional behavior)
 */
type ActivationTrigger = 'click' | 'hover' | 'none'
```

### PositionType

```typescript
/**
 * Valid position types for positioning elements
 */
type PositionType = 'absolute' | 'relative'
```

## Resize Handle Types

### ResizeHandle

```typescript
/**
 * Valid resize handle positions
 * Supports both short ('t', 'b', etc.) and long ('top', 'bottom', etc.) formats
 */
type ResizeHandle = 
  | 't' | 'b' | 'r' | 'l' 
  | 'tr' | 'tl' | 'br' | 'bl' 
  | 'top' | 'bottom' | 'right' | 'left' 
  | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
```

### ResizeHandleType

```typescript
/**
 * Type of resize handles to display
 */
type ResizeHandleType = 'borders' | 'handles' | 'custom' | 'none'
```

## Configuration Options

### DnROptions

```typescript
/**
 * Combined configuration options for Drag and Resize (DnR) functionality
 * This is the shared options interface used by useDnR, useDraggable, and useResizable
 */
interface DnROptions {
  /**
   * Initial position of the element
   * @default { x: 0, y: 0 }
   */
  initialPosition?: Position

  /**
   * Initial size of the resizable element
   * @default { width: 'auto', height: 'auto' }
   */
  initialSize?: Size

  /**
   * Initial active state of the element
   * Only active elements can be dragged/resized when activeOn is not 'none'
   * @default false
   */
  initialActive?: boolean

  /**
   * Whether all interactions are disabled
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean>

  /**
   * Whether dragging is disabled
   * @default false
   */
  disableDrag?: MaybeRefOrGetter<boolean>

  /**
   * Whether resizing is disabled
   * @default false
   */
  disableResize?: MaybeRefOrGetter<boolean>

  /**
   * Types of pointer events to respond to
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: MaybeRefOrGetter<PointerType[]>

  /**
   * Whether to prevent default browser events
   * @default true
   */
  preventDefault?: MaybeRefOrGetter<boolean>

  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: MaybeRefOrGetter<boolean>

  /**
   * Whether to use event capturing phase
   * @default true
   */
  capture?: MaybeRefOrGetter<boolean>

  /**
   * How the element becomes active
   * - 'click': Element becomes active when clicked
   * - 'hover': Element becomes active when hovered
   * - 'none': Element is always active (traditional behavior)
   * @default 'none'
   */
  activeOn?: MaybeRefOrGetter<ActivationTrigger>

  /**
   * When true, the element will stay active even when clicking outside
   * @default false
   */
  preventDeactivation?: MaybeRefOrGetter<boolean>

  /**
   * Delay in ms for throttling move events
   * @default 16
   */
  throttleDelay?: number

  // Drag-specific options
  /**
   * Element for calculating bounds (If not set, it will use the event's target)
   */
  containerElement?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * Grid size for snapping during drag and resize
   * @type [number, number] - [x, y] coordinates for grid spacing
   */
  grid?: MaybeRefOrGetter<[number, number] | undefined | null>

  /**
   * Axis to constrain dragging movement
   * @default 'both'
   */
  axis?: MaybeRefOrGetter<'x' | 'y' | 'both'>

  /**
   * Element that triggers dragging (drag handle)
   * @default the draggable element itself
   */
  handle?: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined>

  /**
   * Scale factor for the draggable element
   * @default 1
   */
  scale?: MaybeRefOrGetter<number>

  // Resize-specific options
  /**
   * CSS position type
   * @default 'absolute'
   */
  positionType?: MaybeRefOrGetter<PositionType>

  /**
   * Minimum width constraint in pixels
   */
  minWidth?: MaybeRefOrGetter<number>

  /**
   * Minimum height constraint in pixels
   */
  minHeight?: MaybeRefOrGetter<number>

  /**
   * Maximum width constraint in pixels
   * @default Infinity
   */
  maxWidth?: MaybeRefOrGetter<number>

  /**
   * Maximum height constraint in pixels
   * @default Infinity
   */
  maxHeight?: MaybeRefOrGetter<number>

  /**
   * Whether to maintain aspect ratio during resizing
   * @default false
   */
  lockAspectRatio?: MaybeRefOrGetter<boolean>

  /**
   * Type of resize handles to display
   * - 'borders': Use element borders as resize handles (default)
   * - 'handles': Display visible handles at corners and edges
   * - 'custom': Use custom handles provided via slots
   * @default 'borders'
   */
  handleType?: MaybeRefOrGetter<ResizeHandleType>

  /**
   * Active resize handles to enable
   * @default ['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']
   */
  handles?: MaybeRefOrGetter<ResizeHandle[]>

  /**
   * Custom handle elements to use when handleType is 'custom'
   * Map of handle positions to HTML elements
   */
  customHandles?: MaybeRefOrGetter<Map<ResizeHandle, HTMLElement> | null | undefined>

  /**
   * Size of the handle or border detection area in pixels
   * - For handleType 'borders': sets the border detection area size
   * - For handleType 'handles' or 'custom': sets the handle element size
   * @default 8
   */
  handlesSize?: MaybeRefOrGetter<number>

  /**
   * Border style for handleType 'borders'.
   * Accepts any valid CSS border value. Default is 'none'.
   * @default 'none'
   */
  handleBorderStyle?: MaybeRefOrGetter<string>

  // Callbacks
  /**
   * Called when dragging starts
   */
  onDragStart?: (position: Position, event: PointerEvent) => void

  /**
   * Called during dragging
   */
  onDrag?: (position: Position, event: PointerEvent) => void

  /**
   * Called when dragging ends
   */
  onDragEnd?: (position: Position, event: PointerEvent) => void

  /**
   * Called when resizing starts
   */
  onResizeStart?: (size: Size, event: PointerEvent, handle: ResizeHandle) => void

  /**
   * Called during resizing
   */
  onResize?: (size: Size, event: PointerEvent, handle: ResizeHandle) => void

  /**
   * Called when resizing ends
   */
  onResizeEnd?: (size: Size, event: PointerEvent, handle: ResizeHandle) => void

  /**
   * Called when active state changes
   * Return false to prevent the change
   */
  onActiveChange?: (active: boolean) => boolean | void
}
```
