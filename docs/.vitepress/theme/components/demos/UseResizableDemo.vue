<script setup>
import { ref, shallowRef } from 'vue'
import { useResizable } from 'vue-dndnr'
import DemoBox from './DemoBox.vue'
import DemoControl from './DemoControl.vue'

// State
const elementRef = ref(null)
const disabled = shallowRef(false)
const grid = ref(null)
const lockAspectRatio = ref(false)

// Min/Max constraints
const minWidth = ref(100)
const minHeight = ref(100)
const maxWidth = ref(400)
const maxHeight = ref(300)

// Options
const gridOptions = [null, [20, 20], [50, 50]]

// Format grid for display
const gridDisplay = (grid) => {
  if (!grid) return 'None'
  return `[${grid[0]}, ${grid[1]}]`
}

// Use the hook
const { size, isResizing } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: minWidth,
  minHeight: minHeight,
  maxWidth: maxWidth,
  maxHeight: maxHeight,
  disabled: disabled,
  grid: grid,
  lockAspectRatio: lockAspectRatio,
})
</script>

<template>
  <DemoBox title="useResizable Hook">
    <template #controls>
      <DemoControl>
        <input type="checkbox" id="use-resizable-disabled" v-model="disabled" />
        <label for="use-resizable-disabled">Disabled</label>
      </DemoControl>

      <DemoControl>
        <input type="checkbox" id="use-resizable-lock-aspect-ratio" v-model="lockAspectRatio" />
        <label for="use-resizable-lock-aspect-ratio">Lock aspect ratio</label>
      </DemoControl>

      <DemoControl label="Grid">
        <select v-model="grid" class="input">
          <option v-for="option in gridOptions" :key="gridDisplay(option)" :value="option">
            {{ gridDisplay(option) }}
          </option>
        </select>
      </DemoControl>
    </template>

    <div class="w-full h-full">
      <div
        ref="elementRef"
        class="relative p-4 rounded-lg text-white flex flex-col items-center justify-center gap-2 transition-colors duration-200"
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
        <div class="text-sm opacity-80">
          {{ isResizing ? 'Resizing' : 'Idle' }}
        </div>
      </div>
    </div>
  </DemoBox>
</template>
