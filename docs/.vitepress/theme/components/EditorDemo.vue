<script setup>
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'
import ShapeElement from './ShapeElement.vue'

const shapes = ref([
  {
    id: 'rect1',
    type: 'rectangle',
    position: { x: 50, y: 50 },
    size: { width: 120, height: 80 },
    color: '#4299e1',
    zIndex: 1,
  },
  {
    id: 'circle1',
    type: 'circle',
    position: { x: 200, y: 100 },
    size: { width: 100, height: 100 },
    color: '#9f7aea',
    zIndex: 2,
  },
  {
    id: 'triangle1',
    type: 'triangle',
    position: { x: 350, y: 150 },
    size: { width: 100, height: 100 },
    color: '#f56565',
    zIndex: 3,
  },
])

// Track the currently selected shape
const selectedShapeId = ref(null)

// Function to select a shape and bring it to front
function selectShape(id) {
  selectedShapeId.value = id

  // Update z-index to bring selected shape to front
  const maxZIndex = Math.max(...shapes.value.map(s => s.zIndex))
  const shape = shapes.value.find(s => s.id === id)
  if (shape && shape.zIndex !== maxZIndex + 1) {
    shape.zIndex = maxZIndex + 1
  }
}

// Function to add a new shape
function addShape(type) {
  const id = `${type}${Date.now()}`
  const newShape = {
    id,
    type,
    position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 },
    size: { width: 80 + Math.random() * 50, height: 80 + Math.random() * 50 },
    color: getRandomColor(),
    zIndex: Math.max(...shapes.value.map(s => s.zIndex), 0) + 1,
  }

  shapes.value.push(newShape)
  selectShape(id)
}

// Helper function to generate random colors
function getRandomColor() {
  const colors = ['#4299e1', '#9f7aea', '#f56565', '#48bb78', '#ed8936', '#38b2ac']
  return colors[Math.floor(Math.random() * colors.length)]
}

// Update position and size when dragging or resizing
function updateShapePosition(id, position) {
  const shape = shapes.value.find(s => s.id === id)
  if (shape) {
    shape.position = position
  }
}

function updateShapeSize(id, size) {
  const shape = shapes.value.find(s => s.id === id)
  if (shape) {
    shape.size = size
  }
}

// Clear selection when clicking on the background
function clearSelection() {
  selectedShapeId.value = null
}
</script>

<template>
  <div class="editor-container" @click.self="clearSelection">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <button class="toolbar-btn" title="Add Rectangle" @click="addShape('rectangle')">
        <div class="i-lucide-square" />
      </button>
      <button class="toolbar-btn" title="Add Circle" @click="addShape('circle')">
        <div class="i-lucide-circle" />
      </button>
      <button class="toolbar-btn" title="Add Triangle" @click="addShape('triangle')">
        <div class="i-lucide-triangle" />
      </button>
    </div>

    <!-- Canvas with shapes -->
    <div class="editor-canvas">
      <DnR v-for="shape in shapes" :key="shape.id" v-model:position="shape.position" v-model:size="shape.size"
        :style="{ zIndex: shape.zIndex }" :class="{ 'shape-selected': selectedShapeId === shape.id }" bounds="parent"
        :min-width="20" :min-height="20" @click="selectShape(shape.id)" @drag-start="selectShape(shape.id)"
        @resize-start="selectShape(shape.id)" @drag="updateShapePosition(shape.id, $event)"
        @resize="updateShapeSize(shape.id, $event)">
        <ShapeElement :type="shape.type" :color="shape.color" :selected="selectedShapeId === shape.id" />
      </DnR>
    </div>

    <!-- Status bar -->
    <div class="editor-statusbar">
      <div v-if="selectedShapeId" class="status-info">
        <span>Selected: {{ selectedShapeId }}</span>
        <span v-if="selectedShapeId">
          {{shapes.find(s => s.id === selectedShapeId)?.position.x.toFixed(0)}},
          {{shapes.find(s => s.id === selectedShapeId)?.position.y.toFixed(0)}}
        </span>
        <span v-if="selectedShapeId">
          {{shapes.find(s => s.id === selectedShapeId)?.size.width.toFixed(0)}} x
          {{shapes.find(s => s.id === selectedShapeId)?.size.height.toFixed(0)}}
        </span>
      </div>
      <div v-else class="status-info">
        <span>Click on a shape to select it</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--color-background);
  position: relative;
}

.editor-toolbar {
  display: flex;
  padding: 8px;
  gap: 8px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background-color: var(--color-background-mute);
}

.toolbar-btn [class^="i-"] {
  width: 20px;
  height: 20px;
}

.editor-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.editor-statusbar {
  height: 28px;
  background-color: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  color: var(--color-text-light);
}

.status-info {
  display: flex;
  gap: 16px;
}

.shape-selected {
  z-index: 10;
}
</style>
