<script setup lang="ts">
import type { Position, Size } from 'vue-dndnr'
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'
import ShapeElement from './ShapeElement.vue'

type ShapeType = 'rectangle' | 'circle' | 'triangle'

interface Shape {
  id: string
  type: ShapeType
  position: Position
  size: Size
  color: string
  zIndex: number
  active?: boolean
}

// Helper function to generate random position
function getRandomPosition(width: number, height: number): Position {
  // Canvas dimensions for random positioning
  const canvasWidth = 600
  const canvasHeight = 400
  const padding = 50

  return {
    x: padding + Math.random() * (canvasWidth - width - padding * 2),
    y: padding + Math.random() * (canvasHeight - height - padding * 2),
  }
}

const editorCanvasRef = ref<HTMLElement | null>(null)

const shapes = ref<Shape[]>([
  {
    id: 'rect1',
    type: 'rectangle',
    position: getRandomPosition(120, 80),
    size: { width: 120, height: 80 },
    color: '#40B38C',
    zIndex: 1,
    active: false,
  },
  {
    id: 'circle1',
    type: 'circle',
    position: getRandomPosition(100, 100),
    size: { width: 100, height: 100 },
    color: '#2E87BA',
    zIndex: 2,
    active: false,
  },
  {
    id: 'triangle1',
    type: 'triangle',
    position: getRandomPosition(100, 100),
    size: { width: 100, height: 100 },
    color: '#F29933',
    zIndex: 3,
    active: false,
  },
])

// Track the currently selected shape
const selectedShapeId = ref<string | null>(null)

// Function to select a shape and bring it to front
function selectShape(id: string): void {
  selectedShapeId.value = id

  // Update z-index to bring selected shape to front
  const maxZIndex = Math.max(...shapes.value.map(s => s.zIndex))
  const shape = shapes.value.find(s => s.id === id)
  if (shape && shape.zIndex !== maxZIndex + 1) {
    shape.zIndex = maxZIndex + 1
  }
}

// Function to add a new shape
function addShape(type: ShapeType): void {
  const id = `${type}${Date.now()}`

  // Generate random size first
  const shapeSize = {
    width: 80 + Math.random() * 50,
    height: 80 + Math.random() * 50,
  }

  const newShape: Shape = {
    id,
    type,
    position: getRandomPosition(shapeSize.width, shapeSize.height),
    size: shapeSize,
    color: getRandomColor(),
    zIndex: Math.max(...shapes.value.map(s => s.zIndex), 0) + 1,
  }

  shapes.value.push(newShape)
  selectShape(id)
}

// Helper function to generate random colors
function getRandomColor(): string {
  const colors = [
    '#40B38C',
    '#65C5A3',
    '#339275',
    '#2E87BA',
    '#4FA0CC',
    '#246D96',
    '#F29933',
    '#F5B05F',
    '#D17B1A',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Update position and size when dragging or resizing
function updateShapePosition(id: string, position: Position): void {
  const shape = shapes.value.find(s => s.id === id)
  if (shape) {
    shape.position = position
  }
}

function updateShapeSize(id: string, size: Size): void {
  const shape = shapes.value.find(s => s.id === id)
  if (shape) {
    shape.size = size
  }
}

// Clear selection when clicking on the background
function clearSelection(): void {
  selectedShapeId.value = null
}

// Reset canvas to initial state
function resetCanvas(): void {
  // Clear selection first to avoid any reactivity issues
  clearSelection()

  // Create new shapes with unique IDs to avoid reactivity conflicts
  const timestamp = Date.now()

  // Reset to initial shapes with random positions
  shapes.value = [
    {
      id: `rect${timestamp}`,
      type: 'rectangle',
      position: getRandomPosition(120, 80),
      size: { width: 120, height: 80 },
      color: '#40B38C',
      zIndex: 1,
      active: false,
    },
    {
      id: `circle${timestamp}`,
      type: 'circle',
      position: getRandomPosition(100, 100),
      size: { width: 100, height: 100 },
      color: '#2E87BA',
      zIndex: 2,
      active: false,
    },
    {
      id: `triangle${timestamp}`,
      type: 'triangle',
      position: getRandomPosition(100, 100),
      size: { width: 100, height: 100 },
      color: '#F29933',
      zIndex: 3,
      active: false,
    },
  ]
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

      <button class="toolbar-btn" title="Reset Canvas" @click="resetCanvas">
        <div class="i-lucide-refresh-ccw" />
      </button>
    </div>

    <!-- Canvas with shapes -->
    <div ref="editorCanvasRef" class="editor-canvas">
      <DnR
        v-for="shape in shapes" :key="shape.id" v-model:position="shape.position" v-model:size="shape.size"
        v-model:active="shape.active" handle-type="handles" active-on="click" :z-index="shape.zIndex"
        :class="{ 'shape-selected': selectedShapeId === shape.id }" bounds="parent" :min-width="20" :min-height="20"
        :container-element="editorCanvasRef" @click="selectShape(shape.id)" @drag-start="selectShape(shape.id)"
        @resize-start="selectShape(shape.id)" @drag="updateShapePosition(shape.id, $event)"
        @resize="updateShapeSize(shape.id, $event)"
        @active-change="(active: boolean) => { if (active) selectShape(shape.id) }"
      >
        <ShapeElement :type="shape.type" :color="shape.color" :selected="selectedShapeId === shape.id" />
      </DnR>
    </div>

    <!-- Status bar -->
    <div class="editor-statusbar">
      <div v-if="selectedShapeId" class="status-info">
        <span>Selected: {{ selectedShapeId }}</span>
        <span v-if="selectedShapeId">
          {{ shapes.find(s => s.id === selectedShapeId)?.position.x.toFixed(0) }},
          {{ shapes.find(s => s.id === selectedShapeId)?.position.y.toFixed(0) }}
        </span>
        <span v-if="selectedShapeId">
          {{ typeof shapes.find(s => s.id === selectedShapeId)?.size.width === 'number'
            ? (shapes.find(s => s.id === selectedShapeId)?.size.width as number).toFixed(0)
            : shapes.find(s => s.id === selectedShapeId)?.size.width }} x
          {{ typeof shapes.find(s => s.id === selectedShapeId)?.size.height === 'number'
            ? (shapes.find(s => s.id === selectedShapeId)?.size.height as number).toFixed(0)
            : shapes.find(s => s.id === selectedShapeId)?.size.height }}
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
