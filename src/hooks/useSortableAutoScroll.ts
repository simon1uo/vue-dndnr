import type { UseSortableDragOptions } from './useSortableDrag'
import { getElementRect, getElementStyleValue, getParentAutoScrollElement, getWindowScrollingElement, scrollBy } from '@/utils'
import { useThrottleFn } from '@vueuse/core'
import { shallowRef, toValue } from 'vue'

export function useSortableAutoScroll(options: UseSortableDragOptions) {
  const scrollEl = shallowRef<HTMLElement | boolean | undefined>(undefined)
  const scrollRootEl = shallowRef<HTMLElement | undefined>(undefined)
  const autoScrolls = shallowRef<{ el: HTMLElement, vx: number, vy: number, pid?: ReturnType<typeof setInterval> }[]>([])
  const pointerElemChangedInterval = shallowRef<ReturnType<typeof setInterval> | null>(null)

  const {
    scroll = false,
    scrollSensitivity = 30,
    scrollSpeed = 10,
    bubbleScroll = true,
  } = options

  const clearAutoScrolls = () => {
    autoScrolls.value.forEach((autoScroll) => {
      clearInterval(autoScroll.pid)
    })
    autoScrolls.value = []
  }

  const clearPointerElemChangedInterval = () => {
    if (pointerElemChangedInterval.value)
      clearInterval(pointerElemChangedInterval.value)
    pointerElemChangedInterval.value = null
  }

  const doAutoScroll = (event: MouseEvent | TouchEvent, target: HTMLElement) => {
    if (!toValue(scroll))
      return

    const x = (event as TouchEvent).touches ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX
    const y = (event as TouchEvent).touches ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY
    const sens = toValue(scrollSensitivity)
    const speed = toValue(scrollSpeed)
    const _bubbleScroll = toValue(bubbleScroll)

    const winScroller = getWindowScrollingElement()
    let scrollThisInstance = false

    if (scrollRootEl.value !== target) {
      scrollRootEl.value = target
      clearAutoScrolls()
      if (toValue(scroll)) {
        scrollEl.value = getParentAutoScrollElement(target, true)
      }
    }

    let layersOut = 0
    let currentParent = scrollEl.value as HTMLElement | null

    do {
      if (!currentParent)
        break

      const rect = getElementRect(currentParent)
      if (!rect) {
        currentParent = getParentAutoScrollElement(currentParent, false)
        continue
      }

      const { top, bottom, left, right } = rect
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } = currentParent
      const style = getElementStyleValue(currentParent) as CSSStyleDeclaration

      let canScrollX: boolean
      let canScrollY: boolean

      if (currentParent === winScroller) {
        canScrollX
          = clientWidth < scrollWidth
            && (style.overflowX === 'auto'
              || style.overflowX === 'scroll'
              || style.overflowX === 'visible')
        canScrollY
          = clientHeight < scrollHeight
            && (style.overflowY === 'auto'
              || style.overflowY === 'scroll'
              || style.overflowY === 'visible')
      }
      else {
        canScrollX = clientWidth < scrollWidth && (style.overflowX === 'auto' || style.overflowX === 'scroll')
        canScrollY = clientHeight < scrollHeight && (style.overflowY === 'auto' || style.overflowY === 'scroll')
      }

      const vx = Number(canScrollX && (Math.abs(right - x) <= sens && currentParent.scrollLeft + clientWidth < scrollWidth))
        - Number(canScrollX && (Math.abs(left - x) <= sens && !!currentParent.scrollLeft))

      const vy = Number(canScrollY && (Math.abs(bottom - y) <= sens && currentParent.scrollTop + clientHeight < scrollHeight))
        - Number(canScrollY && (Math.abs(top - y) <= sens && !!currentParent.scrollTop))

      if (!autoScrolls.value[layersOut]) {
        for (let i = 0; i <= layersOut; i++) {
          if (!autoScrolls.value[i]) {
            autoScrolls.value[i] = { el: currentParent, vx: 0, vy: 0 }
          }
        }
      }

      if (
        autoScrolls.value[layersOut].vx !== vx
        || autoScrolls.value[layersOut].vy !== vy
        || autoScrolls.value[layersOut].el !== currentParent
      ) {
        autoScrolls.value[layersOut].el = currentParent
        autoScrolls.value[layersOut].vx = vx
        autoScrolls.value[layersOut].vy = vy

        clearInterval(autoScrolls.value[layersOut].pid)

        if (vx !== 0 || vy !== 0) {
          scrollThisInstance = true
          autoScrolls.value[layersOut].pid = setInterval(
            (layer: number) => {
              const scrollOffsetY = autoScrolls.value[layer].vy ? autoScrolls.value[layer].vy * speed : 0
              const scrollOffsetX = autoScrolls.value[layer].vx ? autoScrolls.value[layer].vx * speed : 0
              scrollBy(autoScrolls.value[layer].el, scrollOffsetX, scrollOffsetY)
            },
            24,
            layersOut,
          )
        }
      }
      layersOut++
      const nextParent = getParentAutoScrollElement(currentParent, false)
      if (nextParent === currentParent) {
        currentParent = null
      }
      else {
        currentParent = nextParent
      }
      // eslint-disable-next-line no-unmodified-loop-condition
    } while (_bubbleScroll && currentParent)

    return scrollThisInstance
  }

  const throttledAutoScroll = useThrottleFn(doAutoScroll, 30)

  const stop = () => {
    clearPointerElemChangedInterval()
    clearAutoScrolls()
  }

  const handleAutoScroll = (event: MouseEvent | TouchEvent) => {
    if (!toValue(scroll)) {
      return
    }

    const x = (event as TouchEvent).touches ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX
    const y = (event as TouchEvent).touches ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY
    const elem = document.elementFromPoint(x, y) as HTMLElement

    if (!elem) {
      stop()
      return
    }
    throttledAutoScroll(event, elem)
  }

  return {
    handleAutoScroll,
    stop,
  }
}

export default useSortableAutoScroll
