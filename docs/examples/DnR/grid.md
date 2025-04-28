# Grid Alignment DnR

This example demonstrates how to make a DnR element snap to a grid while being dragged and resized.

## Live Demo

<script setup>
import { shallowRef } from 'vue'
import { DnR } from 'vue-dndnr'

const position = shallowRef({ x: 60, y: 60 })
const size = shallowRef({ width: 200, height: 160 })
</script>

<DemoContainer title="Grid Alignment DnR Example">
  <div class="relative bg-gray-100 w-full h-64 rounded-lg overflow-hidden grid-background">
    <DnR v-model:position="position" v-model:size="size" :grid="[20, 20]">
      <div class="bg-blue-500 text-white p-4 rounded shadow-md flex flex-col justify-center items-center" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Drag and resize along the grid!
        <div class="text-sm mt-2">Position: {{ position.x }}, {{ position.y }}</div>
        <div class="text-sm mt-1">Size: {{ size.width }} x {{ size.height }}</div>
        <div class="text-xs mt-1">Grid: 20x20</div>
      </div>
    </DnR>
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
import { DnR } from 'vue-dndnr'

const position = ref({ x: 60, y: 60 })
const size = ref({ width: 200, height: 160 })
</script>

<template>
  <div class="grid-container">
    <DnR v-model:position="position" v-model:size="size" :grid="[20, 20]">
      <div class="dnr-element" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
        Drag and resize along the grid!
        <div>Position: {{ position.x }}, {{ position.y }}</div>
        <div>Size: {{ size.width }} x {{ size.height }}</div>
        <div class="grid-info">Grid: 20x20</div>
      </div>
    </DnR>
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

.dnr-element {
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
<DnR v-model:position="position" v-model:size="size" :grid="[20, 20]">
  <!-- Your content -->
</DnR>
```

In this example, both the position and size will snap to a 20x20 pixel grid.

### Different X and Y Grid Spacing

You can set different grid spacing for the horizontal and vertical directions:

```vue
<DnR v-model:position="position" v-model:size="size" :grid="[50, 25]">
  <!-- Your content -->
</DnR>
```

This will create a grid with 50px horizontal spacing and 25px vertical spacing.

## How Grid Snapping Works

When grid snapping is enabled:

1. **Position Snapping**: When dragging, the element's position will snap to the nearest grid point
2. **Size Snapping**: When resizing, the element's width and height will snap to multiples of the grid spacing

This ensures that both the position and size of the element align perfectly with the grid.

## Combining with Other Props

You can combine grid snapping with other features:

### With Bounds Constraints

```vue
<DnR 
  v-model:position="position" 
  v-model:size="size" 
  :grid="[20, 20]"
  bounds="parent"
>
  <!-- Your content -->
</DnR>
```

This will make the element snap to the grid while also being constrained within its parent container.

### With Size Constraints

```vue
<DnR 
  v-model:position="position" 
  v-model:size="size" 
  :grid="[20, 20]"
  :min-width="100"
  :min-height="100"
  :max-width="400"
  :max-height="300"
>
  <!-- Your content -->
</DnR>
```

This will make the element snap to the grid while also respecting the size constraints.

### With Aspect Ratio Lock

```vue
<DnR 
  v-model:position="position" 
  v-model:size="size" 
  :grid="[20, 20]"
  :lock-aspect-ratio="true"
>
  <!-- Your content -->
</DnR>
```

When combining grid snapping with aspect ratio locking, the component will try to maintain the aspect ratio while also snapping to the grid. This might result in slight deviations from the exact aspect ratio to accommodate the grid.

## Use Cases

Grid alignment is particularly useful for:

1. **Layout Builders**: When users need to align elements precisely
2. **Dashboard Widgets**: For organized widget layouts
3. **Design Tools**: For precise positioning and sizing of elements
4. **Tile-Based Interfaces**: For elements that should align to a tile grid
5. **Floor Plans**: For architectural or space planning applications

## Tips

- Choose a grid size that makes sense for your application's needs
- Add a visual grid background to help users understand the snapping behavior
- The position and size values will always be multiples of the grid spacing
- For finer control, use smaller grid values
- Consider making the grid size configurable by the user for different precision needs
