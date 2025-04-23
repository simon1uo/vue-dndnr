# Draggable Component

The `Draggable` component allows you to make any element draggable.

## Basic Usage

```vue
<script setup>
import { Draggable } from 'vue-dndnr'
import { ref } from 'vue'

const position = ref({ x: 100, y: 100 })
</script>

<template>
  <Draggable v-model:position="position">
    <div class="draggable-box">Drag me!</div>
  </Draggable>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `Object` | `{ x: 0, y: 0 }` | The position of the element. Can be bound with `v-model:position`. |
| `disabled` | `Boolean` | `false` | Whether dragging is disabled. |
| `bounds` | `String\|Object\|null` | `null` | Constrains movement within bounds. Can be 'parent', 'window', or an object with `{ left, top, right, bottom }`. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[x, y]`. |
| `handle` | `String\|null` | `null` | CSS selector for the drag handle. If not provided, the entire element is draggable. |
| `cancel` | `String\|null` | `null` | CSS selector for elements that should not trigger dragging. |
| `axis` | `String\|null` | `null` | Constrains movement to an axis. Can be 'x', 'y', or null for both. |
| `scale` | `Number` | `1` | Scale factor for the draggable element. |
| `zIndex` | `Number\|null` | `null` | Z-index applied while dragging. |

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `dragStart` | `{ event, position }` | Emitted when dragging starts. |
| `drag` | `{ event, position }` | Emitted during dragging. |
| `dragEnd` | `{ event, position }` | Emitted when dragging ends. |
| `update:position` | `{ x, y }` | Emitted when the position changes. Used for `v-model:position` binding. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ position, isDragging }` | The content to be made draggable. |

## Examples

### With Bounds

```vue
<template>
  <div class="parent-container">
    <Draggable v-model:position="position" bounds="parent">
      <div class="draggable-box">Constrained to parent</div>
    </Draggable>
  </div>
</template>
```

### With Grid Snapping

```vue
<template>
  <Draggable v-model:position="position" :grid="[20, 20]">
    <div class="draggable-box">Snaps to 20x20 grid</div>
  </Draggable>
</template>
```

### With Handle

```vue
<template>
  <Draggable v-model:position="position" handle=".handle">
    <div class="draggable-box">
      <div class="handle">Drag here</div>
      <div>Content (not draggable)</div>
    </div>
  </Draggable>
</template>
```

### Axis Constraint

```vue
<template>
  <Draggable v-model:position="position" axis="x">
    <div class="draggable-box">Only moves horizontally</div>
  </Draggable>
</template>
```
