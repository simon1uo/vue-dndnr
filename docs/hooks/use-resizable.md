# useResizable

The `useResizable` hook adds resize functionality to any element.

## Basic Usage Demo

<script setup>
import { ref } from 'vue'
import { useResizable } from 'vue-dndnr'

const resizableRef = ref(null)
const { size } = useResizable(resizableRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  bounds: 'parent'
})
</script>

<DemoContainer>
  <div ref="resizableRef" class="resizable-box">
    Resize me!
    <div class="text-sm color-text-light">{{ size.width }} x {{ size.height }}</div>
  </div>
</DemoContainer>

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useResizable } from 'vue-dndnr'

const resizableRef = ref<HTMLElement | null>(null)
const { size } = useResizable(resizableRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  bounds: 'parent'
})
</script>

<template>
  <div ref="resizableRef" class="resizable-box">
    Resize me!
  </div>
</template>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | Reference to the element to make resizable. |
| `options` | `ResizableOptions` | Configuration options for the resizable behavior. |

### Options

#### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialSize` | `Size` | `{ width: 'auto', height: 'auto' }` | Initial size of the resizable element. |
| `minWidth` | `MaybeRefOrGetter<number>` | `0` | Minimum width constraint in pixels. |
| `minHeight` | `MaybeRefOrGetter<number>` | `0` | Minimum height constraint in pixels. |
| `maxWidth` | `MaybeRefOrGetter<number>` | `Infinity` | Maximum width constraint in pixels. |
| `maxHeight` | `MaybeRefOrGetter<number>` | `Infinity` | Maximum height constraint in pixels. |
| `grid` | `MaybeRefOrGetter<[number, number] \| undefined \| null>` | `undefined` | Grid size for snapping during resize. Format: `[width, height]`. |
| `lockAspectRatio` | `MaybeRefOrGetter<boolean>` | `false` | Whether to maintain aspect ratio during resizing. |
| `handleType` | `MaybeRefOrGetter<'borders' \| 'handles' \| 'custom'>` | `'borders'` | Type of resize handles to display. |
| `handles` | `MaybeRefOrGetter<ResizeHandle[]>` | `['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']` | Active resize handles to enable. |
| `bounds` | `MaybeRefOrGetter<HTMLElement \| 'parent' \| null \| undefined>` | `undefined` | Element or selector to use as bounds for the resizable element. |
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | Whether resizing is disabled. |
| `initialActive` | `boolean` | `false` | Initial active state of the element. |
| `activeOn` | `MaybeRefOrGetter<'click' \| 'hover' \| 'none'>` | `'none'` | Determines how the element becomes active. Can be `'click'`, `'hover'`, or `'none'` (always active). |
| `preventDeactivation` | `MaybeRefOrGetter<boolean>` | `false` | When true, the element will stay active even when clicking outside or leaving the element. |

#### Event Control Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pointerTypes` | `MaybeRefOrGetter<PointerType[] \| null \| undefined>` | `['mouse', 'touch', 'pen']` | Types of pointer events to respond to. |
| `preventDefault` | `MaybeRefOrGetter<boolean>` | `true` | Whether to prevent default browser events during resize. |
| `stopPropagation` | `MaybeRefOrGetter<boolean>` | `false` | Whether to stop event propagation to parent elements. |
| `capture` | `MaybeRefOrGetter<boolean>` | `true` | Whether to use event capturing phase. |
| `handlesSize` | `MaybeRefOrGetter<number>` | `8` | Size of the handle or border detection area in pixels. For `borders`, sets border detection area; for `handles`/`custom`, sets handle size. |
| `handleBorderStyle` | `MaybeRefOrGetter<string>` | `'none'` | Border style for handleType 'borders'. Accepts any valid CSS border value. |
| `throttleDelay` | `MaybeRefOrGetter<number>` | `16` | Delay in milliseconds for throttling resize events (approximately 60fps). |

#### Callback Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onResizeStart` | `(size: Size, event: PointerEvent) => void` | `undefined` | Called when resizing starts. |
| `onResize` | `(size: Size, event: PointerEvent) => void` | `undefined` | Called during resizing. |
| `onResizeEnd` | `(size: Size, event: PointerEvent) => void` | `undefined` | Called when resizing ends. |
| `onActiveChange` | `(active: boolean) => void \| boolean` | `undefined` | Called when the active state changes. Return `false` to prevent active state change. |

## Return Value

The `useResizable` hook returns an object with the following properties and methods:

::: warning Important Note
Unlike what some examples might suggest, the `useResizable` hook does not return a `style` object. Instead, it directly applies styles to the target element. The examples in the documentation that use `:style="style"` are incorrect and will be updated.
:::

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `size` | `Ref<Size>` | Current size of the element. |
| `position` | `Ref<Position>` | Current position of the element (when using absolute positioning). |
| `isResizing` | `Ref<boolean>` | Whether the element is currently being resized. |
| `isActive` | `Ref<boolean>` | Whether the element is currently active. |
| `activeHandle` | `Ref<ResizeHandle \| null>` | Currently active resize handle. |
| `hoverHandle` | `Ref<ResizeHandle \| null>` | Currently hovered resize handle. |
| `isAbsolutePositioned` | `Ref<boolean>` | Whether the element uses absolute positioning. |
| `handleType` | `ComputedRef<'borders' \| 'handles' \| 'custom'>` | Current handle type being used. |
| `handleElements` | `Ref<Map<ResizeHandle, HTMLElement>>` | Map of handle elements for 'handles' or 'custom' mode. |

| `setSize` | `(newSize: Size) => void` | Function to programmatically set the size. |
| `setPosition` | `(newPosition: Position) => void` | Function to programmatically set the position. |
| `setActive` | `(active: boolean) => void` | Function to programmatically set the active state. |
| `onResizeStart` | `(event: PointerEvent) => void` | Handler for resize start event. |
| `onResize` | `(event: PointerEvent) => void` | Handler for resize event. |
| `onResizeEnd` | `(event: PointerEvent) => void` | Handler for resize end event. |
| `detectBoundary` | `(event: PointerEvent, element: HTMLElement) => ResizeHandle \| null` | Function to detect handle at pointer position. |
| `registerHandle` | `(handle: ResizeHandle, element: HTMLElement) => void` | Register a handle element for 'handles' or 'custom' mode. |
| `unregisterHandle` | `(handle: ResizeHandle) => void` | Unregister a handle element. |

::: details Show Type Definitions

```typescript
interface Size {
  /** The width value (can be a number in pixels or a CSS string value) */
  width: number | string
  /** The height value (can be a number in pixels or a CSS string value) */
  height: number | string
}

interface Position {
  /** The horizontal coordinate */
  x: number
  /** The vertical coordinate */
  y: number
}

type ResizeHandle = 't' | 'b' | 'r' | 'l' | 'tr' | 'tl' | 'br' | 'bl' |
  'top' | 'bottom' | 'right' | 'left' |
  'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

type ResizeHandleType = 'borders' | 'handles' | 'custom'

type PointerType = 'mouse' | 'touch' | 'pen'
```

:::
