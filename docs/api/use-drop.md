# useDrop

The `useDrop` hook provides drop zone functionality using the HTML5 Drag and Drop API and pointer events. It allows you to create areas that can receive dragged items with customizable acceptance criteria, visual feedback, and auto-scrolling. The hook uses an optimized approach to handle drag data that works reliably across different browsers, components, and drag modes.

## Demo

<script setup>
import { ref } from 'vue'
import { useDrop, Drag, DragMode } from 'vue-dndnr'

const dropZoneRef = ref(null)
const dropData = ref(null)

const { isDragOver, isValidDrop, data } = useDrop(dropZoneRef, {
  dropId: 'demo-drop-zone',
  accept: ['demo-item'],
  onDrop: (params, event) => {
    console.log('Dropped data:', params)
    dropData.value = params
  },
})
</script>

<DemoContainer>
  <Drag v-bind="{ dragId: 'item-1', index: 0, type: 'demo-item', dragMode: DragMode.Pointer }">
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
    class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl min-h-[200px] w-50% flex items-center justify-start"
  >
    <div class="text-left">
      <div class="text-lg mb-2">Drop Zone</div>
      <div class="text-sm">State: {{ isDragOver ? (isValidDrop ? 'Valid Drop' : 'Invalid Drop') : 'Idle' }}</div>
      <div v-if="dropData" class="drop-data">
        <div>Type: {{ dropData.type }}</div>
        <div>Drag ID: {{ dropData.dragId }}</div>
        <div>Index: {{ dropData.index }}</div>
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
const { isDragOver, isValidDrop, data } = useDrop(dropZoneRef, {
  dropId: 'my-drop-zone',
  accept: ['item-type-A', 'item-type-B'],
  dropEffect: 'move',
  onDragEnter: (params, event) => {
    console.log('Drag entered:', params, event)
  },
  onDragOver: (params, event) => {
    console.log('Drag over:', params, event)
  },
  onDragLeave: (params, event) => {
    console.log('Drag left:', params, event)
  },
  onDrop: (params, event) => {
    console.log('Item dropped:', params)
    if (params.type === 'item-type-A') {
      console.log(`Item ${params.dragId} of type ${params.type} at index ${params.index} dropped.`)
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
    <div>State: {{ isDragOver ? (isValidDrop ? 'Valid Drop' : 'Invalid Drop') : 'Idle' }}</div>
    <div v-if="data" class="drop-data">
      <div>Type: {{ data.type }}</div>
      <div>Drag ID: {{ data.dragId }}</div>
      <div>Index: {{ data.index }}</div>
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
| `options` | `DropOptions` | Configuration options for drop behavior |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isDragOver` | `Ref<boolean>` | Whether an item is currently over the drop zone |
| `isValidDrop` | `Ref<boolean>` | Whether the current drop would be valid |
| `data` | `Ref<{ dragId: string, index: number, type: string } \| null>` | Information about the item being dragged over the drop zone ({ dragId, index, type }) or null. |

### Options

The `DropOptions` interface provides a comprehensive set of configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dropId` | `string` | **Required** | Unique identifier for the drop zone. |
| `accept` | `MaybeRefOrGetter<string \| string[] \| ((type: string) => boolean) \| undefined>` | `undefined` | Acceptance criteria for dropped item's `type`. Can be a single string, an array of strings, or a function that receives the drag item's `type` and returns a boolean. |
| `dropEffect` | `MaybeRefOrGetter<'copy' \| 'move' \| 'link' \| 'none'>` | `'move'` | Visual effect for drop operation. |
| `onDragEnter` | `(params: { dragId: string, index: number, type: string } \| null, event: DragEvent \| PointerEvent) => void` | `undefined` | Callback fired when a draggable enters the drop zone. `params` contains `{ dragId, index, type }` of the dragged item, or `null` if data cannot be determined yet. `event` can be `PointerEvent` if the drag uses pointer mode. |
| `onDragOver` | `(params: { dragId: string, index: number, type: string } \| null, event: DragEvent \| PointerEvent) => void` | `undefined` | Callback fired when a draggable is over the drop zone. `params` contains `{ dragId, index, type }` of the dragged item, or `null`. `event` can be `PointerEvent` if the drag uses pointer mode. |
| `onDragLeave` | `(params: { dragId: string, index: number, type: string } \| null, event: DragEvent \| PointerEvent) => void` | `undefined` | Callback fired when a draggable leaves the drop zone. `params` is usually `null` on leave. `event` can be `PointerEvent` if the drag uses pointer mode. |
| `onDrop` | `(params: { dragId: string, index: number, type: string }, event: DragEvent \| PointerEvent) => void` | `undefined` | Callback fired when an item is dropped and accepted. `params` contains `{ dragId, index, type }` of the dropped item. `event` can be `PointerEvent` if the drag uses pointer mode. |

### DragData

The `DragData` interface defines the structure of the data being dragged and dropped:

```typescript
interface ActiveDragContext {
  id: string
  dragId: string
  index: number
  type: string
  sourceDropId?: string
  isFallback: boolean
}
```

## Features

- HTML5 Drag and Drop API integration with pointer event support
- Reliable data handling for drag item identity (`dragId`, `index`, `type`) across browsers, including robust extraction from `DataTransfer` objects using custom MIME types and a formatted `text/plain` fallback.
- Optimized drag-enter/drag-over/drag-leave event handling.
- Global drag state management via an internal store (shared with `useDrag`), enabling communication of active drag item's `dragId`, `index`, and `type`.
- Automatic support for both native and pointer-based drag modes
- Type-based (`string[]`) and validator-function-based acceptance criteria for dropped items.
- Accessibility support with the `aria-droptarget="true"` attribute automatically set on the drop zone element.
- Comprehensive event lifecycle callbacks: `onDragEnter`, `onDragOver`, `onDragLeave`, and `onDrop`.
- Automatic cleanup of all event listeners when the component is unmounted.

## Browser Support

The hook uses the HTML5 Drag and Drop API, which is supported in all modern browsers. For older browsers, you may need to use a polyfill or fallback implementation.

## Related

- [useDrag](./use-drag.md) - Hook for making elements draggable
- [useDnR](./use-dnr.md) - Combined drag and resize functionality
