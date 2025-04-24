<script setup>
import { ref, shallowRef } from 'vue'
import { Resizable } from 'vue-dndnr'
import DemoBox from './DemoBox.vue'
import DemoControl from './DemoControl.vue'

// State
const size = ref({ width: 200, height: 150 })
const disabled = shallowRef(false)
const grid = ref(null)
const lockAspectRatio = ref(false)
const isResizing = ref(false)

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

// Event handlers
const onResizeStart = () => {
  isResizing.value = true
}

const onResizeEnd = () => {
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
