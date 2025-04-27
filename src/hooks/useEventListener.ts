import type { MaybeRefOrGetter } from 'vue'
import { isClient } from '@/utils'
import { getCurrentScope, onScopeDispose, toValue, watch } from 'vue'

/**
 * Attempts to register a cleanup function in the current scope
 * @param fn - The cleanup function to register
 * @returns True if the function was registered, false otherwise
 */
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

type EventMap = {
  [K in keyof WindowEventMap]: WindowEventMap[K]
} & {
  [key: string]: Event
}

/**
 * Hook for adding event listeners with automatic cleanup on component unmount
 * @template K - The type of event to listen for
 * @param target - The event target (element, window, etc.)
 * @param event - The event name to listen for
 * @param listener - The event handler function
 * @param options - Optional event listener options
 * @returns A cleanup function that removes the event listener
 */
export function useEventListener<K extends keyof EventMap>(
  target: MaybeRefOrGetter<EventTarget | null | undefined>,
  event: K,
  listener: (event: EventMap[K]) => void,
  options?: boolean | UseEventListenerOptions,
) {
  const register = (
    el: EventTarget,
    event: K,
    listener: (event: EventMap[K]) => void,
    options: boolean | AddEventListenerOptions | undefined,
  ) => {
    if (isClient) {
      el.addEventListener(event as string, listener as EventListener, options)
      return () => el.removeEventListener(event as string, listener as EventListener, options)
    }
    return () => { }
  }

  const cleanups: (() => void)[] = []
  const cleanup = () => {
    cleanups.forEach(fn => fn())
    cleanups.length = 0
  }

  const stopWatch = watch(
    () => [toValue(target), event, listener, options] as const,
    ([rawTarget, event, listener, options]) => {
      if (!rawTarget || !event || !listener)
        return
      if (typeof rawTarget === 'string')
        return

      cleanups.push(register(rawTarget, event, listener, options))
    },
    {
      immediate: true,
    },
  )

  const stop = () => {
    stopWatch()
    cleanup()
  }

  tryOnScopeDispose(stop)
  return stop
}
