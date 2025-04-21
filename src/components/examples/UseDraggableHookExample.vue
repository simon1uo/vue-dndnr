<script setup lang="ts">
import { ref } from 'vue'
import { useDraggable } from '../../hooks'

// Create a ref for the element to be draggable
const elementRef = ref<HTMLElement | null>(null)

// Use the draggable hook with the element ref
const { position, isDragging, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  grid: [20, 20],
})

// Track drag state for UI feedback
const dragInfo = ref('')

function onDragStart() {
  dragInfo.value = 'Drag started'
}

function onDrag() {
  dragInfo.value = `Dragging to: x: ${Math.round(position.value.x)}, y: ${Math.round(position.value.y)}`
}

function onDragEnd() {
  dragInfo.value = 'Drag ended'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-xl font-bold mb-2">
      useDraggable Hook Example
    </h2>

    <!-- Container for the draggable element -->
    <div class="relative h-400px bg-background border border-dashed border-border rounded p-4">
      <!-- Element using the useDraggable hook directly -->
      <div
        ref="elementRef" :style="style"
        class="draggable-box bg-blue-100 dark:bg-blue-800 p-4 w-200px h-100px flex items-center justify-center"
        @mousedown="onDragStart" @mousemove="onDrag" @mouseup="onDragEnd" @touchstart="onDragStart" @touchmove="onDrag"
        @touchend="onDragEnd"
      >
        <span class="text-gray-800 dark:text-white font-medium">Drag Me (Hook Example)</span>
      </div>
    </div>

    <!-- Drag info display -->
    <div v-if="position" class="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
      <p>Options:</p>
      <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm">
const { position, isDragging, style } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  grid: [20, 20],
});
</pre>

      <p>Position: x: {{ Math.round(position.x) }}, y: {{ Math.round(position.y) }}</p>
      <p>Is Dragging: {{ isDragging ? 'Yes' : 'No' }}</p>
      <p>Status: {{ dragInfo }}</p>
    </div>
  </div>
</template>

<style scoped>
.draggable-box {
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.draggable-box:active {
  cursor: grabbing;
  opacity: 0.8;
  z-index: 1;
}
</style>
