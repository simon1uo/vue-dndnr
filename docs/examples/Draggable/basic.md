# Basic Draggable Usage

This example demonstrates the most basic usage of the `Draggable` component and `useDraggable` hook.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })

// Hook approach
const elementRef = ref(null)
const { position: hookPosition, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 }
})
</script>

<DemoContainer title="Component Approach">
  <Draggable v-model:position="position">
    <div class="bg-blue-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center">
      Drag me!
      <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
    </div>
  </Draggable>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div
    ref="elementRef"
    :style="style"
    class="bg-purple-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center"
  >
    Drag me!
    <div class="text-sm mt-2">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
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
  <Draggable v-model:position="position">
    <div class="draggable-element">
      Drag me!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
    </div>
  </Draggable>
</template>

<style scoped>
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

## Hook Approach

::: details View Hook Code
```vue
<script setup>
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const elementRef = ref(null)
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 }
})
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="draggable-element"
  >
    Drag me!
    <div>Position: {{ position.x }}, {{ position.y }}</div>
  </div>
</template>

<style scoped>
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
