<script setup lang="ts">
import { ref } from 'vue'
import Draggable from '../Draggable.vue'

// Create a container ref to use as bounds
const containerRef = ref<HTMLElement | null>(null)
const draggableRef = ref<HTMLElement | null>(null)

// Basic example
const position = ref({ x: 0, y: 0 })

// Axis constrained example
const xAxisPosition = ref({ x: 0, y: 100 })
const yAxisPosition = ref({ x: 200, y: 0 })

// Grid snapping example
const gridPosition = ref({ x: 400, y: 100 })

// Handle example
const handlePosition = ref({ x: 200, y: 100 })

// Unbounded example
const unboundedPosition = ref({ x: 400, y: 0 })

// Track drag state for UI feedback
const isDragging = ref(false)
const dragInfo = ref('')

// Handle drag events
function onDragStart() {
  isDragging.value = true
  dragInfo.value = 'Drag started'
}

function onDrag() {
  // Update the drag info with the current position
  dragInfo.value = `Dragging to: x: ${Math.round(position.value.x)}, y: ${Math.round(position.value.y)}`
}

function onDragEnd() {
  isDragging.value = false
  dragInfo.value = 'Drag ended'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-xl font-bold mb-2">
      Draggable Examples
    </h2>

    <!-- Container for draggable elements -->
    <div ref="containerRef" class="relative h-400px flex bg-background border border-dashed border-border rounded p-4">
      <!-- Basic usage example -->
      <Draggable
        ref="draggableRef" v-model:position="position" bounds="parent"
        class="draggable-box bg-blue-100 dark:bg-blue-800 " @drag-start="onDragStart" @drag="onDrag"
        @drag-end="onDragEnd"
      >
        <div class="p-4 w-200px h-100px flex items-center justify-center">
          <span class="text-gray-800 dark:text-white font-medium">Basic Draggable</span>
        </div>
      </Draggable>

      <!-- X-axis constrained example -->
      <Draggable
        v-model:position="xAxisPosition" class="draggable-box bg-green-100 dark:bg-green-800 " bounds="parent"
        axis="x"
      >
        <div class="p-4 w-200px h-100px flex items-center justify-center">
          <span class="text-gray-800 dark:text-white font-medium">X-Axis Only</span>
        </div>
      </Draggable>

      <!-- Y-axis constrained example -->
      <Draggable
        v-model:position="yAxisPosition" class="draggable-box bg-purple-100 dark:bg-purple-800 "
        bounds="parent" axis="y"
      >
        <div class="p-4 w-200px h-100px flex items-center justify-center">
          <span class="text-gray-800 dark:text-white font-medium">Y-Axis Only</span>
        </div>
      </Draggable>

      <!-- Grid snapping example -->
      <Draggable
        v-model:position="gridPosition" class="draggable-box bg-amber-100 dark:bg-amber-800 " bounds="parent"
        :grid="[50, 50]"
      >
        <div class="p-4 w-200px h-100px flex items-center justify-center">
          <span class="text-gray-800 dark:text-white font-medium">Grid Snapping (50x50)</span>
        </div>
      </Draggable>

      <!-- Handle example -->
      <Draggable
        v-model:position="handlePosition" class="draggable-box bg-red-100 dark:bg-red-800 " bounds="parent"
        handle=".handle"
      >
        <div class="p-4 w-200px h-100px flex items-center justify-center">
          <span class="text-gray-800 dark:text-white font-medium">Drag Handle</span>
          <div
            class="handle bg-gray-300 dark:bg-gray-700 rounded-full w-8 h-8 absolute top-2 right-2 cursor-grab flex items-center justify-center"
          >
            👋
          </div>
        </div>
      </Draggable>

      <Draggable v-model:position="unboundedPosition" class="draggable-box bg-teal-100 dark:bg-teal-800">
        <div class="p-4 w-200px h-100px flex items-center justify-center">
          <span class="text-gray-800 dark:text-white font-medium">Unbounded Draggable</span>
        </div>
      </Draggable>
    </div>

    <!-- Current Dragging Into -->
    <div>
      <p class="text-gray-800 dark:text-white font-medium">
        Current Dragging: {{ dragInfo }}
      </p>
    </div>
  </div>
</template>
