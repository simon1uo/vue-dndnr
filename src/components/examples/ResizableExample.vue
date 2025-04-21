<script setup lang="ts">
import { ref } from 'vue'
import { Resizable } from '../'

const size = ref({ width: 200, height: 150 })
const constrainedSize = ref({ width: 200, height: 150 })
const aspectRatioSize = ref({ width: 200, height: 150 })

function onResizeStart(event, handle) {
  console.log(`Resize started with handle: ${handle}`)
}

function onResize(event, handle) {
  console.log(`Resizing with handle: ${handle}`)
}

function onResizeEnd(event, handle) {
  console.log(`Resize ended with handle: ${handle}`)
}
</script>

<template>
  <div class="resizable-examples">
    <h2 class="text-xl font-bold mb-4">
      Resizable Examples
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Basic Resizable -->
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Basic Resizable
        </h3>
        <div class="demo-container bg-background border border-dashed border-border rounded relative h-300px">
          <Resizable
            v-model:size="size"
            class="demo-resizable"
            @resize-start="onResizeStart"
            @resize="onResize"
            @resize-end="onResizeEnd"
          >
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Resize Me
                </div>
                <div class="text-sm text-text-light mt-2">
                  Size: {{ Math.round(size.width) }}px × {{ Math.round(size.height) }}px
                </div>
              </div>
            </div>
          </Resizable>
        </div>
        <div class="mt-2 text-sm text-text-light">
          Drag any handle to resize the element
        </div>
      </div>

      <!-- Constrained Resizable -->
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Constrained Resizable
        </h3>
        <div class="demo-container bg-background border border-dashed border-border rounded relative h-300px">
          <Resizable
            v-model:size="constrainedSize"
            :min-width="100"
            :min-height="100"
            :max-width="300"
            :max-height="250"
            class="demo-resizable constrained"
          >
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Constrained
                </div>
                <div class="text-sm text-text-light mt-2">
                  Min: 100×100, Max: 300×250
                </div>
                <div class="text-sm text-text-light">
                  Size: {{ Math.round(constrainedSize.width) }}px × {{ Math.round(constrainedSize.height) }}px
                </div>
              </div>
            </div>
          </Resizable>
        </div>
        <div class="mt-2 text-sm text-text-light">
          This resizable has minimum and maximum size constraints
        </div>
      </div>

      <!-- Aspect Ratio Resizable -->
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Aspect Ratio Lock
        </h3>
        <div class="demo-container bg-background border border-dashed border-border rounded relative h-300px">
          <Resizable
            v-model:size="aspectRatioSize"
            :lock-aspect-ratio="true"
            class="demo-resizable aspect-ratio"
          >
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Aspect Ratio Locked
                </div>
                <div class="text-sm text-text-light mt-2">
                  Size: {{ Math.round(aspectRatioSize.width) }}px × {{ Math.round(aspectRatioSize.height) }}px
                </div>
              </div>
            </div>
          </Resizable>
        </div>
        <div class="mt-2 text-sm text-text-light">
          This resizable maintains its aspect ratio when resized
        </div>
      </div>

      <!-- Custom Handles Resizable -->
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Custom Handles
        </h3>
        <div class="demo-container bg-background border border-dashed border-border rounded relative h-300px">
          <Resizable
            :handles="['br', 'bl', 'tr', 'tl']"
            class="demo-resizable corners-only"
          >
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Corner Handles Only
                </div>
                <div class="text-sm text-text-light mt-2">
                  Only corner handles are enabled
                </div>
              </div>
            </div>
          </Resizable>
        </div>
        <div class="mt-2 text-sm text-text-light">
          This resizable only has corner handles enabled
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resizable-examples {
  padding: 20px;
}

.example-card {
  margin-bottom: 20px;
}

.demo-container {
  height: 300px;
  position: relative;
  overflow: hidden;
}

.demo-resizable {
  background-color: var(--resizable-bg, #fff7e6);
  border: 2px solid var(--resizable-border, #fa8c16);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-resizable.constrained {
  background-color: var(--constrained-bg, #e6f7ff);
  border-color: var(--constrained-border, #1890ff);
}

.demo-resizable.aspect-ratio {
  background-color: var(--aspect-ratio-bg, #f9f0ff);
  border-color: var(--aspect-ratio-border, #722ed1);
}

.demo-resizable.corners-only {
  background-color: var(--corners-bg, #f6ffed);
  border-color: var(--corners-border, #52c41a);
}

.dark .demo-resizable {
  --resizable-bg: rgba(250, 140, 22, 0.1);
  --resizable-border: #fa8c16;
  --constrained-bg: rgba(24, 144, 255, 0.1);
  --constrained-border: #1890ff;
  --aspect-ratio-bg: rgba(114, 46, 209, 0.1);
  --aspect-ratio-border: #722ed1;
  --corners-bg: rgba(82, 196, 26, 0.1);
  --corners-border: #52c41a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
