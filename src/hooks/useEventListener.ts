/**
 * Hook for adding event listeners with automatic cleanup
 */

import { isClient } from '@/utils'
import type { MaybeRefOrGetter } from 'vue'
import { getCurrentScope, onScopeDispose, toValue, watch } from 'vue'



function tryOnScopeDispose(fn: () => void) {
  if (getCurrentScope()) {
    onScopeDispose(fn)
    return true
  }
  return false
}

export interface UseEventListenerOptions extends AddEventListenerOptions {
  capture?: boolean
  passive?: boolean
}

/**
 * Hook for adding event listeners with automatic cleanup
 * @param target The event target (can be a ref or a getter)
 * @param event The event name to listen for
 * @param listener The event listener function
 * @param options Optional event listener options
 * @returns A function to stop watching and clean up the event listener
 */
export function useEventListener(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: string,
  listener: any,
  options?: boolean | UseEventListenerOptions,
) {
  const register = (
    el: EventTarget,
    event: string,
    listener: any,
    options: boolean | AddEventListenerOptions | undefined,
  ) => {
    if (isClient) {
      el.addEventListener(event, listener, options)
      return () => el.removeEventListener(event, listener, options)
    }
    return () => { }
  }

  const cleanups: (() => void)[] = []
  const cleanup = () => {
    cleanups.forEach(fn => fn())
    cleanups.length = 0
  }

  const stopWatch = watch(() => [toValue(target), event, listener, options], (
    [rawTarget, event, listener, options],
  ) => {
    if (!rawTarget || !event || !listener)
      return
    if (typeof rawTarget === 'string')
      return

    cleanups.push(register(rawTarget, event, listener, options))
  }, {
    immediate: true,
  })

  const stop = () => {
    stopWatch()
    cleanup()
  }

  tryOnScopeDispose(stop)
  return stop
}
