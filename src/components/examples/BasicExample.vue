<script setup lang="ts">
import { ref } from 'vue'
import { DraggableResizable, Droppable, Resizable } from '../'
import TabContainer from '../TabContainer.vue'
import DraggableExample from './DraggableExample.vue'

const position = ref({ x: 50, y: 50 })
const size = ref({ width: 200, height: 150 })
const combinedPosition = ref({ x: 300, y: 50 })
const combinedSize = ref({ width: 200, height: 150 })
const isDropped = ref(false)
const activeTab = ref('draggable')

const tabs = [
  { id: 'draggable', label: 'Draggable' },
  { id: 'droppable', label: 'Droppable' },
  { id: 'resizable', label: 'Resizable' },
  { id: 'draggable-resizable', label: 'Draggable & Resizable' },
]

function handleDrop() {
  isDropped.value = true
}
</script>

<template>
  <div class="example-container">
    <TabContainer v-model:active-tab="activeTab" :tabs="tabs">
      <template #default="{ activeTab }">
        <!-- Draggable Tab -->
        <div v-if="activeTab === 'draggable'" class="component-section">
          <DraggableExample />

          <div class="component-description mt-4">
            <p>The Draggable component allows elements to be moved around within a container.</p>
          </div>
        </div>

        <!-- Droppable Tab -->
        <div v-if="activeTab === 'droppable'" class="component-section">
          <div class="component-demo bg-background border border-dashed border-border rounded">
            <Droppable class="demo-box droppable-box" @drop="handleDrop">
              <div v-if="isDropped" class="dropped-indicator">
                Item dropped here!
              </div>
              <div v-else>
                Drop here
              </div>
            </Droppable>
          </div>
          <div class="component-description mt-4">
            <p>The Droppable component creates a target area where draggable elements can be dropped.</p>
          </div>
        </div>

        <!-- Resizable Tab -->
        <div v-if="activeTab === 'resizable'" class="component-section">
          <div class="component-demo bg-background border border-dashed border-border rounded">
            <Resizable v-model:size="size" :min-width="100" :min-height="100" class="demo-box resizable-box">
              Resize me!
            </Resizable>
          </div>
          <div class="component-description mt-4">
            <p>The Resizable component allows elements to be resized using handles on the edges and corners.</p>
          </div>
        </div>

        <!-- DraggableResizable Tab -->
        <div v-if="activeTab === 'draggable-resizable'" class="component-section">
          <div class="component-demo bg-background border border-dashed border-border rounded">
            <DraggableResizable v-model:position="combinedPosition" v-model:size="combinedSize" bounds="parent"
              :min-width="100" :min-height="100" class="demo-box combined-box">
              Drag and resize me!
            </DraggableResizable>
          </div>
          <div class="component-description mt-4">
            <p>
              The DraggableResizable component combines both draggable and resizable functionality in a single
              component.
            </p>
          </div>
        </div>
      </template>
    </TabContainer>
  </div>
</template>

<style scoped>
.example-container {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.component-section {
  transition: all 0.3s ease;
}

.component-demo {
  position: relative;
  height: 400px;
}

.component-description {
  color: var(--color-text-light);
  line-height: 1.6;
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
  background-color: var(--draggable-bg, #e6f7ff);
  border: 2px solid var(--draggable-border, #1890ff);
  width: 150px;
  height: 100px;
}

.droppable-box {
  background-color: var(--droppable-bg, #f6ffed);
  border: 2px solid var(--droppable-border, #52c41a);
  width: 80%;
  height: 80%;
}

.resizable-box {
  background-color: var(--resizable-bg, #fff7e6);
  border: 2px solid var(--resizable-border, #fa8c16);
}

.combined-box {
  background-color: var(--combined-bg, #f9f0ff);
  border: 2px solid var(--combined-border, #722ed1);
}

.dropped-indicator {
  color: var(--color-primary);
  font-weight: bold;
}

.dark .demo-box {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark .draggable-box {
  --draggable-bg: rgba(24, 144, 255, 0.1);
  --draggable-border: #1890ff;
}

.dark .droppable-box {
  --droppable-bg: rgba(82, 196, 26, 0.1);
  --droppable-border: #52c41a;
}

.dark .resizable-box {
  --resizable-bg: rgba(250, 140, 22, 0.1);
  --resizable-border: #fa8c16;
}

.dark .combined-box {
  --combined-bg: rgba(114, 46, 209, 0.1);
  --combined-border: #722ed1;
}
</style>
