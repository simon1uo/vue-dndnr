# Resizable Component

The `Resizable` component allows you to make any element resizable.

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
| `resizeStart` | `{ event, size }` | Emitted when resizing starts. |
| `resize` | `{ event, size }` | Emitted during resizing. |
| `resizeEnd` | `{ event, size }` | Emitted when resizing ends. |

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
