import type { InternalState, PointerType } from '@/types'
import type { MaybeRefOrGetter } from 'vue'
import { usePublicState } from '@/stores'
import { defaultWindow, isClient, useEventListener } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { computed, nextTick, onMounted, toValue } from 'vue'

export function useInteractive(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: InternalState = {},
) {
  const publicState = usePublicState()

  const {
    elementId = nanoid(8),
    initialActive = false,
    activeOn = 'none',
    disabled = false,
    preventDeactivation = false,
    pointerTypes = ['mouse', 'touch', 'pen'],
    preventDefault = true,
    stopPropagation = false,
    capture = true,
    onActiveChange,
  } = options

  const elementIdValue = computed(() => toValue(elementId))
  const disabledValue = computed(() => toValue(disabled))
  const activeOnValue = computed(() => toValue(activeOn))
  const preventDeactivationValue = computed(() => toValue(preventDeactivation))
  const pointerTypesValue = computed(() => toValue(pointerTypes))
  const preventDefaultValue = computed(() => toValue(preventDefault))
  const stopPropagationValue = computed(() => toValue(stopPropagation))

  const isActive = computed(() => publicState.state.activeElementId === elementIdValue.value)

  /**
   * Set the active state and trigger callback
   * @param value - New active state
   */
  const setActive = (value: boolean) => {
    if (disabledValue.value)
      return

    // Call the user-provided callback if exists
    if (onActiveChange?.(value) === false)
      return

    if (value) {
      const targetEl = toValue(target)
      if (targetEl)
        publicState.setActiveElement(targetEl, elementIdValue.value)
    }
    else {
      // Deactivate only if this element is currently active
      if (publicState.state.activeElementId === elementIdValue.value)
        publicState.setActiveElement(null, null)
    }
  }

  const filterEvent = (event: PointerEvent): boolean => {
    if (disabledValue.value)
      return false
    const types = pointerTypesValue.value
    if (types)
      return types.includes(event.pointerType as PointerType)
    return true
  }

  const onPointerDown = (event: PointerEvent) => {
    if (!filterEvent(event))
      return

    if (activeOnValue.value === 'click') {
      if (!isActive.value)
        setActive(true)
    }
  }

  const onPointerEnter = (_event: PointerEvent) => {
    if (activeOnValue.value === 'hover')
      setActive(true)
  }

  const onPointerLeave = (event: PointerEvent) => {
    const el = toValue(target)
    const relatedTarget = event.relatedTarget as Node | null
    if ((activeOnValue.value === 'hover') && !preventDeactivationValue.value) {
      if (el && relatedTarget && !el.contains(relatedTarget))
        setActive(false)
      else if (!relatedTarget) // Mouse leaves the window
        setActive(false)
    }
  }

  const onDocumentPointerDown = (event: PointerEvent) => {
    if ((activeOnValue.value === 'click') && isActive.value && !preventDeactivationValue.value) {
      const el = toValue(target)
      if (el && !el.contains(event.target as Node))
        setActive(false)
    }
  }

  if (isClient) {
    onMounted(() => {
      const el = toValue(target)
      if (el) {
        if (initialActive && !disabledValue.value && activeOnValue.value !== 'none') {
          nextTick(() => {
            setActive(true)
          })
        }
      }
    })

    const config = computed(() => ({
      capture: toValue(capture),
      passive: !preventDefaultValue.value,
    }))

    useEventListener(target, 'pointerdown', onPointerDown, config)
    useEventListener(target, 'pointerenter', onPointerEnter, config)
    useEventListener(target, 'pointerleave', onPointerLeave, config)
    useEventListener(defaultWindow?.document, 'pointerdown', onDocumentPointerDown, config)
  }

  return {
    isActive,
    setActive,
    elementIdValue,
    disabledValue,
    pointerTypesValue,
    preventDefaultValue,
    stopPropagationValue,
    activeOnValue,
  }
}
