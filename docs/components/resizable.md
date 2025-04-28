# Resizable Component

The `Resizable` component allows you to make any element resizable.

## Basic Usage Demo
<script setup lang="ts">
import { ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 150 })
</script>

<DemoContainer>
  <Resizable v-model:size="size" :min-width="100" :min-height="100" bounds="parent">
    <div class="resizable-box">
      Resize me!
      <div class="text-sm color-text-light">
        {{ size.width }} x {{ size.height }}
      </div>
    </div>
  </Resizable>
</DemoContainer>

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 150 })
</script>

<template>
  <Resizable v-model:size="size" :min-width="100" :min-height="100" bounds="parent">
    Resize me!
    {{ size.width }} x {{ size.height }}
  </Resizable>
</template>
```

## Props

### Model Values

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `Object` | `{ width: 'auto', height: 'auto' }` | The size of the element. Can be bound with `v-model:size`. |
| `modelValue` | `Object` | `undefined` | Alternative v-model binding for size. |

### Size Constraints

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minWidth` | `Number` | `10` | Minimum width in pixels. |
| `minHeight` | `Number` | `10` | Minimum height in pixels. |
| `maxWidth` | `Number\|null` | `null` | Maximum width in pixels. |
| `maxHeight` | `Number\|null` | `null` | Maximum height in pixels. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[width, height]`. |
| `lockAspectRatio` | `Boolean` | `false` | Whether to maintain the aspect ratio when resizing. |
| `bounds` | `String\|Object\|null` | `null` | Constrains resizing within bounds. Can be 'parent', 'window', or an object. |
| `scale` | `Number` | `1` | Scale factor for the resizable element. |

### Behavior Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disabled` | `Boolean` | `false` | Whether resizing is disabled. |
| `handles` | `Array` | `['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']` | Array of handles to display. |

### Event Control Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pointerTypes` | `Array` | `undefined` | Array of supported pointer types. |
| `preventDefault` | `Boolean` | `true` | Whether to prevent default event behavior. |
| `stopPropagation` | `Boolean` | `false` | Whether to stop event propagation. |
| `capture` | `Boolean` | `true` | Whether to use event capture phase. |
| `throttleDelay` | `Number` | `16` | Throttle delay in milliseconds for resize events. |

## Events

### Model Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:size` | `{ width, height }` | Emitted when the size changes. Used for `v-model:size` binding. |
| `update:modelValue` | `{ width, height }` | Alternative v-model event for size changes. |
| `hoverHandleChange` | `ResizeHandle \| null` | Emitted when mouse hovers over a resize handle. |

### Interaction Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `resizeStart` | `size, event` | Emitted when resizing starts. |
| `resize` | `size, event` | Emitted during resizing. |
| `resizeEnd` | `size, event` | Emitted when resizing ends. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ size, isResizing }` | The content to be made resizable. |
