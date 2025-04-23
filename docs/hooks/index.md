# Hooks Overview

Vue DNDNR provides a set of composable hooks that you can use to add drag and resize functionality to your Vue 3 components. These hooks give you more control and flexibility compared to using the pre-built components.

## Available Hooks

### useDraggable

The `useDraggable` hook adds drag functionality to any element.

[Learn more about useDraggable →](/hooks/use-draggable)

### useResizable

The `useResizable` hook adds resize functionality to any element.

[Learn more about useResizable →](/hooks/use-resizable)

### useDnR

The `useDnR` hook combines both drag and resize functionality.

[Learn more about useDnR →](/hooks/use-dnr)

## Hook Design Philosophy

All hooks in Vue DNDNR follow these design principles:

1. **Composable**: Hooks can be used together or separately
2. **Reactive**: Return reactive state that can be used in templates
3. **Flexible**: Provide options for customization
4. **Type-safe**: Full TypeScript support with type definitions
5. **Performant**: Optimized for smooth interactions

## Basic Example

Here's a simple example using the `useDraggable` hook:

```vue
<script setup>
import { useDraggable } from 'vue-dndnr'
import { ref } from 'vue'

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
      padding: '20px',
      backgroundColor: isDragging ? '#e74c3c' : '#3498db',
      color: 'white',
      borderRadius: '4px',
      cursor: 'move'
    }"
  >
    Drag me using the hook!
    <div>Position: {{ position.x }}, {{ position.y }}</div>
  </div>
</template>
```
