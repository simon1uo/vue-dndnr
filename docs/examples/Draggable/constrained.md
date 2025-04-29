# Constrained Draggable

This example demonstrates how to constrain the draggable element within boundaries using both the `Draggable` component and `useDraggable` hook.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })

// Hook approach
const containerRef = ref(null)
const elementRef = ref(null)
const { position: hookPosition, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  bounds: 'parent'
})
</script>

<DemoContainer title="Component Approach">
  <div class="relative bg-gray-200 w-full h-64 rounded-lg overflow-hidden">
    <Draggable v-model:position="position" bounds="parent">
      <div class="bg-green-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center">
        Drag me within the parent container!
        <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
      </div>
    </Draggable>
  </div>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div class="relative bg-gray-200 w-full h-64 rounded-lg overflow-hidden" ref="containerRef">
    <div
      ref="elementRef"
      :style="style"
      class="bg-purple-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center"
    >
      Drag me within the parent container!
      <div class="text-sm mt-2">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
    </div>
  </div>
</DemoContainer>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { Draggable } from 'vue-dndnr'

const position = ref({ x: 50, y: 50 })
</script>

<template>
  <div class="container">
    <Draggable v-model:position="position" bounds="parent">
      <div class="draggable-element">
        Drag me within the parent container!
        <div>Position: {{ position.x }}, {{ position.y }}</div>
      </div>
    </Draggable>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  background-color: #f1f1f1;
  width: 100%;
  height: 16rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.draggable-element {
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

const containerRef = ref(null)
const elementRef = ref(null)
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  bounds: 'parent'
})
</script>

<template>
  <div ref="containerRef" class="container">
    <div
      ref="elementRef"
      :style="style"
      class="draggable-element"
    >
      Drag me within the parent container!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
    </div>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  background-color: #f1f1f1;
  width: 100%;
  height: 16rem;
  border-radius: 0.5rem;
  overflow: hidden;
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

## Boundary Options

The `bounds` prop (for component) or option (for hook) can accept several types of values:

::: details View Boundary Options
### 1. Parent Element

```vue
<!-- Component approach -->
<Draggable v-model:position="position" bounds="parent">
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  bounds: 'parent'
})
```

This constrains the draggable element within its parent container. The parent element must have `position: relative`, `position: absolute`, or `position: fixed` for this to work correctly.

### 2. Selector String

```vue
<!-- Component approach -->
<Draggable v-model:position="position" bounds="#boundary-element">
  <!-- Your content -->
</Draggable>

<!-- Hook approach -->
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  bounds: '#boundary-element'
})
```

This constrains the draggable element within the element matching the selector.

### 3. Element Reference

```vue
<!-- Component approach -->
<script setup>
import { ref } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'
</script>

<script setup>
const position = ref({ x: 50, y: 50 })
const boundaryRef = ref(null)

const boundaryRef = ref(null)
const elementRef = ref(null)
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  bounds: boundaryRef
})
</script>

<!-- Hook approach -->
<template>
  <div ref="boundaryRef" class="boundary">
    <Draggable v-model:position="position" :bounds="boundaryRef">
      <!-- Your content -->
    </Draggable>
  </div>
</template>

<template>
  <div ref="boundaryRef" class="boundary">
    <div ref="elementRef" :style="style">
      <!-- Your content -->
    </div>
  </div>
</template>
```

### 4. Custom Boundary Object

```vue
<!-- Component approach -->
<script setup>
import { ref } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'
</script>

<script setup>
const position = ref({ x: 50, y: 50 })
const customBounds = {
  left: 0,
  top: 0,
  right: 500,
  bottom: 300
}

const elementRef = ref(null)
const customBounds = {
  left: 0,
  top: 0,
  right: 500,
  bottom: 300
}
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  bounds: customBounds
})
</script>

<!-- Hook approach -->
<template>
  <Draggable v-model:position="position" :bounds="customBounds">
    <!-- Your content -->
  </Draggable>
</template>

<template>
  <div>
    <div ref="elementRef" :style="style">
      <!-- Your content -->
    </div>
  </div>
</template>
```

This allows you to define explicit boundary coordinates.
:::
