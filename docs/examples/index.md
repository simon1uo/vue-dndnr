# Basic Examples

This section provides basic examples of how to use Vue DNDNR components and hooks.

## Draggable Example

A simple example of a draggable element.

```vue
<script setup>
import { Draggable } from 'vue-dndnr'
import { ref } from 'vue'

const position = ref({ x: 100, y: 100 })
</script>

<template>
  <div class="example-container">
    <Draggable v-model:position="position" bounds="parent">
      <div class="draggable-box">
        <div>Drag me!</div>
        <div>Position: {{ position.x }}, {{ position.y }}</div>
      </div>
    </Draggable>
  </div>
</template>

<style scoped>
.example-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px dashed #ccc;
  margin-bottom: 20px;
}

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

## Resizable Example

A simple example of a resizable element.

```vue
<script setup>
import { Resizable } from 'vue-dndnr'
import { ref } from 'vue'

const size = ref({ width: 200, height: 150 })
</script>

<template>
  <div class="example-container">
    <Resizable
      v-model:size="size"
      :min-width="100"
      :min-height="100"
      :max-width="500"
      :max-height="300"
    >
      <div class="resizable-box">
        <div>Resize me!</div>
        <div>Size: {{ size.width }} x {{ size.height }}</div>
      </div>
    </Resizable>
  </div>
</template>

<style scoped>
.example-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px dashed #ccc;
  margin-bottom: 20px;
}

.resizable-box {
  width: 100%;
  height: 100%;
  background-color: #2ecc71;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
}
</style>
```

## DnR Example

A simple example of an element that is both draggable and resizable.

```vue
<script setup>
import { DnR } from 'vue-dndnr'
import { ref } from 'vue'

const position = ref({ x: 100, y: 100 })
const size = ref({ width: 200, height: 150 })
</script>

<template>
  <div class="example-container">
    <DnR
      v-model:position="position"
      v-model:size="size"
      bounds="parent"
      :min-width="100"
      :min-height="100"
    >
      <div class="dnr-box">
        <div>Drag and resize me!</div>
        <div>Position: {{ position.x }}, {{ position.y }}</div>
        <div>Size: {{ size.width }} x {{ size.height }}</div>
      </div>
    </DnR>
  </div>
</template>

<style scoped>
.example-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px dashed #ccc;
  margin-bottom: 20px;
}

.dnr-box {
  width: 100%;
  height: 100%;
  background-color: #9b59b6;
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

## Hook Example

An example using the `useDraggable` hook directly.

```vue
<script setup>
import { useDraggable } from 'vue-dndnr'
import { ref } from 'vue'

const containerRef = ref(null)
const elementRef = ref(null)
const { position, isDragging } = useDraggable(elementRef, {
  initialPosition: { x: 100, y: 100 },
  bounds: 'parent',
})
</script>

<template>
  <div
    ref="containerRef"
    class="example-container"
  >
    <div
      ref="elementRef"
      :style="{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '200px',
        height: '100px',
        backgroundColor: isDragging ? '#e74c3c' : '#3498db',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '4px',
        cursor: 'move',
        userSelect: 'none'
      }"
    >
      <div>Using useDraggable hook</div>
      <div>Position: {{ position.x }}, {{ position.y }}</div>
    </div>
  </div>
</template>

<style scoped>
.example-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px dashed #ccc;
  margin-bottom: 20px;
}
</style>
```
