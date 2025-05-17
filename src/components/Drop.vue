<script setup lang="ts">
import type { DragData, DropOptions } from '@/types/dnd'
import { useDrop } from '@/hooks'
import { computed, ref, watch } from 'vue'

interface DropProps<T = unknown> extends Partial<DropOptions<T>> {
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
  allowFallbackDrags: true,
})

const emit = defineEmits<{
  /**
   * Emitted when a draggable enters the drop zone
   */
  (e: 'dragEnter', data: DragData | null, event: DragEvent): void

  /**
   * Emitted when a draggable is over the drop zone
   */
  (e: 'dragOver', data: DragData | null, event: DragEvent): void

  /**
   * Emitted when a draggable leaves the drop zone
   */
  (e: 'dragLeave', data: DragData | null, event: DragEvent): void

  /**
   * Emitted when a draggable is dropped on the drop zone
   */
  (e: 'drop', data: DragData, event: DragEvent): void

  /**
   * Emitted when drop state changes
   */
  (e: 'update:isOver', isOver: boolean): void

  /**
   * Emitted when drop validity changes
   */
  (e: 'update:isValidDrop', isValidDrop: boolean): void

  /**
   * Emitted when drop data changes
   */
  (e: 'update:data', data: DragData | null): void
}>()

// Element reference
const targetRef = ref<HTMLElement | null>(null)

// Use the drop hook
const {
  isDragOver,
  isValidDrop,
  data,
} = useDrop(targetRef, {
  ...props,
  onDragEnter: (data: DragData | null, event: DragEvent) => {
    emit('dragEnter', data, event)
    if (props.onDragEnter) {
      props.onDragEnter(data, event)
    }
  },
  onDragOver: (data: DragData | null, event: DragEvent) => {
    emit('dragOver', data, event)
    if (props.onDragOver) {
      props.onDragOver(data, event)
    }
  },
  onDragLeave: (data: DragData | null, event: DragEvent) => {
    emit('dragLeave', data, event)
    if (props.onDragLeave) {
      props.onDragLeave(data, event)
    }
  },
  onDrop: (data: DragData, event: DragEvent) => {
    emit('drop', data, event)
    if (props.onDrop) {
      props.onDrop(data, event)
    }
  },
})

// Watch for changes and emit events
watch(
  isDragOver,
  (newIsOver) => {
    emit('update:isOver', newIsOver)
  },
)

watch(
  isValidDrop,
  (newIsValidDrop) => {
    emit('update:isValidDrop', newIsValidDrop)
  },
)

watch(
  data,
  (newData) => {
    emit('update:data', newData)
  },
  { deep: true },
)

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
