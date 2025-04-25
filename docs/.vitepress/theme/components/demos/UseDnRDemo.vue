<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { useDnR } from 'vue-dndnr'
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
const containerRef = ref<HTMLElement | null>(null)
const elementRef = ref<HTMLElement | null>(null)
const disabled = shallowRef<boolean>(false)
const grid = ref<GridType>(null)
const lockAspectRatio = ref<boolean>(false)
const bounds = ref<string | null>('parent')

// Min/Max constraints
const minWidth = ref<number>(100)
const minHeight = ref<number>(100)
const maxWidth = ref<number>(400)
const maxHeight = ref<number>(300)

// Options
const boundsOptions: string[] = ['parent', 'none']
const gridOptions: GridType[] = [null, [20, 20], [50, 50]]

// Format grid for display
const gridDisplay = (grid: GridType): string => {
  if (!grid) return 'None'
  return `[${grid[0]}, ${grid[1]}]`
}

// Use the hook
const { position, size, isDragging, isResizing } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  minWidth: minWidth,
  minHeight: minHeight,
  maxWidth: maxWidth,
  maxHeight: maxHeight,
  disabled: disabled,
  grid: grid,
  lockAspectRatio: lockAspectRatio,
  bounds: bounds,
})
</script>

<template>
  <DemoBox title="useDnR Hook">
    <template #controls>
      <DemoControl>
        <input type="checkbox" id="use-dnr-disabled" v-model="disabled" />
        <label for="use-dnr-disabled">Disabled</label>
      </DemoControl>

      <DemoControl>
        <input type="checkbox" id="use-dnr-lock-aspect-ratio" v-model="lockAspectRatio" />
        <label for="use-dnr-lock-aspect-ratio">Lock aspect ratio</label>
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

    <div ref="containerRef" class="relative w-full h-full">
      <div
        ref="elementRef"
        class="absolute p-4 rounded-lg text-white cursor-move select-none flex flex-col items-center justify-center gap-2 transition-colors duration-200"
        :class="{
          'bg-primary': isDragging,
          'bg-primary-light': isResizing,
          'bg-primary-dark': !isDragging && !isResizing
        }"
        :style="{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`
        }"
      >
        <div>🧩 Drag & Resize me!</div>
        <div class="text-sm opacity-80">
          <div>Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}</div>
          <div>Size: {{ Math.round(size.width) }} × {{ Math.round(size.height) }}</div>
        </div>
        <div class="text-sm opacity-80">
          {{ isDragging ? 'Dragging' : isResizing ? 'Resizing' : 'Idle' }}
        </div>
      </div>
    </div>
  </DemoBox>
</template>
