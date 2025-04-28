# Constrained DnR

This example demonstrates how to constrain both dragging and resizing within boundaries and size limits using both the `DnR` component and `useDnR` hook.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { DnR, useDnR } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })
const size = shallowRef({ width: 200, height: 150 })

// Hook approach
const containerRef = ref(null)
const elementRef = ref(null)
const { position: hookPosition, size: hookSize, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  bounds: 'parent',
  minWidth: 100,
  minHeight: 100,
  maxWidth: 300,
  maxHeight: 200
})
</script>

<DemoContainer title="Component Approach">
  <div class="relative bg-gray-200 w-full h-64 rounded-lg overflow-hidden">
    <DnR
      v-model:position="position"
      v-model:size="size"
      bounds="parent"
      :min-width="100"
      :min-height="100"
      :max-width="300"
      :max-height="200"
    >
      <div class="bg-green-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Drag and resize within constraints!
        <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
        <div class="text-sm mt-1">Size: {{ size.width }} x {{ size.height }}</div>
        <div class="text-xs mt-1">Constraints: 100x100 to 300x200</div>
      </div>
    </DnR>
  </div>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div class="relative bg-gray-200 w-full h-64 rounded-lg overflow-hidden" ref="containerRef">
    <div
      ref="elementRef"
      :style="style"
      class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
    >
      Drag and resize within constraints!
      <div class="text-sm mt-2">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
      <div class="text-sm mt-1">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
      <div class="text-xs mt-1">Constraints: 100x100 to 300x200</div>
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
</script>

<template>
  <div class="container">
    <DnR
      v-model:position="position"
      v-model:size="size"
      bounds="parent"
      :min-width="100"
      :min-height="100"
      :max-width="300"
      :max-height="200"
    >
      <div class="dnr-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Drag and resize within constraints!
        <div>Position: {{ position.x }}, {{ position.y }}</div>
        <div>Size: {{ size.width }} x {{ size.height }}</div>
        <div class="constraints">Constraints: 100x100 to 300x200</div>
      </div>
    </DnR>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  background-color: #f1f1f1;
  width: 100%;
  height: 16rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.dnr-element {
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
import { useDnR } from 'vue-dndnr'

const containerRef = ref(null)
const elementRef = ref(null)
const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  bounds: 'parent',
  minWidth: 100,
  minHeight: 100,
  maxWidth: 300,
  maxHeight: 200
})
</script>

<template>
  <div class="container" ref="containerRef">
    <div
      ref="elementRef"
      :style="style"
      class="dnr-element"
    >
      Drag and resize within constraints!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
      <div>Size: {{ size.width }} x {{ size.height }}</div>
      <div class="constraints">Constraints: 100x100 to 300x200</div>
    </div>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  background-color: #f1f1f1;
  width: 100%;
  height: 16rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

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

.constraints {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
```
:::

## Constraint Options

::: details View Constraint Options
Both the component and hook provide several ways to constrain both dragging and resizing:

### Movement Constraints

```vue
<!-- Component approach -->
<DnR v-model:position="position" v-model:size="size" bounds="parent">
  <!-- Your content -->
</DnR>

<!-- Hook approach -->
const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  bounds: 'parent'
})
```

This constrains the element within its parent container. The parent element must have `position: relative`, `position: absolute`, or `position: fixed` for this to work correctly.

You can also use a selector string, element reference, or custom boundary object:

```vue
<!-- Component approach with selector -->
<DnR bounds="#boundary-element">
  <!-- Your content -->
</DnR>

<!-- Hook approach with selector -->
const { position, size, style } = useDnR(elementRef, {
  bounds: '#boundary-element'
})

<!-- Component approach with ref -->
<DnR :bounds="boundaryRef">
  <!-- Your content -->
</DnR>

<!-- Hook approach with ref -->
const { position, size, style } = useDnR(elementRef, {
  bounds: boundaryRef
})

<!-- Component approach with object -->
<DnR :bounds="{ left: 0, top: 0, right: 500, bottom: 300 }">
  <!-- Your content -->
</DnR>

<!-- Hook approach with object -->
const { position, size, style } = useDnR(elementRef, {
  bounds: { left: 0, top: 0, right: 500, bottom: 300 }
})
```

### Size Constraints

Both the component and hook provide options to constrain the size:

```vue
<!-- Component approach -->
<DnR
  v-model:position="position"
  v-model:size="size"
  :min-width="100"
  :min-height="100"
  :max-width="300"
  :max-height="200"
>
  <!-- Your content -->
</DnR>

<!-- Hook approach -->
const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
  maxWidth: 300,
  maxHeight: 200
})
```

These options prevent the element from being resized beyond the specified limits.

### Combining Constraints

You can combine movement and size constraints for complete control:

```vue
<!-- Component approach -->
<DnR
  v-model:position="position"
  v-model:size="size"
  bounds="parent"
  :min-width="100"
  :min-height="100"
  :max-width="300"
  :max-height="200"
>
  <!-- Your content -->
</DnR>

<!-- Hook approach -->
const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  bounds: 'parent',
  minWidth: 100,
  minHeight: 100,
  maxWidth: 300,
  maxHeight: 200
})
```

This constrains the element to stay within its parent container and maintains a size between 100x100 and 300x200 pixels.
:::
