# useResizable

The `useResizable` hook adds resize functionality to any element.

## Usage

<UseResizableDemo />

```vue
<script setup>
import { useResizable } from 'vue-dndnr'
import { ref } from 'vue'

const elementRef = ref(null)
const { size, isResizing } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: isResizing ? '#e74c3c' : '#3498db',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '4px',
      position: 'relative'
    }"
  >
    Resize me using the hook!
    <div>Size: {{ size.width }} x {{ size.height }}</div>
  </div>
</template>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementRef` | `Ref<HTMLElement>` | Reference to the element to make resizable. |
| `options` | `Object` | Configuration options for the resizable behavior. |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialSize` | `Object` | `{ width: 200, height: 150 }` | Initial size of the element. |
| `minWidth` | `Number` | `10` | Minimum width in pixels. |
| `minHeight` | `Number` | `10` | Minimum height in pixels. |
| `maxWidth` | `Number\|null` | `null` | Maximum width in pixels. |
| `maxHeight` | `Number\|null` | `null` | Maximum height in pixels. |
| `disabled` | `Boolean` | `false` | Whether resizing is disabled. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[width, height]`. |
| `handles` | `Array` | All handles | Array of handles to display. Options: 'n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'. |
| `lockAspectRatio` | `Boolean` | `false` | Whether to maintain the aspect ratio when resizing. |
| `scale` | `Number` | `1` | Scale factor for the resizable element. |
| `onResizeStart` | `Function` | `null` | Callback function called when resizing starts. |
| `onResize` | `Function` | `null` | Callback function called during resizing. |
| `onResizeEnd` | `Function` | `null` | Callback function called when resizing ends. |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `size` | `Ref<{ width: number, height: number }>` | Current size of the element. |
| `isResizing` | `Ref<boolean>` | Whether the element is currently being resized. |
| `setSize` | `(size: { width: number, height: number }) => void` | Function to programmatically set the size. |
| `reset` | `() => void` | Function to reset the size to the initial size. |
| `enable` | `() => void` | Function to enable resizing. |
| `disable` | `() => void` | Function to disable resizing. |

## Examples

### With Min/Max Constraints

```vue
<script setup>
import { useResizable } from 'vue-dndnr'
import { ref } from 'vue'

const elementRef = ref(null)
const { size, isResizing } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  maxWidth: 500,
  maxHeight: 400,
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: isResizing ? '#e74c3c' : '#3498db',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '4px',
      position: 'relative'
    }"
  >
    <div>Size constrained between</div>
    <div>100x100 and 500x400</div>
    <div>Current: {{ size.width }} x {{ size.height }}</div>
  </div>
</template>
```

### With Grid Snapping

```vue
<script setup>
import { useResizable } from 'vue-dndnr'
import { ref } from 'vue'

const elementRef = ref(null)
const { size } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  grid: [20, 20],
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: '#3498db',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '4px',
      position: 'relative'
    }"
  >
    Snaps to 20x20 grid
  </div>
</template>
```

### With Specific Handles

```vue
<script setup>
import { useResizable } from 'vue-dndnr'
import { ref } from 'vue'

const elementRef = ref(null)
const { size } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['se', 'sw', 'ne', 'nw'],
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: '#3498db',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '4px',
      position: 'relative'
    }"
  >
    Only corner handles
  </div>
</template>
```

### With Aspect Ratio Lock

```vue
<script setup>
import { useResizable } from 'vue-dndnr'
import { ref } from 'vue'

const elementRef = ref(null)
const { size } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  lockAspectRatio: true,
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      width: `${size.width}px`,
      height: `${size.height}px`,
      backgroundColor: '#3498db',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '4px',
      position: 'relative'
    }"
  >
    Maintains aspect ratio
  </div>
</template>
```
