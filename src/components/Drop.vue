<script setup lang="ts">
import type { DropOptions } from '@/types/dnd'
import { useDrop } from '@/hooks'
import { computed, ref, watch } from 'vue'

/**
 * Info about the current drag item for drop events
 */
export interface DropItemInfo {
  dragId: string
  index: number
  type: string
}

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
  (e: 'dragEnter', data: DropItemInfo | null, event: DragEvent | PointerEvent): void

  /**
   * Emitted when a draggable is over the drop zone
   */
  (e: 'dragOver', data: DropItemInfo | null, event: DragEvent | PointerEvent): void

  /**
   * Emitted when a draggable leaves the drop zone
   */
  (e: 'dragLeave', data: DropItemInfo | null, event: DragEvent | PointerEvent): void

  /**
   * Emitted when a draggable is dropped on the drop zone
   */
  (e: 'drop', data: DropItemInfo, event: DragEvent | PointerEvent): void

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
  (e: 'update:data', data: DropItemInfo | null): void
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
  onDragEnter: (data: any, event: any) => {
    emit('dragEnter', data, event)
    if (props.onDragEnter) {
      props.onDragEnter(data, event)
    }
  },
  onDragOver: (data: any, event: any) => {
    emit('dragOver', data, event)
    if (props.onDragOver) {
      props.onDragOver(data, event)
    }
  },
  onDragLeave: (data: any, event: any) => {
    emit('dragLeave', data, event)
    if (props.onDragLeave) {
      props.onDragLeave(data, event)
    }
  },
  onDrop: (data: any, event: any) => {
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
