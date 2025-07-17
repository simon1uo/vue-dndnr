import type { UniqueId } from '@/types'
import { createGlobalState } from '@vueuse/core'

export const useIdCounters = createGlobalState(() => new Map<string, number>())

/**
 * Generates a unique ID within the application's lifecycle, scoped by a prefix.
 * @param prefix - The prefix for the ID. Defaults to 'vue-dndnr-interactive-el-'.
 * @returns A unique string identifier.
 */
export function useUniqueId(prefix = 'vue-dndnr-el-'): UniqueId {
  const counters = useIdCounters()
  const currentCounter = counters.get(prefix) ?? 0
  const nextCounter = currentCounter + 1
  counters.set(prefix, nextCounter)
  return `${prefix}${nextCounter}`
}
