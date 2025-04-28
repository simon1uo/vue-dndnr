# Basic DnR Usage

This example demonstrates the most basic usage of the `DnR` component and `useDnR` hook, which combine both draggable and resizable functionality.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { DnR, useDnR } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })
const size = shallowRef({ width: 200, height: 150 })

// Hook approach
const elementRef = ref(null)
const { position: hookPosition, size: hookSize, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 }
})
</script>

<DemoContainer title="Component Approach">
  <DnR v-model:position="position" v-model:size="size">
    <div class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Drag and resize me!
      <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
      <div class="text-sm mt-1">Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </DnR>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div
    ref="elementRef"
    :style="style"
    class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
  >
    Drag and resize me!
    <div class="text-sm mt-2">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
    <div class="text-sm mt-1">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
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
</script>

<template>
  <DnR v-model:position="position" v-model:size="size">
    <div class="dnr-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Drag and resize me!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
      <div>Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </DnR>
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
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 }
})
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="dnr-element"
  >
    Drag and resize me!
    <div>Position: {{ position.x }}, {{ position.y }}</div>
    <div>Size: {{ size.width }} x {{ size.height }}</div>
  </div>
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
  justify-content: center;
  align-items: center;
}
</style>
```
:::
