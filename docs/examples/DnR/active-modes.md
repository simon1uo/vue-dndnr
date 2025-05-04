# Active State and Activation Modes

This example demonstrates how to use the `active` state and `activeOn` property to control when elements can be dragged or resized.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { DnR, useDnR } from 'vue-dndnr'

// Component approach - Click activation
const clickPosition = shallowRef({ x: 50, y: 50 })
const clickSize = shallowRef({ width: 200, height: 150 })
const clickActive = ref(false)

// Component approach - Hover activation
const hoverPosition = shallowRef({ x: 300, y: 50 })
const hoverSize = shallowRef({ width: 200, height: 150 })
const hoverActive = ref(false)

// Component approach - Always active (traditional)
const alwaysPosition = shallowRef({ x: 550, y: 50 })
const alwaysSize = shallowRef({ width: 200, height: 150 })

// Hook approach
const clickElementRef = ref(null)
const hoverElementRef = ref(null)
const alwaysElementRef = ref(null)

const {
  position: hookClickPosition,
  size: hookClickSize,
  style: hookClickStyle,
  isActive: hookClickActive
} = useDnR(clickElementRef, {
  initialPosition: { x: 50, y: 250 },
  initialSize: { width: 200, height: 150 },
  initialActive: false,
  activeOn: 'click'
})

const {
  position: hookHoverPosition,
  size: hookHoverSize,
  style: hookHoverStyle,
  isActive: hookHoverActive
} = useDnR(hoverElementRef, {
  initialPosition: { x: 300, y: 250 },
  initialSize: { width: 200, height: 150 },
  initialActive: false,
  activeOn: 'hover'
})

const {
  position: hookAlwaysPosition,
  size: hookAlwaysSize,
  style: hookAlwaysStyle
} = useDnR(alwaysElementRef, {
  initialPosition: { x: 550, y: 250 },
  initialSize: { width: 200, height: 150 },
  initialActive: true,
  activeOn: 'none'
})
</script>

<DemoContainer title="Component Approach">
  <div class="flex flex-col space-y-4">
    <div class="flex space-x-4">
      <DnR
        v-model:position="clickPosition"
        v-model:size="clickSize"
        v-model:active="clickActive"
        activeOn="click"
        class="demo-container"
      >
        <div
          class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
          :style="{ width: `${clickSize.width}px`, height: `${clickSize.height}px` }"
        >
          Click to activate
          <div class="text-sm mt-2">Position: {{ clickPosition.x }}, {{ clickPosition.y }}</div>
          <div class="text-sm mt-1">Size: {{ clickSize.width }} x {{ clickSize.height }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: {{ clickActive ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </DnR>
      <DnR
        v-model:position="hoverPosition"
        v-model:size="hoverSize"
        v-model:active="hoverActive"
        activeOn="hover"
        class="demo-container"
      >
        <div
          class="bg-green-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
          :style="{ width: `${hoverSize.width}px`, height: `${hoverSize.height}px` }"
        >
          Hover to activate
          <div class="text-sm mt-2">Position: {{ hoverPosition.x }}, {{ hoverPosition.y }}</div>
          <div class="text-sm mt-1">Size: {{ hoverSize.width }} x {{ hoverSize.height }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: {{ hoverActive ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </DnR>
      <DnR
        v-model:position="alwaysPosition"
        v-model:size="alwaysSize"
        activeOn="none"
        class="demo-container"
      >
        <div
          class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
          :style="{ width: `${alwaysSize.width}px`, height: `${alwaysSize.height}px` }"
        >
          Always active
          <div class="text-sm mt-2">Position: {{ alwaysPosition.x }}, {{ alwaysPosition.y }}</div>
          <div class="text-sm mt-1">Size: {{ alwaysSize.width }} x {{ alwaysSize.height }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: Always active
          </div>
        </div>
      </DnR>
    </div>
  </div>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div class="flex flex-col space-y-4">
    <div class="flex space-x-4">
      <div
        ref="clickElementRef"
        :style="hookClickStyle"
        class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
      >
        Click to activate
        <div class="text-sm mt-2">Position: {{ hookClickPosition.x }}, {{ hookClickPosition.y }}</div>
        <div class="text-sm mt-1">Size: {{ hookClickSize.width }} x {{ hookClickSize.height }}</div>
        <div class="text-sm mt-1 font-bold">
          Status: {{ hookClickActive ? 'Active' : 'Inactive' }}
        </div>
      </div>
      <div
        ref="hoverElementRef"
        :style="hookHoverStyle"
        class="bg-green-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
      >
        Hover to activate
        <div class="text-sm mt-2">Position: {{ hookHoverPosition.x }}, {{ hookHoverPosition.y }}</div>
        <div class="text-sm mt-1">Size: {{ hookHoverSize.width }} x {{ hookHoverSize.height }}</div>
        <div class="text-sm mt-1 font-bold">
          Status: {{ hookHoverActive ? 'Active' : 'Inactive' }}
        </div>
      </div>
      <div
        ref="alwaysElementRef"
        :style="hookAlwaysStyle"
        class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
      >
        Always active
        <div class="text-sm mt-2">Position: {{ hookAlwaysPosition.x }}, {{ hookAlwaysPosition.y }}</div>
        <div class="text-sm mt-1">Size: {{ hookAlwaysSize.width }} x {{ hookAlwaysSize.height }}</div>
        <div class="text-sm mt-1 font-bold">
          Status: Always active
        </div>
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

// Click activation
const clickPosition = ref({ x: 50, y: 50 })
const clickSize = ref({ width: 200, height: 150 })
const clickActive = ref(false)

// Hover activation
const hoverPosition = ref({ x: 300, y: 50 })
const hoverSize = ref({ width: 200, height: 150 })
const hoverActive = ref(false)

// Always active (traditional)
const alwaysPosition = ref({ x: 550, y: 50 })
const alwaysSize = ref({ width: 200, height: 150 })
</script>

<template>
  <div class="container">
    <!-- Click to activate -->
    <DnR
      v-model:position="clickPosition"
      v-model:size="clickSize"
      v-model:active="clickActive"
      active-on="click"
    >
      <div class="element">
        Click to activate
        <div>Position: {{ clickPosition.x }}, {{ clickPosition.y }}</div>
        <div>Size: {{ clickSize.width }} x {{ clickSize.height }}</div>
        <div>Status: {{ clickActive ? 'Active' : 'Inactive' }}</div>
      </div>
    </DnR>

    <!-- Hover to activate -->
    <DnR
      v-model:position="hoverPosition"
      v-model:size="hoverSize"
      v-model:active="hoverActive"
      active-on="hover"
    >
      <div class="element">
        Hover to activate
        <div>Position: {{ hoverPosition.x }}, {{ hoverPosition.y }}</div>
        <div>Size: {{ hoverSize.width }} x {{ hoverSize.height }}</div>
        <div>Status: {{ hoverActive ? 'Active' : 'Inactive' }}</div>
      </div>
    </DnR>

    <!-- Always active -->
    <DnR
      v-model:position="alwaysPosition"
      v-model:size="alwaysSize"
      active-on="none"
    >
      <div class="element">
        Always active
        <div>Position: {{ alwaysPosition.x }}, {{ alwaysPosition.y }}</div>
        <div>Size: {{ alwaysSize.width }} x {{ alwaysSize.height }}</div>
        <div>Status: Always active</div>
      </div>
    </DnR>
  </div>
</template>
```
:::

## Hook Approach

::: details View Hook Code
```vue
<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const clickElementRef = ref(null)
const hoverElementRef = ref(null)
const alwaysElementRef = ref(null)

// Click activation
const {
  position: clickPosition,
  size: clickSize,
  style: clickStyle,
  isActive: clickActive
} = useDnR(clickElementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  initialActive: false,
  activeOn: 'click'
})

// Hover activation
const {
  position: hoverPosition,
  size: hoverSize,
  style: hoverStyle,
  isActive: hoverActive
} = useDnR(hoverElementRef, {
  initialPosition: { x: 300, y: 50 },
  initialSize: { width: 200, height: 150 },
  initialActive: false,
  activeOn: 'hover'
})

// Always active
const {
  position: alwaysPosition,
  size: alwaysSize,
  style: alwaysStyle
} = useDnR(alwaysElementRef, {
  initialPosition: { x: 550, y: 50 },
  initialSize: { width: 200, height: 150 },
  initialActive: true,
  activeOn: 'none' // Default behavior
})
</script>

<template>
  <div class="container">
    <!-- Click to activate -->
    <div ref="clickElementRef" :style="clickStyle" class="element">
      Click to activate
      <div>Position: {{ clickPosition.x }}, {{ clickPosition.y }}</div>
      <div>Size: {{ clickSize.width }} x {{ clickSize.height }}</div>
      <div>Status: {{ clickActive ? 'Active' : 'Inactive' }}</div>
    </div>

    <!-- Hover to activate -->
    <div ref="hoverElementRef" :style="hoverStyle" class="element">
      Hover to activate
      <div>Position: {{ hoverPosition.x }}, {{ hoverPosition.y }}</div>
      <div>Size: {{ hoverSize.width }} x {{ hoverSize.height }}</div>
      <div>Status: {{ hoverActive ? 'Active' : 'Inactive' }}</div>
    </div>

    <!-- Always active -->
    <div ref="alwaysElementRef" :style="alwaysStyle" class="element">
      Always active
      <div>Position: {{ alwaysPosition.x }}, {{ alwaysPosition.y }}</div>
      <div>Size: {{ alwaysSize.width }} x {{ alwaysSize.height }}</div>
      <div>Status: Always active</div>
    </div>
  </div>
</template>
```
:::
