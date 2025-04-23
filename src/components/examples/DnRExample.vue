<script setup lang="ts">
import type { Position, Size } from '../../types'
import { ref } from 'vue'
import DnR from '../DnR.vue'

// Create a container ref to use as bounds
const containerRef = ref<HTMLElement | null>(null)

// Basic example
const position = ref({ x: 50, y: 50 })
const size = ref({ width: 200, height: 150 })

// Grid snapping example
const gridPosition = ref({ x: 300, y: 50 })
const gridSize = ref({ width: 200, height: 150 })

// Constrained example
const constrainedPosition = ref({ x: 50, y: 250 })
const constrainedSize = ref({ width: 200, height: 150 })

// Handle example
const handlePosition = ref({ x: 300, y: 250 })
const handleSize = ref({ width: 200, height: 150 })
const handleRef = ref<HTMLElement | null>(null)

// Track interaction info
const interactionInfo = ref('')

// Event handlers
function onDragStart(pos: Position, _event: MouseEvent | TouchEvent) {
  interactionInfo.value = `Drag started at x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`
}

function onDrag(pos: Position, _event: MouseEvent | TouchEvent) {
  interactionInfo.value = `Dragging to: x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`
}

function onDragEnd(pos: Position, _event: MouseEvent | TouchEvent) {
  interactionInfo.value = `Drag ended at x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`
}

function onResizeStart(size: Size, _event: MouseEvent | TouchEvent) {
  interactionInfo.value = `Resize started at width: ${Math.round(Number(size.width))}, height: ${Math.round(Number(size.height))}`
}

function onResize(size: Size, _event: MouseEvent | TouchEvent) {
  interactionInfo.value = `Resizing to: width: ${Math.round(Number(size.width))}, height: ${Math.round(Number(size.height))}`
}

function onResizeEnd(size: Size, _event: MouseEvent | TouchEvent) {
  interactionInfo.value = `Resize ended at width: ${Math.round(Number(size.width))}, height: ${Math.round(Number(size.height))}`
}

function onHoverHandleChange(handle: string | null) {
  if (handle) {
    interactionInfo.value = `Hovering over ${handle} handle`
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-xl font-bold mb-2">
      DnR (Drag and Resize) Examples
    </h2>

    <!-- Container for DnR elements -->
    <div ref="containerRef" class="relative h-500px flex bg-background border border-dashed border-border rounded p-4">
      <!-- Basic usage example -->
      <DnR v-model:position="position" v-model:size="size" bounds="parent" class="dnr-box bg-blue-100 dark:bg-blue-800"
        @drag-start="onDragStart" @drag="onDrag" @drag-end="onDragEnd" @resize-start="onResizeStart" @resize="onResize"
        @resize-end="onResizeEnd" @hover-handle-change="onHoverHandleChange">
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Basic DnR
            </div>
            <div class="text-sm text-text-light mt-2">
              Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}
            </div>
            <div class="text-sm text-text-light">
              Size: {{ Math.round(Number(size.width)) }}×{{ Math.round(Number(size.height)) }}
            </div>
          </div>
        </div>
      </DnR>

      <!-- Grid snapping example -->
      <DnR v-model:position="gridPosition" v-model:size="gridSize" bounds="parent" :grid="[20, 20]"
        class="dnr-box bg-green-100 dark:bg-green-800">
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Grid Snapping (20×20)
            </div>
            <div class="text-sm text-text-light mt-2">
              Position: {{ Math.round(gridPosition.x) }}, {{ Math.round(gridPosition.y) }}
            </div>
            <div class="text-sm text-text-light">
              Size: {{ Math.round(Number(gridSize.width)) }}×{{ Math.round(Number(gridSize.height)) }}
            </div>
          </div>
        </div>
      </DnR>

      <!-- Constrained example -->
      <DnR v-model:position="constrainedPosition" v-model:size="constrainedSize" bounds="parent" :min-width="100"
        :min-height="100" :max-width="300" :max-height="250" class="dnr-box bg-purple-100 dark:bg-purple-800">
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Constrained
            </div>
            <div class="text-sm text-text-light mt-2">
              Min: 100×100, Max: 300×250
            </div>
            <div class="text-sm text-text-light">
              Size: {{ Math.round(Number(constrainedSize.width)) }}×{{ Math.round(Number(constrainedSize.height)) }}
            </div>
          </div>
        </div>
      </DnR>

      <!-- Handle example -->
      <DnR v-model:position="handlePosition" v-model:size="handleSize" bounds="parent" :handle="handleRef"
        class="dnr-box bg-red-100 dark:bg-red-800">
        <div ref="handleRef"
          class="bg-gray-300 dark:bg-gray-700 rounded-full w-8 h-8 absolute top-10 right-10 cursor-grab flex items-center justify-center">
          👋
        </div>
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Custom Handle
            </div>
            <div class="text-sm text-text-light mt-2">
              Drag using the handle
            </div>
          </div>
        </div>
      </DnR>
    </div>

    <!-- Interaction info display -->
    <div v-if="interactionInfo" class="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
      <p>Interaction Info: {{ interactionInfo }}</p>
    </div>
  </div>
</template>

<style scoped>
.dnr-box {
  width: 200px;
  height: 150px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>
