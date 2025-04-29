# Aspect Ratio Locked Resizing

This example demonstrates how to maintain a fixed aspect ratio while resizing an element using both the `Resizable` component and `useResizable` hook.

## Live Demo

<script setup>
import { shallowRef, ref, computed } from 'vue'
import { Resizable, useResizable } from 'vue-dndnr'

// Component approach
const size = shallowRef({ width: 200, height: 150 })
const initialRatio = size.value.width / size.value.height

// Hook approach
const elementRef = ref(null)
const { size: hookSize, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  lockAspectRatio: true
})
const hookRatio = computed(() => (hookSize.width / hookSize.height).toFixed(2))
const hookInitialRatio = 200 / 150
</script>

<DemoContainer title="Component Approach">
  <Resizable v-model:size="size" :lock-aspect-ratio="true">
    <div class="bg-orange-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Resize while maintaining aspect ratio!
      <div class="text-sm mt-2">Size: {{ size.width }} x {{ size.height }}</div>
      <div class="text-xs mt-1">Ratio: {{ (size.width / size.height).toFixed(2) }} (Initial: {{ initialRatio.toFixed(2) }})</div>
    </div>
  </Resizable>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div
    ref="elementRef"
    :style="style"
    class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
  >
    Resize while maintaining aspect ratio!
    <div class="text-sm mt-2">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
    <div class="text-xs mt-1">Ratio: {{ hookRatio }} (Initial: {{ hookInitialRatio.toFixed(2) }})</div>
  </div>
</DemoContainer>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { computed, ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 150 })
const aspectRatio = computed(() => (size.value.width / size.value.height).toFixed(2))
const initialRatio = 200 / 150
</script>

<template>
  <Resizable v-model:size="size" :lock-aspect-ratio="true">
    <div class="resizable-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Resize while maintaining aspect ratio!
      <div>Size: {{ size.width }} x {{ size.height }}</div>
      <div class="ratio">
        Ratio: {{ aspectRatio }} (Initial: {{ initialRatio.toFixed(2) }})
      </div>
    </div>
  </Resizable>
</template>

<style scoped>
.resizable-element {
  background-color: #e67e22;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ratio {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
```
:::

## Hook Approach

::: details View Hook Code
```vue
<script setup>
import { computed, ref } from 'vue'
import { useResizable } from 'vue-dndnr'

const elementRef = ref(null)
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  lockAspectRatio: true
})
const aspectRatio = computed(() => (size.width / size.height).toFixed(2))
const initialRatio = 200 / 150
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="resizable-element"
  >
    Resize while maintaining aspect ratio!
    <div>Size: {{ size.width }} x {{ size.height }}</div>
    <div class="ratio">
      Ratio: {{ aspectRatio }} (Initial: {{ initialRatio.toFixed(2) }})
    </div>
  </div>
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

.ratio {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
```
:::

## How It Works

::: details View Details
When the `lockAspectRatio` prop (for component) or option (for hook) is set to `true`, the component will maintain the initial width-to-height ratio during resizing. This means that if you resize the element from any handle, both dimensions will change proportionally.

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :lock-aspect-ratio="true">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  lockAspectRatio: true
})
```

The aspect ratio is calculated from the initial size when the component is mounted. If you change the size programmatically, the new aspect ratio will be used for subsequent resizing operations.

### Combining with Other Props

#### With Size Constraints

You can combine aspect ratio locking with size constraints:

```vue
<!-- Component approach -->
<Resizable
  v-model:size="size"
  :lock-aspect-ratio="true"
  :min-width="100"
  :min-height="75"
  :max-width="400"
  :max-height="300"
>
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  lockAspectRatio: true,
  minWidth: 100,
  minHeight: 75,
  maxWidth: 400,
  maxHeight: 300
})
```

When both aspect ratio locking and size constraints are used, the component will:

1. Maintain the aspect ratio during resizing
2. Respect the size constraints
3. If a constraint would be violated while maintaining the aspect ratio, the component will adjust both dimensions to the closest valid size that maintains the ratio

#### With Custom Handles

You can also combine aspect ratio locking with custom handles:

```vue
<!-- Component approach -->
<Resizable
  v-model:size="size"
  :lock-aspect-ratio="true"
  :handles="['br', 'tr', 'bl', 'tl']"
>
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  lockAspectRatio: true,
  handles: ['br', 'tr', 'bl', 'tl']
})
```

This is often a good combination since corner handles work well with aspect ratio locking, while edge handles might feel less intuitive when both dimensions change.
:::
