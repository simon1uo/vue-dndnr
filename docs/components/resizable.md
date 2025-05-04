# Resizable Component

The `Resizable` component allows you to make any element resizable with customizable handles and constraints.

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
| `size` | `Size` | `{ width: 'auto', height: 'auto' }` | The size of the element. Can be bound with `v-model:size`. |
| `modelValue` | `Size` | `undefined` | Alternative v-model binding for size. |
| `active` | `boolean` | `undefined` | Whether the element is currently active (selected). Can be bound with `v-model:active`. |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeClassName` | `string` | `'active'` | Class name applied when the element is active. |
| `handleBorderStyle` | `string` | `'none'` | Border style for handleType 'borders'. Accepts any valid CSS border value. |

### Activation Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeOn` | `'click' \| 'hover' \| 'none'` | `'none'` | Determines how the element becomes active. Can be `'click'`, `'hover'`, or `'none'` (always active). |
| `disabled` | `boolean` | `false` | Whether resizing is disabled. |

### Size Constraints

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minWidth` | `number` | `undefined` | Minimum width constraint in pixels. |
| `minHeight` | `number` | `undefined` | Minimum height constraint in pixels. |
| `maxWidth` | `number` | `undefined` | Maximum width constraint in pixels. |
| `maxHeight` | `number` | `undefined` | Maximum height constraint in pixels. |
| `grid` | `[number, number] \| null` | `undefined` | Snaps the element to a grid. Format: `[width, height]`. |
| `lockAspectRatio` | `boolean` | `false` | Whether to maintain the aspect ratio when resizing. |
| `bounds` | `HTMLElement \| 'parent' \| null` | `undefined` | Constrains resizing within bounds. Can be 'parent' or an HTML element. |

### Handle Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `handleType` | `'borders' \| 'handles' \| 'custom'` | `'borders'` | Type of resize handles to display. |
| `handles` | `ResizeHandle[]` | `['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']` | Array of handles to display. |

### Event Control Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pointerTypes` | `('mouse' \| 'touch' \| 'pen')[]` | `['mouse', 'touch', 'pen']` | Types of pointer events to respond to. |
| `preventDefault` | `boolean` | `true` | Whether to prevent default browser events. |
| `stopPropagation` | `boolean` | `false` | Whether to stop event propagation. |
| `capture` | `boolean` | `true` | Whether to use event capturing phase. |
| `throttleDelay` | `number` | `16` | Delay in ms for throttling resize events. |

## Events

### Model Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:size` | `Size` | Emitted when the size changes. Used for `v-model:size` binding. |
| `update:modelValue` | `Size` | Alternative v-model event for size changes. |
| `update:active` | `boolean` | Emitted when the active state changes. Used for `v-model:active` binding. |
| `activeChange` | `boolean` | Emitted when the active state changes. |
| `hoverHandleChange` | `ResizeHandle \| null` | Emitted when mouse hovers over a resize handle. |

### Interaction Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `resizeStart` | `size: Size, event: PointerEvent` | Emitted when resizing starts. |
| `resize` | `size: Size, event: PointerEvent` | Emitted during resizing. |
| `resizeEnd` | `size: Size, event: PointerEvent` | Emitted when resizing ends. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ size, isResizing, isActive, activeHandle, hoverHandle }` | The content to be made resizable. |
| `handle-${position}` | `{ handle, active, hover, isResizing, position, cursor, size }` | Custom handle slot for each position when `handleType="custom"`. Position can be any valid handle (e.g., `handle-br`, `handle-tl`, etc.). |
