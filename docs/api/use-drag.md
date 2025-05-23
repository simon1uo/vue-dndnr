# useDrag

The `useDrag` hook provides drag functionality for elements using the HTML5 Drag and Drop API or a custom pointer-based implementation. It allows you to make any element draggable with customizable drag preview, constraints, and effects. The hook uses a simple, type-safe ID-based mechanism for drag data transfer, requiring only `dragId`, `index`, and (optionally) `type`.

## Demo

<script setup>
import { ref } from 'vue'
import { useDrag, DragMode } from 'vue-dndnr'

const elementRef = ref(null)
const customDragRef = ref(null)
const handleRef = ref(null)

const { isDragging, style } = useDrag(elementRef, {
  dragId: 'demo-card',
  index: 0,
  type: 'demo',
  // Use a specific element as the drag handle
  handle: handleRef,
  // Custom drag preview
  dragPreview: {
    element: customDragRef,
    offset: { x: 10, y: 10 }
  },
  // Use pointer-based drag mode for better touch device support
  dragMode: DragMode.Pointer,
  // Add a small delay for touch devices
  delay: 100,
  delayOnTouchOnly: true,
  stateStyles: {
    dragging: {
      opacity: '0.7',
    }
  },
  onDragStart: (event) => {
    console.log('Demo drag started', event)
  },
  onDragEnd: (event) => {
    console.log('Demo drag ended', event)
  }
})
</script>

<DemoContainer>
  <div
    ref="elementRef"
    :style="style"
    class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl w-xs select-none"
  >
    <div class="mb-2">This card is draggable using the handle below</div>
    <!-- Drag handle -->
    <div
      ref="handleRef"
      class="bg-slate-600 dark:bg-slate-600 p-2 rounded flex items-center justify-center cursor-grab"
    >
      <span class="mr-2">⋮⋮👋</span> Drag using this handle
    </div>
    <div class="text-sm mt-2">Drag State: {{ isDragging ? 'Dragging' : 'Idle' }}</div>
  </div>

  <!-- Hidden drag preview element -->
  <div
    ref="customDragRef"
    class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl w-xs"
    style="position: absolute; left: -9999px; top: -9999px;"
  > 👋 Dragging with custom preview!</div>
</DemoContainer>

:::details Hook Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DragMode, useDrag } from 'vue-dndnr'

const elementRef = ref<HTMLElement | null>(null)
const handleRef = ref<HTMLElement | null>(null)

const { isDragging, style } = useDrag(elementRef, {
  dragId: 'item-1',
  index: 0,
  type: 'text',
  // Use a specific element as the drag handle
  handle: handleRef,
  // Use pointer-based drag mode for better touch device support
  dragMode: DragMode.Pointer,
  // Add a delay before drag starts (only on touch devices)
  delay: 150,
  delayOnTouchOnly: true,
  stateStyles: {
    dragging: {
      opacity: '0.7',
    }
  },
  onDragStart: (event) => {
    console.log('Drag started')
  },
  onDrag: (event) => {
    console.log('Dragging')
  },
  onDragEnd: (event) => {
    console.log('Drag ended')
  }
})
</script>

<template>
  <div ref="elementRef" class="draggable" :style="style">
    <div class="content">
      This entire card is draggable, but you can also use the handle
    </div>
    <div ref="handleRef" class="drag-handle">
      <span class="handle-icon">⋮⋮</span> Drag using this handle
    </div>
    <div v-if="isDragging" class="text-sm mt-1">
      Dragging...
    </div>
  </div>
</template>
```

:::

## Type and Options Declarations

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | Reference to the element to make draggable |
| `options` | `Partial<DragOptions>` | Configuration options for drag behavior |

### Return Values

| Name | Type | Description |
|------|------|-------------|
| `isDragging` | `Ref<boolean>` | Whether the element is currently being dragged |
| `style` | `Ref<Record<string, string>>` | Computed style object based on drag state, intended to be applied to the draggable element. |

### Options

The `DragOptions` interface provides a comprehensive set of configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dragId` | `string` | **required** | Unique identifier for the dragged item |
| `index` | `number` | **required** | Index of the item in its container |
| `type` | `string` | `'default'` | Type identifier for the dragged item |
| `dragPreview` | `{ element?: MaybeRefOrGetter<HTMLElement \| null>, offset?: { x: number, y: number }, scale?: number }` | `undefined` | Custom drag preview configuration |
| `handle` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | `undefined` | Element that triggers dragging (drag handle). Defaults to the target element itself. |
| `draggingElement` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| Window \| Document \| null \| undefined>` | `window` | Element to attach pointer event listeners to when using pointer-based drag mode. |
| `dragMode` | `DragMode` | `DragMode.Native` | Specifies the drag mode to use: 'native' for HTML5 Drag and Drop API, or 'pointer' for custom pointer-based implementation. |
| `delay` | `number` | `0` | Delay before drag starts in milliseconds. Applies to both native and pointer modes. |
| `delayOnTouchOnly` | `boolean` | `false` | Whether to only apply delay on touch devices. |
| `stateStyles` | `DragStateStyles` | `{ normal: { cursor: 'grab' }, dragging: { opacity: '0.5', cursor: 'grabbing' } }` | An object to define custom styles for the draggable element in different states (e.g., `normal`, `dragging`). |
| `onDragStart` | `(dragData: { dragId: string, index: number, type: string }, event: DragEvent \| PointerEvent) => void` | `undefined` | Called when drag starts. Receives `PointerEvent` if using pointer mode. |
| `onDrag` | `(dragData: { dragId: string, index: number, type: string }, event: DragEvent \| PointerEvent) => void` | `undefined` | Called during drag. Receives `PointerEvent` if using pointer mode. |
| `onDragEnd` | `(dragData: { dragId: string, index: number, type: string }, event: DragEvent \| PointerEvent) => void` | `undefined` | Called when drag ends. Receives `PointerEvent` if using pointer mode. |

### DragStateStyles

```typescript
interface DragStateStyles {
  /** Styles applied when the element is draggable but not actively being dragged */
  normal?: Partial<CSSStyleDeclaration>
  /** Styles applied when the element is actively being dragged */
  dragging?: Partial<CSSStyleDeclaration>
}
```

## Features

- HTML5 Drag and Drop API integration with optional pointer-based fallback
- Reliable data transfer across components and browsers
- Simple, type-safe ID-based drag data transfer
- Global drag state management via an internal store
- Customizable drag preview (native and pointer modes)
- Support for dedicated drag handles via the `handle` option
- Configurable event target for pointer events via `draggingElement` option
- Two drag modes: native HTML5 D&D and pointer-based implementation
- Customizable element styling for different drag states (`normal`, `dragging`)
- Sets `effectAllowed` on `DataTransfer` for native drags
- Improved touch device support via pointer-based drag mode
- Touch-specific delay configuration with `delayOnTouchOnly` option
- Accessibility support (e.g., `aria-grabbed` attribute management)
- Performance optimizations
- Configurable delay for initiating drag
- Graceful cleanup of side effects on unmount

## Browser Support

The hook uses the HTML5 Drag and Drop API, which is supported in all modern browsers. For older browsers, you may need to use a polyfill or fallback implementation.

## Related

- [useDrop](./use-drop.md) - Hook for creating drop zones
- [useDnR](./use-dnr.md) - Combined drag and resize functionality
