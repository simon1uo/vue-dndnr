<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { Resizable } from 'vue-dndnr'
import DemoBox from './DemoBox.vue'
import DemoControl from './DemoControl.vue'

interface Size {
  width: number
  height: number
}

type GridType = [number, number] | null

// State
const size = ref<Size>({ width: 200, height: 150 })
const disabled = shallowRef<boolean>(false)
const grid = ref<GridType>(null)
const lockAspectRatio = ref<boolean>(false)
const isResizing = ref<boolean>(false)

// Min/Max constraints
const minWidth = ref<number>(100)
const minHeight = ref<number>(100)
const maxWidth = ref<number>(400)
const maxHeight = ref<number>(300)

// Options
const gridOptions: GridType[] = [null, [20, 20], [50, 50]]

// Format grid for display
const gridDisplay = (grid: GridType): string => {
  if (!grid) return 'None'
  return `[${grid[0]}, ${grid[1]}]`
}

// Event handlers
const onResizeStart = (): void => {
  isResizing.value = true
}

const onResizeEnd = (): void => {
  isResizing.value = false
}
</script>

<template>
  <DemoBox title="Resizable Component">
    <template #controls>
      <DemoControl>
        <input type="checkbox" id="resizable-disabled" v-model="disabled" />
        <label for="resizable-disabled">Disabled</label>
      </DemoControl>

      <DemoControl>
        <input type="checkbox" id="lock-aspect-ratio" v-model="lockAspectRatio" />
        <label for="lock-aspect-ratio">Lock aspect ratio</label>
      </DemoControl>

      <DemoControl label="Grid">
        <select v-model="grid" class="input">
          <option v-for="option in gridOptions" :key="gridDisplay(option)" :value="option">
            {{ gridDisplay(option) }}
          </option>
        </select>
      </DemoControl>
    </template>

    <Resizable
      v-model:size="size"
      :min-width="minWidth"
      :min-height="minHeight"
      :max-width="maxWidth"
      :max-height="maxHeight"
      :disabled="disabled"
      :grid="grid"
      :lock-aspect-ratio="lockAspectRatio"
      @resize-start="onResizeStart"
      @resize-end="onResizeEnd"
    >
      <div
        class="p-4 rounded-lg text-white flex flex-col items-center justify-center gap-2 transition-colors duration-200"
        :class="isResizing ? 'bg-primary-dark' : 'bg-primary-light'"
        :style="{
          width: `${size.width}px`,
          height: `${size.height}px`
        }"
      >
        <div>↔️ Resize me!</div>
        <div class="text-sm opacity-80">
          Size: {{ Math.round(size.width) }} × {{ Math.round(size.height) }}
        </div>
        <div v-if="isResizing" class="text-sm opacity-80">Resizing...</div>
      </div>
    </Resizable>
  </DemoBox>
</template>
