# DnR Event Handling

This example demonstrates how to handle events emitted by the `DnR` component and `useDnR` hook during the drag and resize lifecycles.

## Live Demo

<script setup>
import { shallowRef, ref } from 'vue'
import { DnR, useDnR } from 'vue-dndnr'

// Component approach
const position = shallowRef({ x: 50, y: 50 })
const size = shallowRef({ width: 200, height: 150 })
const eventLog = ref([])
const activeHandle = ref(null)
const isDragging = ref(false)
const isResizing = ref(false)

function onDragStart(pos, event) {
  isDragging.value = true
  eventLog.value.push(`Drag started at x: ${pos.x}, y: ${pos.y}`)
  // Limit log length
  if (eventLog.value.length > 6) eventLog.value.shift()
}

function onDrag(pos, event) {
  eventLog.value[eventLog.value.length - 1] = `Dragging at x: ${pos.x}, y: ${pos.y}`
}

function onDragEnd(pos, event) {
  isDragging.value = false
  eventLog.value.push(`Drag ended at x: ${pos.x}, y: ${pos.y}`)
  // Limit log length
  if (eventLog.value.length > 6) eventLog.value.shift()
}

function onResizeStart(newSize, event) {
  isResizing.value = true

  // Get the current active resize handle
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const threshold = 8 // Edge detection threshold

  // Determine which handle is activated
  if (x < threshold && y < threshold) activeHandle.value = 'tl'
  else if (x > rect.width - threshold && y < threshold) activeHandle.value = 'tr'
  else if (x < threshold && y > rect.height - threshold) activeHandle.value = 'bl'
  else if (x > rect.width - threshold && y > rect.height - threshold) activeHandle.value = 'br'
  else if (x < threshold) activeHandle.value = 'l'
  else if (x > rect.width - threshold) activeHandle.value = 'r'
  else if (y < threshold) activeHandle.value = 't'
  else if (y > rect.height - threshold) activeHandle.value = 'b'
  else activeHandle.value = 'unknown'

  eventLog.value.push(`Resize started at ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`)
  // Limit log length
  if (eventLog.value.length > 6) eventLog.value.shift()
}

function onResize(newSize, event) {
  eventLog.value[eventLog.value.length - 1] = `Resizing to ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`
}

function onResizeEnd(newSize, event) {
  isResizing.value = false
  activeHandle.value = null
  eventLog.value.push(`Resize ended at ${newSize.width}x${newSize.height}`)
  // Limit log length
  if (eventLog.value.length > 6) eventLog.value.shift()
}

// Hook approach
const elementRef = ref(null)
const hookEventLog = ref([])
const hookActiveHandle = ref(null)
const hookIsDragging = ref(false)
const hookIsResizing = ref(false)

const { position: hookPosition, size: hookSize, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  onDragStart: (pos, event) => {
    hookIsDragging.value = true
    hookEventLog.value.push(`Drag started at x: ${pos.x}, y: ${pos.y}`)
    // Limit log length
    if (hookEventLog.value.length > 6) hookEventLog.value.shift()
  },
  onDrag: (pos, event) => {
    hookEventLog.value[hookEventLog.value.length - 1] = `Dragging at x: ${pos.x}, y: ${pos.y}`
  },
  onDragEnd: (pos, event) => {
    hookIsDragging.value = false
    hookEventLog.value.push(`Drag ended at x: ${pos.x}, y: ${pos.y}`)
    // Limit log length
    if (hookEventLog.value.length > 6) hookEventLog.value.shift()
  },
  onResizeStart: (newSize, event) => {
    hookIsResizing.value = true

    // Get the current active resize handle
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const threshold = 8 // Edge detection threshold

    // Determine which handle is activated
    if (x < threshold && y < threshold) hookActiveHandle.value = 'tl'
    else if (x > rect.width - threshold && y < threshold) hookActiveHandle.value = 'tr'
    else if (x < threshold && y > rect.height - threshold) hookActiveHandle.value = 'bl'
    else if (x > rect.width - threshold && y > rect.height - threshold) hookActiveHandle.value = 'br'
    else if (x < threshold) hookActiveHandle.value = 'l'
    else if (x > rect.width - threshold) hookActiveHandle.value = 'r'
    else if (y < threshold) hookActiveHandle.value = 't'
    else if (y > rect.height - threshold) hookActiveHandle.value = 'b'
    else hookActiveHandle.value = 'unknown'

    hookEventLog.value.push(`Resize started at ${newSize.width}x${newSize.height} using ${hookActiveHandle.value} handle`)
    // Limit log length
    if (hookEventLog.value.length > 6) hookEventLog.value.shift()
  },
  onResize: (newSize, event) => {
    hookEventLog.value[hookEventLog.value.length - 1] = `Resizing to ${newSize.width}x${newSize.height} using ${hookActiveHandle.value} handle`
  },
  onResizeEnd: (newSize, event) => {
    hookIsResizing.value = false
    hookActiveHandle.value = null
    hookEventLog.value.push(`Resize ended at ${newSize.width}x${newSize.height}`)
    // Limit log length
    if (hookEventLog.value.length > 6) hookEventLog.value.shift()
  }
})
</script>

<DemoContainer title="Component Approach">
  <div class="flex flex-col space-y-4">
    <DnR
      v-model:position="position"
      v-model:size="size"
      @dragStart="onDragStart"
      @drag="onDrag"
      @dragEnd="onDragEnd"
      @resizeStart="onResizeStart"
      @resize="onResize"
      @resizeEnd="onResizeEnd"
    >
      <div
        class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center"
        :style="{ width: `${size.width}px`, height: `${size.height}px` }"
        :class="{
          'ring-2 ring-blue-300': isDragging,
          'ring-2 ring-green-300': isResizing
        }"
      >
        Drag and resize me!
        <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
        <div class="text-sm mt-1">Size: {{ size.width }} x {{ size.height }}</div>
        <div class="text-sm mt-1">
          <span v-if="isDragging">Dragging</span>
          <span v-else-if="isResizing">Resizing with {{ activeHandle }} handle</span>
          <span v-else>Idle</span>
        </div>
      </div>
    </DnR>
    <div class="bg-gray-100 p-4 rounded">
      <h3 class="text-lg font-medium mb-2">Event Log:</h3>
      <div v-if="eventLog.length === 0" class="text-gray-500">No events yet. Try dragging or resizing the element.</div>
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
      :class="{
        'ring-2 ring-blue-300': hookIsDragging,
        'ring-2 ring-green-300': hookIsResizing
      }"
    >
      Drag and resize me!
      <div class="text-sm mt-2">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
      <div class="text-sm mt-1">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
      <div class="text-sm mt-1">
        <span v-if="hookIsDragging">Dragging</span>
        <span v-else-if="hookIsResizing">Resizing with {{ hookActiveHandle }} handle</span>
        <span v-else>Idle</span>
      </div>
    </div>
    <div class="bg-gray-100 p-4 rounded">
      <h3 class="text-lg font-medium mb-2">Event Log:</h3>
      <div v-if="hookEventLog.length === 0" class="text-gray-500">No events yet. Try dragging or resizing the element.</div>
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
import { DnR } from 'vue-dndnr'

const position = ref({ x: 50, y: 50 })
const size = ref({ width: 200, height: 150 })
const eventLog = ref([])
const activeHandle = ref(null)
const isDragging = ref(false)
const isResizing = ref(false)

function onDragStart(pos, event) {
  isDragging.value = true
  eventLog.value.push(`Drag started at x: ${pos.x}, y: ${pos.y}`)
  // Limit log length
  if (eventLog.value.length > 6)
    eventLog.value.shift()
}

function onDrag(pos, event) {
  eventLog.value[eventLog.value.length - 1] = `Dragging at x: ${pos.x}, y: ${pos.y}`
}

function onDragEnd(pos, event) {
  isDragging.value = false
  eventLog.value.push(`Drag ended at x: ${pos.x}, y: ${pos.y}`)
  // Limit log length
  if (eventLog.value.length > 6)
    eventLog.value.shift()
}

function onResizeStart(newSize, event) {
  isResizing.value = true

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
  if (eventLog.value.length > 6)
    eventLog.value.shift()
}

function onResize(newSize, event) {
  eventLog.value[eventLog.value.length - 1] = `Resizing to ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`
}

function onResizeEnd(newSize, event) {
  isResizing.value = false
  activeHandle.value = null
  eventLog.value.push(`Resize ended at ${newSize.width}x${newSize.height}`)
  // Limit log length
  if (eventLog.value.length > 6)
    eventLog.value.shift()
}
</script>

<template>
  <div class="container">
    <DnR
      v-model:position="position"
      v-model:size="size"
      @drag-start="onDragStart"
      @drag="onDrag"
      @drag-end="onDragEnd"
      @resize-start="onResizeStart"
      @resize="onResize"
      @resize-end="onResizeEnd"
    >
      <div
        class="dnr-element"
        :style="{ width: `${size.width}px`, height: `${size.height}px` }"
        :class="{
          dragging: isDragging,
          resizing: isResizing,
        }"
      >
        Drag and resize me!
        <div>Position: {{ position.x }}, {{ position.y }}</div>
        <div>Size: {{ size.width }} x {{ size.height }}</div>
        <div>
          <span v-if="isDragging">Dragging</span>
          <span v-else-if="isResizing">Resizing with {{ activeHandle }} handle</span>
          <span v-else>Idle</span>
        </div>
      </div>
    </DnR>

    <div class="event-log">
      <h3>Event Log:</h3>
      <div v-if="eventLog.length === 0" class="empty-log">
        No events yet. Try dragging or resizing the element.
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

.dnr-element {
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

.dragging {
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2);
}

.resizing {
  box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2);
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
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const eventLog = ref([])
const activeHandle = ref(null)
const isDragging = ref(false)
const isResizing = ref(false)

const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  onDragStart: (pos, event) => {
    isDragging.value = true
    eventLog.value.push(`Drag started at x: ${pos.x}, y: ${pos.y}`)
    // Limit log length
    if (eventLog.value.length > 6)
      eventLog.value.shift()
  },
  onDrag: (pos, event) => {
    eventLog.value[eventLog.value.length - 1] = `Dragging at x: ${pos.x}, y: ${pos.y}`
  },
  onDragEnd: (pos, event) => {
    isDragging.value = false
    eventLog.value.push(`Drag ended at x: ${pos.x}, y: ${pos.y}`)
    // Limit log length
    if (eventLog.value.length > 6)
      eventLog.value.shift()
  },
  onResizeStart: (newSize, event) => {
    isResizing.value = true

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
    if (eventLog.value.length > 6)
      eventLog.value.shift()
  },
  onResize: (newSize, event) => {
    eventLog.value[eventLog.value.length - 1] = `Resizing to ${newSize.width}x${newSize.height} using ${activeHandle.value} handle`
  },
  onResizeEnd: (newSize, event) => {
    isResizing.value = false
    activeHandle.value = null
    eventLog.value.push(`Resize ended at ${newSize.width}x${newSize.height}`)
    // Limit log length
    if (eventLog.value.length > 6)
      eventLog.value.shift()
  }
})
</script>

<template>
  <div class="container">
    <div
      ref="elementRef"
      :style="style"
      class="dnr-element"
      :class="{
        dragging: isDragging,
        resizing: isResizing,
      }"
    >
      Drag and resize me!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
      <div>Size: {{ size.width }} x {{ size.height }}</div>
      <div>
        <span v-if="isDragging">Dragging</span>
        <span v-else-if="isResizing">Resizing with {{ activeHandle }} handle</span>
        <span v-else>Idle</span>
      </div>
    </div>

    <div class="event-log">
      <h3>Event Log:</h3>
      <div v-if="eventLog.length === 0" class="empty-log">
        No events yet. Try dragging or resizing the element.
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

.dragging {
  box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2);
}

.resizing {
  box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2);
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
