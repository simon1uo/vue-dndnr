<script setup lang="ts">
import { ref } from 'vue'
import DnR from '../DnR.vue'

// Create a container ref to use as bounds
const containerRef = ref<HTMLElement | null>(null)

// Basic example
const position = ref({ x: 50, y: 50 })
const size = ref({ width: 200, height: 150 })

// Grid example
const gridPosition = ref({ x: 300, y: 50 })
const gridSize = ref({ width: 200, height: 150 })

// Custom handles example
const customHandlesPosition = ref({ x: 50, y: 250 })
const customHandlesSize = ref({ width: 200, height: 150 })

// Aspect ratio example
const aspectRatioPosition = ref({ x: 300, y: 250 })
const aspectRatioSize = ref({ width: 200, height: 150 })

// Track interaction state for UI feedback
const interactionInfo = ref('')

// Event handlers
function onDragStart(pos: { x: number, y: number }) {
  interactionInfo.value = `Drag started at x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`
}

function onDrag(pos: { x: number, y: number }) {
  interactionInfo.value = `Dragging to x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`
}

function onDragEnd(pos: { x: number, y: number }) {
  interactionInfo.value = `Drag ended at x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`
}

function onResizeStart(size: { width: number | string, height: number | string }) {
  const width = typeof size.width === 'number' ? Math.round(size.width) : size.width
  const height = typeof size.height === 'number' ? Math.round(size.height) : size.height
  interactionInfo.value = `Resize started at width: ${width}, height: ${height}`
}

function onResize(size: { width: number | string, height: number | string }) {
  const width = typeof size.width === 'number' ? Math.round(size.width) : size.width
  const height = typeof size.height === 'number' ? Math.round(size.height) : size.height
  interactionInfo.value = `Resizing to width: ${width}, height: ${height}`
}

function onResizeEnd(size: { width: number | string, height: number | string }) {
  const width = typeof size.width === 'number' ? Math.round(size.width) : size.width
  const height = typeof size.height === 'number' ? Math.round(size.height) : size.height
  interactionInfo.value = `Resize ended at width: ${width}, height: ${height}`
}
</script>

<template>
  <div class="dnr-examples">
    <h2 class="text-2xl font-bold mb-4">
      DnR (Drag and Resize) Examples
    </h2>

    <div class="mb-4 p-2 bg-background-soft rounded">
      <p class="text-sm">
        {{ interactionInfo || 'Drag or resize any element to see interaction information' }}
      </p>
    </div>

    <!-- Container for DnR elements -->
    <div ref="containerRef" class="relative h-500px flex bg-background border border-dashed border-border rounded p-4">
      <!-- Basic DnR -->
      <DnR
        v-model:position="position" v-model:size="size" bounds="parent"
        class="bg-blue-100 dark:bg-blue-800" @drag-start="onDragStart" @drag="onDrag"
        @drag-end="onDragEnd" @resize-start="onResizeStart" @resize="onResize"
        @resize-end="onResizeEnd"
      >
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Basic DnR
            </div>
            <div class="text-sm text-text-light mt-2">
              Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}<br>
              Size: {{ typeof size.width === 'number' ? Math.round(size.width) : size.width }} ×
              {{ typeof size.height === 'number' ? Math.round(size.height) : size.height }}
            </div>
          </div>
        </div>
      </DnR>

      <!-- Grid DnR -->
      <DnR
        v-model:position="gridPosition" v-model:size="gridSize" bounds="parent"
        class="bg-green-100 dark:bg-green-800" :grid="[20, 20]"
      >
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Grid Snapping
            </div>
            <div class="text-sm text-text-light mt-2">
              Grid: [20, 20]
            </div>
          </div>
        </div>
      </DnR>

      <!-- Custom Handles DnR -->
      <DnR
        v-model:position="customHandlesPosition" v-model:size="customHandlesSize" bounds="parent"
        class="bg-purple-100 dark:bg-purple-800" :handles="['br', 'bl', 'tr', 'tl']"
      >
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Corner Handles Only
            </div>
            <div class="text-sm text-text-light mt-2">
              Only corner handles are enabled
            </div>
          </div>
        </div>
      </DnR>

      <!-- Aspect Ratio DnR -->
      <DnR
        v-model:position="aspectRatioPosition" v-model:size="aspectRatioSize" bounds="parent"
        class="bg-red-100 dark:bg-red-800" :lock-aspect-ratio="true"
      >
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Lock Aspect Ratio
            </div>
            <div class="text-sm text-text-light mt-2">
              Maintains aspect ratio during resize
            </div>
          </div>
        </div>
      </DnR>
    </div>
  </div>
</template>

<style scoped>
.dnr-examples {
  padding: 20px;
}

.h-500px {
  height: 500px;
}
</style>
