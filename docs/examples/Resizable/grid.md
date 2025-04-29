# Grid Resizing

This example demonstrates how to make a resizable element snap to a grid while being resized.

## Live Demo

<script setup>
import { shallowRef } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = shallowRef({ width: 200, height: 160 })
</script>

<DemoContainer title="Grid Resizing Example">
  <div class="relative bg-gray-100 w-full h-64 rounded-lg overflow-hidden grid-background">
    <Resizable v-model:size="size" :grid="[20, 20]">
      <div class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Resize me along the grid!
        <div class="text-sm mt-2">Size: {{ size.width }} x {{ size.height }}</div>
        <div class="text-xs mt-1">Grid: 20x20</div>
      </div>
    </Resizable>
  </div>
</DemoContainer>

<style>
.grid-background {
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>

## Code Example

```vue
<script setup>
import { ref } from 'vue'
import { Resizable } from 'vue-dndnr'

const size = ref({ width: 200, height: 160 })
</script>

<template>
  <div class="grid-container">
    <Resizable v-model:size="size" :grid="[20, 20]">
      <div class="resizable-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Resize me along the grid!
        <div>Size: {{ size.width }} x {{ size.height }}</div>
        <div class="grid-info">
          Grid: 20x20
        </div>
      </div>
    </Resizable>
  </div>
</template>

<style scoped>
.grid-container {
  position: relative;
  background-color: #f8f9fa;
  width: 100%;
  height: 16rem;
  border-radius: 0.5rem;
  overflow: hidden;
  /* Grid background */
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.resizable-element {
  background-color: #3498db;
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.grid-info {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
```

## Grid Configuration

The `grid` prop takes an array of two numbers representing the x and y grid spacing in pixels:

```vue
<Resizable v-model:size="size" :grid="[20, 20]">
  <!-- Your content -->
</Resizable>
```

In this example, the element will snap to a 20x20 pixel grid.

### Different X and Y Grid Spacing

You can set different grid spacing for the width and height:

```vue
<Resizable v-model:size="size" :grid="[50, 25]">
  <!-- Your content -->
</Resizable>
```

This will create a grid with 50px horizontal spacing and 25px vertical spacing.

## Combining with Other Props

You can combine grid snapping with other features:

### With Size Constraints

```vue
<Resizable
  v-model:size="size"
  :grid="[20, 20]"
  :min-width="100"
  :min-height="100"
  :max-width="400"
  :max-height="300"
>
  <!-- Your content -->
</Resizable>
```

This will make the element snap to the grid while also respecting the size constraints.

### With Aspect Ratio Lock

```vue
<Resizable
  v-model:size="size"
  :grid="[20, 20]"
  :lock-aspect-ratio="true"
>
  <!-- Your content -->
</Resizable>
```

When combining grid snapping with aspect ratio locking, the component will try to maintain the aspect ratio while also snapping to the grid. This might result in slight deviations from the exact aspect ratio to accommodate the grid.

### With Custom Handles

```vue
<Resizable
  v-model:size="size"
  :grid="[20, 20]"
  :handles="['br', 'tr', 'bl', 'tl']"
>
  <!-- Your content -->
</Resizable>
```

This will make the element snap to the grid while only allowing resizing from the corners.

## Use Cases

Grid snapping is particularly useful for:

1. **Layout Builders**: When users need to align elements precisely
2. **Design Tools**: For precise sizing of elements
3. **Tile-Based Interfaces**: For elements that should align to a tile grid
4. **Data Visualization**: For charts or graphs that need precise sizing

## Tips

- Choose a grid size that makes sense for your application's needs
- Consider adding a visual grid background to help users understand the snapping behavior
- The size values will always be multiples of the grid spacing
- For finer control, use smaller grid values
- When combined with aspect ratio locking, the grid takes precedence
