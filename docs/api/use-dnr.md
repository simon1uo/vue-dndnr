# useDnR

The `useDnR` hook combines both drag and resize functionality into a single composable hook, allowing you to create elements that can be both moved and resized.

## Demo

<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const { position, size, style, active } = useDnR(elementRef, {
  initialPosition: { x: 0, y: 0 },
  initialSize: { width: 200, height: 150 },
  minWidth: 200,
  minHeight: 150
})
</script>

<DemoContainer>
  <div
    ref="elementRef"
    :style="style"
    class="bg-slate dark:bg-slate-700 text-sm text-white p-4 rounded-xl shadow-xl cursor-move"
  >
    👋 Drag & ↔️ Resize me!
    <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
    <div class="text-sm mt-1">Size: {{ size.width }} x {{ size.height }}</div>
  </div>
</DemoContainer>

:::details Hook Usage

```vue
<script setup>
import { ref } from 'vue'
import { useDnR } from 'vue-dndnr'

const elementRef = ref(null)
const { position, size, style } = useDnR(elementRef, {
  initialPosition: { x: 50, y: 50 },
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100
})
</script>

<template>
  <div ref="elementRef" :style="style">
    Drag & Resize me!
    <div>Position: {{ position.x }}, {{ position.y }}</div>
    <div>Size: {{ size.width }} x {{ size.height }}</div>
  </div>
</template>
```
:::

:::details Component Usage

The `DnR` component provides a convenient wrapper around the `useDnR` hook, making it easier to create draggable and resizable elements without manually setting up refs and styles.

```vue
<script setup>
import { ref } from 'vue'
import { DnR } from 'vue-dndnr'

const position = ref({ x: 50, y: 50 })
const size = ref({ width: 200, height: 150 })
</script>

<template>
  <DnR v-model:position="position" v-model:size="size" :min-width="100" :min-height="100">
    <div :style="{ width: `${size.width}px`, height: `${size.height}px` }">
      Drag and resize me!
      <div>Position: {{ position.x }}, {{ position.y }}</div>
      <div>Size: {{ size.width }} x {{ size.height }}</div>
    </div>
  </DnR>
</template>
```
:::

## Type and Options Declarations

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | Reference to the element to make draggable and resizable |
| `options` | `DnROptions` | Configuration options for the draggable and resizable behavior |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `position` | `Ref<Position>` | Current position of the element |
| `size` | `Ref<Size>` | Current size of the element |
| `style` | `ComputedRef<CSSProperties>` | Computed CSS style object to apply to the element |
| `isDragging` | `Ref<boolean>` | Whether the element is currently being dragged |
| `isResizing` | `Ref<boolean>` | Whether the element is currently being resized |
| `isActive` | `Ref<boolean>` | Whether the element is currently active |
| `interactionMode` | `Ref<'idle' \| 'dragging' \| 'resizing'>` | Current interaction mode |
| `activeHandle` | `Ref<ResizeHandle \| null>` | Currently active resize handle |
| `hoverHandle` | `Ref<ResizeHandle \| null>` | Resize handle currently being hovered |
| `setPosition` | `(position: Position) => void` | Function to programmatically set the position |
| `setSize` | `(size: Size) => void` | Function to programmatically set the size |
| `setActive` | `(active: boolean) => void` | Function to programmatically set the active state |
| `registerHandle` | `(handle: ResizeHandle, element: HTMLElement) => void` | Register a custom resize handle |
| `unregisterHandle` | `(handle: ResizeHandle) => void` | Unregister a custom resize handle |

### Options

The `DnROptions` interface provides a comprehensive set of configuration options:

#### Common Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialPosition` | `Position` | `{ x: 0, y: 0 }` | Initial position of the element |
| `initialSize` | `Size` | `{ width: 'auto', height: 'auto' }` | Initial size of the element |
| `disabled` | `MaybeRefOrGetter<boolean>` | `false` | Whether all interactions are disabled |
| `disableDrag` | `MaybeRefOrGetter<boolean>` | `false` | Whether dragging is disabled |
| `disableResize` | `MaybeRefOrGetter<boolean>` | `false` | Whether resizing is disabled |
| `pointerTypes` | `MaybeRefOrGetter<PointerType[]>` | `['mouse', 'touch', 'pen']` | Types of pointer events to respond to |
| `preventDefault` | `MaybeRefOrGetter<boolean>` | `true` | Whether to prevent default browser events |
| `stopPropagation` | `MaybeRefOrGetter<boolean>` | `false` | Whether to stop event propagation |
| `capture` | `MaybeRefOrGetter<boolean>` | `true` | Whether to use event capturing phase |
| `initialActive` | `boolean` | `false` | Initial active state |
| `activeOn` | `MaybeRefOrGetter<ActivationTrigger>` | `'none'` | How the element becomes active |
| `preventDeactivation` | `MaybeRefOrGetter<boolean>` | `false` | Prevent deactivation when clicking outside |
| `throttleDelay` | `number` | `16` | Delay in ms for throttling move events |

#### Drag Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `handle` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | `target` | Element that triggers dragging |
| `containerElement` | `MaybeRefOrGetter<HTMLElement \| SVGElement \| null \| undefined>` | `undefined` | Element for calculating bounds |
| `grid` | `MaybeRefOrGetter<[number, number] \| undefined \| null>` | `undefined` | Grid size for snapping |
| `axis` | `MaybeRefOrGetter<'x' \| 'y' \| 'both'>` | `'both'` | Axis to constrain movement |
| `scale` | `MaybeRefOrGetter<number>` | `1` | Scale factor for the element |

#### Resize Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `positionType` | `MaybeRefOrGetter<'absolute' \| 'relative'>` | `'absolute'` | CSS position type |
| `minWidth` | `MaybeRefOrGetter<number>` | `undefined` | Minimum width constraint |
| `minHeight` | `MaybeRefOrGetter<number>` | `undefined` | Minimum height constraint |
| `maxWidth` | `MaybeRefOrGetter<number>` | `undefined` | Maximum width constraint |
| `maxHeight` | `MaybeRefOrGetter<number>` | `undefined` | Maximum height constraint |
| `lockAspectRatio` | `MaybeRefOrGetter<boolean>` | `false` | Maintain aspect ratio during resize |
| `handleType` | `MaybeRefOrGetter<ResizeHandleType>` | `'borders'` | Type of resize handles |
| `handles` | `MaybeRefOrGetter<ResizeHandle[]>` | `['t', 'b', 'r', 'l', 'tr', 'tl', 'br', 'bl']` | Active resize handles |
| `customHandles` | `MaybeRefOrGetter<Map<ResizeHandle, HTMLElement> \| null \| undefined>` | `undefined` | Custom handle elements |
| `handlesSize` | `MaybeRefOrGetter<number>` | `8` | Size of handles in pixels |
| `handleBorderStyle` | `MaybeRefOrGetter<string>` | `'none'` | Border style for handles |

#### Callback Options

| Option | Type | Description |
|--------|------|-------------|
| `onDragStart` | `(position: Position, event: PointerEvent) => void` | Called when dragging starts |
| `onDrag` | `(position: Position, event: PointerEvent) => void` | Called during dragging |
| `onDragEnd` | `(position: Position, event: PointerEvent) => void` | Called when dragging ends |
| `onResizeStart` | `(size: Size, event: PointerEvent, handle: ResizeHandle) => void` | Called when resizing starts |
| `onResize` | `(size: Size, event: PointerEvent, handle: ResizeHandle) => void` | Called during resizing |
| `onResizeEnd` | `(size: Size, event: PointerEvent, handle: ResizeHandle) => void` | Called when resizing ends |
| `onActiveChange` | `(active: boolean) => boolean` | Called when active state changes |

### Component Props

The `DnR` component accepts all options from the `useDnR` hook as props, plus the following:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `Position` | `undefined` | Current position of the element. Can be bound with `v-model:position`. |
| `size` | `Size` | `undefined` | Current size of the element. Can be bound with `v-model:size`. |
| `active` | `boolean` | `undefined` | Whether the element is currently active. Can be bound with `v-model:active`. |
| `className` | `string` | `undefined` | CSS class to apply to the wrapper element. |
| `draggingClassName` | `string` | `undefined` | CSS class to apply when dragging. |
| `resizingClassName` | `string` | `undefined` | CSS class to apply when resizing. |
| `activeClassName` | `string` | `undefined` | CSS class to apply when active. |

### Component Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:position` | `Position` | Emitted when position changes. Used for `v-model:position` binding. |
| `update:size` | `Size` | Emitted when size changes. Used for `v-model:size` binding. |
| `update:active` | `boolean` | Emitted when active state changes. Used for `v-model:active` binding. |
| `activeChange` | `boolean` | Emitted when active state changes. |
| `dragStart` | `position: Position, event: PointerEvent` | Emitted when dragging starts. |
| `drag` | `position: Position, event: PointerEvent` | Emitted during dragging. |
| `dragEnd` | `position: Position, event: PointerEvent` | Emitted when dragging ends. |
| `resizeStart` | `size: Size, event: PointerEvent, handle: ResizeHandle` | Emitted when resizing starts. |
| `resize` | `size: Size, event: PointerEvent, handle: ResizeHandle` | Emitted during resizing. |
| `resizeEnd` | `size: Size, event: PointerEvent, handle: ResizeHandle` | Emitted when resizing ends. |

### Component Slots

| Slot | Props | Description |
|------|-------|-------------|
| default | `{ position, size, isDragging, isResizing, isActive, activeHandle, hoverHandle, style }` | The content to be made draggable and resizable. |
| handle-[position] | `{ active, hover, isResizing, cursor, size }` | Custom resize handle for the specified position (e.g., `handle-br` for bottom-right). Only used when `handleType="custom"`. |
