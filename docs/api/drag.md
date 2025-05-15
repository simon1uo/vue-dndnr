# Drag

The `Drag` component provides a convenient wrapper around the `useDrag` hook, making it easier to create draggable elements using the HTML5 Drag and Drop API. It allows you to make any element draggable with customizable drag preview, constraints, and effects.

## Demo

<script setup>
import { ref } from 'vue'
import { Drag } from 'vue-dndnr'

const dragData = ref({
  type: 'demo',
  payload: { message: 'Hello from drag item!' }
})

const isDragging = ref(false)
const dragEffect = ref(null)

const handleDragStart = (event) => {
  console.log('Demo drag started')
}

const handleDragEnd = (event) => {
  console.log('Demo drag ended')
}
</script>

<DemoContainer>
  <Drag
    :data="dragData"
    @dragStart="handleDragStart"
    @dragEnd="handleDragEnd"
    @update:isDragging="isDragging = $event"
    @update:dragEffect="dragEffect = $event"
  >
    <div class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl cursor-move w-xs" :class="{ 'opacity-50': isDragging }">
      👋 Drag me!
      <div class="text-sm mt-2">Drag State: {{ isDragging ? 'Dragging' : 'Idle' }}</div>
      <div v-if="dragEffect" class="text-sm mt-1">
        Effect: {{ dragEffect }}
      </div>
    </div>

    <template #dragPreview>
      <div class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl cursor-move w-xs">
        👋 Custom Preview!
      </div>
    </template>
  </Drag>
</DemoContainer>

:::details Component Usage

```vue
<script setup>
import { ref } from 'vue'
import { Drag } from 'vue-dndnr'

const dragData = ref({
  type: 'item',
  payload: { id: 1, name: 'Draggable Item' }
})

const isDragging = ref(false)
const dragEffect = ref(null)
</script>

<template>
  <Drag
    :data="dragData"
    @drag-start="handleDragStart"
    @drag-end="handleDragEnd"
    @update:is-dragging="isDragging = $event"
    @update:drag-effect="dragEffect = $event"
  >
    <div :class="{ dragging: isDragging }">
      Drag me!
      <div>State: {{ isDragging ? 'Dragging' : 'Idle' }}</div>
      <div v-if="dragEffect">
        Effect: {{ dragEffect }}
      </div>
    </div>

    <!-- Optional custom drag preview -->
    <template #dragPreview>
      <div class="custom-preview">
        Custom Drag Preview
      </div>
    </template>
  </Drag>
</template>
```
:::

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DragData<T>` | `{ type: 'default', payload: null }` | The data to be dragged |
| `dragPreview` | `DragPreview` | `undefined` | Custom drag preview configuration (used when `dragPreview` slot is not provided) |
| `className` | `string` | `undefined` | CSS class name for the component |
| `draggingClassName` | `string` | `'dragging'` | CSS class name applied when dragging |

## Events

| Event | Type | Description |
|-------|------|-------------|
| `dragStart` | `(event: DragEvent) => void` | Emitted when drag starts |
| `drag` | `(event: DragEvent) => void` | Emitted during drag |
| `dragEnd` | `(event: DragEvent) => void` | Emitted when drag ends |
| `update:dragData` | `(data: DragData \| null) => void` | Emitted when drag data changes |
| `update:dragEffect` | `(effect: DragEffect \| null) => void` | Emitted when drag effect changes |
| `update:position` | `(position: Position \| null) => void` | Emitted when position changes |
| `update:isDragging` | `(isDragging: boolean) => void` | Emitted when dragging state changes |

## Slots

| Slot | Description |
|------|-------------|
| `default` | The content to be made draggable |
| `dragPreview` | Custom drag preview content that will be shown during dragging |

## DragData Type

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

## DragPreview Type

```typescript
interface DragPreview {
  /**
   * Custom element to use as drag preview
   */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>

  /**
   * Offset from the cursor position
   */
  offset?: {
    x: number
    y: number
  }

  /**
   * Scale factor for the preview
   */
  scale?: number
}
```

## Related

- [useDrag](./use-drag.md) - Hook for creating draggable elements
- [Drop](./drop.md) - Component for creating drop zones
- [useDrop](./use-drop.md) - Hook for creating drop zones
