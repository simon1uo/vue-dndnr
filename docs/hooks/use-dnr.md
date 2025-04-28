# useDnR

The `useDnR` hook combines both drag and resize functionality into a single hook.

## Basic Usage Demo

<script setup lang="ts">
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const dnrRef = ref(null)
const { style, position, size } = useDnR(dnrRef, {
  initialPosition: { x: 0, y: 0 },
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  bounds: 'parent'
})
</script>

<DemoContainer>
  <div ref="dnrRef":style="style">
    <div class="dnr-box">
      Drag & Resize me!
      <div class="text-sm color-text-light">Position: {{ position.x }}, {{ position.y }}</div>
      <div class="text-sm color-text-light">Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </div>
</DemoContainer>

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const dnrRef = ref<HTMLElement | null>(null)
const { style } = useDnR(dnrRef, {
  initialPosition: { x: 0, y: 0 },
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  bounds: 'parent'
})
</script>

<template>
  <div ref="dnrRef" :style="style">
    <div class="dnr-box">
      Drag & Resize me!
      <div>
        Position: {{ position.x }}, {{ position.y }}
      </div>
      <div>
        Size: {{ size.width }} x {{ size.height }}
      </div>
    </div>
  </div>
</template>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | Reference to the element to make draggable and resizable. |
| `options` | `DnROptions` | Configuration options for the draggable and resizable behavior. |

### Options

The `useDnR` hook combines all options from both the `useDraggable` and `useResizable` hooks. The `DnROptions` interface extends both `DraggableOptions` and `ResizableOptions`.

#### Common Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | Whether all interactions are disabled. |
| `bounds` | `MaybeRefOrGetter<HTMLElement \| 'parent' \| null \| undefined>` | `undefined` | Element or selector to use as bounds for the element. |
| `grid` | `MaybeRefOrGetter<[number, number] \| undefined \| null>` | `undefined` | Grid size for snapping during interactions. |
| `pointerTypes` | `MaybeRefOrGetter<PointerType[] \| null \| undefined>` | `['mouse', 'touch', 'pen']` | Types of pointer events to respond to. |
| `preventDefault` | `MaybeRefOrGetter<boolean>` | `true` | Whether to prevent default browser events. |
| `stopPropagation` | `MaybeRefOrGetter<boolean>` | `false` | Whether to stop event propagation to parent elements. |
| `capture` | `MaybeRefOrGetter<boolean>` | `true` | Whether to use event capturing phase. |
| `throttleDelay` | `MaybeRefOrGetter<number>` | `16` | Delay in milliseconds for throttling events. |

#### Draggable Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialPosition` | `Position` | `{ x: 0, y: 0 }` | Initial position of the element. |
| `handle` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | `target` | Element that triggers dragging (drag handle). |
| `axis` | `MaybeRefOrGetter<'x' \| 'y' \| 'both'>` | `'both'` | Axis to constrain dragging movement. |
| `scale` | `MaybeRefOrGetter<number>` | `1` | Scale factor for the draggable element. |
| `onDragStart` | `(position: Position, event: PointerEvent) => void \| boolean` | `undefined` | Called when dragging starts. |
| `onDrag` | `(position: Position, event: PointerEvent) => void \| boolean` | `undefined` | Called during dragging. |
| `onDragEnd` | `(position: Position, event: PointerEvent) => void \| boolean` | `undefined` | Called when dragging ends. |

#### Resizable Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialSize` | `Size` | `{ width: 'auto', height: 'auto' }` | Initial size of the element. |
| `minWidth` | `MaybeRefOrGetter<number>` | `0` | Minimum width constraint in pixels. |
| `minHeight` | `MaybeRefOrGetter<number>` | `0` | Minimum height constraint in pixels. |
| `maxWidth` | `MaybeRefOrGetter<number>` | `Infinity` | Maximum width constraint in pixels. |
| `maxHeight` | `MaybeRefOrGetter<number>` | `Infinity` | Maximum height constraint in pixels. |
| `handles` | `MaybeRefOrGetter<ResizeHandle[]>` | `['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']` | Active resize handles to enable. |
| `lockAspectRatio` | `MaybeRefOrGetter<boolean>` | `false` | Whether to maintain aspect ratio during resizing. |
| `boundaryThreshold` | `MaybeRefOrGetter<number>` | `8` | Distance in pixels from edges to detect resize handles. |
| `onResizeStart` | `(size: Size, event: PointerEvent) => void` | `undefined` | Called when resizing starts. |
| `onResize` | `(size: Size, event: PointerEvent) => void` | `undefined` | Called during resizing. |
| `onResizeEnd` | `(size: Size, event: PointerEvent) => void` | `undefined` | Called when resizing ends. |

## Return Value

The `useDnR` hook returns an object with the following properties and methods:

::: warning Important Note
The `style` object returned by `useDnR` is a computed style object that combines the position styles from `useDraggable` with the size styles. This is different from `useResizable`, which directly applies styles to the target element without returning a style object.
:::

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `position` | `Ref<Position>` | Current position of the element. |
| `size` | `Ref<Size>` | Current size of the element. |
| `isDragging` | `Ref<boolean>` | Whether the element is currently being dragged. |
| `isResizing` | `Ref<boolean>` | Whether the element is currently being resized. |
| `interactionMode` | `Ref<'idle' \| 'dragging' \| 'resizing'>` | Current interaction state. |
| `activeHandle` | `Ref<ResizeHandle \| null>` | Currently active resize handle. |
| `hoverHandle` | `Ref<ResizeHandle \| null>` | Currently hovered resize handle. |
| `isAbsolutePositioned` | `Ref<boolean>` | Whether the element uses absolute positioning. |
| `isNearResizeHandle` | `Ref<boolean>` | Whether the mouse is near a resize handle. |
| `style` | `ComputedRef<CSSProperties>` | Combined style object for positioning and sizing. |
| `setPosition` | `(newPosition: Position) => void` | Function to programmatically set the position. |
| `setSize` | `(newSize: Size) => void` | Function to programmatically set the size. |
| `onDragStart` | `(event: PointerEvent) => void` | Handler for drag start event. |
| `onDrag` | `(event: PointerEvent) => void` | Handler for drag event. |
| `onDragEnd` | `(event: PointerEvent) => void` | Handler for drag end event. |
| `onResizeStart` | `(event: PointerEvent) => void` | Handler for resize start event. |
| `onResize` | `(event: PointerEvent) => void` | Handler for resize event. |
| `onResizeEnd` | `(event: PointerEvent) => void` | Handler for resize end event. |
| `detectBoundary` | `(event: PointerEvent, element: HTMLElement) => ResizeHandle \| null` | Function to detect handle at pointer position. |

::: details Show Type Definitions

```typescript
interface Position {
  /** The horizontal coordinate */
  x: number
  /** The vertical coordinate */
  y: number
}

interface Size {
  /** The width value (can be a number in pixels or a CSS string value) */
  width: number | string
  /** The height value (can be a number in pixels or a CSS string value) */
  height: number | string
}

type ResizeHandle = 't' | 'b' | 'r' | 'l' | 'tr' | 'tl' | 'br' | 'bl' |
  'top' | 'bottom' | 'right' | 'left' |
  'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

type PointerType = 'mouse' | 'touch' | 'pen'
```

:::
