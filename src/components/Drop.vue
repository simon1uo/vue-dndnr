<script setup lang="ts">
import type { DropItemData, DropOptions } from '@/types/dnd'
import { useDrop } from '@/hooks'
import { computed, ref } from 'vue'

interface DropProps extends Partial<Omit<DropOptions, 'dropId'>> {
  /**
   * Unique identifier for the drop zone
   */
  dropId: string

  /**
   * CSS class name for the component
   */
  className?: string

  /**
   * CSS class name applied when an item is over the drop zone
   * @default 'over'
   */
  overClassName?: string

  /**
   * CSS class name applied when a valid drop is possible
   * @default 'valid'
   */
  validClassName?: string

  /**
   * CSS class name applied when an invalid drop is detected
   * @default 'invalid'
   */
  invalidClassName?: string
}

const props = withDefaults(defineProps<DropProps>(), {
  dropEffect: 'move',
  overClassName: 'over',
  validClassName: 'valid',
  invalidClassName: 'invalid',
})

const emit = defineEmits<{
  /**
   * Emitted when a draggable enters the drop zone
   */
  (e: 'dragEnter', data: DropItemData | null, event: DragEvent | PointerEvent): void

  /**
   * Emitted when a draggable is over the drop zone
   */
  (e: 'dragOver', data: DropItemData | null, event: DragEvent | PointerEvent): void

  /**
   * Emitted when a draggable leaves the drop zone
   */
  (e: 'dragLeave', data: DropItemData | null, event: DragEvent | PointerEvent): void

  /**
   * Emitted when a draggable is dropped on the drop zone
   */
  (e: 'drop', data: DropItemData, event: DragEvent | PointerEvent): void

}>()

// Element reference
const targetRef = ref<HTMLElement | null>(null)

// Use the drop hook
const {
  isDragOver,
  isValidDrop,
} = useDrop(targetRef, {
  ...props,
  onDragEnter: (data, event) => {
    emit('dragEnter', data, event)
    if (props.onDragEnter) {
      props.onDragEnter(data, event)
    }
  },
  onDragOver: (data, event) => {
    emit('dragOver', data, event)
    if (props.onDragOver) {
      props.onDragOver(data, event)
    }
  },
  onDragLeave: (data, event) => {
    emit('dragLeave', data, event)
    if (props.onDragLeave) {
      props.onDragLeave(data, event)
    }
  },
  onDrop: (data, event) => {
    emit('drop', data, event)
    if (props.onDrop) {
      props.onDrop(data, event)
    }
  },
})

// Combine CSS classes
const combinedClass = computed(() => {
  const classes = ['drop']

  if (props.className) {
    classes.push(props.className)
  }

  if (isDragOver.value) {
    classes.push(props.overClassName)

    if (isValidDrop.value) {
      classes.push(props.validClassName)
    }
    else {
      classes.push(props.invalidClassName)
    }
  }

  return classes.join(' ')
})
</script>

<template>
  <div ref="targetRef" :class="combinedClass">
    <slot />
  </div>
</template>

<style scoped>
.drop {
  position: relative;
  min-height: 20px;
  min-width: 20px;
}
</style>
