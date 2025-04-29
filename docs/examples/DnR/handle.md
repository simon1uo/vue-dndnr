# Custom Drag Handle

This example demonstrates how to use a custom drag handle with the `DnR` component and `useDnR` hook, allowing you to specify which part of the element can be used to initiate dragging.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { DnR, useDnR } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })
const size = shallowRef({ width: 200, height: 150 })
const handleRef = ref(null)

// Hook approach
const elementRef = ref(null)
const hookHandleRef = ref(null)
const { position: hookPosition, size: hookSize, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  handle: hookHandleRef
})
</script>

<DemoContainer title="Component Approach">
  <DnR
    v-model:position="position"
    v-model:size="size"
    :handle="handleRef"
  >
    <div class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      <div class="handle bg-purple-700 p-2 rounded cursor-move text-center mb-4" ref="handleRef">Drag Handle</div>
      <div class="text-center flex-grow flex flex-col justify-center">
        <div>Drag only by handle</div>
        <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
        <div class="text-sm mt-1">Size: {{ size.width }} x {{ size.height }}</div>
      </div>
    </div>
  </DnR>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div
    ref="elementRef"
    :style="style"
    class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col"
  >
    <div class="handle bg-blue-700 p-2 rounded cursor-move text-center mb-4" ref="hookHandleRef">Drag Handle</div>
    <div class="text-center flex-grow flex flex-col justify-center">
      <div>Drag only by handle</div>
      <div class="text-sm mt-2">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
      <div class="text-sm mt-1">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
    </div>
  </div>
</DemoContainer>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'

const position = ref({ x: 50, y: 50 })
const size = ref({ width: 200, height: 150 })
const handleRef = ref(null)
</script>

<template>
  <DnR
    v-model:position="position"
    v-model:size="size"
    :handle="handleRef"
  >
    <div class="dnr-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      <div ref="handleRef" class="drag-handle">
        Drag Handle
      </div>
      <div class="content">
        <div>Drag only by handle</div>
        <div>Position: {{ position.x }}, {{ position.y }}</div>
        <div>Size: {{ size.width }} x {{ size.height }}</div>
      </div>
    </div>
  </DnR>
</template>

<style scoped>
.dnr-element {
  background-color: #9b59b6;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.drag-handle {
  background-color: #8e44ad;
  padding: 0.5rem;
  border-radius: 0.25rem;
  text-align: center;
  cursor: move;
  margin-bottom: 1rem;
}

.content {
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
```
:::

## Hook Approach

::: details View Hook Code
```vue
<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const handleRef = ref(null)
const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  handle: handleRef
})
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="dnr-element"
  >
    <div ref="handleRef" class="drag-handle">
      Drag Handle
    </div>
    <div class="content">
      <div>Drag only by handle</div>
      <div>Position: {{ position.x }}, {{ position.y }}</div>
      <div>Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </div>
</template>

<style scoped>
.dnr-element {
  background-color: #3498db;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.drag-handle {
  background-color: #2980b9;
  padding: 0.5rem;
  border-radius: 0.25rem;
  text-align: center;
  cursor: move;
  margin-bottom: 1rem;
}

.content {
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
```
:::
