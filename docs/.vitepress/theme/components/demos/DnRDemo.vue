<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { DnR } from 'vue-dndnr'
import DemoBox from './DemoBox.vue'
import DemoControl from './DemoControl.vue'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

type GridType = [number, number] | null

// State
const position = ref<Position>({ x: 50, y: 50 })
const size = ref<Size>({ width: 200, height: 150 })
const disabled = shallowRef<boolean>(false)
const grid = ref<GridType>(null)
const lockAspectRatio = ref<boolean>(false)
const bounds = ref<string | null>('parent')
const isDragging = ref<boolean>(false)
const isResizing = ref<boolean>(false)

// Min/Max constraints
const minWidth = ref<number>(100)
const minHeight = ref<number>(100)
const maxWidth = ref<number>(400)
const maxHeight = ref<number>(300)

// Options
const boundsOptions: string[] = ['parent', 'none']
const gridOptions: GridType[] = [null, [20, 20], [50, 50]]

// Format grid for display
function gridDisplay(grid: GridType): string {
  if (!grid)
    return 'None'
  return `[${grid[0]}, ${grid[1]}]`
}

// Event handlers
function onDragStart(): void {
  isDragging.value = true
}

function onDragEnd(): void {
  isDragging.value = false
}

function onResizeStart(): void {
  isResizing.value = true
}

function onResizeEnd(): void {
  isResizing.value = false
}
</script>

<template>
  <DemoBox title="Drag & Resize Component">
    <template #controls>
      <DemoControl>
        <input id="dnr-disabled" v-model="disabled" type="checkbox">
        <label for="dnr-disabled">Disabled</label>
      </DemoControl>

      <DemoControl>
        <input id="dnr-lock-aspect-ratio" v-model="lockAspectRatio" type="checkbox">
        <label for="dnr-lock-aspect-ratio">Lock aspect ratio</label>
      </DemoControl>

      <DemoControl label="Bounds">
        <select v-model="bounds" class="input">
          <option v-for="option in boundsOptions" :key="option" :value="option === 'none' ? null : option">
            {{ option }}
          </option>
        </select>
      </DemoControl>

      <DemoControl label="Grid">
        <select v-model="grid" class="input">
          <option v-for="option in gridOptions" :key="gridDisplay(option)" :value="option">
            {{ gridDisplay(option) }}
          </option>
        </select>
      </DemoControl>
    </template>

    <DnR
      v-model:position="position"
      v-model:size="size"
      :min-width="minWidth"
      :min-height="minHeight"
      :max-width="maxWidth"
      :max-height="maxHeight"
      :disabled="disabled"
      :grid="grid"
      :lock-aspect-ratio="lockAspectRatio"
      :bounds="bounds"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
      @resize-start="onResizeStart"
      @resize-end="onResizeEnd"
    >
      <div
        class="w-full h-full p-4 rounded-lg text-white cursor-move select-none flex flex-col items-center justify-center gap-2 transition-colors duration-200"
        :class="{
          'bg-primary': isDragging,
          'bg-primary-light': isResizing,
          'bg-primary-dark': !isDragging && !isResizing,
        }"
      >
        <div>🧩 Drag & Resize me!</div>
        <div class="text-sm opacity-80">
          <div>Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}</div>
          <div>Size: {{ Math.round(size.width) }} × {{ Math.round(size.height) }}</div>
        </div>
        <div v-if="isDragging" class="text-sm opacity-80">
          Dragging...
        </div>
        <div v-else-if="isResizing" class="text-sm opacity-80">
          Resizing...
        </div>
      </div>
    </DnR>
  </DemoBox>
</template>
