# useResizable

The `useResizable` hook adds resize functionality to any element.

## Basic Usage Demo

<script setup>
import { ref } from 'vue'
import { useResizable } from 'vue-dndnr'

const resizableRef = ref(null)
const { style, size } = useResizable(resizableRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  bounds: 'parent'
})
</script>

<DemoContainer>
  <div ref="resizableRef" class="resizable-box" :style="style">
    Resize me!
    <div class="text-xs mt-1">{{ size.width }} x {{ size.height }}</div>
  </div>
</DemoContainer>

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useResizable } from 'vue-dndnr'

const resizableRef = ref<HTMLElement | null>(null)
const { style } = useResizable(resizableRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  bounds: 'parent'
})
</script>

<template>
  <div ref="resizableRef" class="resizable-box" :style="style">
    Resize me!
  </div>
</template>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementRef` | `Ref<HTMLElement>` | Reference to the element to make resizable. |
| `options` | `Object` | Configuration options for the resizable behavior. |

### Options

#### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialSize` | `Object` | `{ width: 'auto', height: 'auto' }` | Initial size of the element. |
| `minWidth` | `Number` | `10` | Minimum width in pixels. |
| `minHeight` | `Number` | `10` | Minimum height in pixels. |
| `maxWidth` | `Number\|null` | `null` | Maximum width in pixels. |
| `maxHeight` | `Number\|null` | `null` | Maximum height in pixels. |
| `disabled` | `Boolean` | `false` | Whether resizing is disabled. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[width, height]`. |
| `handles` | `Array` | `['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']` | Array of handles to display. |
| `lockAspectRatio` | `Boolean` | `false` | Whether to maintain the aspect ratio when resizing. |
| `scale` | `Number` | `1` | Scale factor for the resizable element. |

#### Event Control Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pointerTypes` | `Array` | `['mouse', 'touch', 'pen']` | Array of supported pointer types. |
| `preventDefault` | `Boolean` | `true` | Whether to prevent default event behavior. |
| `stopPropagation` | `Boolean` | `false` | Whether to stop event propagation. |
| `capture` | `Boolean` | `true` | Whether to use event capture phase. |
| `boundaryThreshold` | `Number` | `8` | Threshold in pixels for handle detection. |
| `throttleDelay` | `Number` | `16` | Throttle delay in milliseconds for resize events. |

#### Callback Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onResizeStart` | `Function` | `null` | Callback function called when resizing starts. |
| `onResize` | `Function` | `null` | Callback function called during resizing. |
| `onResizeEnd` | `Function` | `null` | Callback function called when resizing ends. |

## Return Value

### State

| Property | Type | Description |
|----------|------|-------------|
| `size` | `Ref<{ width: number\|string, height: number\|string }>` | Current size of the element. |
| `position` | `Ref<{ x: number, y: number }>` | Current position of the element. |
| `isResizing` | `Ref<boolean>` | Whether the element is currently being resized. |
| `activeHandle` | `Ref<ResizeHandle \| null>` | Currently active resize handle. |
| `hoverHandle` | `Ref<ResizeHandle \| null>` | Currently hovered resize handle. |
| `isAbsolutePositioned` | `Ref<boolean>` | Whether the element uses absolute positioning. |

### Methods

| Method | Type | Description |
|--------|------|-------------|
| `setSize` | `(size: { width: number\|string, height: number\|string }) => void` | Function to programmatically set the size. |
| `setPosition` | `(position: { x: number, y: number }) => void` | Function to programmatically set the position. |
| `onResizeStart` | `(event: PointerEvent) => void` | Handler for resize start event. |
| `onResize` | `(event: PointerEvent) => void` | Handler for resize event. |
| `onResizeEnd` | `(event: PointerEvent) => void` | Handler for resize end event. |
| `detectBoundary` | `(event: PointerEvent, element: HTMLElement) => ResizeHandle \| null` | Function to detect handle at pointer position. |
