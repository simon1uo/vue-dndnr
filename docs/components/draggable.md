# Draggable Component

The `Draggable` component allows you to make any element draggable.

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

## Examples

### With Bounds

```vue
<template>
  <div class="parent-container">
    <Draggable v-model:position="position" bounds="parent">
      <div class="draggable-box">
        Constrained to parent
      </div>
    </Draggable>
  </div>
</template>
```

### With Grid Snapping

```vue
<template>
  <Draggable v-model:position="position" :grid="[20, 20]">
    <div class="draggable-box">
      Snaps to 20x20 grid
    </div>
  </Draggable>
</template>
```

### With Handle

```vue
<template>
  <Draggable v-model:position="position" handle=".handle">
    <div class="draggable-box">
      <div class="handle">
        Drag here
      </div>
      <div>Content (not draggable)</div>
    </div>
  </Draggable>
</template>
```

### Axis Constraint

```vue
<template>
  <Draggable v-model:position="position" axis="x">
    <div class="draggable-box">
      Only moves horizontally
    </div>
  </Draggable>
</template>
```
