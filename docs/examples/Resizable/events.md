# Resizable Event Handling

This example demonstrates how to handle events emitted by the `Resizable` component and `useResizable` hook during the resize lifecycle.

## Live Demo

<script setup>
import { ref, shallowRef } from 'vue'
import { Resizable, useResizable } from 'vue-dndnr'

// Component approach
const size = shallowRef({ width: 200, height: 150 })
const eventLog = ref([])
const activeHandle = ref(null)

function onResizeStart(newSize, event) {
  // Get the current active resize handle
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const threshold = 8; // Edge detection threshold

  // Determine which handle is activated
  if (x < threshold && y < threshold) activeHandle.value = 'tl';
  else if (x > rect.width - threshold && y < threshold) activeHandle.value = 'tr';
  else if (x < threshold && y > rect.height - threshold) activeHandle.value = 'bl';
  else if (x > rect.width - threshold && y > rect.height - threshold) activeHandle.value = 'br';
  else if (x < threshold) activeHandle.value = 'l';
  else if (x > rect.width - threshold) activeHandle.value = 'r';
  else if (y < threshold) activeHandle.value = 't';
  else if (y > rect.height - threshold) activeHandle.value = 'b';
  else activeHandle.value = 'unknown';

  eventLog.value.push(`Resize started at ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`)
  // Limit log length
  if (eventLog.value.length > 5) eventLog.value.shift()
}

function onResize(newSize, event) {
  eventLog.value[eventLog.value.length - 1] = `Resizing to ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`
}

function onResizeEnd(newSize, event) {
  eventLog.value.push(`Resize ended at ${newSize.width}x${newSize.height}`)
  activeHandle.value = null
  // Limit log length
  if (eventLog.value.length > 5) eventLog.value.shift()
}

// Hook approach
const elementRef = ref(null)
const hookEventLog = ref([])
const hookActiveHandle = ref(null)

const { size: hookSize, style, isResizing } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  onResizeStart: (newSize, event) => {
    // Get the current active resize handle
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const threshold = 8; // Edge detection threshold

    // Determine which handle is activated
    if (x < threshold && y < threshold) hookActiveHandle.value = 'tl';
    else if (x > rect.width - threshold && y < threshold) hookActiveHandle.value = 'tr';
    else if (x < threshold && y > rect.height - threshold) hookActiveHandle.value = 'bl';
    else if (x > rect.width - threshold && y > rect.height - threshold) hookActiveHandle.value = 'br';
    else if (x < threshold) hookActiveHandle.value = 'l';
    else if (x > rect.width - threshold) hookActiveHandle.value = 'r';
    else if (y < threshold) hookActiveHandle.value = 't';
    else if (y > rect.height - threshold) hookActiveHandle.value = 'b';
    else hookActiveHandle.value = 'unknown';

    hookEventLog.value.push(`Resize started at ${newSize.width}x${newSize.height} using ${hookActiveHandle.value} handle`)
    // Limit log length
    if (hookEventLog.value.length > 5) hookEventLog.value.shift()
  },
  onResize: (newSize, event) => {
    hookEventLog.value[hookEventLog.value.length - 1] = `Resizing to ${newSize.width}x${newSize.height} using ${hookActiveHandle.value} handle`
  },
  onResizeEnd: (newSize, event) => {
    hookEventLog.value.push(`Resize ended at ${newSize.width}x${newSize.height}`)
    hookActiveHandle.value = null
    // Limit log length
    if (hookEventLog.value.length > 5) hookEventLog.value.shift()
  }
})
</script>

<DemoContainer title="Component Approach">
  <div class="flex flex-col space-y-4">
    <Resizable
      v-model:size="size"
      @resizeStart="onResizeStart"
      @resize="onResize"
      @resizeEnd="onResizeEnd"
    >
      <div class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Resize me!
        <div class="text-sm mt-2">Size: {{ size.width }} x {{ size.height }}</div>
        <div v-if="activeHandle" class="text-sm mt-1">Active Handle: {{ activeHandle }}</div>
      </div>
    </Resizable>
    <div class="p-4 rounded">
      <h3 class="text-lg font-medium mb-2">Event Log:</h3>
      <div v-if="eventLog.length === 0" class="text-gray-500">No events yet. Try resizing the element.</div>
      <ul v-else class="space-y-1">
        <li v-for="(log, index) in eventLog" :key="index" class="text-sm">
          {{ log }}
        </li>
      </ul>
    </div>
  </div>
</DemoContainer>

<DemoContainer title="Hook Approach">
  <div class="flex flex-col space-y-4">
    <div
      ref="elementRef"
      :style="style"
      class="bg-green-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
    >
      Resize me!
      <div class="text-sm mt-2">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
      <div v-if="hookActiveHandle" class="text-sm mt-1">Active Handle: {{ hookActiveHandle }}</div>
    </div>
    <div class="p-4 rounded">
      <h3 class="text-lg font-medium mb-2">Event Log:</h3>
      <div v-if="hookEventLog.length === 0" class="text-gray-500">No events yet. Try resizing the element.</div>
      <ul v-else class="space-y-1">
        <li v-for="(log, index) in hookEventLog" :key="index" class="text-sm">
          {{ log }}
        </li>
      </ul>
    </div>
  </div>
</DemoContainer>

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 150 })
const eventLog = ref([])
const activeHandle = ref(null)

function onResizeStart(newSize, event) {
  // Get the current active resize handle
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const threshold = 8 // Edge detection threshold

  // Determine which handle is activated
  if (x < threshold && y < threshold)
    activeHandle.value = 'tl'
  else if (x > rect.width - threshold && y < threshold)
    activeHandle.value = 'tr'
  else if (x < threshold && y > rect.height - threshold)
    activeHandle.value = 'bl'
  else if (x > rect.width - threshold && y > rect.height - threshold)
    activeHandle.value = 'br'
  else if (x < threshold)
    activeHandle.value = 'l'
  else if (x > rect.width - threshold)
    activeHandle.value = 'r'
  else if (y < threshold)
    activeHandle.value = 't'
  else if (y > rect.height - threshold)
    activeHandle.value = 'b'
  else activeHandle.value = 'unknown'

  eventLog.value.push(`Resize started at ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`)
  // Limit log length
  if (eventLog.value.length > 5)
    eventLog.value.shift()
}

function onResize(newSize, event) {
  eventLog.value[eventLog.value.length - 1] = `Resizing to ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`
}

function onResizeEnd(newSize, event) {
  eventLog.value.push(`Resize ended at ${newSize.width}x${newSize.height}`)
  activeHandle.value = null
  // Limit log length
  if (eventLog.value.length > 5)
    eventLog.value.shift()
}
</script>

<template>
  <div class="container">
    <Resizable
      v-model:size="size"
      @resize-start="onResizeStart"
      @resize="onResize"
      @resize-end="onResizeEnd"
    >
      <div class="resizable-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Resize me!
        <div>Size: {{ size.width }} x {{ size.height }}</div>
        <div v-if="activeHandle">
          Active Handle: {{ activeHandle }}
        </div>
      </div>
    </Resizable>

    <div class="event-log">
      <h3>Event Log:</h3>
      <div v-if="eventLog.length === 0" class="empty-log">
        No events yet. Try resizing the element.
      </div>
      <ul v-else>
        <li v-for="(log, index) in eventLog" :key="index">
          {{ log }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

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
import { useResizable } from 'vue-dndnr'

const elementRef = ref(null)
const eventLog = ref([])
const activeHandle = ref(null)

const { size, style, isResizing } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  onResizeStart: (newSize, event) => {
    // Get the current active resize handle
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const threshold = 8 // Edge detection threshold

    // Determine which handle is activated
    if (x < threshold && y < threshold)
      activeHandle.value = 'tl'
    else if (x > rect.width - threshold && y < threshold)
      activeHandle.value = 'tr'
    else if (x < threshold && y > rect.height - threshold)
      activeHandle.value = 'bl'
    else if (x > rect.width - threshold && y > rect.height - threshold)
      activeHandle.value = 'br'
    else if (x < threshold)
      activeHandle.value = 'l'
    else if (x > rect.width - threshold)
      activeHandle.value = 'r'
    else if (y < threshold)
      activeHandle.value = 't'
    else if (y > rect.height - threshold)
      activeHandle.value = 'b'
    else activeHandle.value = 'unknown'

    eventLog.value.push(`Resize started at ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`)
    // Limit log length
    if (eventLog.value.length > 5)
      eventLog.value.shift()
  },
  onResize: (newSize, event) => {
    eventLog.value[eventLog.value.length - 1] = `Resizing to ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`
  },
  onResizeEnd: (newSize, event) => {
    eventLog.value.push(`Resize ended at ${newSize.width}x${newSize.height}`)
    activeHandle.value = null
    // Limit log length
    if (eventLog.value.length > 5)
      eventLog.value.shift()
  }
})
</script>

<template>
  <div class="container">
    <div
      ref="elementRef"
      :style="style"
      class="resizable-element"
    >
      Resize me!
      <div>Size: {{ size.width }} x {{ size.height }}</div>
      <div v-if="activeHandle">
        Active Handle: {{ activeHandle }}
      </div>
    </div>

    <div class="event-log">
      <h3>Event Log:</h3>
      <div v-if="eventLog.length === 0" class="empty-log">
        No events yet. Try resizing the element.
      </div>
      <ul v-else>
        <li v-for="(log, index) in eventLog" :key="index">
          {{ log }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

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
