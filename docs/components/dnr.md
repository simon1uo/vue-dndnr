# DnR Component

The `DnR` (Draggable and Resizable) component combines both draggable and resizable functionality into a single component, allowing elements to be both moved and resized with a single wrapper.

<script setup>
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'

const position = ref({ x: 100, y: 100 })
const size = ref({ width: 200, height: 200 })
</script>

## Basic Usage Demo

<DemoContainer>
  <DnR v-model:position="position" v-model:size="size" :min-width="100" :min-height="100" bounds="parent">
    <div class="dnr-box">Drag & Resize me!
      <div class="text-sm color-text-light">
        position: {{ position.x }}, {{ position.y }}
      </div>
      <div class="text-sm color-text-light">
        size: {{ size.width }} x {{ size.height }}
      </div>
    </div>
  </DnR>
</DemoContainer>

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'

const position = ref({ x: 0, y: 0 })
const size = ref({ width: 200, height: 150 })
</script>

<template>
  <DnR v-model:position="position" v-model:size="size" :min-width="100" :min-height="100" bounds="parent">
    Drag & Resize me!
    position: {{ position.x }}, {{ position.y }}
    size: {{ size.width }} x {{ size.height }}
  </DnR>
</template>
```

## Props

The `DnR` component combines props from both the `Draggable` and `Resizable` components.

### Model Values

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `Object` | `{ x: 0, y: 0 }` | The position of the element. Can be bound with `v-model:position`. |
| `size` | `Object` | `{ width: 'auto', height: 'auto' }` | The size of the element. Can be bound with `v-model:size`. |
| `active` | `Boolean` | `false` | Whether the element is currently active (selected). Can be bound with `v-model:active`. |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `String` | `undefined` | Custom class name for the component. |
| `draggingClassName` | `String` | `'dragging'` | Class name applied while dragging. |
| `resizingClassName` | `String` | `'resizing'` | Class name applied while resizing. |
| `activeClassName` | `String` | `'active'` | Class name applied when the element is active. |
| `handleBorderStyle` | `String` | `'none'` | Border style for handleType 'borders'. Accepts any valid CSS border value. |

### Activation Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeOn` | `String` | `'none'` | Determines how the element becomes active. Can be `'click'`, `'hover'`, or `'none'` (always active). |
| `disabled` | `Boolean` | `false` | Whether all interactions are disabled. |

### Draggable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bounds` | `HTMLElement \| 'parent' \| null` | `undefined` | Constrains movement within bounds. Can be 'parent' or an HTML element. |
| `grid` | `[number, number] \| null` | `undefined` | Snaps the element to a grid. Format: `[x, y]`. |
| `handle` | `HTMLElement \| null` | `undefined` | Element to use as the drag handle. |
| `axis` | `'x' \| 'y' \| 'both'` | `'both'` | Constrains movement to an axis. |
| `scale` | `number` | `1` | Scale factor for the element. |

### Resizable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minWidth` | `number` | `undefined` | Minimum width constraint in pixels. |
| `minHeight` | `number` | `undefined` | Minimum height constraint in pixels. |
| `maxWidth` | `number` | `undefined` | Maximum width constraint in pixels. |
| `maxHeight` | `number` | `undefined` | Maximum height constraint in pixels. |
| `handles` | `ResizeHandle[]` | `['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']` | Array of handles to display. |
| `handleType` | `'borders' \| 'handles' \| 'custom'` | `'borders'` | Type of resize handles to display. |
| `lockAspectRatio` | `boolean` | `false` | Whether to maintain the aspect ratio when resizing. |

### Event Control Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pointerTypes` | `('mouse' \| 'touch' \| 'pen')[]` | `['mouse', 'touch', 'pen']` | Types of pointer events to respond to. |
| `preventDefault` | `boolean` | `true` | Whether to prevent default browser events. |
| `stopPropagation` | `boolean` | `false` | Whether to stop event propagation. |
| `capture` | `boolean` | `true` | Whether to use event capturing phase. |
| `throttleDelay` | `number` | `16` | Delay in ms for throttling move events. |

## Events

The `DnR` component emits events for both dragging and resizing operations.

### Model Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:position` | `Position` | Emitted when the position changes. Used for `v-model:position` binding. |
| `update:size` | `Size` | Emitted when the size changes. Used for `v-model:size` binding. |
| `update:active` | `boolean` | Emitted when the active state changes. Used for `v-model:active` binding. |
| `activeChange` | `boolean` | Emitted when the active state changes. |
| `hoverHandleChange` | `ResizeHandle \| null` | Emitted when mouse hovers over a resize handle. |

### Draggable Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `dragStart` | `position: Position, event: PointerEvent` | Emitted when dragging starts. |
| `drag` | `position: Position, event: PointerEvent` | Emitted during dragging. |
| `dragEnd` | `position: Position, event: PointerEvent` | Emitted when dragging ends. |

### Resizable Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `resizeStart` | `size: Size, event: PointerEvent` | Emitted when resizing starts. |
| `resize` | `size: Size, event: PointerEvent` | Emitted during resizing. |
| `resizeEnd` | `size: Size, event: PointerEvent` | Emitted when resizing ends. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ position, size, isDragging, isResizing, isActive, interactionMode, activeHandle, hoverHandle }` | The content to be made draggable and resizable. |
| `handle-${position}` | `{ handle, active, hover, isResizing, position, cursor, size }` | Custom handle slot for each position when `handleType="custom"`. Position can be any valid handle (e.g., `handle-br`, `handle-tl`, etc.). |
