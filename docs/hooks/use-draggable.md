# useDraggable

The `useDraggable` hook adds drag functionality to any element.

## Usage

```vue
<script setup>
import { useDraggable } from 'vue-dndnr'
import { ref } from 'vue'

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
      cursor: 'move'
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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialPosition` | `Object` | `{ x: 0, y: 0 }` | Initial position of the element. |
| `disabled` | `Boolean` | `false` | Whether dragging is disabled. |
| `bounds` | `String\|Object\|null` | `null` | Constrains movement within bounds. Can be 'parent', 'window', or an object. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[x, y]`. |
| `axis` | `String\|null` | `null` | Constrains movement to an axis. Can be 'x', 'y', or null for both. |
| `scale` | `Number` | `1` | Scale factor for the draggable element. |
| `onDragStart` | `Function` | `null` | Callback function called when dragging starts. |
| `onDrag` | `Function` | `null` | Callback function called during dragging. |
| `onDragEnd` | `Function` | `null` | Callback function called when dragging ends. |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `position` | `Ref<{ x: number, y: number }>` | Current position of the element. |
| `isDragging` | `Ref<boolean>` | Whether the element is currently being dragged. |
| `setPosition` | `(position: { x: number, y: number }) => void` | Function to programmatically set the position. |
| `reset` | `() => void` | Function to reset the position to the initial position. |
| `enable` | `() => void` | Function to enable dragging. |
| `disable` | `() => void` | Function to disable dragging. |

## Examples

### With Bounds

```vue
<script setup>
import { useDraggable } from 'vue-dndnr'
import { ref } from 'vue'

const containerRef = ref(null)
const elementRef = ref(null)
const { position, isDragging } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  bounds: 'parent',
})
</script>

<template>
  <div 
    ref="containerRef" 
    style="position: relative; width: 400px; height: 400px; border: 2px solid #ccc;"
  >
    <div 
      ref="elementRef" 
      :style="{ 
        position: 'absolute',
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: '100px',
        height: '100px',
        backgroundColor: isDragging ? '#e74c3c' : '#3498db',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '4px',
        cursor: 'move'
      }"
    >
      Constrained to parent
    </div>
  </div>
</template>
```

### With Grid Snapping

```vue
<script setup>
import { useDraggable } from 'vue-dndnr'
import { ref } from 'vue'

const elementRef = ref(null)
const { position } = useDraggable(elementRef, {
  initialPosition: { x: 100, y: 100 },
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
      padding: '20px',
      backgroundColor: '#3498db',
      color: 'white',
      borderRadius: '4px',
      cursor: 'move'
    }"
  >
    Snaps to 20x20 grid
  </div>
</template>
```

### With Axis Constraint

```vue
<script setup>
import { useDraggable } from 'vue-dndnr'
import { ref } from 'vue'

const horizontalRef = ref(null)
const verticalRef = ref(null)

const { position: horizontalPosition } = useDraggable(horizontalRef, {
  initialPosition: { x: 100, y: 100 },
  axis: 'x',
})

const { position: verticalPosition } = useDraggable(verticalRef, {
  initialPosition: { x: 300, y: 100 },
  axis: 'y',
})
</script>

<template>
  <div>
    <div 
      ref="horizontalRef" 
      :style="{ 
        position: 'absolute',
        left: `${horizontalPosition.x}px`, 
        top: `${horizontalPosition.y}px`,
        padding: '20px',
        backgroundColor: '#3498db',
        color: 'white',
        borderRadius: '4px',
        cursor: 'move'
      }"
    >
      X-axis only
    </div>
    
    <div 
      ref="verticalRef" 
      :style="{ 
        position: 'absolute',
        left: `${verticalPosition.x}px`, 
        top: `${verticalPosition.y}px`,
        padding: '20px',
        backgroundColor: '#e74c3c',
        color: 'white',
        borderRadius: '4px',
        cursor: 'move'
      }"
    >
      Y-axis only
    </div>
  </div>
</template>
```
