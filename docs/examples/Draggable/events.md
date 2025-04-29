# Draggable Event Handling

This example demonstrates how to handle events emitted by the `Draggable` component and `useDraggable` hook during the drag lifecycle.

## Live Demo

<script setup>
import { shallowRef, ref } from 'vue'
import { Draggable, useDraggable } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })
const eventLog = ref([])

function onDragStart(pos, event) {
  eventLog.value.push(`Drag started at x: ${pos.x}, y: ${pos.y}`)
  // Limit log length
  if (eventLog.value.length > 5) eventLog.value.shift()
}

function onDrag(pos, event) {
  eventLog.value[eventLog.value.length - 1] = `Dragging at x: ${pos.x}, y: ${pos.y}`
}

function onDragEnd(pos, event) {
  eventLog.value.push(`Drag ended at x: ${pos.x}, y: ${pos.y}`)
  // Limit log length
  if (eventLog.value.length > 5) eventLog.value.shift()
}

// Hook approach
const elementRef = ref(null)
const hookEventLog = ref([])

const { position: hookPosition, style, isDragging } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  onDragStart: (pos, event) => {
    hookEventLog.value.push(`Drag started at x: ${pos.x}, y: ${pos.y}`)
    if (hookEventLog.value.length > 5) hookEventLog.value.shift()
  },
  onDrag: (pos, event) => {
    hookEventLog.value[hookEventLog.value.length - 1] = `Dragging at x: ${pos.x}, y: ${pos.y}`
  },
  onDragEnd: (pos, event) => {
    hookEventLog.value.push(`Drag ended at x: ${pos.x}, y: ${pos.y}`)
    if (hookEventLog.value.length > 5) hookEventLog.value.shift()
  }
})
</script>

<DemoContainer title="Component Approach">
  <div class="flex flex-col space-y-4">
    <div>
      <h3 class="text-lg font-medium mb-2">Event Log:</h3>
      <div v-if="eventLog.length === 0" class="text-gray-500">No events yet. Try dragging the element.</div>
      <ul v-else class="space-y-1">
        <li v-for="(log, index) in eventLog" :key="index" class="text-sm">
          {{ log }}
        </li>
      </ul>
    </div>
    <Draggable
      v-model:position="position"
      @dragStart="onDragStart"
      @drag="onDrag"
      @dragEnd="onDragEnd"
    >
      <div class="bg-blue-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center">
        Drag me!
        <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
      </div>
    </Draggable>
  </div>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div class="flex flex-col space-y-4">
    <div>
      <h3 class="text-lg font-medium mb-2">Event Log:</h3>
      <div v-if="hookEventLog.length === 0" class="text-gray-500">No events yet. Try dragging the element.</div>
      <ul v-else class="space-y-1">
        <li v-for="(log, index) in hookEventLog" :key="index" class="text-sm">
          {{ log }}
        </li>
      </ul>
    </div>
    <div
      ref="elementRef"
      :style="style"
      class="bg-purple-500 text-white p-4 rounded shadow-md w-48 h-32 flex flex-col justify-center items-center"
      :class="{ 'ring-2 ring-purple-300': isDragging }"
    >
      Drag me!
      <div class="text-sm mt-2">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
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
const eventLog = ref([])

function onDragStart(pos, event) {
  eventLog.value.push(`Drag started at x: ${pos.x}, y: ${pos.y}`)
  // Limit log length
  if (eventLog.value.length > 5)
    eventLog.value.shift()
}

function onDrag(pos, event) {
  eventLog.value[eventLog.value.length - 1] = `Dragging at x: ${pos.x}, y: ${pos.y}`
}

function onDragEnd(pos, event) {
  eventLog.value.push(`Drag ended at x: ${pos.x}, y: ${pos.y}`)
  // Limit log length
  if (eventLog.value.length > 5)
    eventLog.value.shift()
}
</script>

<template>
  <div class="container">
    <div class="event-log">
      <h3>Event Log:</h3>
      <div v-if="eventLog.length === 0" class="empty-log">
        No events yet. Try dragging the element.
      </div>
      <ul v-else>
        <li v-for="(log, index) in eventLog" :key="index">
          {{ log }}
        </li>
      </ul>
    </div>

    <Draggable
      v-model:position="position"
      @drag-start="onDragStart"
      @drag="onDrag"
      @drag-end="onDragEnd"
    >
      <div class="draggable-element">
        Drag me!
        <div>Position: {{ position.x }}, {{ position.y }}</div>
      </div>
    </Draggable>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

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
  justify-content: center;
  align-items: center;
}

.event-log {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
}

.event-log h3 {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.empty-log {
  color: #6c757d;
}

.event-log ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-log li {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
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
const eventLog = ref([])

const { position, style, isDragging } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  onDragStart: (pos, event) => {
    eventLog.value.push(`Drag started at x: ${pos.x}, y: ${pos.y}`)
    if (eventLog.value.length > 5)
      eventLog.value.shift()
  },
  onDrag: (pos, event) => {
    eventLog.value[eventLog.value.length - 1] = `Dragging at x: ${pos.x}, y: ${pos.y}`
  },
  onDragEnd: (pos, event) => {
    eventLog.value.push(`Drag ended at x: ${pos.x}, y: ${pos.y}`)
    if (eventLog.value.length > 5)
      eventLog.value.shift()
  }
})
</script>

<template>
  <div class="container">
    <div class="event-log">
      <h3>Event Log:</h3>
      <div v-if="eventLog.length === 0" class="empty-log">
        No events yet. Try dragging the element.
      </div>
      <ul v-else>
        <li v-for="(log, index) in eventLog" :key="index">
          {{ log }}
        </li>
      </ul>
    </div>

    <div
      ref="elementRef"
      :style="style"
      class="draggable-element"
      :class="{ dragging: isDragging }"
    >
      Drag me!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.draggable-element {
  background-color: #9b59b6;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 12rem;
  height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.dragging {
  box-shadow: 0 0 0 2px rgba(155, 89, 182, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2);
}

.event-log {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
}

.event-log h3 {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.empty-log {
  color: #6c757d;
}

.event-log ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-log li {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}
</style>
```
:::

## Event Handling

::: details View Event Handling Details
### Component Events

The `Draggable` component emits the following events during the drag lifecycle:

```vue
<Draggable
  @dragStart="(position, event) => { /* Your code here */ }"
  @drag="(position, event) => { /* Your code here */ }"
  @dragEnd="(position, event) => { /* Your code here */ }"
>
  <!-- Your content -->
</Draggable>
```

### Hook Event Callbacks

The `useDraggable` hook accepts event callbacks in its options:

```vue
const { position, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  onDragStart: (position, event) => { /* Your code here */ },
  onDrag: (position, event) => { /* Your code here */ },
  onDragEnd: (position, event) => { /* Your code here */ }
})
```

### Event Parameters

Each event handler receives two parameters:

1. `position`: An object with `x` and `y` properties representing the current position
2. `event`: The original DOM event (PointerEvent)

### Event Timing

- **dragStart/onDragStart**: Emitted when dragging begins
- **drag/onDrag**: Emitted continuously during dragging
- **dragEnd/onDragEnd**: Emitted when dragging ends
:::
