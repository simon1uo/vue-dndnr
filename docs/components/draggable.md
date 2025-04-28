# Draggable Component

The `Draggable` component allows you to make any element draggable.

<script setup lang="ts">
import { ref } from 'vue'
import { Draggable } from 'vue-dndnr'

const position = ref({ x: 0, y: 0 })
</script>
## Basic Usage Demo

<DemoContainer>
  <Draggable v-model:position="position">
    <div class="draggable-box">
      Drag me!
      <span class="color-text-light text-sm">({{ position.x }}, {{ position.y }})</span>
    </div>
  </Draggable>
</DemoContainer>

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Draggable } from 'vue-dndnr'

const position = ref({ x: 0, y: 0 })
</script>

<template>
  <Draggable v-model:position="position">
    Drag me!
    {{ position.x }}, {{ position.y }}
  </Draggable>
</template>
```

## Props

### Model Values

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `Object` | `{ x: 0, y: 0 }` | The position of the element. Can be bound with `v-model:position`. |
| `modelValue` | `Object` | `undefined` | Alternative v-model binding for position. |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `String` | `undefined` | Custom class name for the component. |
| `draggingClassName` | `String` | `'dragging'` | Class name applied while dragging. |

### Behavior Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disabled` | `Boolean` | `false` | Whether dragging is disabled. |
| `bounds` | `String\|Object\|null` | `null` | Constrains movement within bounds. Can be 'parent', 'window', or an object with `{ left, top, right, bottom }`. |
| `grid` | `Array\|null` | `null` | Snaps the element to a grid. Format: `[x, y]`. |
| `handle` | `String\|null` | `null` | CSS selector for the drag handle. If not provided, the entire element is draggable. |
| `cancel` | `String\|null` | `null` | CSS selector for elements that should not trigger dragging. |
| `axis` | `String` | `'both'` | Constrains movement to an axis. Can be 'x', 'y', or 'both'. |
| `scale` | `Number` | `1` | Scale factor for the draggable element. |
| `zIndex` | `Number\|null` | `null` | Z-index applied while dragging. |

### Event Control Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pointerTypes` | `Array` | `undefined` | Array of supported pointer types. |
| `preventDefault` | `Boolean` | `true` | Whether to prevent default event behavior. |
| `stopPropagation` | `Boolean` | `false` | Whether to stop event propagation. |
| `capture` | `Boolean` | `true` | Whether to use event capture phase. |
| `throttleDelay` | `Number` | `16` | Throttle delay in milliseconds for drag events. |

## Events

### Model Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:position` | `{ x, y }` | Emitted when the position changes. Used for `v-model:position` binding. |
| `update:modelValue` | `{ x, y }` | Alternative v-model event for position changes. |

### Interaction Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `dragStart` | `{ event, position }` | Emitted when dragging starts. |
| `drag` | `{ event, position }` | Emitted during dragging. |
| `dragEnd` | `{ event, position }` | Emitted when dragging ends. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ position, isDragging }` | The content to be made draggable. |
