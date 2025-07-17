import type { UseDraggableOptions, UseResizableOptions } from '@/core'
import type { MaybeRefOrGetter } from 'vue'
import { useDraggable, useResizable } from '@/core'
import { nanoid } from 'nanoid'
import { computed, toValue } from 'vue'

export interface UseDnrOptions extends UseDraggableOptions, UseResizableOptions {
  /**
   * Whether to disable dragging functionality.
   * @default false
   */
  disableDrag?: MaybeRefOrGetter<boolean>

  /**
   * Whether to disable resizing functionality.
   * @default false
   */
  disableResize?: MaybeRefOrGetter<boolean>
}

export function useDnr(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseDnrOptions = {},
) {
  const {
    disableDrag = false,
    disableResize = false,
    disabled = false,
    elementId: commonElementId = nanoid(8),
    ...restOptions
  } = options

  const disabledValue = computed(() => toValue(disabled))
  const isDraggableDisabled = computed(() => disabledValue.value || toValue(disableDrag))
  const isResizableDisabled = computed(() => disabledValue.value || toValue(disableResize))

  const {
    style: draggableStyle,
    setPosition,
    position,
    isDragging,
    isActive,
    setActive,
  } = useDraggable(target, {
    ...restOptions,
    elementId: commonElementId,
    disabled: isDraggableDisabled,
  })

  const {
    style: resizableStyle,
    setSize,
    activeHandle,
    hoverHandle,
    size,
    isResizing,
  } = useResizable(target, {
    ...restOptions,
    elementId: commonElementId,
    disabled: isResizableDisabled,
  })

  const style = computed(() => {
    const combined = { ...resizableStyle.value, ...draggableStyle.value }

    if (isResizing.value || hoverHandle.value)
      combined.cursor = resizableStyle.value.cursor

    return combined
  })

  return {
    position,
    size,
    isDragging,
    isResizing,
    isActive,
    style,
    setActive,
    setPosition,
    setSize,
    activeHandle,
    hoverHandle,
  }
}
