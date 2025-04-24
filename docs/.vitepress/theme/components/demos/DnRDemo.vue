<script setup>
import { ref, shallowRef } from 'vue'
import { DnR } from 'vue-dndnr'
import DemoBox from './DemoBox.vue'
import DemoControl from './DemoControl.vue'

// State
const position = ref({ x: 50, y: 50 })
const size = ref({ width: 200, height: 150 })
const disabled = shallowRef(false)
const grid = ref(null)
const lockAspectRatio = ref(false)
const bounds = ref('parent')
const isDragging = ref(false)
const isResizing = ref(false)

// Min/Max constraints
const minWidth = ref(100)
const minHeight = ref(100)
const maxWidth = ref(400)
const maxHeight = ref(300)

// Options
const boundsOptions = ['parent', 'none']
const gridOptions = [null, [20, 20], [50, 50]]

// Format grid for display
const gridDisplay = (grid) => {
  if (!grid) return 'None'
  return `[${grid[0]}, ${grid[1]}]`
}

// Event handlers
const onDragStart = () => {
  isDragging.value = true
}

const onDragEnd = () => {
  isDragging.value = false
}

const onResizeStart = () => {
  isResizing.value = true
}

const onResizeEnd = () => {
  isResizing.value = false
}
</script>

<template>
  <DemoBox title="Drag & Resize Component">
    <template #controls>
      <DemoControl>
        <input type="checkbox" id="dnr-disabled" v-model="disabled" />
        <label for="dnr-disabled">Disabled</label>
      </DemoControl>

      <DemoControl>
        <input type="checkbox" id="dnr-lock-aspect-ratio" v-model="lockAspectRatio" />
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
          'bg-primary-dark': !isDragging && !isResizing
        }"
      >
        <div>🧩 Drag & Resize me!</div>
        <div class="text-sm opacity-80">
          <div>Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}</div>
          <div>Size: {{ Math.round(size.width) }} × {{ Math.round(size.height) }}</div>
        </div>
        <div v-if="isDragging" class="text-sm opacity-80">Dragging...</div>
        <div v-else-if="isResizing" class="text-sm opacity-80">Resizing...</div>
      </div>
    </DnR>
  </DemoBox>
</template>
