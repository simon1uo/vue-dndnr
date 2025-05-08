---
outline: false
aside: false
---

# useDnR Playground

<script setup>
import { ref, computed, shallowRef, watch } from 'vue'
import { useDnR } from 'vue-dndnr'

// Element references
const elementRef = ref(null)
const containerRef = ref(null)
const containerBounds = ref(false);
const containerElement = computed(() => {
  if (containerBounds.value) {
    return containerRef.value
  }
  return undefined
})

// Custom handles references
const brHandleRef = ref(null)
const trHandleRef = ref(null)
const blHandleRef = ref(null)
const tlHandleRef = ref(null)
const customHandlesMap = computed(() => {
  if (handleType.value !== 'custom') return undefined

  const map = new Map()
  if (brHandleRef.value) map.set('br', brHandleRef.value)
  if (trHandleRef.value) map.set('tr', trHandleRef.value)
  if (blHandleRef.value) map.set('bl', blHandleRef.value)
  if (tlHandleRef.value) map.set('tl', tlHandleRef.value)
  return map
})

// Basic configuration
const initialPosition = shallowRef({ x: 50, y: 50 })
const initialSize = shallowRef({ width: 200, height: 150 })
const disabled = ref(false)
const disableDrag = ref(false)
const disableResize = ref(false)
const handleType = ref('borders')
const positionType = ref('absolute')
const lockAspectRatio = ref(false)

// Size constraints
const minWidth = ref(100)
const minHeight = ref(100)
const maxWidth = ref(500)
const maxHeight = ref(400)
const enableMinWidth = ref(true)
const enableMinHeight = ref(true)
const enableMaxWidth = ref(true)
const enableMaxHeight = ref(true)

// Activation settings
const activeOn = ref('none')
const preventDeactivation = ref(false)

// Advanced settings
const grid = ref(null)
const useGrid = ref(false)
const gridSize = ref(20)
const axis = ref('both')
const scale = ref(1)
const handlesSize = ref(8)
const handleBorderStyle = ref('none')
const availableHandles = ref(['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl'])

// Event logs
const eventLog = ref([])
const logEvent = (event, data) => {
  eventLog.value.unshift({ event, data, time: new Date().toLocaleTimeString() })
  if (eventLog.value.length > 5) {
    eventLog.value.pop()
  }
}

// Computed grid value
const gridValue = computed(() => {
  if (!useGrid.value) return undefined
  return [gridSize.value, gridSize.value]
})

// Computed size constraints
const computedMinWidth = computed(() => enableMinWidth.value ? minWidth.value : undefined)
const computedMinHeight = computed(() => enableMinHeight.value ? minHeight.value : undefined)
const computedMaxWidth = computed(() => enableMaxWidth.value ? maxWidth.value : undefined)
const computedMaxHeight = computed(() => enableMaxHeight.value ? maxHeight.value : undefined)

// Using the useDnR hook
const {
  position,
  size,
  style,
  isDragging,
  isResizing,
  isActive,
  activeHandle,
  hoverHandle,
  registerHandle,
  unregisterHandle
} = useDnR(elementRef, {
  // Basic options
  initialPosition: initialPosition.value,
  initialSize: initialSize.value,
  initialActive: true,
  disabled,
  disableDrag,
  disableResize,

  // Resize options
  handleType,
  positionType,
  lockAspectRatio,
  minWidth: computedMinWidth,
  minHeight: computedMinHeight,
  maxWidth: computedMaxWidth,
  maxHeight: computedMaxHeight,
  handles: availableHandles,
  customHandles: customHandlesMap,
  handlesSize,
  handleBorderStyle,

  // Drag options
  containerElement,
  grid: gridValue,
  axis,
  scale,

  // Activation options
  activeOn,
  preventDeactivation,

  // Event callbacks
  onDragStart: (e) => logEvent('dragStart', { x: position.x, y: position.y }),
  onDrag: (e) => logEvent('drag', { x: position.x, y: position.y }),
  onDragEnd: (e) => logEvent('dragEnd', { x: position.x, y: position.y }),
  onResizeStart: (e, handle) => logEvent('resizeStart', { handle, size: { ...size } }),
  onResize: (e, handle) => logEvent('resize', { handle, size: { ...size } }),
  onResizeEnd: (e, handle) => logEvent('resizeEnd', { handle, size: { ...size } }),
  onActiveChange: (active) => logEvent('activeChange', { active })
})

// Element class based on state
const elementClass = computed(() => {
  return {
    'bg-primary text-white p-4 rounded-lg': true,
    'ring-2 ring-blue-300': isDragging.value,
    'ring-2 ring-green-300': isResizing.value,
    'ring-2 ring-secondary shadow-xl': isActive.value,
    'cursor-grab': !disableDrag.value && !isDragging.value,
    'cursor-grabbing': isDragging.value,
  }
})

</script>

<PlaygroundContainer title="useDnR Hook" description="Combined drag and resize functionality">
  <template #demo>
    <div ref="containerRef" class="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      <div
        ref="elementRef"
        :style="style"
        :class="elementClass"
      >
        <div>Drag and Resize</div>
        <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
        <div class="text-sm mt-1">Size: {{ size.width }} x {{ size.height }}</div>
        <div class="text-sm mt-1">
          <span v-if="isDragging">Dragging...</span>
          <span v-else-if="isResizing">Resizing ({{ activeHandle }})...</span>
          <span v-else-if="isActive">Active</span>
          <span v-else>Idle</span>
        </div>
        <!-- Custom handles when handleType is 'custom' -->
        <template v-if="handleType === 'custom'">
          <div
            ref="brHandleRef"
            class="absolute bottom-0 right-0 w-4 h-4 bg-red rounded-bl cursor-nwse-resize"
          ></div>
          <div
            ref="trHandleRef"
            class="absolute top-0 right-0 w-4 h-4 bg-red rounded-tr cursor-nesw-resize"
          ></div>
          <div
            ref="blHandleRef"
            class="absolute bottom-0 left-0 w-4 h-4 bg-red rounded-bl cursor-nesw-resize"
          ></div>
          <div
            ref="tlHandleRef"
            class="absolute top-0 left-0 w-4 h-4 bg-red rounded-tl cursor-nwse-resize"
          ></div>
        </template>
      </div>
      <!-- Event log display -->
      <div class="absolute bottom-2 right-2 bg-white dark:bg-gray-700 p-2 rounded shadow-md text-xs w-64 max-h-32 overflow-y-auto">
        <div class="font-bold mb-1">Event Log:</div>
        <div v-for="(log, index) in eventLog" :key="index" class="mb-1">
          <span class="text-gray-500">{{ log.time }}</span>
          <span class="font-medium">{{ log.event }}</span>
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ JSON.stringify(log.data) }}</span>
        </div>
        <div v-if="eventLog.length === 0" class="text-gray-500">No events yet</div>
      </div>
    </div>
  </template>

  <template #config>
    <!-- Basic Configuration -->
    <div class="mb-6">
    <h5 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Basic Configuration</h5>
      <ConfigOption
        label="Disable All"
        description="Disable all drag and resize functionality"
        v-model="disabled"
      />
      <ConfigOption
        label="Disable Drag"
        description="Only disable drag functionality"
        v-model="disableDrag"
      />
      <ConfigOption
        label="Disable Resize"
        description="Only disable resize functionality"
        v-model="disableResize"
      />
      <ConfigOption
        label="Lock Aspect Ratio"
        description="Maintain aspect ratio when resizing"
        v-model="lockAspectRatio"
      />
      <ConfigOption
        label="Use Container"
        description="Constrain element within container boundaries"
        v-model="containerBounds"
      />
    </div>
    <!-- Resize Configuration -->
    <div class="mb-6">
      <h5 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Resize Configuration</h5>
      <ConfigOption
        label="Handle Type"
        description="Type of resize handles"
        type="select"
        :options="[
          { label: 'Borders', value: 'borders' },
          { label: 'Visible Handles', value: 'handles' },
          { label: 'Custom Handles', value: 'custom' }
        ]"
        v-model="handleType"
      />
      <ConfigOption
        label="Handles Size"
        description="Size of resize handles in pixels"
        type="range"
        :min="4"
        :max="20"
        :step="2"
        v-model="handlesSize"
        :disabled="handleType === 'borders'"
      />
      <ConfigOption
        v-if="handleType === 'borders'"
        label="Handle Border Style"
        description="Border style for border handles"
        type="select"
        :options="[
          { label: 'None', value: 'none' },
          { label: 'Solid', value: '1px solid rgba(0,0,0,0.2)' },
          { label: 'Dashed', value: '1px dashed rgba(0,0,0,0.2)' }
        ]"
        v-model="handleBorderStyle"
        :disabled="handleType !== 'borders'"
      />
      <ConfigOption
        label="Enable Min Width"
        description="Enable minimum width constraint"
        v-model="enableMinWidth"
      />
      <template v-if="enableMinWidth">
        <ConfigOption
          label="Minimum Width"
          description="Minimum width of the element"
          type="range"
          :min="50"
          :max="300"
          :step="10"
          v-model="minWidth"
        />
      </template>
      <ConfigOption
        label="Enable Min Height"
        description="Enable minimum height constraint"
        v-model="enableMinHeight"
      />
      <template v-if="enableMinHeight">
        <ConfigOption
          label="Minimum Height"
          description="Minimum height of the element"
          type="range"
          :min="50"
          :max="300"
          :step="10"
          v-model="minHeight"
        />
      </template>
      <ConfigOption
        label="Enable Max Width"
        description="Enable maximum width constraint"
        v-model="enableMaxWidth"
      />
      <template v-if="enableMaxWidth">
        <ConfigOption
          label="Maximum Width"
          description="Maximum width of the element"
          type="range"
          :min="200"
          :max="800"
          :step="50"
          v-model="maxWidth"
        />
      </template>
      <ConfigOption
        label="Enable Max Height"
        description="Enable maximum height constraint"
        v-model="enableMaxHeight"
      />
      <template v-if="enableMaxHeight">
        <ConfigOption
          label="Maximum Height"
          description="Maximum height of the element"
          type="range"
          :min="200"
          :max="800"
          :step="50"
          v-model="maxHeight"
        />
      </template>
    </div>
    <!-- Drag Configuration -->
    <div class="mb-6">
      <h5 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Drag Configuration</h5>
      <ConfigOption
        label="Use Grid"
        description="Snap to grid when dragging"
        v-model="useGrid"
      />
      <ConfigOption
        v-if="useGrid"
        label="Grid Size"
        description="Size of grid cells in pixels"
        type="range"
        :min="5"
        :max="50"
        :step="5"
        v-model="gridSize"
        :disabled="!useGrid"
      />
      <ConfigOption
        label="Drag Axis"
        description="Axis constraint for dragging"
        type="select"
        :options="[
          { label: 'Both', value: 'both' },
          { label: 'X Only', value: 'x' },
          { label: 'Y Only', value: 'y' }
        ]"
        v-model="axis"
      />
      <ConfigOption
        label="Scale Factor"
        description="Scale factor for dragging (for transformed containers)"
        type="range"
        :min="0.5"
        :max="2"
        :step="0.1"
        v-model="scale"
      />
    </div>
    <!-- Position Configuration -->
    <div class="mb-6">
      <h5 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Position Configuration</h5>
      <ConfigOption
        label="Position Type"
        description="Positioning type of the element"
        type="select"
        :options="[
          { label: 'Absolute', value: 'absolute' },
          { label: 'Relative', value: 'relative' }
        ]"
        v-model="positionType"
      />
    </div>
    <!-- Activation Configuration -->
    <div class="mb-6">
      <h5 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Activation Configuration</h5>
      <ConfigOption
        label="Activation Mode"
        description="How the element is activated"
        type="select"
        :options="[
          { label: 'No Activation', value: 'none' },
          { label: 'Click to Activate', value: 'click' },
          { label: 'Hover to Activate', value: 'hover' }
        ]"
        v-model="activeOn"
      />
      <ConfigOption
        label="Prevent Deactivation"
        description="Prevent element from being deactivated"
        v-model="preventDeactivation"
      />
    </div>
  </template>
</PlaygroundContainer>

## API Reference

For complete API documentation of the useDnR hook, please refer to the [useDnR API Documentation](/api/use-dnr).
