# Constrained Resizing

This example demonstrates how to constrain the resizable element with minimum and maximum size limits using both the `Resizable` component and `useResizable` hook.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Resizable, useResizable } from 'vue-dndnr'

// Component approach
const size = shallowRef({ width: 200, height: 150 })

// Hook approach
const elementRef = ref(null)
const { size: hookSize, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  maxWidth: 400,
  maxHeight: 300
})
</script>

<DemoContainer title="Component Approach">
  <Resizable v-model:size="size" :min-width="100" :min-height="100" :max-width="400" :max-height="300">
    <div class="bg-green-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Resize me within constraints!
      <div class="text-sm mt-2">Size: {{ size.width }} x {{ size.height }}</div>
      <div class="text-xs mt-1">Constraints: 100x100 to 400x300</div>
    </div>
  </Resizable>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div
    ref="elementRef"
    :style="style"
    class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
  >
    Resize me within constraints!
    <div class="text-sm mt-2">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
    <div class="text-xs mt-1">Constraints: 100x100 to 400x300</div>
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
  <Resizable
    v-model:size="size"
    :min-width="100"
    :min-height="100"
    :max-width="400"
    :max-height="300"
  >
    <div class="resizable-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Resize me within constraints!
      <div>Size: {{ size.width }} x {{ size.height }}</div>
      <div class="constraints">
        Constraints: 100x100 to 400x300
      </div>
    </div>
  </Resizable>
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

.constraints {
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
import { ref } from 'vue'
import { useResizable } from 'vue-dndnr'

const elementRef = ref(null)
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  maxWidth: 400,
  maxHeight: 300
})
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="resizable-element"
  >
    Resize me within constraints!
    <div>Size: {{ size.width }} x {{ size.height }}</div>
    <div class="constraints">
      Constraints: 100x100 to 400x300
    </div>
  </div>
</template>

<style scoped>
.resizable-element {
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

.constraints {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
```
:::

## Size Constraints

::: details View Size Constraints
Both the component and hook provide options to constrain the size of the element:

### 1. Minimum Width

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :min-width="100">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100
})
```

This prevents the element from being resized to a width smaller than 100 pixels.

### 2. Minimum Height

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :min-height="100">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minHeight: 100
})
```

This prevents the element from being resized to a height smaller than 100 pixels.

### 3. Maximum Width

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :max-width="400">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  maxWidth: 400
})
```

This prevents the element from being resized to a width larger than 400 pixels.

### 4. Maximum Height

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :max-height="300">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  maxHeight: 300
})
```

This prevents the element from being resized to a height larger than 300 pixels.

### Combining Constraints

You can combine all four constraints to create a bounded size range:

```vue
<!-- Component approach -->
<Resizable
  v-model:size="size"
  :min-width="100"
  :min-height="100"
  :max-width="400"
  :max-height="300"
>
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  maxWidth: 400,
  maxHeight: 300
})
```

This constrains the element to a size between 100x100 and 400x300 pixels.
:::
