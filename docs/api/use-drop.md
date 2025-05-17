# useDrop

The `useDrop` hook provides drop zone functionality using the HTML5 Drag and Drop API. It allows you to create areas that can receive dragged items with customizable acceptance criteria, visual feedback, and auto-scrolling. The hook uses an optimized approach to handle drag data that works reliably across different browsers and components.

## Demo

<script setup>
import { ref } from 'vue'
import { useDrop, Drag } from 'vue-dndnr'

const dropZoneRef = ref(null)
const dropData = ref(null)

const { isOver, isValidDrop, data } = useDrop(dropZoneRef, {
  accept: ['demo', 'text', 'files'],
  onDrop: (data, event) => {
    console.log('Dropped data:', data)
    dropData.value = data
  },
})
</script>

<DemoContainer>
  <Drag forceFallback :data="{
    type: 'demo',
    payload: { message: 'Hello from drag item!' }
  }">
    <div
      class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl w-xs select-none mb-10"
    ><span class="mr-2">⋮⋮👋</span> Drag me and drop below!
    </div>
    <template #dragPreview>
        <div
          class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl w-xs"
        > 👋 Dragging with custom preview!
        </div>
    </template>
  </Drag>

  <div
    ref="dropZoneRef"
    class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl min-h-[200px] flex items-center justify-start"
  >
    <div class="text-left">
      <div class="text-lg mb-2">Drop Zone</div>
      <div class="text-sm">State: {{ isOver ? (isValidDrop ? 'Valid Drop' : 'Invalid Drop') : 'Idle' }}</div>
      <div v-if="dropData" class="drop-data">
        <div>Type: {{ dropData.type }}</div>
        <div>Payload: {{ JSON.stringify(dropData.payload) }}</div>
        <div v-if="dropData.source">
          Source: {{ JSON.stringify(dropData.source) }}
        </div>
      </div>
    </div>
  </div>
</DemoContainer>

:::details Hook Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDrop } from 'vue-dndnr'

const dropZoneRef = ref(null)
const { isOver, isValidDrop, data } = useDrop(dropZoneRef, {
  accept: ['item', 'text', 'files'],
  dropEffect: 'move',
  scroll: {
    enabled: true,
    speed: 1,
    sensitivity: 20
  },
  onDragEnter: (data, event) => {
    console.log('Drag entered:', event)
  },
  onDragOver: (data, event) => {
    console.log('Drag over:', event)
  },
  onDragLeave: (data, event) => {
    console.log('Drag left:', event)
  },
  onDrop: (data, event) => {
    console.log('Item dropped:', data)
    // Handle the dropped data
    if (data.type === 'item') {
      // Process item data
      const item = data.payload
      // Update your application state
    }
  }
})
</script>

<template>
  <div
    ref="dropZoneRef"
    class="drop-zone"
  >
    <div>Drop Zone</div>
    <div>State: {{ isOver ? (isValidDrop ? 'Valid Drop' : 'Invalid Drop') : 'Idle' }}</div>
    <div v-if="data" class="drop-data">
      <div>Type: {{ data.type }}</div>
      <div>Payload: {{ JSON.stringify(data.payload) }}</div>
      <div v-if="data.source">
        Source ID: {{ data.source.id }}
        Index: {{ data.source.index }}
        <span v-if="data.source.containerId">
          Container: {{ data.source.containerId }}
        </span>
      </div>
    </div>
  </div>
</template>
```

:::

## Type and Options Declarations

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | Reference to the element to make a drop zone |
| `options` | `Partial<DropOptions<T>>` | Configuration options for drop behavior |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isOver` | `Ref<boolean>` | Whether an item is currently over the drop zone |
| `isValidDrop` | `Ref<boolean>` | Whether the current drop would be valid |
| `data` | `Ref<DragData<T> \| null>` | The data of the item being dragged over the drop zone |

### Options

The `DropOptions` interface provides a comprehensive set of configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `accept` | `MaybeRefOrGetter<readonly string[] \| ((types: readonly string[]) => boolean) \| undefined>` | `undefined` | Acceptance criteria for dropped items |
| `dropEffect` | `MaybeRefOrGetter<'copy' \| 'move' \| 'link' \| 'none'>` | `'move'` | Visual effect for drop operation |
| `allowFallbackDrags` | `MaybeRefOrGetter<boolean>` | `true` | Enables fallback drag handling using Pointer Events for drags not initiated via native HTML5 drag API (e.g., from `useDrag` with pointer fallback). |
| `onDragEnter` | `(data: DragData<T> \| null, event: DragEvent \| PointerEvent) => void` | `undefined` | Callback fired when a draggable enters the drop zone. `event` can be `PointerEvent` if `allowFallbackDrags` is true and a fallback drag occurs. |
| `onDragOver` | `(data: DragData<T> \| null, event: DragEvent \| PointerEvent) => void` | `undefined` | Callback fired when a draggable is over the drop zone. `event` can be `PointerEvent` if `allowFallbackDrags` is true and a fallback drag occurs. |
| `onDragLeave` | `(data: DragData<T> \| null, event: DragEvent \| PointerEvent) => void` | `undefined` | Callback fired when a draggable leaves the drop zone. `event` can be `PointerEvent` if `allowFallbackDrags` is true and a fallback drag occurs. |
| `onDrop` | `(data: DragData<T>, event: DragEvent \| PointerEvent) => void` | `undefined` | Callback fired when an item is dropped and accepted. `event` can be `PointerEvent` if `allowFallbackDrags` is true and a fallback drag occurs. |

### DragData

The `DragData` interface defines the structure of the data being dragged and dropped:

```typescript
interface DragData<T = unknown> {
  /**
   * Type identifier for the dragged item
   */
  type: string

  /**
   * The actual data being dragged
   */
  payload: T

  /**
   * Source information about where the drag started
   */
  source?: {
    /**
     * Unique identifier of the source element
     */
    id: string | number

    /**
     * Index of the item in its container
     */
    index: number

    /**
     * Optional container identifier
     */
    containerId?: string
  }
}
```

## Features

- HTML5 Drag and Drop API integration
- Reliable data handling across browsers, including robust data extraction from `DataTransfer` objects by attempting various formats (custom MIME types, structured text, JSON, and common web types like text, URL, HTML, and files).
- Optimized drag-enter/drag-over/drag-leave event handling.
- Global drag state management via an internal store (shared with `useDrag`), enabling communication for complex drag-and-drop scenarios.
- Fallback drag and drop mechanism using Pointer Events, controlled by the `allowFallbackDrags` option, for drags not initiated via the native HTML5 API (e.g., initiated by `useDrag` with pointer fallback).
- Type-based (`string[]`) and validator-function-based acceptance criteria for dropped items.
- Accessibility support with the `aria-droptarget="true"` attribute automatically set on the drop zone element.
- Comprehensive event lifecycle callbacks: `onDragEnter`, `onDragOver`, `onDragLeave`, and `onDrop`.
- Automatic cleanup of all event listeners when the component is unmounted.

## Browser Support

The hook uses the HTML5 Drag and Drop API, which is supported in all modern browsers. For older browsers, you may need to use a polyfill or fallback implementation.

## Related

- [useDrag](./use-drag.md) - Hook for making elements draggable
- [useDnR](./use-dnr.md) - Combined drag and resize functionality
