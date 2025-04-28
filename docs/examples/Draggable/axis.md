# Axis Constraint

This example demonstrates how to constrain dragging to a specific axis (horizontal or vertical) using both the `Draggable` component and `useDraggable` hook.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'

// Component approach
const horizontalPosition = shallowRef({ x: 50, y: 50 })
const verticalPosition = shallowRef({ x: 50, y: 50 })

// Hook approach
const horizontalElementRef = ref(null)
const verticalElementRef = ref(null)
const { position: hookHorizontalPosition, style: horizontalStyle } = useDraggable(horizontalElementRef, {
  initialPosition: { x: 50, y: 50 },
  axis: 'x'
})
const { position: hookVerticalPosition, style: verticalStyle } = useDraggable(verticalElementRef, {
  initialPosition: { x: 50, y: 50 },
  axis: 'y'
})
</script>

<DemoContainer title="Component Approach - Horizontal">
  <Draggable v-model:position="horizontalPosition" axis="x">
    <div class="bg-blue-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center">
      Drag me horizontally!
      <div class="text-sm mt-2">Position: {{ horizontalPosition.x }}, {{ horizontalPosition.y }}</div>
    </div>
  </Draggable>
</DemoContainer>

<DemoContainer title="Component Approach - Vertical">
  <Draggable v-model:position="verticalPosition" axis="y">
    <div class="bg-green-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center">
      Drag me vertically!
      <div class="text-sm mt-2">Position: {{ verticalPosition.x }}, {{ verticalPosition.y }}</div>
    </div>
  </Draggable>
</DemoContainer>

<DemoContainer title="Hook Approach - Horizontal">
  <div
    ref="horizontalElementRef"
    :style="horizontalStyle"
    class="bg-purple-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center"
  >
    Drag me horizontally!
    <div class="text-sm mt-2">Position: {{ hookHorizontalPosition.x }}, {{ hookHorizontalPosition.y }}</div>
  </div>
</DemoContainer>

<DemoContainer title="Hook Approach - Vertical">
  <div
    ref="verticalElementRef"
    :style="verticalStyle"
    class="bg-orange-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center"
  >
    Drag me vertically!
    <div class="text-sm mt-2">Position: {{ hookVerticalPosition.x }}, {{ hookVerticalPosition.y }}</div>
  </div>
</DemoContainer>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { Draggable } from 'vue-dndnr'

const horizontalPosition = ref({ x: 50, y: 50 })
const verticalPosition = ref({ x: 50, y: 50 })
</script>

<template>
  <!-- Horizontal axis constraint -->
  <Draggable v-model:position="horizontalPosition" axis="x">
    <div class="horizontal-element">
      Drag me horizontally!
      <div>Position: {{ horizontalPosition.x }}, {{ horizontalPosition.y }}</div>
    </div>
  </Draggable>

  <!-- Vertical axis constraint -->
  <Draggable v-model:position="verticalPosition" axis="y">
    <div class="vertical-element">
      Drag me vertically!
      <div>Position: {{ verticalPosition.x }}, {{ verticalPosition.y }}</div>
    </div>
  </Draggable>
</template>

<style scoped>
.horizontal-element {
  background-color: #3498db;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 12rem;
  height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.vertical-element {
  background-color: #2ecc71;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 12rem;
  height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
```
:::

## Hook Approach

::: details View Hook Code
```vue
<script setup>
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const horizontalElementRef = ref(null)
const verticalElementRef = ref(null)

const { position: horizontalPosition, style: horizontalStyle } = useDraggable(horizontalElementRef, {
  initialPosition: { x: 50, y: 50 },
  axis: 'x'
})

const { position: verticalPosition, style: verticalStyle } = useDraggable(verticalElementRef, {
  initialPosition: { x: 50, y: 50 },
  axis: 'y'
})
</script>

<template>
  <!-- Horizontal axis constraint -->
  <div
    ref="horizontalElementRef"
    :style="horizontalStyle"
    class="horizontal-element"
  >
    Drag me horizontally!
    <div>Position: {{ horizontalPosition.x }}, {{ horizontalPosition.y }}</div>
  </div>

  <!-- Vertical axis constraint -->
  <div
    ref="verticalElementRef"
    :style="verticalStyle"
    class="vertical-element"
  >
    Drag me vertically!
    <div>Position: {{ verticalPosition.x }}, {{ verticalPosition.y }}</div>
  </div>
</template>

<style scoped>
.horizontal-element {
  background-color: #9b59b6;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 12rem;
  height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.vertical-element {
  background-color: #e67e22;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 12rem;
  height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
```
:::

## Axis Options

::: details View Axis Options
The `axis` prop (for component) or option (for hook) accepts three possible values:

### 1. Horizontal Axis Only (`x`)

```vue
<!-- Component approach -->
<Draggable v-model:position="position" axis="x">
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  axis: 'x'
})
```

This constrains movement to the horizontal (x) axis only. The element can only be dragged left and right.

### 2. Vertical Axis Only (`y`)

```vue
<!-- Component approach -->
<Draggable v-model:position="position" axis="y">
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  axis: 'y'
})
```

This constrains movement to the vertical (y) axis only. The element can only be dragged up and down.

### 3. Both Axes (`both`)

```vue
<!-- Component approach -->
<Draggable v-model:position="position" axis="both">
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  axis: 'both' // This is the default value
})
```

This is the default value and allows movement in both directions.

### Combining with Other Props

Axis constraints can be combined with other props for more complex behavior:

```vue
<!-- Component approach -->
<Draggable
  v-model:position="position"
  axis="x"
  :grid="[20, 20]"
  bounds="parent"
>
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  axis: 'x',
  grid: [20, 20],
  bounds: 'parent'
})
```

This example constrains movement to the horizontal axis, snaps to a 20x20 grid, and keeps the element within its parent container.
:::
