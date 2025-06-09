import type {
  AnimationEvent,
  AutoScrollOptions,
  DragStateInfo,
  EasingFunction,
  MultiDragOptions,
  PluginEvent,
  Position,
  Rect,
  ResponsiveSortableOptions,
  Size,
  SortableDirectionFunction,
  SortableEvent,
  SortableEventCallbacks,
  SortableEventType,
  SortableFilterFunction,
  SortableGroup,
  SortableOptions,
  SortablePullFunction,
  SortablePutFunction,
  SwapOptions,
} from '@/types'
import { DragState, SortDirection } from '@/types'
import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'

describe('common Types', () => {
  it('should have correct DragState values', () => {
    expect(DragState.IDLE).toBe('idle')
    expect(DragState.PENDING).toBe('pending')
    expect(DragState.DRAGGING).toBe('dragging')
    expect(DragState.COMPLETED).toBe('completed')
  })

  it('should have correct SortDirection values', () => {
    expect(SortDirection.HORIZONTAL).toBe('horizontal')
    expect(SortDirection.VERTICAL).toBe('vertical')
    expect(SortDirection.AUTO).toBe('auto')
  })

  it('should accept valid EasingFunction values', () => {
    const easings: EasingFunction[] = [
      'linear',
      'ease',
      'ease-in',
      'ease-out',
      'ease-in-out',
      'cubic-bezier(n,n,n,n)',
    ]

    easings.forEach((easing) => {
      expect(typeof easing).toBe('string')
    })
  })

  it('should define Position interface correctly', () => {
    const position: Position = { x: 10, y: 20 }
    expect(position.x).toBe(10)
    expect(position.y).toBe(20)
  })

  it('should define Size interface correctly', () => {
    const size: Size = { width: 100, height: 200 }
    expect(size.width).toBe(100)
    expect(size.height).toBe(200)
  })

  it('should define Rect interface correctly', () => {
    const rect: Rect = { x: 10, y: 20, width: 100, height: 200 }
    expect(rect.x).toBe(10)
    expect(rect.y).toBe(20)
    expect(rect.width).toBe(100)
    expect(rect.height).toBe(200)
  })
})

describe('sortable Types', () => {
  it('should accept basic sortable options', () => {
    const options: SortableOptions = {
      group: 'test',
      sort: true,
      disabled: false,
      animation: 150,
      ghostClass: 'ghost',
      draggable: '.item',
    }

    expect(options.group).toBe('test')
    expect(options.sort).toBe(true)
    expect(options.disabled).toBe(false)
    expect(options.animation).toBe(150)
    expect(options.ghostClass).toBe('ghost')
    expect(options.draggable).toBe('.item')
  })

  it('should accept group configuration', () => {
    const group: SortableGroup = {
      name: 'shared',
      pull: true,
      put: ['group1', 'group2'],
      revertClone: false,
    }

    const options: SortableOptions = { group }
    expect(options.group).toBe(group)
  })

  it('should accept function-based configurations', () => {
    const pullFunction: SortablePullFunction = (_to, _from, dragEl, _evt) => {
      return dragEl.classList.contains('allowed')
    }

    const putFunction: SortablePutFunction = (to, _from, _dragEl, _evt) => {
      return to.classList.contains('drop-zone')
    }

    const filterFunction: SortableFilterFunction = (_evt, item, _target) => {
      return item.classList.contains('no-drag')
    }

    const directionFunction: SortableDirectionFunction = (_evt, _target, _dragEl) => {
      return SortDirection.VERTICAL
    }

    const group: SortableGroup = {
      name: 'test',
      pull: pullFunction,
      put: putFunction,
    }

    const options: SortableOptions = {
      group,
      filter: filterFunction,
      direction: directionFunction,
    }

    expect(typeof options.group).toBe('object')
    expect(typeof (options.group as SortableGroup).pull).toBe('function')
    expect(typeof (options.group as SortableGroup).put).toBe('function')
    expect(typeof options.filter).toBe('function')
    expect(typeof options.direction).toBe('function')
  })

  it('should accept responsive sortable options', () => {
    const disabled = ref(false)
    const animation = ref(150)
    const ghostClass = computed(() => disabled.value ? 'disabled' : 'ghost')

    const options: ResponsiveSortableOptions = {
      disabled,
      animation,
      ghostClass,
      sort: ref(true),
      delay: computed(() => disabled.value ? 0 : 100),
    }

    expect(options.disabled).toBe(disabled)
    expect(options.animation).toBe(animation)
    expect(options.ghostClass).toBe(ghostClass)
  })

  it('should define plugin options correctly', () => {
    const multiDragOptions: MultiDragOptions = {
      name: 'multiDrag',
      enabled: true,
      selectedClass: 'selected',
      multiDragKey: 'ctrl',
      availableKeys: {
        ctrl: 'Control',
        shift: 'Shift',
      },
    }

    const autoScrollOptions: AutoScrollOptions = {
      name: 'autoScroll',
      enabled: true,
      scrollSensitivity: 100,
      scrollSpeed: 20,
      bubbleScroll: true,
    }

    const swapOptions: SwapOptions = {
      name: 'swap',
      enabled: true,
      swapClass: 'swap-highlight',
      swapThreshold: 0.65,
    }

    expect(multiDragOptions.name).toBe('multiDrag')
    expect(autoScrollOptions.scrollSensitivity).toBe(100)
    expect(swapOptions.swapThreshold).toBe(0.65)
  })

  it('should define DragStateInfo correctly', () => {
    const dragState: DragStateInfo = {
      state: DragState.DRAGGING,
      element: document.createElement('div'),
      ghost: null,
      oldIndex: 0,
      newIndex: 2,
      startPosition: { x: 10, y: 20 },
      currentPosition: { x: 50, y: 60 },
      sourceContainer: document.createElement('ul'),
      targetContainer: document.createElement('ul'),
    }

    expect(dragState.state).toBe(DragState.DRAGGING)
    expect(dragState.oldIndex).toBe(0)
    expect(dragState.newIndex).toBe(2)
    expect(dragState.startPosition?.x).toBe(10)
    expect(dragState.currentPosition?.x).toBe(50)
  })
})

describe('event Types', () => {
  it('should define SortableEvent interface correctly', () => {
    const mockEvent = new Event('test')
    const to = document.createElement('div')
    const from = document.createElement('div')
    const item = document.createElement('div')

    const sortableEvent: SortableEvent = Object.assign(mockEvent, {
      to,
      from,
      item,
      oldIndex: 0,
      newIndex: 1,
      originalEvent: mockEvent,
    })

    expect(sortableEvent.to).toBe(to)
    expect(sortableEvent.from).toBe(from)
    expect(sortableEvent.item).toBe(item)
    expect(sortableEvent.oldIndex).toBe(0)
    expect(sortableEvent.newIndex).toBe(1)
  })

  it('should define event callbacks correctly', () => {
    const callbacks: SortableEventCallbacks = {
      onStart: (event) => {
        console.warn('Start:', event.item)
      },
      onEnd: (event) => {
        console.warn('End:', event.item)
      },
      onAdd: (event) => {
        console.warn('Add:', event.item)
      },
      onRemove: (event) => {
        console.warn('Remove:', event.item)
      },
      onUpdate: (event) => {
        console.warn('Update:', event.item)
      },
      onMove: (_event, _originalEvent) => {
        return true // Allow move
      },
    }

    expect(typeof callbacks.onStart).toBe('function')
    expect(typeof callbacks.onEnd).toBe('function')
    expect(typeof callbacks.onMove).toBe('function')
  })

  it('should have correct event type values', () => {
    const eventTypes: SortableEventType[] = [
      'start',
      'end',
      'add',
      'remove',
      'update',
      'sort',
      'filter',
      'move',
      'clone',
      'change',
      'choose',
      'unchoose',
      'spill',
      'select',
      'deselect',
    ]

    eventTypes.forEach((type) => {
      expect(typeof type).toBe('string')
    })
  })

  it('should define PluginEvent correctly', () => {
    const pluginEvent: PluginEvent = {
      plugin: 'multiDrag',
      type: 'select',
      data: { selectedCount: 3 },
      target: document.createElement('div'),
      cancelable: true,
      cancelled: false,
    }

    expect(pluginEvent.plugin).toBe('multiDrag')
    expect(pluginEvent.type).toBe('select')
    expect(pluginEvent.data?.selectedCount).toBe(3)
  })

  it('should define AnimationEvent correctly', () => {
    const animationEvent: AnimationEvent = {
      type: 'start',
      target: document.createElement('div'),
      duration: 150,
      easing: 'ease-out',
      properties: {
        transform: 'translateX(100px)',
        opacity: 0.5,
      },
    }

    expect(animationEvent.type).toBe('start')
    expect(animationEvent.duration).toBe(150)
    expect(animationEvent.easing).toBe('ease-out')
    expect(animationEvent.properties?.transform).toBe('translateX(100px)')
  })
})

describe('type Compatibility', () => {
  it('should be compatible with Vue3 reactivity', () => {
    // Test that our types work with Vue3 reactive system
    const reactiveOptions = ref<SortableOptions>({
      animation: 150,
      ghostClass: 'ghost',
    })

    const computedOptions = computed<ResponsiveSortableOptions>(() => ({
      animation: reactiveOptions.value.animation,
      ghostClass: reactiveOptions.value.ghostClass,
      disabled: false,
    }))

    expect(reactiveOptions.value.animation).toBe(150)
    expect(computedOptions.value.animation).toBe(150)
  })

  it('should support function type guards', () => {
    const group: string | SortableGroup = {
      name: 'test',
      pull: true,
    }

    // Type guard function
    function isSortableGroup(value: string | SortableGroup): value is SortableGroup {
      return typeof value === 'object' && value !== null
    }

    if (isSortableGroup(group)) {
      expect(group.name).toBe('test')
      expect(group.pull).toBe(true)
    }
  })
})
