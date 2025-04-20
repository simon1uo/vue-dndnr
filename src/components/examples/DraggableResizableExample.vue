<script setup lang="ts">
import { ref } from 'vue'
import { DraggableResizable } from '../'

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

// Aspect ratio example
const aspectRatioPosition = ref({ x: 300, y: 250 })
const aspectRatioSize = ref({ width: 200, height: 150 })

// Handle example
const handlePosition = ref({ x: 550, y: 50 })
const handleSize = ref({ width: 200, height: 150 })

// Track interaction state for UI feedback
const interactionInfo = ref('')

// Handle drag events
function onDragStart() {
  interactionInfo.value = 'Drag started'
}

function onDrag() {
  interactionInfo.value = `Dragging to: x: ${Math.round(position.value.x)}, y: ${Math.round(position.value.y)}`
}

function onDragEnd() {
  interactionInfo.value = 'Drag ended'
}

// Handle resize events
function onResizeStart(event: MouseEvent | TouchEvent, handle: string) {
  interactionInfo.value = `Resize started with handle: ${handle}`
}

function onResize() {
  interactionInfo.value = `Resizing to: ${Math.round(size.value.width)}px × ${Math.round(size.value.height)}px`
}

function onResizeEnd() {
  interactionInfo.value = 'Resize ended'
}
</script>

<template>
  <div class="draggable-resizable-examples">
    <h2 class="text-xl font-bold mb-4">
      Draggable & Resizable Examples
    </h2>

    <div class="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
      <p>
        <strong>Interaction:</strong> {{ interactionInfo }}
      </p>
    </div>

    <!-- Container for draggable-resizable elements -->
    <div ref="containerRef" class="relative h-600px bg-background border border-dashed border-border rounded p-4 mb-8">
      <!-- Basic example -->
      <DraggableResizable v-model:position="position" v-model:size="size" bounds="parent"
        class="example-box bg-blue-100 dark:bg-blue-800" @drag-start="onDragStart" @drag="onDrag" @drag-end="onDragEnd"
        @resize-start="onResizeStart" @resize="onResize" @resize-end="onResizeEnd">
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Basic Example
            </div>
            <div class="text-sm mt-2">
              Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}
            </div>
            <div class="text-sm">
              Size: {{ Math.round(size.width) }}px × {{ Math.round(size.height) }}px
            </div>
          </div>
        </div>
      </DraggableResizable>

      <!-- Grid snapping example -->
      <DraggableResizable v-model:position="gridPosition" v-model:size="gridSize" bounds="parent" :grid="[20, 20]"
        class="example-box bg-amber-100 dark:bg-amber-800">
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Grid Snapping (20×20)
            </div>
            <div class="text-sm mt-2">
              Position: {{ Math.round(gridPosition.x) }}, {{ Math.round(gridPosition.y) }}
            </div>
            <div class="text-sm">
              Size: {{ Math.round(gridSize.width) }}px × {{ Math.round(gridSize.height) }}px
            </div>
          </div>
        </div>
      </DraggableResizable>

      <!-- Constrained example -->
      <DraggableResizable v-model:position="constrainedPosition" v-model:size="constrainedSize" bounds="parent"
        :min-width="100" :min-height="100" :max-width="300" :max-height="200"
        class="example-box bg-green-100 dark:bg-green-800">
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Size Constraints
            </div>
            <div class="text-sm mt-2">
              Min: 100×100, Max: 300×200
            </div>
            <div class="text-sm">
              Size: {{ Math.round(constrainedSize.width) }}px × {{ Math.round(constrainedSize.height) }}px
            </div>
          </div>
        </div>
      </DraggableResizable>

      <!-- Aspect ratio example -->
      <DraggableResizable v-model:position="aspectRatioPosition" v-model:size="aspectRatioSize" bounds="parent"
        :lock-aspect-ratio="true" class="example-box bg-purple-100 dark:bg-purple-800">
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Aspect Ratio Lock
            </div>
            <div class="text-sm mt-2">
              Size: {{ Math.round(aspectRatioSize.width) }}px × {{ Math.round(aspectRatioSize.height) }}px
            </div>
          </div>
        </div>
      </DraggableResizable>

      <!-- Handle example -->
      <DraggableResizable v-model:position="handlePosition" v-model:size="handleSize" bounds="parent"
        handle=".drag-handle" class="example-box bg-red-100 dark:bg-red-800">
        <div class="p-4 flex items-center justify-center h-full">
          <div class="text-center">
            <div class="text-lg font-medium">
              Custom Drag Handle
            </div>
            <div class="text-sm mt-2">
              Drag using the handle only
            </div>
          </div>
          <div
            class="drag-handle bg-gray-300 dark:bg-gray-700 rounded-full w-8 h-8 absolute top-2 right-2 cursor-grab flex items-center justify-center">
            👋
          </div>
        </div>
      </DraggableResizable>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Usage
        </h3>
        <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm">
&lt;DraggableResizable
  v-model:position="position"
  v-model:size="size"
  bounds="parent"
  @drag-start="onDragStart"
  @drag="onDrag"
  @drag-end="onDragEnd"
  @resize-start="onResizeStart"
  @resize="onResize"
  @resize-end="onResizeEnd"
&gt;
  Your content here
&lt;/DraggableResizable&gt;
        </pre>
      </div>

      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Available Props
        </h3>
        <ul class="list-disc pl-5 text-sm space-y-1">
          <li><strong>position/modelValue:</strong> Current position (v-model support)</li>
          <li><strong>size/sizeModel:</strong> Current size (v-model support)</li>
          <li><strong>bounds:</strong> Constrains movement within boundaries</li>
          <li><strong>grid:</strong> Snaps to a grid during drag and resize</li>
          <li><strong>axis:</strong> Restricts movement to 'x', 'y', or 'both'</li>
          <li><strong>handle:</strong> CSS selector for the drag handle</li>
          <li><strong>minWidth/minHeight:</strong> Minimum size constraints</li>
          <li><strong>maxWidth/maxHeight:</strong> Maximum size constraints</li>
          <li><strong>lockAspectRatio:</strong> Maintains width/height ratio</li>
          <li><strong>handles:</strong> Which resize handles to display</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.draggable-resizable-examples {
  padding: 20px;
}

.example-box {
  border: 2px solid;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.example-card {
  margin-bottom: 20px;
}
</style>
