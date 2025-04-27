# Basic Usage

This guide will show you how to use the basic components of Vue DNDNR.

## Draggable Component

The `Draggable` component allows you to make any element draggable.

```vue
<script setup>
import { ref } from 'vue'
import { Draggable } from 'vue-dndnr'

const position = ref({ x: 100, y: 100 })
</script>

<template>
  <Draggable v-model:position="position" bounds="parent">
    <div class="draggable-box">
      Drag me!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
    </div>
  </Draggable>
</template>

<style scoped>
.draggable-box {
  width: 200px;
  height: 100px;
  background-color: #3498db;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  cursor: move;
}
</style>
```

## Resizable Component

The `Resizable` component allows you to make any element resizable.

```vue
<script setup>
import { ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 150 })
</script>

<template>
  <Resizable v-model:size="size" :min-width="100" :min-height="100">
    <div class="resizable-box">
      Resize me!
      <div>Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </Resizable>
</template>

<style scoped>
.resizable-box {
  background-color: #2ecc71;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  height: 100%;
  width: 100%;
}
</style>
```

## DnR Component (Draggable and Resizable)

The `DnR` component combines both draggable and resizable functionality.

```vue
<script setup>
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'

const position = ref({ x: 100, y: 100 })
const size = ref({ width: 200, height: 150 })
</script>

<template>
  <DnR
    v-model:position="position"
    v-model:size="size"
    bounds="parent"
    :min-width="100"
    :min-height="100"
  >
    <div class="dnr-box">
      Drag and resize me!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
      <div>Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </DnR>
</template>

<style scoped>
.dnr-box {
  background-color: #9b59b6;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  height: 100%;
  width: 100%;
  cursor: move;
}
</style>
```

## Using Hooks

If you need more control, you can use the hooks directly:

```vue
<script setup>
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const elementRef = ref(null)
const { position, isDragging } = useDraggable(elementRef, {
  initialPosition: { x: 100, y: 100 },
  bounds: 'parent',
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      backgroundColor: isDragging ? '#e74c3c' : '#3498db',
      padding: '20px',
      borderRadius: '4px',
      color: 'white',
      cursor: 'move',
      userSelect: 'none',
    }"
  >
    Using useDraggable hook
    <div>Position: {{ position.x }}, {{ position.y }}</div>
    <div>Dragging: {{ isDragging }}</div>
  </div>
</template>
```

Check out the [Components](/components/) and [Hooks](/hooks/) sections for more detailed documentation.
