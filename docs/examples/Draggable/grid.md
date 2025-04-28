# Grid-Aligned Draggable

This example demonstrates how to make a draggable element snap to a grid while being dragged using both the `Draggable` component and `useDraggable` hook.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 60, y: 60 })

// Hook approach
const elementRef = ref(null)
const { position: hookPosition, style } = useDraggable(elementRef, {
  initialPosition: { x: 60, y: 60 },
  grid: [20, 20]
})
</script>

<DemoContainer title="Component Approach">
  <div class="relative bg-gray-100 w-full h-64 rounded-lg overflow-hidden grid-background">
    <Draggable v-model:position="position" :grid="[20, 20]">
      <div class="bg-purple-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center">
        Drag me along the grid!
        <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
      </div>
    </Draggable>
  </div>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div class="relative bg-gray-100 w-full h-64 rounded-lg overflow-hidden grid-background">
    <div
      ref="elementRef"
      :style="style"
      class="bg-blue-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center"
    >
      Drag me along the grid!
      <div class="text-sm mt-2">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
    </div>
  </div>
</DemoContainer>

<style>
.grid-background {
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { Draggable } from 'vue-dndnr'

const position = ref({ x: 60, y: 60 })
</script>

<template>
  <div class="grid-container">
    <Draggable v-model:position="position" :grid="[20, 20]">
      <div class="draggable-element">
        Drag me along the grid!
        <div>Position: {{ position.x }}, {{ position.y }}</div>
      </div>
    </Draggable>
  </div>
</template>

<style scoped>
.grid-container {
  position: relative;
  background-color: #f8f9fa;
  width: 100%;
  height: 16rem;
  border-radius: 0.5rem;
  overflow: hidden;
  /* Grid background */
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.draggable-element {
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

const elementRef = ref(null)
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 60, y: 60 },
  grid: [20, 20]
})
</script>

<template>
  <div class="grid-container">
    <div
      ref="elementRef"
      :style="style"
      class="draggable-element"
    >
      Drag me along the grid!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  position: relative;
  background-color: #f8f9fa;
  width: 100%;
  height: 16rem;
  border-radius: 0.5rem;
  overflow: hidden;
  /* Grid background */
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.draggable-element {
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
}
</style>
```
:::

## Grid Configuration

::: details View Grid Configuration
The `grid` prop (for component) or option (for hook) takes an array of two numbers representing the x and y grid spacing in pixels:

```vue
<!-- Component approach -->
<Draggable v-model:position="position" :grid="[20, 20]">
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 60, y: 60 },
  grid: [20, 20]
})
```

In this example, the element will snap to a 20x20 pixel grid.

### Different X and Y Grid Spacing

You can set different grid spacing for the x and y axes:

```vue
<!-- Component approach -->
<Draggable v-model:position="position" :grid="[50, 25]">
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 60, y: 60 },
  grid: [50, 25]
})
```

This will create a grid with 50px horizontal spacing and 25px vertical spacing.

### Combining with Bounds

You can combine grid snapping with boundary constraints:

```vue
<!-- Component approach -->
<Draggable
  v-model:position="position"
  :grid="[20, 20]"
  bounds="parent"
>
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 60, y: 60 },
  grid: [20, 20],
  bounds: 'parent'
})
```

This will make the element snap to the grid while also being constrained within its parent container.
:::
