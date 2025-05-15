<script setup lang="ts">
import type { DragOptions } from '@/types/dnd'
import { useDrag } from '@/hooks'
import { computed, ref, toValue, useSlots } from 'vue'

interface DragProps<T = unknown> extends Partial<DragOptions<T>> {
  /**
   * CSS class name for the component
   */
  className?: string

  /**
   * CSS class name applied when dragging
   * @default 'dragging'
   */
  draggingClassName?: string
}

const props = withDefaults(defineProps<DragProps>(), {
  data: () => ({ type: 'default', payload: null as unknown }),
  draggingClassName: 'dragging',
})

const emit = defineEmits<{
  /**
   * Emitted when drag starts
   */
  (e: 'dragStart', event: DragEvent | PointerEvent): void

  /**
   * Emitted during drag
   */
  (e: 'drag', event: DragEvent | PointerEvent): void

  /**
   * Emitted when drag ends
   */
  (e: 'dragEnd', event: DragEvent | PointerEvent): void
}>()

// Element references
const targetRef = ref<HTMLElement | null>(null)
const previewRef = ref<HTMLElement | null>(null)

// Check if dragPreview slot is provided
const slots = useSlots()
const hasDragPreviewSlot = computed(() => !!slots.dragPreview)

// Create dragPreview configuration based on slot or props
const dragPreview = computed(() => {
  // If dragPreview slot is provided, use the previewRef as the element
  if (hasDragPreviewSlot.value) {
    return {
      element: previewRef,
      offset: toValue(props.dragPreview)?.offset || { x: 0, y: 0 },
      scale: toValue(props.dragPreview)?.scale || 1,
    }
  }
  // Otherwise, use the dragPreview from props
  return toValue(props.dragPreview)
})

// Use the drag hook
const {
  isDragging,
} = useDrag(targetRef, {
  ...props,
  dragPreview,
  onDragStart: (event: DragEvent | PointerEvent) => {
    emit('dragStart', event)
    if (props.onDragStart) {
      props.onDragStart(event)
    }
  },
  onDrag: (event: DragEvent | PointerEvent) => {
    emit('drag', event)
    if (props.onDrag) {
      props.onDrag(event)
    }
  },
  onDragEnd: (event: DragEvent | PointerEvent) => {
    emit('dragEnd', event)
    if (props.onDragEnd) {
      props.onDragEnd(event)
    }
  },
})

// Combine CSS classes
const combinedClass = computed(() => {
  const classes = ['drag']

  if (props.className) {
    classes.push(props.className)
  }

  if (isDragging.value && props.draggingClassName) {
    classes.push(props.draggingClassName)
  }

  return classes.join(' ')
})
</script>

<template>
  <div ref="targetRef" :class="combinedClass">
    <slot />
  </div>

  <!-- Hidden container for drag preview slot -->
  <div
    v-if="hasDragPreviewSlot" ref="previewRef"
    style="position: absolute; left: -9999px; top: -9999px; pointer-events: none;"
  >
    <slot name="dragPreview" />
  </div>
</template>

<style scoped>
.drag {
  touch-action: none;
  user-select: none;
}
</style>
