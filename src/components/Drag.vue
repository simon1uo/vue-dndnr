<script setup lang="ts">
import type { DragOptions } from '@/types/dnd'
import { useDrag } from '@/hooks'
import { DragMode } from '@/types/dnd'
import { computed, ref, toValue, useSlots } from 'vue'

interface DragProps extends DragOptions {
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
  type: 'default',
  draggingClassName: 'dragging',
  dragMode: DragMode.Native,
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

// Resolve the drag type from props
const resolvedType = computed(() => props.type)

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
  dragId: props.dragId,
  index: props.index,
  type: resolvedType.value,
  dragPreview: dragPreview.value,
  handle: props.handle,
  draggingElement: props.draggingElement,
  dragMode: props.dragMode,
  delay: props.delay,
  delayOnTouchOnly: props.delayOnTouchOnly,
  stateStyles: props.stateStyles,

  onDragStart: (dragData, event) => {
    emit('dragStart', event)
    if (props.onDragStart) {
      props.onDragStart(dragData, event)
    }
  },
  onDrag: (dragData, event) => {
    emit('drag', event)
    if (props.onDrag) {
      props.onDrag(dragData, event)
    }
  },
  onDragEnd: (dragData, event) => {
    emit('dragEnd', event)
    if (props.onDragEnd) {
      props.onDragEnd(dragData, event)
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
