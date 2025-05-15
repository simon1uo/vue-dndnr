# useDrag

The `useDrag` hook provides drag functionality for elements using the HTML5 Drag and Drop API. It allows you to make any element draggable with customizable drag preview, constraints, and effects. The hook uses an optimized data transfer mechanism that works reliably across different browsers and components.

## Demo

<script setup>
import { ref } from 'vue'
import { useDrag } from 'vue-dndnr'

const elementRef = ref(null)
const customDragRef = ref(null)

const { isDragging, dragData, style } = useDrag(elementRef, {
  data: {
    type: 'demo',
    payload: { message: 'Hello from drag item!' }
  },
  dragPreview: {
    element: customDragRef,
    offset: { x: 10, y: 10 }
  },
  stateStyles: {
    dragging: {
      opacity: '0.7',
      transform: 'scale(1.05)',
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
    👋 Drag me!
    <div class="text-sm mt-2">Drag State: {{ isDragging ? 'Dragging' : 'Idle' }}</div>
  </div>

  <div
    ref="customDragRef"
    class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl w-xs"
    style="position: absolute; left: -9999px; top: -9999px;"
  > 👋 Dragging!</div>
</DemoContainer>

:::details Hook Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDrag } from 'vue-dndnr'

const elementRef = ref<HTMLElement | null>(null)
const { isDragging, dragData, style } = useDrag(elementRef, {
  data: () => ({
    type: 'text',
    payload: 'Hello World'
  }),
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
  <div ref="elementRef" class="draggable">
    Drag me!
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
| `options` | `Partial<DragOptions<T>>` | Configuration options for drag behavior |

### Return Values

| Name | Type | Description |
|------|------|-------------|
| `isDragging` | `Ref<boolean>` | Whether the element is currently being dragged |
| `dragData` | `Ref<DragData \| null>` | Current drag data |
| `style` | `Ref<Record<string, string>>` | Computed style object based on drag state, intended to be applied to the draggable element. |

### Options

The `DragOptions` interface provides a comprehensive set of configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | `MaybeRefOrGetter<DragData<T>>` | `{ type: 'default', payload: null }` | The data to be dragged |
| `dragPreview` | `{ element?: MaybeRefOrGetter<HTMLElement \| null>, offset?: { x: number, y: number }, scale?: number }` | `undefined` | Custom drag preview configuration |
| `forceFallback` | `boolean` | `false` | If `true`, forces the use of pointer events for dragging, bypassing native HTML5 drag and drop. Useful for touch devices or specific interaction needs. |
| `fallbackClass` | `string` | `'dndnr-fallback'` | CSS class applied to the fallback drag preview element when `forceFallback` is `true` or when native drag fails. |
| `fallbackOnBody` | `boolean` | `true` | If `true` (and using fallback mode), the fallback drag preview is appended to `document.body`. If `false`, it's appended to the draggable element's parent. |
| `fallbackTolerance` | `number` | `0` | In fallback mode, the distance in pixels the pointer must move before a drag operation is initiated. |
| `delay` | `number` | `0` | Delay before drag starts in milliseconds. Applies to both native and fallback modes. |
| `onDragStart` | `(event: DragEvent \| PointerEvent) => void` | `undefined` | Called when drag starts. Receives `PointerEvent` if fallback mode is active. |
| `onDrag` | `(event: DragEvent \| PointerEvent) => void` | `undefined` | Called during drag. Receives `PointerEvent` if fallback mode is active. |
| `onDragEnd` | `(event: DragEvent \| PointerEvent) => void` | `undefined` | Called when drag ends. Receives `PointerEvent` if fallback mode is active. |
| `stateStyles` | `DragStateStyles` | `{ normal: { cursor: 'grab' }, dragging: { opacity: '0.5', cursor: 'grabbing' } }` | An object to define custom styles for the draggable element in different states (e.g., `normal`, `dragging`). |

### DragStateStyles

```typescript
interface DragStateStyles {
  /** Styles applied when the element is draggable but not actively being dragged */
  normal?: Partial<CSSStyleDeclaration>
  /** Styles applied when the element is actively being dragged */
  dragging?: Partial<CSSStyleDeclaration>
}
```

### DragData

The `DragData` interface defines the structure of the data being dragged:

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

### Position and DragEffect

The hook uses these types for position and effect:

```typescript
/**
 * Position type for drag and drop operations
 */
export interface Position {
  x: number
  y: number
}

/**
 * Drag effect type
 */
export type DragEffect = 'none' | 'copy' | 'link' | 'move'
```

## Features

- HTML5 Drag and Drop API integration
- Reliable data transfer across components and browsers
- Multiple data format support (JSON, text, URL, HTML, Files)
- Global drag state management via an internal store
- Customizable drag preview (native and fallback)
- Pointer Events fallback mode for wider compatibility (e.g., touch devices or when native HTML5 D&D is not desired).
- Customizable element styling for different drag states (`normal`, `dragging`).
- Sets `effectAllowed` on `DataTransfer` for native drags.
- Improved touch device support via Pointer Events fallback mode.
- Accessibility support (e.g., `aria-grabbed` attribute management)
- Performance optimizations
- Configurable delay for initiating drag
- Graceful cleanup of side effects on unmount

## Browser Support

The hook uses the HTML5 Drag and Drop API, which is supported in all modern browsers. For older browsers, you may need to use a polyfill or fallback implementation.

## Related

- [Drag](./drag.md) - Component wrapper for useDrag
- [useDrop](./use-drop.md) - Hook for creating drop zones
- [useDnR](./use-dnr.md) - Combined drag and resize functionality
