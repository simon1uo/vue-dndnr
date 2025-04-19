<script setup lang="ts">
import { ref } from 'vue'
import { Draggable, DraggableResizable, Droppable, Resizable } from '../'

const position = ref({ x: 50, y: 50 })
const size = ref({ width: 200, height: 150 })
const combinedPosition = ref({ x: 300, y: 50 })
const combinedSize = ref({ width: 200, height: 150 })
const isDropped = ref(false)

function handleDrop() {
  isDropped.value = true
}
</script>

<template>
  <div class="example-container">
    <h2 class="text-heading text-2xl font-bold mb-6">
      Vue DNDNR Components Example
    </h2>

    <div class="components-grid">
      <div class="component-section card card-hover">
        <h3 class="text-heading text-xl font-semibold mb-4">
          Draggable Component
        </h3>
        <div class="component-demo bg-background border border-dashed border-border rounded">
          <Draggable
            v-model:position="position"
            bounds="parent"
            class="demo-box draggable-box"
          >
            Drag me!
          </Draggable>
        </div>
      </div>

      <div class="component-section card card-hover">
        <h3 class="text-heading text-xl font-semibold mb-4">
          Droppable Component
        </h3>
        <div class="component-demo bg-background border border-dashed border-border rounded">
          <Droppable
            class="demo-box droppable-box"
            @drop="handleDrop"
          >
            <div v-if="isDropped" class="dropped-indicator">
              Item dropped here!
            </div>
            <div v-else>
              Drop here
            </div>
          </Droppable>
        </div>
      </div>

      <div class="component-section card card-hover">
        <h3 class="text-heading text-xl font-semibold mb-4">
          Resizable Component
        </h3>
        <div class="component-demo bg-background border border-dashed border-border rounded">
          <Resizable
            v-model:size="size"
            :min-width="100"
            :min-height="100"
            class="demo-box resizable-box"
          >
            Resize me!
          </Resizable>
        </div>
      </div>

      <div class="component-section card card-hover">
        <h3 class="text-heading text-xl font-semibold mb-4">
          DraggableResizable Component
        </h3>
        <div class="component-demo bg-background border border-dashed border-border rounded">
          <DraggableResizable
            v-model:position="combinedPosition"
            v-model:size="combinedSize"
            bounds="parent"
            :min-width="100"
            :min-height="100"
            class="demo-box combined-box"
          >
            Drag and resize me!
          </DraggableResizable>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example-container {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.component-section {
  transition: all 0.3s ease;
}

.component-demo {
  position: relative;
  height: 300px;
  margin-top: 16px;
  transition: all 0.3s ease;
}

.demo-box {
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s ease;
}

.draggable-box {
  background-color: var(--draggable-bg);
  border: 2px solid var(--draggable-border);
  width: 150px;
  height: 100px;
}

.droppable-box {
  background-color: var(--droppable-bg);
  border: 2px solid var(--droppable-border);
  width: 100%;
  height: 100%;
}

.resizable-box {
  background-color: var(--resizable-bg);
  border: 2px solid var(--resizable-border);
}

.combined-box {
  background-color: var(--combined-bg);
  border: 2px solid var(--combined-border);
}

.dropped-indicator {
  color: var(--color-primary);
  font-weight: bold;
}

.dark .demo-box {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
