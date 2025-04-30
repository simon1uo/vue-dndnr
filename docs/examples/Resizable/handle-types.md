# Resize Handle Types

This example demonstrates the different handle types available for the `Resizable` component and `useResizable` hook.

## Handle Type Options

The `handleType` prop/option supports three values:

- **`'borders'`** (default): Uses the element borders as resize handles
- **`'handles'`**: Displays visible handles at corners and edges
- **`'custom'`**: Uses custom handles provided via slots (component) or the `customHandles` option (hook)

## Live Demo

<script setup>
import { ref, shallowRef, onMounted, computed } from 'vue'
import { Resizable, useResizable } from 'vue-dndnr'

// Component approach with different handle types
const borderSize = shallowRef({ width: 200, height: 150 })
const handlesSize = shallowRef({ width: 200, height: 150 })
const customSize = shallowRef({ width: 200, height: 150 })

// Hook approach with visible handles
const elementRef = ref(null)
const { size: hookSize, style } = useResizable(elementRef, {
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
  size: hookCustomSize,
  style: customStyle,
  isResizing: hookIsResizing,
  activeHandle: hookActiveHandle,
  registerHandle
} = useResizable(customElementRef, {
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
      <Resizable
        v-model:size="borderSize"
        handleType="borders"
        :min-width="100"
        :min-height="100"
      >
        <div class="resizable-box">
          <div>Resize from borders</div>
          <div class="size-display">{{ borderSize.width }} x {{ borderSize.height }}</div>
        </div>
      </Resizable>
    </div>
    <div class="demo-section">
      <h3>Visible Handles</h3>
      <Resizable
        v-model:size="handlesSize"
        handleType="handles"
        :min-width="100"
        :min-height="100"
      >
        <div class="resizable-box">
          <div>Resize using visible handles</div>
          <div class="size-display">{{ handlesSize.width }} x {{ handlesSize.height }}</div>
        </div>
      </Resizable>
    </div>
    <div class="demo-section">
      <h3>Custom Handles</h3>
      <Resizable
        v-model:size="customSize"
        handleType="custom"
        :min-width="100"
        :min-height="100"
        :handles="['br', 'tr', 'bl', 'tl']"
      >
        <div class="resizable-box">
          <div>Resize using custom handles</div>
          <div class="size-display">{{ customSize.width }} x {{ customSize.height }}</div>
        </div>
        <template #handle-br="{ active, hover, isResizing, cursor, size }">
          <div
            class="custom-handle custom-handle-br"
            :class="{ active, hover, resizing: isResizing && active }"
            :style="{ cursor }"
          >
            <span class="handle-icon">↘</span>
            <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
          </div>
        </template>
        <template #handle-tr="{ active, hover, isResizing, cursor, size }">
          <div
            class="custom-handle custom-handle-tr"
            :class="{ active, hover, resizing: isResizing && active }"
            :style="{ cursor }"
          >
            <span class="handle-icon">↗</span>
            <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
          </div>
        </template>
        <template #handle-bl="{ active, hover, isResizing, cursor, size }">
          <div
            class="custom-handle custom-handle-bl"
            :class="{ active, hover, resizing: isResizing && active }"
            :style="{ cursor }"
          >
            <span class="handle-icon">↙</span>
            <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
          </div>
        </template>
        <template #handle-tl="{ active, hover, isResizing, cursor, size }">
          <div
            class="custom-handle custom-handle-tl"
            :class="{ active, hover, resizing: isResizing && active }"
            :style="{ cursor }"
          >
            <span class="handle-icon">↖</span>
            <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
          </div>
        </template>
      </Resizable>
    </div>
    <div class="demo-section">
      <h3>Hook with Visible Handles</h3>
      <div
        ref="elementRef"
        :style="style"
        class="resizable-box hook-example"
      >
        <div>Using useResizable hook</div>
        <div class="size-display">{{ hookSize.width }} x {{ hookSize.height }}</div>
      </div>
    </div>
    <div class="demo-section">
      <h3>Hook with Custom Handles</h3>
      <div
          ref="customElementRef"
          :style="customStyle"
          class="resizable-box hook-example"
        >
          <div>Hook with custom handles</div>
          <div class="size-display">{{ hookCustomSize.width }} x {{ hookCustomSize.height }}</div>
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

.resizable-box {
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

When using `handleType="custom"` with the `Resizable` component, it automatically registers the elements provided in the named slots. This makes creating custom handles very simple and intuitive.

Simply use the named slot for each handle position you want to customize:

```vue
<template #handle-br="{ active, hover, isResizing, cursor, size }">
  <div
    class="my-custom-handle"
    :class="{ active, hover, resizing: isResizing && active }"
    :style="{ cursor }"
  >
    <span>{{ size.width }}x{{ size.height }}</span>
  </div>
</template>
```

The component will automatically:
1. Find your custom handle element in the slot
2. Register it with the resize functionality
3. Apply the appropriate event listeners

You don't need to add any special attributes or directives to your handle elements - just place them in the correct named slot.

### Hook Approach

When using `handleType="custom"` with the `useResizable` hook, you have two options:

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
    const { size, style } = useResizable(elementRef, {
      handleType: 'custom',
      customHandles: customHandlesMap
    })
    ```

2. **Using the `registerHandle` method**:
    ```js
    // Get the registerHandle method from the hook
    const { registerHandle } = useResizable(elementRef, {
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
import { Resizable } from 'vue-dndnr'

// Border handles (default)
const borderSize = ref({ width: 200, height: 150 })

// Visible handles
const handlesSize = ref({ width: 200, height: 150 })

// Custom handles
const customSize = ref({ width: 200, height: 150 })
</script>

<template>
  <!-- Border handles (default) -->
  <Resizable
    v-model:size="borderSize"
    handle-type="borders"
    :min-width="100"
    :min-height="100"
  >
    <div class="resizable-box">
      Resize from borders
      {{ borderSize.width }} x {{ borderSize.height }}
    </div>
  </Resizable>

  <!-- Visible handles -->
  <Resizable
    v-model:size="handlesSize"
    handle-type="handles"
    :min-width="100"
    :min-height="100"
  >
    <div class="resizable-box">
      Resize using visible handles
      {{ handlesSize.width }} x {{ handlesSize.height }}
    </div>
  </Resizable>

  <!-- Custom handles -->
  <Resizable
    v-model:size="customSize"
    handle-type="custom"
    :min-width="100"
    :min-height="100"
    :handles="['br', 'tr', 'bl', 'tl']"
  >
    <div class="resizable-box">
      Resize using custom handles
      {{ customSize.width }} x {{ customSize.height }}
    </div>

    <!-- Custom handle slots with enhanced props -->
    <template #handle-br="{ active, hover, isResizing, cursor, size }">
      <div
        class="custom-handle custom-handle-br"
        :class="{ active, hover, resizing: isResizing && active }"
        :style="{ cursor }"
      >
        <span class="handle-icon">↘</span>
        <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
      </div>
    </template>

    <template #handle-tr="{ active, hover, isResizing, cursor, size }">
      <div
        class="custom-handle custom-handle-tr"
        :class="{ active, hover, resizing: isResizing && active }"
        :style="{ cursor }"
      >
        <span class="handle-icon">↗</span>
        <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
      </div>
    </template>

    <template #handle-bl="{ active, hover, isResizing, cursor, size }">
      <div
        class="custom-handle custom-handle-bl"
        :class="{ active, hover, resizing: isResizing && active }"
        :style="{ cursor }"
      >
        <span class="handle-icon">↙</span>
        <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
      </div>
    </template>

    <template #handle-tl="{ active, hover, isResizing, cursor, size }">
      <div
        class="custom-handle custom-handle-tl"
        :class="{ active, hover, resizing: isResizing && active }"
        :style="{ cursor }"
      >
        <span class="handle-icon">↖</span>
        <span v-if="active" class="handle-tooltip">{{ size.width }}x{{ size.height }}</span>
      </div>
    </template>
  </Resizable>
</template>

<style>
.resizable-box {
  background-color: #3498db;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Custom handle styles */
.custom-handle {
  position: absolute;
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

.custom-handle-br {
  bottom: -12px;
  right: -12px;
}
.custom-handle-br .handle-tooltip {
  top: -30px;
  right: 0;
}

.custom-handle-tr {
  top: -12px;
  right: -12px;
}
.custom-handle-tr .handle-tooltip {
  bottom: -30px;
  right: 0;
}

.custom-handle-bl {
  bottom: -12px;
  left: -12px;
}
.custom-handle-bl .handle-tooltip {
  top: -30px;
  left: 0;
}

.custom-handle-tl {
  top: -12px;
  left: -12px;
}
.custom-handle-tl .handle-tooltip {
  bottom: -30px;
  left: 0;
}
</style>
```
:::

## Hook Approach

### Using Visible Handles

::: details View Hook Code with Visible Handles
```vue
<script setup>
import { ref } from 'vue'
import { useResizable } from 'vue-dndnr'

const elementRef = ref(null)
const { size, style } = useResizable(elementRef, {
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
    class="resizable-box"
  >
    Using useResizable hook with visible handles
    {{ size.width }} x {{ size.height }}
  </div>
</template>

<style>
.resizable-box {
  background-color: #3498db;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
```
:::

### Using Custom Handles

When using the hook with `handleType="custom"`, you have two options for registering custom handle elements. With our latest update, custom handles are now automatically styled with absolute positioning and will properly adjust their positions as the element resizes.

#### Option 1: Using the `customHandles` option (Recommended)

The simplest way is to pass a Map of handle elements directly to the hook using the `customHandles` option. The hook will automatically apply absolute positioning and proper placement to these elements:

::: details View Hook Code with customHandles option
```vue
<script setup>
import { computed, ref } from 'vue'
import { useResizable } from 'vue-dndnr'

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

// Initialize useResizable with handleType="custom" and customHandles
const {
  size,
  style,
  isResizing,
  activeHandle
} = useResizable(customElementRef, {
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
      class="resizable-box"
    >
      Hook with custom handles
      <div>{{ size.width }} x {{ size.height }}</div>
      <div v-if="activeHandle" class="active-handle-display">
        Active: {{ activeHandle }}
      </div>
    </div>

    <!-- Custom handle elements - positioning is now automatic -->
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

Alternatively, you can manually register each handle element using the `registerHandle` method:

::: details View Hook Code with registerHandle method
```vue
<script setup>
import { onMounted, ref } from 'vue'
import { useResizable } from 'vue-dndnr'

// Create refs for the main element and handle elements
const customElementRef = ref(null)

// Create separate refs for each handle
const brHandleRef = ref(null)
const trHandleRef = ref(null)
const blHandleRef = ref(null)
const tlHandleRef = ref(null)

// Initialize useResizable with handleType="custom"
const {
  size,
  style,
  isResizing,
  activeHandle,
  registerHandle
} = useResizable(customElementRef, {
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
      class="resizable-box"
    >
      Hook with custom handles
      <div>{{ size.width }} x {{ size.height }}</div>
      <div v-if="activeHandle" class="active-handle-display">
        Active: {{ activeHandle }}
      </div>
    </div>

    <!-- Custom handle elements - positioning is now automatic -->
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

#### Common Styling for Custom Handles

Regardless of which approach you use, you can style your custom handles with visual properties. The positioning (`position: absolute` and placement like `top`, `right`, etc.) is now automatically handled by the hook:

::: details View Custom Handle Styles
```css
.custom-hook-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Custom handle styles */
.custom-handle {
  /* No need to set position or placement - the hook handles this automatically */
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
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.custom-handle:hover {
  transform: scale(1.2);
  background-color: #c0392b;
}

/*
 * The following positioning styles are no longer needed as they're
 * automatically applied by the hook, but you can keep them in your CSS
 * if you want to override the default positioning.
 */
/*
.custom-handle-br {
  bottom: -12px;
  right: -12px;
}

.custom-handle-tr {
  top: -12px;
  right: -12px;
}

.custom-handle-bl {
  bottom: -12px;
  left: -12px;
}

.custom-handle-tl {
  top: -12px;
  left: -12px;
}
*/

.active-handle-display {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.7;
}
```
:::
