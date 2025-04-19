<script setup lang="ts">
import { useDraggable } from '../../hooks'

const { position, isDragging, elementRef } = useDraggable({
  initialPosition: { x: 50, y: 50 },
  bounds: 'parent',
})
</script>

<template>
  <div class="draggable-container">
    <div
      ref="elementRef"
      class="draggable-box"
      :class="{ 'is-dragging': isDragging }"
      :style="{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }"
    >
      <div class="draggable-content">
        <slot>Drag me!</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.draggable-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 1px solid #ddd;
  overflow: hidden;
}

.draggable-box {
  position: absolute;
  padding: 20px;
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: move;
  user-select: none;
  transition: box-shadow 0.2s ease;
}

.draggable-box.is-dragging {
  background-color: #f0f0f0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.draggable-content {
  min-width: 100px;
  min-height: 50px;
}
</style>
