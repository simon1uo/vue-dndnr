# useDraggable

The `useDraggable` hook adds drag functionality to any element.

## Usage

<UseDraggableDemo />

```vue
<script setup>
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const elementRef = ref(null)
const { position, isDragging } = useDraggable(elementRef, {
  initialPosition: { x: 100, y: 100 },
  bounds: 'parent',
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      backgroundColor: isDragging ? '#e74c3c' : '#3498db',
      padding: '20px',
      borderRadius: '4px',
      color: 'white',
      cursor: 'move',
    }"
  >
    Drag me using the hook!
  </div>
</template>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementRef` | `Ref<HTMLElement>` | Reference to the element to make draggable. |
| `options` | `Object` | Configuration options for the draggable behavior. |

### Options

#### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialPosition` | `Object` | `{ x: 0, y: 0 }` | Initial position of the element. |
| `disabled` | `Boolean` | `false` | Whether dragging is disabled. |
| `bounds` | `String\|Object\|null` | `null` | Constrains movement within bounds. Can be 'parent', 'window', or an object. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[x, y]`. |
| `axis` | `String` | `'both'` | Constrains movement to an axis. Can be 'x', 'y', or 'both'. |
| `scale` | `Number` | `1` | Scale factor for the draggable element. |

#### Event Control Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `draggingHandle` | `HTMLElement\|null` | `target` | Element used as the drag handle. |
| `draggingElement` | `Window\|null` | `window` | Element to attach drag events to. |
| `pointerTypes` | `Array` | `['mouse', 'touch', 'pen']` | Array of supported pointer types. |
| `preventDefault` | `Boolean` | `true` | Whether to prevent default event behavior. |
| `stopPropagation` | `Boolean` | `false` | Whether to stop event propagation. |
| `capture` | `Boolean` | `true` | Whether to use event capture phase. |
| `throttleDelay` | `Number` | `16` | Throttle delay in milliseconds for drag events. |

#### Callback Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onDragStart` | `Function` | `null` | Callback function called when dragging starts. |
| `onDrag` | `Function` | `null` | Callback function called during dragging. |
| `onDragEnd` | `Function` | `null` | Callback function called when dragging ends. |

## Return Value

### State

| Property | Type | Description |
|----------|------|-------------|
| `position` | `Ref<{ x: number, y: number }>` | Current position of the element. |
| `isDragging` | `Ref<boolean>` | Whether the element is currently being dragged. |

### Style

| Property | Type | Description |
|----------|------|-------------|
| `style` | `Ref<Object>` | Combined style object for positioning. |

### Methods

| Method | Type | Description |
|--------|------|-------------|
| `setPosition` | `(position: { x: number, y: number }) => void` | Function to programmatically set the position. |
| `onDragStart` | `(event: PointerEvent) => void` | Handler for drag start event. |
| `onDrag` | `(event: PointerEvent) => void` | Handler for drag event. |
| `onDragEnd` | `(event: PointerEvent) => void` | Handler for drag end event. |

## Examples

### With Bounds

```
