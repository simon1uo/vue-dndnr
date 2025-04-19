/**
 * Hook for adding event listeners with automatic cleanup
 */

import type { MaybeRefOrGetter } from 'vue'
import { onMounted, onUnmounted, toValue, watch } from 'vue'

export interface UseEventListenerOptions extends AddEventListenerOptions {
  /**
   * Whether to listen for the event in the capture phase
   */
  capture?: boolean
  /**
   * Whether the listener should be passive
   */
  passive?: boolean
}

/**
 * Register an event listener that is automatically removed when the component is unmounted
 *
 * @param target The target to listen on
 * @param event The event to listen for
 * @param listener The event listener callback
 * @param options Event listener options
 */
export function useEventListener<E extends keyof WindowEventMap>(
  target: MaybeRefOrGetter<Window | null | undefined>,
  event: E,
  listener: (this: Window, ev: WindowEventMap[E]) => any,
  options?: UseEventListenerOptions,
): void

export function useEventListener<E extends keyof DocumentEventMap>(
  target: MaybeRefOrGetter<Document | null | undefined>,
  event: E,
  listener: (this: Document, ev: DocumentEventMap[E]) => any,
  options?: UseEventListenerOptions,
): void

export function useEventListener<E extends keyof HTMLElementEventMap>(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  event: E,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[E]) => any,
  options?: UseEventListenerOptions,
): void

export function useEventListener<E extends keyof SVGElementEventMap>(
  target: MaybeRefOrGetter<SVGElement | null | undefined>,
  event: E,
  listener: (this: SVGElement, ev: SVGElementEventMap[E]) => any,
  options?: UseEventListenerOptions,
): void

export function useEventListener<E extends string>(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: E,
  listener: EventListenerOrEventListenerObject,
  options?: UseEventListenerOptions,
): void

export function useEventListener(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options: UseEventListenerOptions = {},
): void {
  const cleanup = () => {
    const el = toValue(target)
    if (!el)
      return

    // Check if the element has addEventListener method
    if (typeof el.removeEventListener !== 'function') {
      console.warn('Target does not have removeEventListener method:', el)
      return
    }

    el.removeEventListener(event, listener, options)
  }

  const register = () => {
    const el = toValue(target)
    if (!el)
      return

    // Check if the element has addEventListener method
    if (typeof el.addEventListener !== 'function') {
      console.warn('Target does not have addEventListener method:', el)
      return
    }

    el.addEventListener(event, listener, options)
  }

  onMounted(register)
  onUnmounted(cleanup)

  // If the target changes, re-register
  if (target !== window && target !== document) {
    watch(
      () => toValue(target),
      (newValue, oldValue) => {
        if (oldValue)
          cleanup()
        if (newValue)
          register()
      },
      { immediate: true },
    )
  }
}
