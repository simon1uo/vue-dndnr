# Draggable Component

The `Draggable` component allows you to make any element draggable with a simple wrapper component.

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
| `position` | `Position` | `{ x: 0, y: 0 }` | The position of the element. Can be bound with `v-model:position`. |
| `modelValue` | `Position` | `undefined` | Alternative v-model binding for position. |
| `active` | `boolean` | `undefined` | Whether the element is currently active (selected). Can be bound with `v-model:active`. |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Custom class name for the component. |
| `draggingClassName` | `string` | `'dragging'` | Class name applied while dragging. |
| `activeClassName` | `string` | `'active'` | Class name applied when the element is active. |

### Activation Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeOn` | `'click' \| 'hover' \| 'none'` | `'none'` | Determines how the element becomes active. Can be `'click'`, `'hover'`, or `'none'` (always active). |
| `preventDeactivation` | `boolean` | `false` | When true, the component will stay active even when clicking outside or leaving the element. |
| `disabled` | `boolean` | `false` | Whether dragging is disabled. |

### Behavior Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bounds` | `HTMLElement \| 'parent' \| null` | `undefined` | Constrains movement within bounds. Can be 'parent' or an HTML element. |
| `grid` | `[number, number] \| null` | `undefined` | Snaps the element to a grid. Format: `[x, y]`. |
| `handle` | `HTMLElement \| null` | `undefined` | Element to use as the drag handle. |
| `axis` | `'x' \| 'y' \| 'both'` | `'both'` | Constrains movement to an axis. |
| `scale` | `number` | `1` | Scale factor for the draggable element. |

### Event Control Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pointerTypes` | `('mouse' \| 'touch' \| 'pen')[]` | `['mouse', 'touch', 'pen']` | Types of pointer events to respond to. |
| `preventDefault` | `boolean` | `true` | Whether to prevent default browser events. |
| `stopPropagation` | `boolean` | `false` | Whether to stop event propagation. |
| `capture` | `boolean` | `true` | Whether to use event capturing phase. |
| `throttleDelay` | `number` | `16` | Delay in ms for throttling move events. |

## Events

### Model Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:position` | `Position` | Emitted when the position changes. Used for `v-model:position` binding. |
| `update:modelValue` | `Position` | Alternative v-model event for position changes. |
| `update:active` | `boolean` | Emitted when the active state changes. Used for `v-model:active` binding. |
| `activeChange` | `boolean` | Emitted when the active state changes. |

### Interaction Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `dragStart` | `position: Position, event: PointerEvent` | Emitted when dragging starts. |
| `drag` | `position: Position, event: PointerEvent` | Emitted during dragging. |
| `dragEnd` | `position: Position, event: PointerEvent` | Emitted when dragging ends. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ position, isDragging, isActive, style }` | The content to be made draggable. |
