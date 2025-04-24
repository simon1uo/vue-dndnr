<script setup>
import { ref, shallowRef } from 'vue'
import { Draggable } from 'vue-dndnr'
import DemoBox from './DemoBox.vue'
import DemoControl from './DemoControl.vue'

// State
const position = ref({ x: 50, y: 50 })
const disabled = shallowRef(false)
const bounds = ref('parent')
const grid = ref(null)
const isDragging = ref(false)
const handleRef = ref()

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

    <Draggable
      v-model:position="position"
      :bounds="bounds"
      :disabled="disabled"
      :grid="grid"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
    >
      <div
        class="p-4 rounded-lg text-white flex flex-col items-center gap-2 transition-colors duration-200 cursor-move select-none"
        :class="isDragging ? 'bg-primary-dark' : 'bg-primary'"
      >
        <div ref="handleRef">👋 Drag me!</div>
        <div class="text-sm opacity-80">
          Position: {{ Math.round(position.x) }}, {{ Math.round(position.y) }}
        </div>
        <div v-if="isDragging" class="text-sm opacity-80">Dragging...</div>
      </div>
    </Draggable>
  </DemoBox>
</template>
