# Active State and Activation Modes

This example demonstrates how to use the `active` state and `activeOn` property to control when elements can be dragged.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'

// Component approach - Click activation
const clickPosition = shallowRef({ x: 50, y: 50 })
const clickActive = ref(false)

// Component approach - Hover activation
const hoverPosition = shallowRef({ x: 300, y: 50 })
const hoverActive = ref(false)

// Component approach - Always active (traditional)
const alwaysPosition = shallowRef({ x: 550, y: 50 })

// Hook approach
const clickElementRef = ref(null)
const hoverElementRef = ref(null)
const alwaysElementRef = ref(null)

const {
  position: hookClickPosition,
  style: hookClickStyle,
  isActive: hookClickActive
} = useDraggable(clickElementRef, {
  initialPosition: { x: 50, y: 250 },
  initialActive: false,
  activeOn: 'click'
})

const {
  position: hookHoverPosition,
  style: hookHoverStyle,
  isActive: hookHoverActive
} = useDraggable(hoverElementRef, {
  initialPosition: { x: 300, y: 250 },
  initialActive: false,
  activeOn: 'hover'
})

const {
  position: hookAlwaysPosition,
  style: hookAlwaysStyle
} = useDraggable(alwaysElementRef, {
  initialPosition: { x: 550, y: 250 },
  initialActive: true,
  activeOn: 'none'
})
</script>

<DemoContainer title="Component Approach">
  <div class="flex flex-col space-y-4">
    <div class="flex space-x-4">
      <Draggable
        v-model:position="clickPosition"
        v-model:active="clickActive"
        activeOn="click"
        class="demo-container"
      >
        <div
          class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center w-48 h-32"
        >
          Click to activate
          <div class="text-sm mt-2">Position: {{ clickPosition.x }}, {{ clickPosition.y }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: {{ clickActive ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </Draggable>
      <Draggable
        v-model:position="hoverPosition"
        v-model:active="hoverActive"
        activeOn="hover"
        class="demo-container"
      >
        <div
          class="bg-green-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center w-48 h-32"
        >
          Hover to activate
          <div class="text-sm mt-2">Position: {{ hoverPosition.x }}, {{ hoverPosition.y }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: {{ hoverActive ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </Draggable>
      <Draggable
        v-model:position="alwaysPosition"
        activeOn="none"
        class="demo-container"
      >
        <div
          class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center w-48 h-32"
        >
          Always active
          <div class="text-sm mt-2">Position: {{ alwaysPosition.x }}, {{ alwaysPosition.y }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: Always active
          </div>
        </div>
      </Draggable>
    </div>
  </div>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div class="flex flex-col space-y-4">
    <div class="flex space-x-4">
      <div
        ref="clickElementRef"
        :style="hookClickStyle"
        class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center w-48 h-32"
      >
        Click to activate
        <div class="text-sm mt-2">Position: {{ hookClickPosition.x }}, {{ hookClickPosition.y }}</div>
        <div class="text-sm mt-1 font-bold">
          Status: {{ hookClickActive ? 'Active' : 'Inactive' }}
        </div>
      </div>
      <div
        ref="hoverElementRef"
        :style="hookHoverStyle"
        class="bg-green-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center w-48 h-32"
      >
        Hover to activate
        <div class="text-sm mt-2">Position: {{ hookHoverPosition.x }}, {{ hookHoverPosition.y }}</div>
        <div class="text-sm mt-1 font-bold">
          Status: {{ hookHoverActive ? 'Active' : 'Inactive' }}
        </div>
      </div>
      <div
        ref="alwaysElementRef"
        :style="hookAlwaysStyle"
        class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center w-48 h-32"
      >
        Always active
        <div class="text-sm mt-2">Position: {{ hookAlwaysPosition.x }}, {{ hookAlwaysPosition.y }}</div>
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
import { Draggable } from 'vue-dndnr'

// Click activation
const clickPosition = ref({ x: 50, y: 50 })
const clickActive = ref(false)

// Hover activation
const hoverPosition = ref({ x: 300, y: 50 })
const hoverActive = ref(false)

// Always active (traditional)
const alwaysPosition = ref({ x: 550, y: 50 })
</script>

<template>
  <div class="container">
    <!-- Click to activate -->
    <Draggable
      v-model:position="clickPosition"
      v-model:active="clickActive"
      active-on="click"
    >
      <div class="element">
        Click to activate
        <div>Position: {{ clickPosition.x }}, {{ clickPosition.y }}</div>
        <div>Status: {{ clickActive ? 'Active' : 'Inactive' }}</div>
      </div>
    </Draggable>

    <!-- Hover to activate -->
    <Draggable
      v-model:position="hoverPosition"
      v-model:active="hoverActive"
      active-on="hover"
    >
      <div class="element">
        Hover to activate
        <div>Position: {{ hoverPosition.x }}, {{ hoverPosition.y }}</div>
        <div>Status: {{ hoverActive ? 'Active' : 'Inactive' }}</div>
      </div>
    </Draggable>

    <!-- Always active -->
    <Draggable
      v-model:position="alwaysPosition"
      active-on="none"
    >
      <div class="element">
        Always active
        <div>Position: {{ alwaysPosition.x }}, {{ alwaysPosition.y }}</div>
        <div>Status: Always active</div>
      </div>
    </Draggable>
  </div>
</template>
```
:::

## Hook Approach

::: details View Hook Code
```vue
<script setup>
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const clickElementRef = ref(null)
const hoverElementRef = ref(null)
const alwaysElementRef = ref(null)

// Click activation
const {
  position: clickPosition,
  style: clickStyle,
  isActive: clickActive
} = useDraggable(clickElementRef, {
  initialPosition: { x: 50, y: 50 },
  initialActive: false,
  activeOn: 'click'
})

// Hover activation
const {
  position: hoverPosition,
  style: hoverStyle,
  isActive: hoverActive
} = useDraggable(hoverElementRef, {
  initialPosition: { x: 300, y: 50 },
  initialActive: false,
  activeOn: 'hover'
})

// Always active
const {
  position: alwaysPosition,
  style: alwaysStyle
} = useDraggable(alwaysElementRef, {
  initialPosition: { x: 550, y: 50 },
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
      <div>Status: {{ clickActive ? 'Active' : 'Inactive' }}</div>
    </div>

    <!-- Hover to activate -->
    <div ref="hoverElementRef" :style="hoverStyle" class="element">
      Hover to activate
      <div>Position: {{ hoverPosition.x }}, {{ hoverPosition.y }}</div>
      <div>Status: {{ hoverActive ? 'Active' : 'Inactive' }}</div>
    </div>

    <!-- Always active -->
    <div ref="alwaysElementRef" :style="alwaysStyle" class="element">
      Always active
      <div>Position: {{ alwaysPosition.x }}, {{ alwaysPosition.y }}</div>
      <div>Status: Always active</div>
    </div>
  </div>
</template>
```
:::
