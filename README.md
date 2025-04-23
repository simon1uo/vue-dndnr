# Vue DNDNR

Vue DNDNR is a Vue 3 component library for draggable and resizable elements with TypeScript support.

## Features

- **Draggable**: Elements that can be moved around the screen
- **Resizable**: Elements that can be resized from different handles
- **Combined functionality**: Elements that can be both dragged and resized
- **TypeScript hooks**: Custom hooks for implementing drag-and-drop functionality
- **Customizable styling**: Support for custom styling and theming
- **Grid snapping**: Ability to snap elements to a grid
- **Bounds constraints**: Restrict movement and resizing within bounds
- **Touch support**: Support for touch devices
- **Accessibility**: Keyboard navigation and ARIA attributes

## Installation

```sh
pnpm add vue-dndnr
```

or

```sh
npm install vue-dndnr
```

or

```sh
yarn add vue-dndnr
```

## Usage

### Components

```vue
<script setup>
import { ref } from 'vue'
import { DnR, Draggable, Resizable } from 'vue-dndnr'

const position = ref({ x: 100, y: 100 })
const size = ref({ width: 200, height: 150 })
</script>

<template>
  <!-- Draggable component -->
  <Draggable v-model:position="position" bounds="parent">
    <div>Drag me!</div>
  </Draggable>

  <!-- Resizable component -->
  <Resizable v-model:size="size" :min-width="100" :min-height="100">
    <div>Resize me!</div>
  </Resizable>

  <!-- Combined Drag and Resize component -->
  <DnR v-model:position="position" v-model:size="size" bounds="parent">
    <div>Drag and resize me!</div>
  </DnR>
</template>
```

### Hooks

```vue
<script setup>
import { ref } from 'vue'
import { useDnR, useDraggable, useResizable } from 'vue-dndnr'

const elementRef = ref(null)

// Use the draggable hook
const { position, isDragging } = useDraggable(elementRef, {
  initialPosition: { x: 0, y: 0 },
  bounds: 'parent',
})

// Use the resizable hook
const { size, isResizing } = useResizable(elementRef, {
  initialSize: { width: 200, height: 150 },
  minWidth: 100,
  minHeight: 100,
})

// Use the combined hook
const { position, size, isDragging, isResizing } = useDnR(elementRef, {
  initialPosition: { x: 0, y: 0 },
  initialSize: { width: 200, height: 150 },
  bounds: 'parent',
})
</script>

<template>
  <div ref="elementRef" :style="{ left: `${position.x}px`, top: `${position.y}px` }">
    This element can be dragged and resized using hooks
  </div>
</template>
```

## Development

### Project Setup

```sh
pnpm install
```

### Build the Library

```sh
pnpm build
```

This will build the library and generate type declarations.

## Documentation

The documentation is built with VitePress and can be found in the `docs` directory.

### Running Documentation Locally

```sh
pnpm docs:dev
```

### Building Documentation

```sh
pnpm docs:build
```

## License

MIT
