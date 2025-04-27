/**
 * Creates a throttled version of a function that limits its execution rate
 * @template T - The type of the function to throttle
 * @param fn - The function to throttle
 * @param delay - The minimum time (in milliseconds) that must pass between function calls
 * @returns A throttled version of the input function that limits execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function throttled(...args: Parameters<T>): void {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall >= delay) {
      // If enough time has passed, call the function immediately
      fn(...args)
      lastCall = now
    }
    else {
      // Otherwise, schedule the call for later
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        fn(...args)
        lastCall = Date.now()
        timeoutId = null
      }, delay - timeSinceLastCall)
    }
  }
}

/**
 * Creates a debounced version of a function that delays its execution
 * @template T - The type of the function to debounce
 * @param fn - The function to debounce
 * @param delay - The time to wait (in milliseconds) after the last call before executing
 * @returns A debounced version of the input function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function debounced(...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}
