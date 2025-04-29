# Custom Drag Handle

This example demonstrates how to use a custom drag handle with the `Draggable` component and `useDraggable` hook, allowing you to specify which part of the element can be used to initiate dragging.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })
const handleRef = ref(null)

// Hook approach
const containerRef = ref(null)
const elementRef = ref(null)
const hookHandleRef = ref(null)
const { position: hookPosition, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  handle: hookHandleRef
})
</script>

<DemoContainer title="Component Approach">
  <Draggable v-model:position="position" :handle="handleRef">
    <div class="bg-orange-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-between">
      <div class="handle bg-orange-700 p-2 rounded cursor-move text-center" ref="handleRef">Drag Handle</div>
      <div class="text-center">Drag only by handle</div>
      <div class="text-sm text-center">Position: {{ position.x }}, {{ position.y }}</div>
    </div>
  </Draggable>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div ref="containerRef">
    <div
      ref="elementRef"
      :style="style"
      class="bg-blue-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-between"
    >
      <div class="handle bg-blue-700 p-2 rounded cursor-move text-center" ref="hookHandleRef">Drag Handle</div>
      <div class="text-center">Drag only by handle</div>
      <div class="text-sm text-center">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
    </div>
  </div>
</DemoContainer>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { Draggable } from 'vue-dndnr'

const position = ref({ x: 50, y: 50 })
const handleRef = ref(null)
</script>

<template>
  <Draggable v-model:position="position" :handle="handleRef">
    <div class="draggable-element">
      <div ref="handleRef" class="drag-handle">
        Drag Handle
      </div>
      <div class="content">
        Drag only by handle
      </div>
      <div class="position">
        Position: {{ position.x }}, {{ position.y }}
      </div>
    </div>
  </Draggable>
</template>

<style scoped>
.draggable-element {
  background-color: #e67e22;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 12rem;
  height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.drag-handle {
  background-color: #d35400;
  padding: 0.5rem;
  border-radius: 0.25rem;
  text-align: center;
  cursor: move;
}

.content {
  text-align: center;
}

.position {
  font-size: 0.875rem;
  text-align: center;
}
</style>
```
:::

## Hook Approach

::: details View Hook Code
```vue
<script setup>
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const elementRef = ref(null)
const handleRef = ref(null)
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  handle: handleRef
})
</script>

<template>
  <div>
    <div
      ref="elementRef"
      :style="style"
      class="draggable-element"
    >
      <div ref="handleRef" class="drag-handle">
        Drag Handle
      </div>
      <div class="content">
        Drag only by handle
      </div>
      <div class="position">
        Position: {{ position.x }}, {{ position.y }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.draggable-element {
  background-color: #3498db;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 12rem;
  height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.drag-handle {
  background-color: #2980b9;
  padding: 0.5rem;
  border-radius: 0.25rem;
  text-align: center;
  cursor: move;
}

.content {
  text-align: center;
}

.position {
  font-size: 0.875rem;
  text-align: center;
}
</style>
```
:::

## Handle Options

::: details View Handle Options
Both the component and hook support several types of handle values:

### 1. Element Reference

```vue
<!-- Component approach -->
<script setup>
import { ref } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'
</script>

<script setup>
const position = ref({ x: 50, y: 50 })
const handleRef = ref(null)

const elementRef = ref(null)
const handleRef = ref(null)
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  handle: handleRef
})
</script>

<!-- Hook approach -->
<template>
  <Draggable v-model:position="position" :handle="handleRef">
    <div class="draggable-element">
      <div ref="handleRef" class="drag-handle">
        Drag Handle
      </div>
      <!-- Rest of your content -->
    </div>
  </Draggable>
</template>

<template>
  <div>
    <div ref="elementRef" :style="style" class="draggable-element">
      <div class="drag-handle" ref="handleRef">Drag Handle</div>
      <!-- Rest of your content -->
    </div>
  </div>
</template>
```

This approach uses a Vue ref to specify the handle element.

### 2. CSS Selector

```vue
<!-- Component approach -->
<script setup>
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const elementRef = ref(null)
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  handle: '.drag-handle'
})
</script>

<!-- Hook approach -->
<template>
  <Draggable v-model:position="position" handle=".drag-handle">
    <div class="draggable-element">
      <div class="drag-handle">
        Drag Handle
      </div>
      <!-- Rest of your content -->
    </div>
  </Draggable>
</template>

<template>
  <div>
    <div ref="elementRef" :style="style" class="draggable-element">
      <div class="drag-handle">Drag Handle</div>
      <!-- Rest of your content -->
    </div>
  </div>
</template>
```

This approach uses a CSS selector to specify the handle element.

### 3. Direct Element

You can also pass an HTMLElement directly if you have access to it:

```vue
<!-- Component approach -->
<script setup>
import { onMounted, ref } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'
</script>

<script setup>
const position = ref({ x: 50, y: 50 })
const handleElement = ref(null)

onMounted(() => {
  handleElement.value = document.querySelector('.drag-handle')
})

const elementRef = ref(null)
const handleElement = ref(null)

onMounted(() => {
  handleElement.value = document.querySelector('.drag-handle')
})

const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  handle: handleElement
})
</script>

<!-- Hook approach -->
<template>
  <Draggable v-model:position="position" :handle="handleElement">
    <div class="draggable-element">
      <div class="drag-handle">
        Drag Handle
      </div>
      <!-- Rest of your content -->
    </div>
  </Draggable>
</template>

<template>
  <div>
    <div ref="elementRef" :style="style" class="draggable-element">
      <div class="drag-handle">Drag Handle</div>
      <!-- Rest of your content -->
    </div>
  </div>
</template>
```
:::
