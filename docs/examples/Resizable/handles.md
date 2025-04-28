# Custom Resize Handles

This example demonstrates how to customize which resize handles are available on the `Resizable` component and `useResizable` hook.

## Live Demo

<script setup>
import { shallowRef, ref } from 'vue'
import { Resizable, useResizable } from 'vue-dndnr'

// Component approach
const cornerSize = shallowRef({ width: 200, height: 150 })
const edgeSize = shallowRef({ width: 200, height: 150 })
const customSize = shallowRef({ width: 200, height: 150 })
const activeHandle = ref(null)

function onResizeStart(size, event, handle) {
  activeHandle.value = handle
}

function onResizeEnd() {
  activeHandle.value = null
}

// Hook approach
const cornerElementRef = ref(null)
const edgeElementRef = ref(null)
const customElementRef = ref(null)
const hookActiveHandle = ref(null)

const { size: hookCornerSize, style: cornerStyle } = useResizable(cornerElementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['tl', 'tr', 'bl', 'br']
})

const { size: hookEdgeSize, style: edgeStyle } = useResizable(edgeElementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['t', 'b', 'l', 'r']
})

const { size: hookCustomSize, style: customStyle } = useResizable(customElementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['br'],
  onResizeStart: (size, event, handle) => {
    hookActiveHandle.value = handle
  },
  onResizeEnd: () => {
    hookActiveHandle.value = null
  }
})
</script>

<DemoContainer title="Component - Corner Handles Only">
  <Resizable v-model:size="cornerSize" :handles="['tl', 'tr', 'bl', 'br']">
    <div class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${cornerSize.width}px`, height: `${cornerSize.height}px` }">
      Resize from corners only!
      <div class="text-sm mt-2">Size: {{ cornerSize.width }} x {{ cornerSize.height }}</div>
    </div>
  </Resizable>
</DemoContainer>

<DemoContainer title="Component - Edge Handles Only">
  <Resizable v-model:size="edgeSize" :handles="['t', 'b', 'l', 'r']">
    <div class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${edgeSize.width}px`, height: `${edgeSize.height}px` }">
      Resize from edges only!
      <div class="text-sm mt-2">Size: {{ edgeSize.width }} x {{ edgeSize.height }}</div>
    </div>
  </Resizable>
</DemoContainer>

<DemoContainer title="Component - Bottom-Right Handle Only">
  <Resizable
    v-model:size="customSize"
    :handles="['br']"
    @resizeStart="onResizeStart"
    @resizeEnd="onResizeEnd"
  >
    <div class="bg-orange-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${customSize.width}px`, height: `${customSize.height}px` }">
      Resize from bottom-right corner only!
      <div class="text-sm mt-2">Size: {{ customSize.width }} x {{ customSize.height }}</div>
      <div v-if="activeHandle" class="text-xs mt-1">Active handle: {{ activeHandle }}</div>
    </div>
  </Resizable>
</DemoContainer>

<DemoContainer title="Hook - Corner Handles Only">
  <div
    ref="cornerElementRef"
    :style="cornerStyle"
    class="bg-purple-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
  >
    Resize from corners only!
    <div class="text-sm mt-2">Size: {{ hookCornerSize.width }} x {{ hookCornerSize.height }}</div>
  </div>
</DemoContainer>

<DemoContainer title="Hook - Edge Handles Only">
  <div
    ref="edgeElementRef"
    :style="edgeStyle"
    class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
  >
    Resize from edges only!
    <div class="text-sm mt-2">Size: {{ hookEdgeSize.width }} x {{ hookEdgeSize.height }}</div>
  </div>
</DemoContainer>

<DemoContainer title="Hook - Bottom-Right Handle Only">
  <div
    ref="customElementRef"
    :style="customStyle"
    class="bg-orange-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
  >
    Resize from bottom-right corner only!
    <div class="text-sm mt-2">Size: {{ hookCustomSize.width }} x {{ hookCustomSize.height }}</div>
    <div v-if="hookActiveHandle" class="text-xs mt-1">Active handle: {{ hookActiveHandle }}</div>
  </div>
</DemoContainer>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 150 })
const activeHandle = ref(null)

function onResizeStart(size, event, handle) {
  activeHandle.value = handle
}

function onResizeEnd() {
  activeHandle.value = null
}
</script>

<template>
  <Resizable
    v-model:size="size"
    :handles="['br']"
    @resizeStart="onResizeStart"
    @resizeEnd="onResizeEnd"
  >
    <div class="resizable-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Resize from bottom-right corner only!
      <div>Size: {{ size.width }} x {{ size.height }}</div>
      <div v-if="activeHandle">Active handle: {{ activeHandle }}</div>
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
const activeHandle = ref(null)

const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['br'],
  onResizeStart: (size, event, handle) => {
    activeHandle.value = handle
  },
  onResizeEnd: () => {
    activeHandle.value = null
  }
})
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="resizable-element"
  >
    Resize from bottom-right corner only!
    <div>Size: {{ size.width }} x {{ size.height }}</div>
    <div v-if="activeHandle">Active handle: {{ activeHandle }}</div>
  </div>
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
</style>
```
:::

## Available Handles

::: details View Available Handles
The `handles` prop (for component) or option (for hook) accepts an array of strings representing the handles to display. The available handles are:

| Handle | Description | Position |
|--------|-------------|----------|
| `'t'` | Top edge | Middle of top edge |
| `'b'` | Bottom edge | Middle of bottom edge |
| `'l'` | Left edge | Middle of left edge |
| `'r'` | Right edge | Middle of right edge |
| `'tl'` | Top-left corner | Top-left corner |
| `'tr'` | Top-right corner | Top-right corner |
| `'bl'` | Bottom-left corner | Bottom-left corner |
| `'br'` | Bottom-right corner | Bottom-right corner |

### Common Handle Configurations

#### 1. Corners Only

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :handles="['tl', 'tr', 'bl', 'br']">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['tl', 'tr', 'bl', 'br']
})
```

This configuration only allows resizing from the corners, which is useful for maintaining the center position of the element.

#### 2. Edges Only

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :handles="['t', 'b', 'l', 'r']">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['t', 'b', 'l', 'r']
})
```

This configuration only allows resizing from the edges, which is useful for more precise control over width and height independently.

#### 3. Bottom-Right Only

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :handles="['br']">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['br']
})
```

This is a common configuration for text areas and input fields, where resizing is only allowed from the bottom-right corner.

#### 4. Width Only

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :handles="['l', 'r']">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['l', 'r']
})
```

This configuration only allows horizontal resizing, keeping the height fixed.

#### 5. Height Only

```vue
<!-- Component approach -->
<Resizable v-model:size="size" :handles="['t', 'b']">
  <!-- Your content -->
</Resizable>

<!-- Hook approach -->
const { size, style } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  handles: ['t', 'b']
})
```

This configuration only allows vertical resizing, keeping the width fixed.
:::
