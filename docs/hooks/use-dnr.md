# useDnR

The `useDnR` hook combines both drag and resize functionality into a single hook.

## Usage

<UseDnRDemo />

```vue
<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const { position, size, isDragging, isResizing } = useDnR(elementRef, {
  initialPosition: { x: 100, y: 100 },
  initialSize: { width: 200, height: 150 },
  bounds: 'parent',
  minWidth: 100,
  minHeight: 100,
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: isDragging || isResizing ? '#e74c3c' : '#3498db',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '4px',
      cursor: isDragging ? 'move' : 'default',
    }"
  >
    <div>Drag and resize me!</div>
    <div>Position: {{ position.x }}, {{ position.y }}</div>
    <div>Size: {{ size.width }} x {{ size.height }}</div>
  </div>
</template>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementRef` | `Ref<HTMLElement>` | Reference to the element to make draggable and resizable. |
| `options` | `Object` | Configuration options for the draggable and resizable behavior. |

### Options

The `useDnR` hook combines all options from both the `useDraggable` and `useResizable` hooks.

#### Common Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disabled` | `Boolean` | `false` | Whether all interactions are disabled. |
| `pointerTypes` | `Array` | `undefined` | Array of supported pointer types. |
| `preventDefault` | `Boolean` | `true` | Whether to prevent default event behavior. |
| `stopPropagation` | `Boolean` | `false` | Whether to stop event propagation. |
| `capture` | `Boolean` | `true` | Whether to use event capture phase. |
| `throttleDelay` | `Number` | `16` | Throttle delay in milliseconds for events. |

#### Draggable Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialPosition` | `Object` | `{ x: 0, y: 0 }` | Initial position of the element. |
| `dragDisabled` | `Boolean` | `false` | Whether dragging is disabled. |
| `bounds` | `String\|Object\|null` | `null` | Constrains movement within bounds. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[x, y]`. |
| `axis` | `String\|null` | `null` | Constrains movement to an axis. |
| `scale` | `Number` | `1` | Scale factor for the element. |
| `onDragStart` | `Function` | `null` | Callback function called when dragging starts. |
| `onDrag` | `Function` | `null` | Callback function called during dragging. |
| `onDragEnd` | `Function` | `null` | Callback function called when dragging ends. |

#### Resizable Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialSize` | `Object` | `{ width: 200, height: 150 }` | Initial size of the element. |
| `minWidth` | `Number` | `10` | Minimum width in pixels. |
| `minHeight` | `Number` | `10` | Minimum height in pixels. |
| `maxWidth` | `Number\|null` | `null` | Maximum width in pixels. |
| `maxHeight` | `Number\|null` | `null` | Maximum height in pixels. |
| `resizeDisabled` | `Boolean` | `false` | Whether resizing is disabled. |
| `handles` | `Array` | All handles | Array of handles to display. |
| `lockAspectRatio` | `Boolean` | `false` | Whether to maintain the aspect ratio when resizing. |
| `onResizeStart` | `Function` | `null` | Callback function called when resizing starts. |
| `onResize` | `Function` | `null` | Callback function called during resizing. |
| `onResizeEnd` | `Function` | `null` | Callback function called when resizing ends. |

## Return Value

### State

| Property | Type | Description |
|----------|------|-------------|
| `position` | `Ref<{ x: number, y: number }>` | Current position of the element. |
| `size` | `Ref<{ width: number\|string, height: number\|string }>` | Current size of the element. |
| `isDragging` | `Ref<boolean>` | Whether the element is currently being dragged. |
| `isResizing` | `Ref<boolean>` | Whether the element is currently being resized. |
| `interactionMode` | `Ref<'idle' \| 'dragging' \| 'resizing'>` | Current interaction state. |
| `activeHandle` | `Ref<ResizeHandle \| null>` | Currently active resize handle. |
| `hoverHandle` | `Ref<ResizeHandle \| null>` | Currently hovered resize handle. |
| `isAbsolutePositioned` | `Ref<boolean>` | Whether the element uses absolute positioning. |
| `isNearResizeHandle` | `Ref<boolean>` | Whether the mouse is near a resize handle. |

### Style

| Property | Type | Description |
|----------|------|-------------|
| `style` | `Ref<Object>` | Combined style object for positioning and sizing. |

### Methods

| Method | Type | Description |
|--------|------|-------------|
| `setPosition` | `(position: { x: number, y: number }) => void` | Function to programmatically set the position. |
| `setSize` | `(size: { width: number\|string, height: number\|string }) => void` | Function to programmatically set the size. |
| `onDragStart` | `(event: PointerEvent) => void` | Handler for drag start event. |
| `onDrag` | `(event: PointerEvent) => void` | Handler for drag event. |
| `onDragEnd` | `(event: PointerEvent) => void` | Handler for drag end event. |
| `onResizeStart` | `(event: PointerEvent) => void` | Handler for resize start event. |
| `onResize` | `(event: PointerEvent) => void` | Handler for resize event. |
| `onResizeEnd` | `(event: PointerEvent) => void` | Handler for resize end event. |
| `detectBoundary` | `() => void` | Function to detect and enforce boundary constraints. |

## Examples

### With Bounds and Size Constraints

```vue
<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const containerRef = ref(null)
const elementRef = ref(null)
const { position, size, isDragging, isResizing } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  bounds: 'parent',
  minWidth: 100,
  minHeight: 100,
  maxWidth: 400,
  maxHeight: 300,
})
</script>

<template>
  <div
    ref="containerRef"
    style="position: relative; width: 600px; height: 400px; border: 2px solid #ccc;"
  >
    <div
      ref="elementRef"
      :style="{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: isDragging || isResizing ? '#e74c3c' : '#3498db',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '4px',
        cursor: isDragging ? 'move' : 'default',
      }"
    >
      <div>Constrained within parent</div>
      <div>Size between 100x100 and 400x300</div>
    </div>
  </div>
</template>
```

### With Grid Snapping

```vue
<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const { position, size } = useDnR(elementRef, {
  initialPosition: { x: 100, y: 100 },
  initialSize: { width: 200, height: 150 },
  grid: [20, 20],
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: '#3498db',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '4px',
      cursor: 'move',
    }"
  >
    Snaps to 20x20 grid
  </div>
</template>
```

### Programmatically Controlling Position and Size

```vue
<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const { position, size, setPosition, setSize, reset } = useDnR(elementRef, {
  initialPosition: { x: 100, y: 100 },
  initialSize: { width: 200, height: 150 },
})

function moveToCenter() {
  setPosition({ x: 200, y: 200 })
}

function makeSmaller() {
  setSize({ width: size.value.width * 0.8, height: size.value.height * 0.8 })
}

function makeLarger() {
  setSize({ width: size.value.width * 1.2, height: size.value.height * 1.2 })
}

function resetElement() {
  reset()
}
</script>

<template>
  <div>
    <div
      ref="elementRef"
      :style="{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: '#3498db',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '4px',
        cursor: 'move',
      }"
    >
      Drag and resize me!
    </div>

    <div style="position: fixed; bottom: 20px; left: 20px;">
      <button @click="moveToCenter">
        Center
      </button>
      <button @click="makeSmaller">
        Smaller
      </button>
      <button @click="makeLarger">
        Larger
      </button>
      <button @click="resetElement">
        Reset
      </button>
    </div>
  </div>
</template>
```
