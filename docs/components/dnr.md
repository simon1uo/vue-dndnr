# DnR Component

The `DnR` (Draggable and Resizable) component combines both draggable and resizable functionality into a single component.

## Basic Usage

<DnRDemo />

```vue
<script setup>
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'

const position = ref({ x: 100, y: 100 })
const size = ref({ width: 200, height: 150 })
</script>

<template>
  <DnR v-model:position="position" v-model:size="size">
    <div class="dnr-box">
      Drag and resize me!
    </div>
  </DnR>
</template>
```

## Props

The `DnR` component combines all props from both the `Draggable` and `Resizable` components.

### Common Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `String` | `undefined` | Custom class name for the component. |
| `draggingClassName` | `String` | `'dragging'` | Class name applied while dragging. |
| `resizingClassName` | `String` | `'resizing'` | Class name applied while resizing. |
| `disabled` | `Boolean` | `false` | Whether all interactions are disabled. |
| `pointerTypes` | `Array` | `undefined` | Array of supported pointer types. |
| `preventDefault` | `Boolean` | `true` | Whether to prevent default event behavior. |
| `stopPropagation` | `Boolean` | `false` | Whether to stop event propagation. |
| `capture` | `Boolean` | `true` | Whether to use event capture phase. |

### Model Values

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `Object` | `{ x: 0, y: 0 }` | The position of the element. Can be bound with `v-model:position`. |
| `size` | `Object` | `{ width: 'auto', height: 'auto' }` | The size of the element. Can be bound with `v-model:size`. |

### Draggable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dragDisabled` | `Boolean` | `false` | Whether dragging is disabled. |
| `bounds` | `String\|Object\|null` | `null` | Constrains movement within bounds. Can be 'parent', 'window', or an object. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[x, y]`. |
| `handle` | `String\|null` | `null` | CSS selector for the drag handle. |
| `cancel` | `String\|null` | `null` | CSS selector for elements that should not trigger dragging. |
| `axis` | `String\|null` | `null` | Constrains movement to an axis. Can be 'x', 'y', or null for both. |
| `scale` | `Number` | `1` | Scale factor for the element. |
| `zIndex` | `Number\|null` | `null` | Z-index applied while dragging. |

### Resizable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minWidth` | `Number` | `10` | Minimum width in pixels. |
| `minHeight` | `Number` | `10` | Minimum height in pixels. |
| `maxWidth` | `Number\|null` | `null` | Maximum width in pixels. |
| `maxHeight` | `Number\|null` | `null` | Maximum height in pixels. |
| `resizeDisabled` | `Boolean` | `false` | Whether resizing is disabled. |
| `handles` | `Array` | All handles | Array of handles to display. |
| `lockAspectRatio` | `Boolean` | `false` | Whether to maintain the aspect ratio when resizing. |

## Events

The `DnR` component emits all events from both the `Draggable` and `Resizable` components.

### Model Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:position` | `{ x, y }` | Emitted when the position changes. |
| `update:size` | `{ width, height }` | Emitted when the size changes. |
| `hoverHandleChange` | `ResizeHandle \| null` | Emitted when mouse hovers over a resize handle. |

### Draggable Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `dragStart` | `{ event, position }` | Emitted when dragging starts. |
| `drag` | `{ event, position }` | Emitted during dragging. |
| `dragEnd` | `{ event, position }` | Emitted when dragging ends. |

### Resizable Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `resizeStart` | `{ event, size }` | Emitted when resizing starts. |
| `resize` | `{ event, size }` | Emitted during resizing. |
| `resizeEnd` | `{ event, size }` | Emitted when resizing ends. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ position, size, isDragging, isResizing }` | The content to be made draggable and resizable. |

## Examples

### With Bounds and Size Constraints

```vue
<template>
  <div class="parent-container">
    <DnR
      v-model:position="position"
      v-model:size="size"
      bounds="parent"
      :min-width="100"
      :min-height="100"
      :max-width="500"
      :max-height="400"
    >
      <div class="dnr-box">
        Constrained within parent
        <br>
        Size between 100x100 and 500x400
      </div>
    </DnR>
  </div>
</template>
```

### With Grid Snapping

```vue
<template>
  <DnR v-model:position="position" v-model:size="size" :grid="[20, 20]">
    <div class="dnr-box">
      Snaps to 20x20 grid
    </div>
  </DnR>
</template>
```

### With Handle

```vue
<template>
  <DnR v-model:position="position" v-model:size="size" handle=".handle">
    <div class="dnr-box">
      <div class="handle">
        Drag here
      </div>
      <div>Content (not draggable)</div>
    </div>
  </DnR>
</template>
```
