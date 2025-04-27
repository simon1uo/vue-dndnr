# Components Overview

Vue DNDNR provides several components to add drag and resize functionality to your Vue 3 applications.

## Available Components

### Draggable

The `Draggable` component allows you to make any element draggable. It provides a simple way to add drag functionality with customizable options.

[Learn more about Draggable →](/components/draggable)

### Resizable

The `Resizable` component allows you to make any element resizable. It provides handles on the edges and corners to resize the element.

[Learn more about Resizable →](/components/resizable)

### DnR (Draggable and Resizable)

The `DnR` component combines both draggable and resizable functionality into a single component.

[Learn more about DnR →](/components/dnr)

## Component Design Philosophy

All components in Vue DNDNR follow these design principles:

1. **Composable**: Components can be used together or separately
2. **Customizable**: Extensive props for configuration
3. **Reactive**: Two-way binding with v-model support
4. **Accessible**: Keyboard navigation and ARIA attributes
5. **Performant**: Optimized for smooth interactions

## Basic Example

Here's a simple example using the `Draggable` component:

```vue
<script setup>
import { ref } from 'vue'
import { Draggable } from 'vue-dndnr'

const position = ref({ x: 100, y: 100 })
</script>

<template>
  <Draggable v-model:position="position">
    <div class="draggable-element">
      Drag me!
    </div>
  </Draggable>
</template>

<style scoped>
.draggable-element {
  width: 200px;
  height: 100px;
  background-color: #3498db;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
}
</style>
```
