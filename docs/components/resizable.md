# Resizable Component

The `Resizable` component allows you to make any element resizable.

## Basic Usage

<ResizableDemo />

```vue
<script setup>
import { ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 150 })
</script>

<template>
  <Resizable v-model:size="size">
    <div class="resizable-box">
      Resize me!
    </div>
  </Resizable>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `Object` | `{ width: 200, height: 150 }` | The size of the element. Can be bound with `v-model:size`. |
| `minWidth` | `Number` | `10` | Minimum width in pixels. |
| `minHeight` | `Number` | `10` | Minimum height in pixels. |
| `maxWidth` | `Number\|null` | `null` | Maximum width in pixels. |
| `maxHeight` | `Number\|null` | `null` | Maximum height in pixels. |
| `disabled` | `Boolean` | `false` | Whether resizing is disabled. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[width, height]`. |
| `handles` | `Array` | All handles | Array of handles to display. Options: 'n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'. |
| `lockAspectRatio` | `Boolean` | `false` | Whether to maintain the aspect ratio when resizing. |
| `bounds` | `String\|Object\|null` | `null` | Constrains resizing within bounds. Can be 'parent', 'window', or an object. |
| `scale` | `Number` | `1` | Scale factor for the resizable element. |

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `resizeStart` | `{ event, size }` | Emitted when resizing starts. |
| `resize` | `{ event, size }` | Emitted during resizing. |
| `resizeEnd` | `{ event, size }` | Emitted when resizing ends. |
| `update:size` | `{ width, height }` | Emitted when the size changes. Used for `v-model:size` binding. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ size, isResizing }` | The content to be made resizable. |

## Examples

### With Min/Max Constraints

```vue
<template>
  <Resizable
    v-model:size="size"
    :min-width="100"
    :min-height="100"
    :max-width="500"
    :max-height="400"
  >
    <div class="resizable-box">
      Size constrained between 100x100 and 500x400
    </div>
  </Resizable>
</template>
```

### With Grid Snapping

```vue
<template>
  <Resizable v-model:size="size" :grid="[20, 20]">
    <div class="resizable-box">
      Snaps to 20x20 grid
    </div>
  </Resizable>
</template>
```

### With Specific Handles

```vue
<template>
  <Resizable v-model:size="size" :handles="['se', 'sw', 'ne', 'nw']">
    <div class="resizable-box">
      Only corner handles
    </div>
  </Resizable>
</template>
```

### With Aspect Ratio Lock

```vue
<template>
  <Resizable v-model:size="size" :lock-aspect-ratio="true">
    <div class="resizable-box">
      Maintains aspect ratio
    </div>
  </Resizable>
</template>
```
