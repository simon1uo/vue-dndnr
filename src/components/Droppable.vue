<script setup lang="ts">
import type { DroppableOptions } from '../types'
import { computed } from 'vue'
import { useDroppable } from '../hooks'

// Define props
const props = defineProps<{
  /**
   * Selector or function to determine which draggable elements can be dropped
   */
  accept?: string | ((draggedElement: HTMLElement) => boolean)

  /**
   * Whether the droppable is disabled
   */
  disabled?: boolean

  /**
   * Whether the droppable should prevent event propagation to nested droppables
   */
  greedy?: boolean

  /**
   * CSS class to apply to the droppable element
   */
  class?: string

  /**
   * CSS style to apply to the droppable element
   */
  style?: Record<string, string>
}>()

// Define emits
const emit = defineEmits<{
  /**
   * Emitted when a draggable enters the droppable
   */
  (e: 'dropEnter', event: DragEvent): void

  /**
   * Emitted when a draggable is over the droppable
   */
  (e: 'dropOver', event: DragEvent): void

  /**
   * Emitted when a draggable leaves the droppable
   */
  (e: 'dropLeave', event: DragEvent): void

  /**
   * Emitted when a draggable is dropped on the droppable
   */
  (e: 'drop', event: DragEvent): void
}>()

// Create options for useDroppable
const options = computed<DroppableOptions>(() => ({
  accept: props.accept,
  disabled: props.disabled,
  greedy: props.greedy,
}))

// Use the droppable hook
const { isOver, elementRef } = useDroppable(options.value)

// Custom event handlers
function onDropEnter(event: DragEvent) {
  emit('dropEnter', event)
}

function onDropOver(event: DragEvent) {
  emit('dropOver', event)
}

function onDropLeave(event: DragEvent) {
  emit('dropLeave', event)
}

function onDrop(event: DragEvent) {
  emit('drop', event)
}

// Computed styles
const droppableStyle = computed(() => {
  return {
    position: 'relative',
    ...props.style,
  }
})

// Computed classes
const droppableClass = computed(() => {
  return {
    'vue-droppable': true,
    'vue-droppable--active': isOver.value,
    ...(props.class ? { [props.class]: true } : {}),
  }
})
</script>

<template>
  <div
    ref="elementRef"
    :class="droppableClass"
    :style="droppableStyle"
    @dragenter="onDropEnter"
    @dragover="onDropOver"
    @dragleave="onDropLeave"
    @drop="onDrop"
  >
    <slot />
  </div>
</template>

<style scoped>
.vue-droppable {
  min-height: 20px;
  min-width: 20px;
}

.vue-droppable--active {
  outline: 2px dashed #4299e1;
  background-color: rgba(66, 153, 225, 0.1);
}
</style>
