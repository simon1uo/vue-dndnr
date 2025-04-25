<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { Draggable } from 'vue-dndnr'
import DemoBox from './DemoBox.vue'
import DemoControl from './DemoControl.vue'

interface Position {
  x: number
  y: number
}

type GridType = [number, number] | null

// State
const position = ref<Position>({ x: 50, y: 50 })
const handlePosition = ref<Position>({ x: 50, y: 50 })

const disabled = shallowRef<boolean>(false)
const bounds = ref<string | null>('parent')
const grid = ref<GridType>(null)
const isDragging = ref<boolean>(false)
const handleRef = ref<HTMLElement | null>(null)

// Options
const boundsOptions: string[] = ['parent', 'none']
const gridOptions: GridType[] = [null, [20, 20], [50, 50]]

// Format grid for display
const gridDisplay = (grid: GridType): string => {
  if (!grid) return 'None'
  return `[${grid[0]}, ${grid[1]}]`
}

// Event handlers
const onDragStart = (): void => {
  isDragging.value = true
}

const onDragEnd = (): void => {
  isDragging.value = false
}

</script>

<template>
  <DemoBox title="Draggable Component">
    <template #controls>
      <DemoControl>
        <input type="checkbox" id="disabled" v-model="disabled" />
        <label for="disabled">Disabled</label>
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

    <Draggable v-model:position="position" :bounds="bounds" :disabled="disabled" :grid="grid" @drag-start="onDragStart"
      @drag-end="onDragEnd">
      <div
        class="p-4 rounded-lg text-white flex flex-col items-center gap-2 transition-colors duration-200 cursor-move select-none"
        :class="isDragging ? 'bg-primary-dark' : 'bg-primary'">

        <div class="text-sm opacity-80">
          Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}
        </div>
        <div v-if="isDragging" class="text-sm opacity-80">Dragging...</div>
      </div>
    </Draggable>
  </DemoBox>

  <DemoBox title="Draggable Component with Handle">
    <Draggable v-model:position="handlePosition" :handle="handleRef">
      <div class="draggable-box">
        <div ref="handleRef">👋 Drag me!</div>
        <div>Content (not draggable)</div>
      </div>
    </Draggable>
  </DemoBox>
</template>
