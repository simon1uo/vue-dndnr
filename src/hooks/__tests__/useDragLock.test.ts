import { DragState } from '@/types/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDragLock } from '../useDragLock'

describe('useDragLock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should start with IDLE state', () => {
    const lock = useDragLock()
    expect(lock.getPhase()).toBe(DragState.IDLE)
    expect(lock.isLockClaimed()).toBe(false)
    expect(lock.getLock()).toBeNull()
  })

  it('should acquire lock successfully', () => {
    const lock = useDragLock()
    const dragId = 'test-drag-id'
    const sensorId = 'test-sensor'
    const forceStop = vi.fn()

    const actions = lock.tryGetLock(dragId, sensorId, forceStop)

    expect(actions).not.toBeNull()
    expect(lock.isLockClaimed()).toBe(true)
    expect(lock.getPhase()).toBe(DragState.PRE_DRAG)

    const currentLock = lock.getLock()
    expect(currentLock).not.toBeNull()
    expect(currentLock?.dragId).toBe(dragId)
    expect(currentLock?.sensorId).toBe(sensorId)
    expect(currentLock?.phase).toBe(DragState.PRE_DRAG)
  })

  it('should not allow multiple locks', () => {
    const lock = useDragLock()

    // 获取第一个锁
    const firstActions = lock.tryGetLock('drag-1', 'sensor-1')
    expect(firstActions).not.toBeNull()

    // 尝试获取第二个锁，应该失败
    const secondActions = lock.tryGetLock('drag-2', 'sensor-2')
    expect(secondActions).toBeNull()

    // 确认锁仍然属于第一个传感器
    const currentLock = lock.getLock()
    expect(currentLock?.sensorId).toBe('sensor-1')
  })

  it('should release lock when abort is called', () => {
    const lock = useDragLock()

    const actions = lock.tryGetLock('drag-1', 'sensor-1')
    expect(actions).not.toBeNull()

    // 调用 abort 应该释放锁
    actions!.abort()

    expect(lock.isLockClaimed()).toBe(false)
    expect(lock.getPhase()).toBe(DragState.IDLE)
    expect(lock.getLock()).toBeNull()
  })

  it('should handle fluid lift correctly', () => {
    const lock = useDragLock()

    const preDragActions = lock.tryGetLock('drag-1', 'sensor-1')
    expect(preDragActions).not.toBeNull()

    // 执行流畅提升
    const fluidActions = preDragActions!.fluidLift({ x: 100, y: 100 })

    // 检查状态转换
    expect(lock.getPhase()).toBe(DragState.DRAGGING)
    expect(fluidActions).not.toBeNull()

    // 检查动作是否存在
    expect(typeof fluidActions.move).toBe('function')
    expect(typeof fluidActions.drop).toBe('function')
    expect(typeof fluidActions.cancel).toBe('function')
    expect(typeof fluidActions.moveUp).toBe('function')
    expect(typeof fluidActions.moveDown).toBe('function')
    expect(typeof fluidActions.moveLeft).toBe('function')
    expect(typeof fluidActions.moveRight).toBe('function')
  })

  it('should handle snap lift correctly', () => {
    const lock = useDragLock()

    const preDragActions = lock.tryGetLock('drag-1', 'sensor-1')
    expect(preDragActions).not.toBeNull()

    // 执行快照提升
    const snapActions = preDragActions!.snapLift()

    // 检查状态转换
    expect(lock.getPhase()).toBe(DragState.DRAGGING)
    expect(snapActions).not.toBeNull()
  })

  it('should handle drop correctly', () => {
    const lock = useDragLock()

    const preDragActions = lock.tryGetLock('drag-1', 'sensor-1')
    const fluidActions = preDragActions!.fluidLift({ x: 100, y: 100 })

    // 执行放置
    fluidActions.drop()

    // 检查状态转换
    expect(lock.getPhase()).toBe(DragState.IDLE)
    expect(lock.isLockClaimed()).toBe(false)
  })

  it('should handle cancel correctly', () => {
    const lock = useDragLock()

    const preDragActions = lock.tryGetLock('drag-1', 'sensor-1')
    const fluidActions = preDragActions!.fluidLift({ x: 100, y: 100 })

    // 执行取消
    fluidActions.cancel()

    // 检查状态转换
    expect(lock.getPhase()).toBe(DragState.IDLE)
    expect(lock.isLockClaimed()).toBe(false)
  })

  it('should release lock after timeout', () => {
    const lock = useDragLock({ lockTimeout: 1000 })
    const forceStop = vi.fn()

    lock.tryGetLock('drag-1', 'sensor-1', forceStop)

    // 快进时间
    vi.advanceTimersByTime(1500)

    // 检查锁是否被释放
    expect(lock.isLockClaimed()).toBe(false)
    expect(lock.getPhase()).toBe(DragState.IDLE)
    expect(forceStop).toHaveBeenCalled()
  })

  it('should clear timeout when lock is used', () => {
    const lock = useDragLock({ lockTimeout: 1000 })
    const forceStop = vi.fn()

    const actions = lock.tryGetLock('drag-1', 'sensor-1', forceStop)

    // 快进一部分时间
    vi.advanceTimersByTime(500)

    // 使用锁
    actions!.fluidLift({ x: 100, y: 100 })

    // 继续快进时间
    vi.advanceTimersByTime(1000)

    // 检查锁是否仍然有效
    expect(lock.isLockClaimed()).toBe(true)
    expect(lock.getPhase()).toBe(DragState.DRAGGING)
    expect(forceStop).not.toHaveBeenCalled()
  })
})
