# Window Style DnR

This example demonstrates how to create a window-like UI element using the `DnR` component and `useDnR` hook.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { DnR, useDnR } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })
const size = shallowRef({ width: 300, height: 200 })
const handleRef = ref(null)

// Hook approach
const elementRef = ref(null)
const hookHandleRef = ref(null)
const { position: hookPosition, size: hookSize, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 150 },
  initialSize: { width: 300, height: 200 },
  handle: hookHandleRef
})
</script>

<DemoContainer title="Component Approach">
  <DnR
    v-model:position="position"
    v-model:size="size"
    :handle="handleRef"
  >
    <div class="bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      <div class="window-header bg-gray-100 p-2 border-b border-gray-300 flex justify-between items-center cursor-move" ref="handleRef">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div class="text-sm font-medium text-black">Window Example</div>
        <div class="w-4"></div>
      </div>
      <div class="p-4 flex flex-col h-[calc(100%-36px)]">
        <div class="text-gray-700 flex-grow flex flex-col justify-center items-center">
          <div>Draggable and resizable window</div>
          <div class="text-sm mt-2 text-gray-500">Position: {{ position.x }}, {{ position.y }}</div>
          <div class="text-sm mt-1 text-gray-500">Size: {{ size.width }} x {{ size.height }}</div>
        </div>
      </div>
    </div>
  </DnR>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div
    ref="elementRef"
    :style="style"
    class="bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden"
  >
    <div class="window-header bg-gray-100 p-2 border-b border-gray-300 flex justify-between items-center cursor-move" ref="hookHandleRef">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
        <div class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
        <div class="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      <div class="text-sm font-medium text-black">Window Example</div>
      <div class="w-4"></div>
    </div>
    <div class="p-4 flex flex-col h-[calc(100%-36px)]">
      <div class="text-gray-700 flex-grow flex flex-col justify-center items-center">
        <div>Draggable and resizable window</div>
        <div class="text-sm mt-2 text-gray-500">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
        <div class="text-sm mt-1 text-gray-500">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
      </div>
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
const size = ref({ width: 300, height: 200 })
const handleRef = ref(null)
</script>

<template>
  <DnR
    v-model:position="position"
    v-model:size="size"
    :handle="handleRef"
  >
    <div class="window" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      <div class="window-header" ref="handleRef">
        <div class="window-controls">
          <div class="control red"></div>
          <div class="control yellow"></div>
          <div class="control green"></div>
        </div>
        <div class="window-title">Window Example</div>
        <div class="window-spacer"></div>
      </div>
      <div class="window-content">
        <div class="window-body">
          <div>Draggable and resizable window</div>
          <div class="window-info">Position: {{ position.x }}, {{ position.y }}</div>
          <div class="window-info">Size: {{ size.width }} x {{ size.height }}</div>
        </div>
      </div>
    </div>
  </DnR>
</template>

<style scoped>
.window {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.window-header {
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.window-controls {
  display: flex;
  align-items: center;
}

.control {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.red {
  background-color: #f56565;
}

.yellow {
  background-color: #ecc94b;
}

.green {
  background-color: #48bb78;
}

.window-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a202c;
}

.window-spacer {
  width: 1rem;
}

.window-content {
  padding: 1rem;
  height: calc(100% - 36px);
  display: flex;
  flex-direction: column;
}

.window-body {
  color: #4a5568;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.window-info {
  font-size: 0.875rem;
  color: #718096;
  margin-top: 0.25rem;
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
  initialSize: { width: 300, height: 200 },
  handle: handleRef
})
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="window"
  >
    <div class="window-header" ref="handleRef">
      <div class="window-controls">
        <div class="control red"></div>
        <div class="control yellow"></div>
        <div class="control green"></div>
      </div>
      <div class="window-title">Window Example</div>
      <div class="window-spacer"></div>
    </div>
    <div class="window-content">
      <div class="window-body">
        <div>Draggable and resizable window</div>
        <div class="window-info">Position: {{ position.x }}, {{ position.y }}</div>
        <div class="window-info">Size: {{ size.width }} x {{ size.height }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.window {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.window-header {
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.window-controls {
  display: flex;
  align-items: center;
}

.control {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.red {
  background-color: #f56565;
}

.yellow {
  background-color: #ecc94b;
}

.green {
  background-color: #48bb78;
}

.window-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a202c;
}

.window-spacer {
  width: 1rem;
}

.window-content {
  padding: 1rem;
  height: calc(100% - 36px);
  display: flex;
  flex-direction: column;
}

.window-body {
  color: #4a5568;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.window-info {
  font-size: 0.875rem;
  color: #718096;
  margin-top: 0.25rem;
}
</style>
```
:::
