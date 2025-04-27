<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { useDraggable } from 'vue-dndnr'
import DemoBox from './DemoBox.vue'
import DemoControl from './DemoControl.vue'

type GridType = [number, number] | null

// State
const containerRef = ref<HTMLElement | null>(null)
const elementRef = ref<HTMLElement | null>(null)
const disabled = shallowRef<boolean>(false)
const bounds = ref<string | null>('parent')
const grid = ref<GridType>(null)

// Options
const boundsOptions: string[] = ['parent', 'none']
const gridOptions: GridType[] = [null, [20, 20], [50, 50]]

// Format grid for display
function gridDisplay(grid: GridType): string {
  if (!grid)
    return 'None'
  return `[${grid[0]}, ${grid[1]}]`
}

// Use the hook
const { position, isDragging } = useDraggable(elementRef, {
  initialPosition: { x: 50, y: 50 },
  bounds,
  disabled,
  grid,
})
</script>

<template>
  <DemoBox title="useDraggable Hook">
    <template #controls>
      <DemoControl>
        <input id="use-draggable-disabled" v-model="disabled" type="checkbox">
        <label for="use-draggable-disabled">Disabled</label>
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
        class="absolute p-4 rounded-lg text-white cursor-move select-none flex flex-col items-center gap-2 transition-colors duration-200"
        :class="isDragging ? 'bg-primary-dark' : 'bg-primary'" :style="{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }"
      >
        <div>👋 Drag me!</div>
        <div class="text-sm opacity-80">
          Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}
        </div>
        <div class="text-sm opacity-80">
          {{ isDragging ? 'Dragging' : 'Idle' }}
        </div>
      </div>
    </div>
  </DemoBox>
</template>
