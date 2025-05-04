# useDraggable

The `useDraggable` hook adds drag functionality to any element.

## Basic Usage Demo

<DemoContainer>
  <div ref="draggableRef" class="draggable-box" :style="style">
    Drag me!
    <span class="text-sm color-text-light">({{ position.x }}, {{ position.y }})</span>
  </div>
</DemoContainer>

<script setup>
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const draggableRef = ref(null)
const { style, position } = useDraggable(draggableRef, {
  initialPosition: { x: 0, y: 0 }
})
</script>

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDraggable } from 'vue-dndnr'

const draggableRef = ref<HTMLElement | null>(null)
const { style } = useDraggable(draggableRef, {
  initialPosition: { x: 0, y: 0 }
})
</script>

<template>
  <div ref="draggableRef" class="draggable-box" :style="style">
    Drag me!
    <div>
      {{ position.x }}, {{ position.y }}
    </div>
  </div>
</template>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | Reference to the element to make draggable. |
| `options` | `DraggableOptions` | Configuration options for the draggable behavior. |

### Options

#### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialPosition` | `Position` | `{ x: 0, y: 0 }` | Initial position of the element. |
| `handle` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | `target` | Element that triggers dragging (drag handle). |
| `draggingElement` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| Window \| Document \| null \| undefined>` | `window` | Element to attach pointer event listeners to. |
| `bounds` | `MaybeRefOrGetter<HTMLElement \| 'parent' \| { left: number, top: number, right: number, bottom: number } \| null \| undefined>` | `undefined` | Element or selector to use as bounds for the draggable element. |
| `grid` | `MaybeRefOrGetter<[number, number] \| undefined \| null>` | `undefined` | Grid size for snapping during drag. Format: `[x, y]`. |
| `axis` | `MaybeRefOrGetter<'x' \| 'y' \| 'both'>` | `'both'` | Axis to constrain dragging movement. |
| `scale` | `MaybeRefOrGetter<number>` | `1` | Scale factor for the draggable element. Useful when the element is within a transformed container. |
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | Whether dragging is disabled. |
| `initialActive` | `boolean` | `false` | Initial active state of the element. |
| `activeOn` | `MaybeRefOrGetter<'click' \| 'hover' \| 'none'>` | `'none'` | Determines how the element becomes active. Can be `'click'`, `'hover'`, or `'none'` (always active). |
| `preventDeactivation` | `MaybeRefOrGetter<boolean>` | `false` | When true, the element will stay active even when clicking outside or leaving the element. |

#### Event Control Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pointerTypes` | `MaybeRefOrGetter<PointerType[] \| null \| undefined>` | `['mouse', 'touch', 'pen']` | Types of pointer events to respond to. |
| `preventDefault` | `MaybeRefOrGetter<boolean>` | `true` | Whether to prevent default browser events. |
| `stopPropagation` | `MaybeRefOrGetter<boolean>` | `false` | Whether to stop event propagation to parent elements. |
| `capture` | `MaybeRefOrGetter<boolean>` | `true` | Whether to use event capturing phase. |
| `throttleDelay` | `MaybeRefOrGetter<number>` | `16` | Delay in milliseconds for throttling drag events (approximately 60fps). |

#### Callback Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onDragStart` | `(position: Position, event: PointerEvent) => void \| boolean` | `undefined` | Called when dragging starts. Return `false` to prevent dragging. |
| `onDrag` | `(position: Position, event: PointerEvent) => void \| boolean` | `undefined` | Called during dragging. Return `false` to stop dragging. |
| `onDragEnd` | `(position: Position, event: PointerEvent) => void \| boolean` | `undefined` | Called when dragging ends. Return `false` to prevent position update. |
| `onActiveChange` | `(active: boolean) => void \| boolean` | `undefined` | Called when the active state changes. Return `false` to prevent active state change. |

## Return Value

The `useDraggable` hook returns an object with the following properties and methods:

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `position` | `Ref<Position>` | Current position of the element. |
| `isDragging` | `Ref<boolean>` | Whether the element is currently being dragged. |
| `isActive` | `Ref<boolean>` | Whether the element is currently active. |
| `style` | `ComputedRef<CSSProperties>` | Computed style object for positioning the element. |
| `setPosition` | `(newPosition: Position) => void` | Function to programmatically set the position. |
| `setActive` | `(active: boolean) => void` | Function to programmatically set the active state. |
| `onDragStart` | `(event: PointerEvent) => void` | Handler for drag start event. |
| `onDrag` | `(event: PointerEvent) => void` | Handler for drag event. |
| `onDragEnd` | `(event: PointerEvent) => void` | Handler for drag end event. |

::: details Show Type Definitions

```typescript
interface Position {
  /** The horizontal coordinate */
  x: number
  /** The vertical coordinate */
  y: number
}

type PointerType = 'mouse' | 'touch' | 'pen'
```
:::
