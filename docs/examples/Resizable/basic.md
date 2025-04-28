# Basic Resizable Usage

This example demonstrates the most basic usage of the `Resizable` component and `useResizable` hook.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Resizable, useResizable } from 'vue-dndnr'

// Component approach
const size = shallowRef({ width: 200, height: 150 })

// Hook approach
const elementRef = ref(null)
const { size: hookSize, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 }
})
</script>

<DemoContainer title="Component Approach">
  <Resizable v-model:size="size">
    <div class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Resize me!
      <div class="text-sm mt-2">Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </Resizable>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div
    ref="elementRef"
    :style="style"
    class="bg-green-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
  >
    Resize me!
    <div class="text-sm mt-2">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
  </div>
</DemoContainer>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 150 })
</script>

<template>
  <Resizable v-model:size="size">
    <div class="resizable-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Resize me!
      <div>Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </Resizable>
</template>

<style scoped>
.resizable-element {
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
import { useResizable } from 'vue-dndnr'

const elementRef = ref(null)
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 }
})
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="resizable-element"
  >
    Resize me!
    <div>Size: {{ size.width }} x {{ size.height }}</div>
  </div>
</template>

<style scoped>
.resizable-element {
  background-color: #2ecc71;
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
