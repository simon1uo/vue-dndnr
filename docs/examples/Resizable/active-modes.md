# Active State and Activation Modes

This example demonstrates how to use the `active` state and `activeOn` property to control when elements can be resized.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Resizable, useResizable } from 'vue-dndnr'

// Component approach - Click activation
const clickSize = shallowRef({ width: 200, height: 150 })
const clickActive = ref(false)

// Component approach - Hover activation
const hoverSize = shallowRef({ width: 200, height: 150 })
const hoverActive = ref(false)

// Component approach - Always active (traditional)
const alwaysSize = shallowRef({ width: 200, height: 150 })

// Hook approach
const clickElementRef = ref(null)
const hoverElementRef = ref(null)
const alwaysElementRef = ref(null)

const {
  size: hookClickSize,
  style: hookClickStyle,
  isActive: hookClickActive
} = useResizable(clickElementRef, {
  initialSize: { width: 200, height: 150 },
  initialActive: false,
  activeOn: 'click'
})

const {
  size: hookHoverSize,
  style: hookHoverStyle,
  isActive: hookHoverActive
} = useResizable(hoverElementRef, {
  initialSize: { width: 200, height: 150 },
  initialActive: false,
  activeOn: 'hover'
})

const {
  size: hookAlwaysSize,
  style: hookAlwaysStyle
} = useResizable(alwaysElementRef, {
  initialSize: { width: 200, height: 150 },
  initialActive: true,
  activeOn: 'none'
})
</script>

<DemoContainer title="Component Approach">
  <div class="flex flex-col space-y-4">
    <div class="flex space-x-4">
      <Resizable
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
          <div class="text-sm mt-2">Size: {{ clickSize.width }} x {{ clickSize.height }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: {{ clickActive ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </Resizable>
      <Resizable
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
          <div class="text-sm mt-2">Size: {{ hoverSize.width }} x {{ hoverSize.height }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: {{ hoverActive ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </Resizable>
      <Resizable
        v-model:size="alwaysSize"
        activeOn="none"
        class="demo-container"
      >
        <div
          class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
          :style="{ width: `${alwaysSize.width}px`, height: `${alwaysSize.height}px` }"
        >
          Always active
          <div class="text-sm mt-2">Size: {{ alwaysSize.width }} x {{ alwaysSize.height }}</div>
          <div class="text-sm mt-1 font-bold">
            Status: Always active
          </div>
        </div>
      </Resizable>
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
        <div class="text-sm mt-2">Size: {{ hookClickSize.width }} x {{ hookClickSize.height }}</div>
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
        <div class="text-sm mt-2">Size: {{ hookHoverSize.width }} x {{ hookHoverSize.height }}</div>
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
        <div class="text-sm mt-2">Size: {{ hookAlwaysSize.width }} x {{ hookAlwaysSize.height }}</div>
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
import { Resizable } from 'vue-dndnr'

// Click activation
const clickSize = ref({ width: 200, height: 150 })
const clickActive = ref(false)

// Hover activation
const hoverSize = ref({ width: 200, height: 150 })
const hoverActive = ref(false)

// Always active (traditional)
const alwaysSize = ref({ width: 200, height: 150 })
</script>

<template>
  <div class="container">
    <!-- Click to activate -->
    <Resizable
      v-model:size="clickSize"
      v-model:active="clickActive"
      active-on="click"
    >
      <div class="element" :style="{ width: `${clickSize.width}px`, height: `${clickSize.height}px` }">
        Click to activate
        <div>Size: {{ clickSize.width }} x {{ clickSize.height }}</div>
        <div>Status: {{ clickActive ? 'Active' : 'Inactive' }}</div>
      </div>
    </Resizable>

    <!-- Hover to activate -->
    <Resizable
      v-model:size="hoverSize"
      v-model:active="hoverActive"
      active-on="hover"
    >
      <div class="element" :style="{ width: `${hoverSize.width}px`, height: `${hoverSize.height}px` }">
        Hover to activate
        <div>Size: {{ hoverSize.width }} x {{ hoverSize.height }}</div>
        <div>Status: {{ hoverActive ? 'Active' : 'Inactive' }}</div>
      </div>
    </Resizable>

    <!-- Always active -->
    <Resizable
      v-model:size="alwaysSize"
      active-on="none"
    >
      <div class="element" :style="{ width: `${alwaysSize.width}px`, height: `${alwaysSize.height}px` }">
        Always active
        <div>Size: {{ alwaysSize.width }} x {{ alwaysSize.height }}</div>
        <div>Status: Always active</div>
      </div>
    </Resizable>
  </div>
</template>
```
:::

## Hook Approach

::: details View Hook Code
```vue
<script setup>
import { ref } from 'vue'
import { useResizable } from 'vue-dndnr'

const clickElementRef = ref(null)
const hoverElementRef = ref(null)
const alwaysElementRef = ref(null)

// Click activation
const {
  size: clickSize,
  style: clickStyle,
  isActive: clickActive
} = useResizable(clickElementRef, {
  initialSize: { width: 200, height: 150 },
  initialActive: false,
  activeOn: 'click'
})

// Hover activation
const {
  size: hoverSize,
  style: hoverStyle,
  isActive: hoverActive
} = useResizable(hoverElementRef, {
  initialSize: { width: 200, height: 150 },
  initialActive: false,
  activeOn: 'hover'
})

// Always active
const {
  size: alwaysSize,
  style: alwaysStyle
} = useResizable(alwaysElementRef, {
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
      <div>Size: {{ clickSize.width }} x {{ clickSize.height }}</div>
      <div>Status: {{ clickActive ? 'Active' : 'Inactive' }}</div>
    </div>

    <!-- Hover to activate -->
    <div ref="hoverElementRef" :style="hoverStyle" class="element">
      Hover to activate
      <div>Size: {{ hoverSize.width }} x {{ hoverSize.height }}</div>
      <div>Status: {{ hoverActive ? 'Active' : 'Inactive' }}</div>
    </div>

    <!-- Always active -->
    <div ref="alwaysElementRef" :style="alwaysStyle" class="element">
      Always active
      <div>Size: {{ alwaysSize.width }} x {{ alwaysSize.height }}</div>
      <div>Status: Always active</div>
    </div>
  </div>
</template>
```
:::
