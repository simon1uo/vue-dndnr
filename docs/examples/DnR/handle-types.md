# DnR Handle Types

This example demonstrates the different handle types available for the `DnR` component and `useDnR` hook.

## Handle Type Options

The `handleType` prop/option supports three values:

- **`'borders'`** (default): Uses the element borders as resize handles
- **`'handles'`**: Displays visible handles at corners and edges
- **`'custom'`**: Uses custom handles provided via slots (component) or the `customHandles` option (hook)

## Live Demo

<script setup>
import { ref, shallowRef, onMounted, computed } from 'vue'
import { DnR, useDnR } from 'vue-dndnr'

// Component approach with different handle types
const borderPosition = shallowRef({ x: 50, y: 50 })
const borderSize = shallowRef({ width: 200, height: 150 })

const handlesPosition = shallowRef({ x: 300, y: 50 })
const handlesSize = shallowRef({ width: 200, height: 150 })

const customPosition = shallowRef({ x: 50, y: 250 })
const customSize = shallowRef({ width: 200, height: 150 })

// Hook approach with visible handles
const elementRef = ref(null)
const { position: hookPosition, size: hookSize, style } = useDnR(elementRef, {
  initialPosition: { x: 300, y: 250 },
  initialSize: { width: 200, height: 150 },
  handleType: 'handles'
})

// Hook approach with custom handles
const customElementRef = ref(null)

// Create separate refs for each handle
const brHandleRef = ref(null)
const trHandleRef = ref(null)
const blHandleRef = ref(null)
const tlHandleRef = ref(null)

// Create a computed Map to store custom handles
const customHandlesMap = computed(() => {
  const handlesMap = new Map()

  // Only add handles that have been mounted
  if (brHandleRef.value) handlesMap.set('br', brHandleRef.value)
  if (trHandleRef.value) handlesMap.set('tr', trHandleRef.value)
  if (blHandleRef.value) handlesMap.set('bl', blHandleRef.value)
  if (tlHandleRef.value) handlesMap.set('tl', tlHandleRef.value)

  return handlesMap
})

const {
  position: hookCustomPosition,
  size: hookCustomSize,
  style: customStyle,
  isResizing: hookIsResizing,
  activeHandle: hookActiveHandle,
  registerHandle
} = useDnR(customElementRef, {
  initialPosition: { x: 550, y: 250 },
  initialSize: { width: 200, height: 150 },
  handleType: 'custom',
  minWidth: 100,
  minHeight: 100,
  handles: ['br', 'tr', 'bl', 'tl'],
  // Pass the Map of custom handles directly to the hook
  customHandles: customHandlesMap
})
</script>

<DemoContainer>
  <div class="handle-types-demo">
    <div class="demo-section">
      <h3>Border Handles (Default)</h3>
      <DnR
        v-model:position="borderPosition"
        v-model:size="borderSize"
        handleType="borders"
        :min-width="100"
        :min-height="100"
      >
        <div class="dnr-box">
          <div>Drag and resize from borders</div>
          <div class="position-display">Position: {{ borderPosition.x }}, {{ borderPosition.y }}</div>
          <div class="size-display">Size: {{ borderSize.width }} x {{ borderSize.height }}</div>
        </div>
      </DnR>
    </div>
    <div class="demo-section">
      <h3>Visible Handles</h3>
      <DnR
        v-model:position="handlesPosition"
        v-model:size="handlesSize"
        handleType="handles"
        :min-width="100"
        :min-height="100"
      >
        <div class="dnr-box">
          <div>Drag and resize using visible handles</div>
          <div class="position-display">Position: {{ handlesPosition.x }}, {{ handlesPosition.y }}</div>
          <div class="size-display">Size: {{ handlesSize.width }} x {{ handlesSize.height }}</div>
        </div>
      </DnR>
    </div>
    <div class="demo-section">
      <h3>Custom Handles</h3>
      <DnR
        v-model:position="customPosition"
        v-model:size="customSize"
        handleType="custom"
        :min-width="100"
        :min-height="100"
        :handles="['br', 'tr', 'bl', 'tl']"
      >
        <div class="dnr-box">
          <div>Drag and resize using custom handles</div>
          <div class="position-display">Position: {{ customPosition.x }}, {{ customPosition.y }}</div>
          <div class="size-display">Size: {{ customSize.width }} x {{ customSize.height }}</div>
        </div>
        <template #handle-br="{ handle, active, hover, isResizing, cursor, size, position }">
          <div
            class="custom-handle custom-handle-br"
            :class="{ active, hover, resizing: isResizing }"
            :style="{ cursor }"
          >
            <span class="handle-icon">↘</span>
            <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
          </div>
        </template>
        <template #handle-tr="{ handle, active, hover, isResizing, cursor, size, position }">
          <div
            class="custom-handle custom-handle-tr"
            :class="{ active, hover, resizing: isResizing }"
            :style="{ cursor }"
          >
            <span class="handle-icon">↗</span>
            <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
          </div>
        </template>
        <template #handle-bl="{ handle, active, hover, isResizing, cursor, size, position }">
          <div
            class="custom-handle custom-handle-bl"
            :class="{ active, hover, resizing: isResizing }"
            :style="{ cursor }"
          >
            <span class="handle-icon">↙</span>
            <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
          </div>
        </template>
        <template #handle-tl="{ handle, active, hover, isResizing, cursor, size, position }">
          <div
            class="custom-handle custom-handle-tl"
            :class="{ active, hover, resizing: isResizing }"
            :style="{ cursor }"
          >
            <span class="handle-icon">↖</span>
            <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
          </div>
        </template>
      </DnR>
    </div>
    <div class="demo-section">
      <h3>Hook with Visible Handles</h3>
      <div
        ref="elementRef"
        :style="style"
        class="dnr-box hook-example"
      >
        <div>Using useDnR hook with visible handles</div>
        <div class="position-display">Position: {{ hookPosition.x }}, {{ hookPosition.y }}</div>
        <div class="size-display">Size: {{ hookSize.width }} x {{ hookSize.height }}</div>
      </div>
    </div>
    <div class="demo-section">
      <h3>Hook with Custom Handles</h3>
      <div
          ref="customElementRef"
          :style="customStyle"
          class="dnr-box hook-example"
        >
          <div>Hook with custom handles</div>
          <div class="position-display">Position: {{ hookCustomPosition.x }}, {{ hookCustomPosition.y }}</div>
          <div class="size-display">Size: {{ hookCustomSize.width }} x {{ hookCustomSize.height }}</div>
          <div v-if="hookActiveHandle" class="active-handle-display">Active: {{ hookActiveHandle }}</div>
            <!-- Custom handles - positioning is now automatic -->
            <div ref="brHandleRef" class="custom-handle custom-handle-br">
              <span class="handle-icon">↘</span>
              <span v-if="hookIsResizing && hookActiveHandle === 'br'" class="handle-tooltip">
                {{ hookCustomSize.width }}x{{ hookCustomSize.height }}
              </span>
            </div>
            <div ref="trHandleRef" class="custom-handle custom-handle-tr">
              <span class="handle-icon">↗</span>
              <span v-if="hookIsResizing && hookActiveHandle === 'tr'" class="handle-tooltip">
                {{ hookCustomSize.width }}x{{ hookCustomSize.height }}
              </span>
            </div>
            <div ref="blHandleRef" class="custom-handle custom-handle-bl">
              <span class="handle-icon">↙</span>
              <span v-if="hookIsResizing && hookActiveHandle === 'bl'" class="handle-tooltip">
                {{ hookCustomSize.width }}x{{ hookCustomSize.height }}
              </span>
            </div>
            <div ref="tlHandleRef" class="custom-handle custom-handle-tl">
              <span class="handle-icon">↖</span>
              <span v-if="hookIsResizing && hookActiveHandle === 'tl'" class="handle-tooltip">
                {{ hookCustomSize.width }}x{{ hookCustomSize.height }}
              </span>
            </div>
      </div>
    </div>
  </div>
</DemoContainer>

<style>
.handle-types-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.demo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dnr-box {
  background-color: #3498db;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.hook-example {
  width: 100%;
  height: 100%;
}

.position-display,
.size-display {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Custom handle styles */
.custom-handle {
  /* Position and placement are now automatically handled by the hook */
  width: 24px;
  height: 24px;
  background-color: #e74c3c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.custom-handle:hover, .custom-handle.hover {
  transform: scale(1.2);
  background-color: #c0392b;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.custom-handle.active, .custom-handle.resizing {
  background-color: #a93226;
  transform: scale(1.3);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.handle-icon {
  font-size: 16px;
  line-height: 1;
}

.handle-tooltip {
  position: absolute;
  background-color: #2c3e50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;
}

/*
 * The following positioning styles are no longer needed for the hook approach
 * as they're automatically applied, but we keep them for the component approach
 * and for tooltip positioning
 */
.custom-handle-br .handle-tooltip {
  top: -30px;
  right: 0;
}

.custom-handle-tr .handle-tooltip {
  bottom: -30px;
  right: 0;
}

.custom-handle-bl .handle-tooltip {
  top: -30px;
  left: 0;
}

.custom-handle-tl .handle-tooltip {
  bottom: -30px;
  left: 0;
}

/* Custom hook container styles */
.custom-hook-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.active-handle-display {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>

## Using Custom Handles

### Component Approach

When using `handleType="custom"` with the `DnR` component, it automatically registers the elements provided in the named slots. This makes creating custom handles very simple and intuitive.

Simply use the named slot for each handle position you want to customize:

```vue
<DnR v-model:position="position" v-model:size="size" handleType="custom">
  <template #handle-br="{ handle, active, hover, isResizing, cursor, size, position }">
    <div
      class="my-custom-handle"
      :class="{ active, hover, resizing: isResizing }"
      :style="{ cursor }"
    >
      <span>{{ size.width }}x{{ size.height }}</span>
    </div>
  </template>
</DnR>
```

The component will automatically:
1. Find your custom handle element in the slot
2. Register it with the resize functionality
3. Apply the appropriate event listeners

You don't need to add any special attributes or directives to your handle elements - just place them in the correct named slot.

Each handle slot receives the following props:
- `handle`: The handle position (e.g., 'br', 'tl')
- `position`: The handle position (same as `handle`, for compatibility with Resizable)
- `active`: Whether this handle is currently active (being dragged)
- `hover`: Whether the mouse is hovering over this handle
- `isResizing`: Whether the element is being resized
- `cursor`: The appropriate cursor style for this handle
- `size`: The current size of the element

### Hook Approach

When using `handleType="custom"` with the `useDnR` hook, you have two options:

1. **Using the `customHandles` option (Recommended)**:
    ```js
    // Create separate refs for each handle
    const brHandleRef = ref(null)
    const trHandleRef = ref(null)
    const blHandleRef = ref(null)
    const tlHandleRef = ref(null)

    // Create a computed Map of handle positions to elements
    const customHandlesMap = computed(() => {
      const handlesMap = new Map()
      // Only add handles that have been mounted
      if (brHandleRef.value)
        handlesMap.set('br', brHandleRef.value)
      if (trHandleRef.value)
        handlesMap.set('tr', trHandleRef.value)
      if (blHandleRef.value)
        handlesMap.set('bl', blHandleRef.value)
      if (tlHandleRef.value)
        handlesMap.set('tl', tlHandleRef.value)
      return handlesMap
    })

    // Initialize the hook with the customHandles option
    const { position, size, style } = useDnR(elementRef, {
      handleType: 'custom',
      customHandles: customHandlesMap
    })
    ```

2. **Using the `registerHandle` method**:
    ```js
    // Get the registerHandle method from the hook
    const { registerHandle } = useDnR(elementRef, {
      handleType: 'custom'
    })

    // Register each handle manually
    registerHandle('br', bottomRightHandleElement)
    ```

If no custom handles are provided, the hook will create default handles similar to the `'handles'` type.

## Component Approach

::: details View Component Code
```vue
<script setup>
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'

// Border handles (default)
const borderPosition = ref({ x: 50, y: 50 })
const borderSize = ref({ width: 200, height: 150 })

// Visible handles
const handlesPosition = ref({ x: 300, y: 50 })
const handlesSize = ref({ width: 200, height: 150 })

// Custom handles
const customPosition = ref({ x: 50, y: 250 })
const customSize = ref({ width: 200, height: 150 })
</script>

<template>
  <!-- Border handles (default) -->
  <DnR
    v-model:position="borderPosition"
    v-model:size="borderSize"
    handle-type="borders"
    :min-width="100"
    :min-height="100"
  >
    <div class="dnr-box">
      <div>Drag and resize from borders</div>
      <div class="position-display">
        Position: {{ borderPosition.x }}, {{ borderPosition.y }}
      </div>
      <div class="size-display">
        Size: {{ borderSize.width }} x {{ borderSize.height }}
      </div>
    </div>
  </DnR>

  <!-- Visible handles -->
  <DnR
    v-model:position="handlesPosition"
    v-model:size="handlesSize"
    handle-type="handles"
    :min-width="100"
    :min-height="100"
  >
    <div class="dnr-box">
      <div>Drag and resize using visible handles</div>
      <div class="position-display">
        Position: {{ handlesPosition.x }}, {{ handlesPosition.y }}
      </div>
      <div class="size-display">
        Size: {{ handlesSize.width }} x {{ handlesSize.height }}
      </div>
    </div>
  </DnR>

  <!-- Custom handles -->
  <DnR
    v-model:position="customPosition"
    v-model:size="customSize"
    handle-type="custom"
    :min-width="100"
    :min-height="100"
    :handles="['br', 'tr', 'bl', 'tl']"
  >
    <div class="dnr-box">
      <div>Drag and resize using custom handles</div>
      <div class="position-display">
        Position: {{ customPosition.x }}, {{ customPosition.y }}
      </div>
      <div class="size-display">
        Size: {{ customSize.width }} x {{ customSize.height }}
      </div>
    </div>

    <!-- Custom handle slots with enhanced props -->
    <template #handle-br="{ handle, active, hover, isResizing, cursor, size, position }">
      <div
        class="custom-handle custom-handle-br"
        :class="{ active, hover, resizing: isResizing }"
        :style="{ cursor }"
      >
        <span class="handle-icon">↘</span>
        <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
      </div>
    </template>

    <template #handle-tr="{ handle, active, hover, isResizing, cursor, size, position }">
      <div
        class="custom-handle custom-handle-tr"
        :class="{ active, hover, resizing: isResizing }"
        :style="{ cursor }"
      >
        <span class="handle-icon">↗</span>
        <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
      </div>
    </template>

    <template #handle-bl="{ handle, active, hover, isResizing, cursor, size, position }">
      <div
        class="custom-handle custom-handle-bl"
        :class="{ active, hover, resizing: isResizing }"
        :style="{ cursor }"
      >
        <span class="handle-icon">↙</span>
        <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
      </div>
    </template>

    <template #handle-tl="{ handle, active, hover, isResizing, cursor, size, position }">
      <div
        class="custom-handle custom-handle-tl"
        :class="{ active, hover, resizing: isResizing }"
        :style="{ cursor }"
      >
        <span class="handle-icon">↖</span>
        <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
      </div>
    </template>
  </DnR>
</template>
```
:::

## Hook Approach

### Using Visible Handles

::: details View Hook Code with Visible Handles
```vue
<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  handleType: 'handles', // Can be 'borders', 'handles', or 'custom'
  minWidth: 100,
  minHeight: 100
})
</script>

<template>
  <div
    ref="elementRef"
    :style="style"
    class="dnr-box"
  >
    <div>Using useDnR hook with visible handles</div>
    <div class="position-display">
      Position: {{ position.x }}, {{ position.y }}
    </div>
    <div class="size-display">
      Size: {{ size.width }} x {{ size.height }}
    </div>
  </div>
</template>
```
:::

### Using Custom Handles

When using the hook with `handleType="custom"`, you have two options for registering custom handle elements:

#### Option 1: Using the `customHandles` option (Recommended)

::: details View Hook Code with customHandles option
```vue
<script setup>
import { computed, ref } from 'vue'
import { useDnR } from 'vue-dndnr'

// Create refs for the main element and handle elements
const customElementRef = ref(null)

// Create separate refs for each handle
const brHandleRef = ref(null)
const trHandleRef = ref(null)
const blHandleRef = ref(null)
const tlHandleRef = ref(null)

// Create a computed Map to store custom handles
const customHandlesMap = computed(() => {
  const handlesMap = new Map()

  // Only add handles that have been mounted
  if (brHandleRef.value)
    handlesMap.set('br', brHandleRef.value)
  if (trHandleRef.value)
    handlesMap.set('tr', trHandleRef.value)
  if (blHandleRef.value)
    handlesMap.set('bl', blHandleRef.value)
  if (tlHandleRef.value)
    handlesMap.set('tl', tlHandleRef.value)

  return handlesMap
})

// Initialize useDnR with handleType="custom" and customHandles
const {
  position,
  size,
  style,
  isResizing,
  activeHandle
} = useDnR(customElementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  handleType: 'custom',
  minWidth: 100,
  minHeight: 100,
  handles: ['br', 'tr', 'bl', 'tl'],
  // Pass the computed Map of custom handles directly to the hook
  customHandles: customHandlesMap
})
</script>

<template>
  <div class="custom-hook-container">
    <!-- Main resizable element -->
    <div
      ref="customElementRef"
      :style="style"
      class="dnr-box"
    >
      <div>Hook with custom handles</div>
      <div class="position-display">
        Position: {{ position.x }}, {{ position.y }}
      </div>
      <div class="size-display">
        Size: {{ size.width }} x {{ size.height }}
      </div>
      <div v-if="activeHandle" class="active-handle-display">
        Active: {{ activeHandle }}
      </div>
    </div>

    <!-- Custom handle elements -->
    <div ref="brHandleRef" class="custom-handle">
      <span class="handle-icon">↘</span>
      <span v-if="isResizing && activeHandle === 'br'" class="handle-tooltip">
        {{ size.width }}x{{ size.height }}
      </span>
    </div>
    <div ref="trHandleRef" class="custom-handle">
      <span class="handle-icon">↗</span>
      <span v-if="isResizing && activeHandle === 'tr'" class="handle-tooltip">
        {{ size.width }}x{{ size.height }}
      </span>
    </div>
    <div ref="blHandleRef" class="custom-handle">
      <span class="handle-icon">↙</span>
      <span v-if="isResizing && activeHandle === 'bl'" class="handle-tooltip">
        {{ size.width }}x{{ size.height }}
      </span>
    </div>
    <div ref="tlHandleRef" class="custom-handle">
      <span class="handle-icon">↖</span>
      <span v-if="isResizing && activeHandle === 'tl'" class="handle-tooltip">
        {{ size.width }}x{{ size.height }}
      </span>
    </div>
  </div>
</template>
```
:::

#### Option 2: Using the `registerHandle` method

::: details View Hook Code with registerHandle method
```vue
<script setup>
import { onMounted, ref } from 'vue'
import { useDnR } from 'vue-dndnr'

// Create refs for the main element and handle elements
const customElementRef = ref(null)

// Create separate refs for each handle
const brHandleRef = ref(null)
const trHandleRef = ref(null)
const blHandleRef = ref(null)
const tlHandleRef = ref(null)

// Initialize useDnR with handleType="custom"
const {
  position,
  size,
  style,
  isResizing,
  activeHandle,
  registerHandle
} = useDnR(customElementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  handleType: 'custom',
  minWidth: 100,
  minHeight: 100,
  handles: ['br', 'tr', 'bl', 'tl']
})

// Register custom handles when they're mounted
onMounted(() => {
  // Register each handle individually
  if (brHandleRef.value)
    registerHandle('br', brHandleRef.value)
  if (trHandleRef.value)
    registerHandle('tr', trHandleRef.value)
  if (blHandleRef.value)
    registerHandle('bl', blHandleRef.value)
  if (tlHandleRef.value)
    registerHandle('tl', tlHandleRef.value)
})
</script>

<template>
  <div class="custom-hook-container">
    <!-- Main resizable element -->
    <div
      ref="customElementRef"
      :style="style"
      class="dnr-box"
    >
      <div>Hook with custom handles</div>
      <div class="position-display">
        Position: {{ position.x }}, {{ position.y }}
      </div>
      <div class="size-display">
        Size: {{ size.width }} x {{ size.height }}
      </div>
      <div v-if="activeHandle" class="active-handle-display">
        Active: {{ activeHandle }}
      </div>
    </div>

    <!-- Custom handle elements -->
    <div ref="brHandleRef" class="custom-handle">
      <span class="handle-icon">↘</span>
      <span v-if="isResizing && activeHandle === 'br'" class="handle-tooltip">
        {{ size.width }}x{{ size.height }}
      </span>
    </div>
    <div ref="trHandleRef" class="custom-handle">
      <span class="handle-icon">↗</span>
      <span v-if="isResizing && activeHandle === 'tr'" class="handle-tooltip">
        {{ size.width }}x{{ size.height }}
      </span>
    </div>
    <div ref="blHandleRef" class="custom-handle">
      <span class="handle-icon">↙</span>
      <span v-if="isResizing && activeHandle === 'bl'" class="handle-tooltip">
        {{ size.width }}x{{ size.height }}
      </span>
    </div>
    <div ref="tlHandleRef" class="custom-handle">
      <span class="handle-icon">↖</span>
      <span v-if="isResizing && activeHandle === 'tl'" class="handle-tooltip">
        {{ size.width }}x{{ size.height }}
      </span>
    </div>
  </div>
</template>
```
:::
