<script setup lang="ts">
import type { Size } from '../../types'
import { onMounted, ref } from 'vue'
import { Resizable } from '../'
import { useResizable } from '../../hooks'

const size = ref({ width: 200, height: 150 })
const constrainedSize = ref({ width: 200, height: 150 })
const aspectRatioSize = ref({ width: 200, height: 150 })
const boundarySize = ref({ width: 200, height: 150 })
const smallBoundarySize = ref({ width: 200, height: 150 })

// For absolute positioned example
const absoluteSize = ref({ width: 200, height: 150 })
const absolutePosition = ref({ x: 50, y: 50 })

// For pure hook example
const hookExampleRef = ref<HTMLElement | null>(null)
const hookSize = ref({ width: 200, height: 150 })

// Track hover handle for boundary examples
const hoverHandle = ref<string | null>(null)
const activeHandle = ref<string | null>(null)

// Event handlers for Resizable component
// These handlers match the component's emit signature
function onResizeStart(_size: Size, _event: MouseEvent | TouchEvent) {
  console.log('onResizeStart', _size)
}

function onResize(_size: Size, _event: MouseEvent | TouchEvent) {
  console.log('onResize', _size)
}

function onResizeEnd(_size: Size, _event: MouseEvent | TouchEvent) {
  console.log('onResizeEnd', _size)
}

// Handle hover events for boundary examples
function onHoverHandleChange(handle: string | null) {
  hoverHandle.value = handle
}

// Format handle name for display
function formatHandle(handle: string | null) {
  if (!handle)
    return 'None'

  const handleMap: Record<string, string> = {
    t: 'Top',
    b: 'Bottom',
    r: 'Right',
    l: 'Left',
    tr: 'Top-Right',
    tl: 'Top-Left',
    br: 'Bottom-Right',
    bl: 'Bottom-Left',
  }

  return handleMap[handle] || handle
}

// Setup pure hook example
onMounted(() => {
  if (hookExampleRef.value) {
    useResizable(hookExampleRef, {
      initialSize: hookSize.value,
      minWidth: 100,
      minHeight: 100,
      maxWidth: 400,
      maxHeight: 250,
      onResizeStart: (_size, _event) => {
        // console.log('Hook resize started', size)
      },
      onResize: (size, _event) => {
        // Need to create a copy to avoid type issues
        hookSize.value = {
          width: typeof size.width === 'number' ? size.width : Number.parseInt(size.width),
          height: typeof size.height === 'number' ? size.height : Number.parseInt(size.height),
        }
      },
      onResizeEnd: (_size, _event) => {
        // console.log('Hook resize ended', size)
      },
    })
  }
})
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
          <Resizable v-model:size="size" class="demo-resizable" bounds="parent" @resize-start="onResizeStart"
            @resize="onResize" @resize-end="onResizeEnd">
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Resize Me (Constrained by 'parent')
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
          <Resizable v-model:size="constrainedSize" :min-width="100" :min-height="100" :max-width="300"
            :max-height="250" class="demo-resizable constrained">
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
          <Resizable v-model:size="aspectRatioSize" :lock-aspect-ratio="true" class="demo-resizable aspect-ratio">
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

      <!-- Default Boundary Threshold -->
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Boundary Resizing (Default)
        </h3>
        <div class="demo-container bg-background border border-dashed border-border rounded relative h-300px">
          <Resizable v-model:size="boundarySize" class="demo-resizable boundary" @resize-start="onResizeStart"
            @resize="onResize" @resize-end="onResizeEnd" @hover-handle-change="onHoverHandleChange">
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Boundary Resizing
                </div>
                <div class="text-sm text-text-light mt-2">
                  Size: {{ Math.round(boundarySize.width) }}px × {{ Math.round(boundarySize.height) }}px
                </div>
                <div class="text-sm text-text-light mt-2">
                  <div>Hover: <span class="font-medium">{{ formatHandle(hoverHandle) }}</span></div>
                  <div>Active: <span class="font-medium">{{ formatHandle(activeHandle) }}</span></div>
                </div>
              </div>
            </div>
          </Resizable>
        </div>
        <div class="mt-2 text-sm text-text-light">
          Move your cursor to the edges to resize (default 8px threshold)
        </div>
      </div>

      <!-- Small Boundary Threshold -->
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Custom Boundary Threshold
        </h3>
        <div class="demo-container bg-background border border-dashed border-border rounded relative h-300px">
          <Resizable v-model:size="smallBoundarySize" :boundary-threshold="4"
            :handles="['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']" class="demo-resizable small-boundary"
            @hover-handle-change="onHoverHandleChange" @resize-start="onResizeStart" @resize-end="onResizeEnd">
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Small Boundary (4px)
                </div>
                <div class="text-sm text-text-light mt-2">
                  Size: {{ Math.round(smallBoundarySize.width) }}px × {{ Math.round(smallBoundarySize.height) }}px
                </div>
                <div class="text-sm text-text-light mt-2">
                  <div>Hover: <span class="font-medium">{{ formatHandle(hoverHandle) }}</span></div>
                  <div>Active: <span class="font-medium">{{ formatHandle(activeHandle) }}</span></div>
                </div>
              </div>
            </div>
          </Resizable>
        </div>
        <div class="mt-2 text-sm text-text-light">
          This resizable has a smaller boundary threshold (4px instead of 8px)
        </div>
      </div>

      <!-- Pure Hook Usage Example -->
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Pure Hook Usage
        </h3>
        <div class="demo-container bg-background border border-dashed border-border rounded relative h-300px">
          <div ref="hookExampleRef" class="demo-resizable hook-example">
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Hook Example
                </div>
                <div class="text-sm text-text-light mt-2">
                  Size: {{ Math.round(hookSize.width) }}px × {{ Math.round(hookSize.height) }}px
                </div>
                <div class="text-sm text-text-light mt-2">
                  <div>Using useResizable hook directly</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-2 text-sm text-text-light">
          This example uses the useResizable hook directly without the Resizable component
        </div>
      </div>

      <!-- Absolute Positioned Resizable -->
      <div class="example-card">
        <h3 class="text-lg font-semibold mb-2">
          Absolute Positioned Resizable
        </h3>
        <div class="demo-container bg-background border border-dashed border-border rounded relative h-300px">
          <Resizable v-model:size="absoluteSize" v-model:position="absolutePosition" bounds="parent"
            class="demo-resizable absolute-positioned">
            <div class="p-4 flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-lg font-medium">
                  Absolute Positioned
                </div>
                <div class="text-sm text-text-light mt-2">
                  Size: {{ Math.round(absoluteSize.width) }}px × {{ Math.round(absoluteSize.height) }}px
                </div>
                <div class="text-sm text-text-light mt-2">
                  Position: {{ Math.round(absolutePosition.x) }}px, {{ Math.round(absolutePosition.y) }}px
                </div>
              </div>
            </div>
          </Resizable>
        </div>
        <div class="mt-2 text-sm text-text-light">
          This resizable has absolute positioning and updates position when resizing from top or left edges
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

.demo-resizable.boundary {
  background-color: var(--boundary-bg, #f6ffed);
  border-color: var(--boundary-border, #52c41a);
}

.demo-resizable.small-boundary {
  background-color: var(--small-boundary-bg, #fffbe6);
  border-color: var(--small-boundary-border, #faad14);
}

.demo-resizable.hook-example {
  background-color: var(--hook-example-bg, #e6fffb);
  border-color: var(--hook-example-border, #13c2c2);
}

.demo-resizable.absolute-positioned {
  position: absolute;
  background-color: var(--absolute-bg, #fff0f6);
  border-color: var(--absolute-border, #eb2f96);
}

.dark .demo-resizable {
  --resizable-bg: rgba(250, 140, 22, 0.1);
  --resizable-border: #fa8c16;
  --constrained-bg: rgba(24, 144, 255, 0.1);
  --constrained-border: #1890ff;
  --aspect-ratio-bg: rgba(114, 46, 209, 0.1);
  --aspect-ratio-border: #722ed1;
  --boundary-bg: rgba(82, 196, 26, 0.1);
  --boundary-border: #52c41a;
  --small-boundary-bg: rgba(250, 173, 20, 0.1);
  --small-boundary-border: #faad14;
  --hook-example-bg: rgba(19, 194, 194, 0.1);
  --hook-example-border: #13c2c2;
  --absolute-bg: rgba(235, 47, 150, 0.1);
  --absolute-border: #eb2f96;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
