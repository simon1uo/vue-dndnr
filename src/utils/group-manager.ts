import type { UseSortableAnimationReturn } from '@/hooks/useSortableAnimation'
import type { SortableStateInternal } from '@/hooks/useSortableState'
import type { SortableGroup, SortablePullFunction } from '@/types'

/**
 * Registry entry for a sortable list in a group
 */
export interface GroupRegistryEntry {
  /** The sortable container element */
  element: HTMLElement
  /** Parsed group configuration */
  group: SortableGroup
  /** Timestamp when the list was registered */
  registeredAt: number
  /** Reference to the sortable state for cross-list data synchronization */
  state?: SortableStateInternal
  /** Reference to the animation controller for cross-list animations */
  animation?: UseSortableAnimationReturn
}

/**
 * Result of drop permission check
 */
export interface DropPermissionResult {
  /** Whether the drop is allowed */
  allowed: boolean
  /** Pull mode if allowed   */
  pullMode?: boolean | 'clone' | SortablePullFunction
  /** Source group configuration */
  sourceGroup?: SortableGroup
  /** Target group configuration */
  targetGroup?: SortableGroup
  /** Whether to revert clone after cross-list move */
  revertClone?: boolean
  /** Reason for denial (for debugging) */
  reason?: string
}

/**
 * Global group manager for cross-list drag and drop operations.
 * Manages registration of sortable lists and provides utilities for
 * checking drag permissions between different groups.
 */
class GroupManager {
  /** Global registry of all sortable groups */
  private registry = new Map<HTMLElement, GroupRegistryEntry>()

  /** Index by group name for fast lookup */
  private groupIndex = new Map<string, Set<HTMLElement>>()

  /**
   * Register a sortable list with a group configuration
   * @param element - The sortable container element
   * @param group - Group configuration (string or SortableGroup object)
   * @param state - Reference to the sortable state (optional)
   * @param animation - Reference to the animation controller (optional)
   */
  registerList(
    element: HTMLElement,
    group: string | SortableGroup,
    state?: SortableStateInternal,
    animation?: UseSortableAnimationReturn,
  ): void {
    if (!element) {
      throw new Error('Element is required for group registration')
    }

    // Parse group configuration
    const parsedGroup = this.parseGroupConfig(group)

    // Create registry entry
    const entry: GroupRegistryEntry = {
      element,
      group: parsedGroup,
      registeredAt: Date.now(),
      state,
      animation,
    }

    // Remove existing registration if present
    this.unregisterList(element)

    // Register in main registry
    this.registry.set(element, entry)

    // Add to group index
    if (!this.groupIndex.has(parsedGroup.name!)) {
      this.groupIndex.set(parsedGroup.name!, new Set())
    }
    this.groupIndex.get(parsedGroup.name!)!.add(element)

    // Add data attribute for CSS targeting and debugging
    element.setAttribute('data-sortable-group', parsedGroup.name!)
  }

  /**
   * Unregister a sortable list from group management
   * @param element - The sortable container element to unregister
   */
  unregisterList(element: HTMLElement): void {
    const entry = this.registry.get(element)
    if (!entry) {
      return
    }

    // Remove from group index
    const groupSet = this.groupIndex.get(entry.group.name!)
    if (groupSet) {
      groupSet.delete(element)
      if (groupSet.size === 0) {
        this.groupIndex.delete(entry.group.name!)
      }
    }

    // Remove from main registry
    this.registry.delete(element)

    // Remove data attribute
    element.removeAttribute('data-sortable-group')
  }

  /**
   * Find the group configuration for a given element
   * @param element - The sortable container element
   * @returns Group configuration or null if not found
   */
  findTargetGroup(element: HTMLElement): SortableGroup | null {
    const entry = this.registry.get(element)
    return entry ? entry.group : null
  }

  /**
   * Get all lists in a specific group
   * @param groupName - Name of the group
   * @returns Array of container elements in the group
   */
  getGroupLists(groupName: string): HTMLElement[] {
    const groupSet = this.groupIndex.get(groupName)
    return groupSet ? Array.from(groupSet) : []
  }

  /**
   * Check if a drop operation is allowed between two containers
   * @param sourceElement - Source container element
   * @param targetElement - Target container element
   * @param dragElement - Element being dragged
   * @param originalEvent - Original drag event (optional)
   * @returns Drop permission result with detailed information
   */
  canAcceptDrop(
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    dragElement: HTMLElement,
    originalEvent?: Event,
  ): DropPermissionResult {
    // Same container - always allowed
    if (sourceElement === targetElement) {
      const sourceGroup = this.findTargetGroup(sourceElement)
      return {
        allowed: true,
        pullMode: true,
        sourceGroup: sourceGroup || undefined,
        targetGroup: sourceGroup || undefined,
        revertClone: sourceGroup?.revertClone || false,
      }
    }

    const sourceGroup = this.findTargetGroup(sourceElement)
    const targetGroup = this.findTargetGroup(targetElement)

    // If either group is not registered, deny
    if (!sourceGroup || !targetGroup) {
      return { allowed: false, reason: 'missing_group_config' }
    }

    // Check pull permission from source
    const pullResult = this.checkPullPermission(
      sourceGroup,
      targetElement,
      sourceElement,
      dragElement,
      originalEvent,
    )

    if (!pullResult.allowed) {
      return { allowed: false, reason: 'pull_denied' }
    }

    // Check put permission to target
    const putAllowed = this.checkPutPermission(
      targetGroup,
      targetElement,
      sourceElement,
      dragElement,
      originalEvent,
    )

    if (!putAllowed) {
      return { allowed: false, reason: 'put_denied' }
    }

    return {
      allowed: true,
      pullMode: pullResult.pullMode,
      sourceGroup,
      targetGroup,
      revertClone: sourceGroup.revertClone || false,
    }
  }

  /**
   * Parse group configuration from string or object
   * @param group - Group configuration
   * @returns Parsed SortableGroup object
   */
  private parseGroupConfig(group: string | SortableGroup): SortableGroup {
    if (typeof group === 'string') {
      return {
        name: group,
        pull: true,
        put: 'same-group', // Default behavior: only allow same group
        revertClone: false,
      }
    }

    return {
      name: group.name || 'default',
      pull: group.pull !== undefined ? group.pull : true,
      put: group.put !== undefined ? group.put : 'same-group', // Default behavior: only allow same group
      revertClone: group.revertClone || false,
    }
  }

  /**
   * Check pull permission from source group
   * @param sourceGroup - Source group configuration
   * @param targetElement - Target container element
   * @param sourceElement - Source container element
   * @param dragElement - Element being dragged
   * @param originalEvent - Original drag event
   * @returns Pull permission result
   */
  private checkPullPermission(
    sourceGroup: SortableGroup,
    targetElement: HTMLElement,
    sourceElement: HTMLElement,
    dragElement: HTMLElement,
    originalEvent?: Event,
  ): { allowed: boolean, pullMode?: 'clone' | boolean } {
    const { pull } = sourceGroup

    if (pull === false) {
      return { allowed: false }
    }

    if (pull === true || pull === 'clone') {
      return { allowed: true, pullMode: pull }
    }

    // Function-based pull permission
    if (typeof pull === 'function') {
      try {
        const result = pull(targetElement, sourceElement, dragElement, originalEvent || new Event('drag'))
        return {
          allowed: result !== false,
          pullMode: result,
        }
      }
      catch {
        return { allowed: false }
      }
    }

    return { allowed: false }
  }

  /**
   * Check put permission to target group
   * @param targetGroup - Target group configuration
   * @param targetElement - Target container element
   * @param sourceElement - Source container element
   * @param dragElement - Element being dragged
   * @param originalEvent - Original drag event
   * @returns Whether put is allowed
   */
  private checkPutPermission(
    targetGroup: SortableGroup,
    targetElement: HTMLElement,
    sourceElement: HTMLElement,
    dragElement: HTMLElement,
    originalEvent?: Event,
  ): boolean {
    const { put } = targetGroup
    const sourceGroup = this.findTargetGroup(sourceElement)

    if (put === false) {
      return false
    }

    if (put === true) {
      // For put=true, allow from any group
      return true
    }

    // Handle undefined/null put value
    if (put == null) {
      // Default behavior: allow same group or if source group allows pull
      return sourceGroup ? sourceGroup.name === targetGroup.name : false
    }

    if (put === 'same-group') {
      // Only allow same group
      return sourceGroup ? sourceGroup.name === targetGroup.name : false
    }

    // String-based put permission (specific group name)
    if (typeof put === 'string') {
      return sourceGroup ? sourceGroup.name === put : false
    }

    // Array-based put permission (allowed group names)
    if (Array.isArray(put)) {
      return sourceGroup ? put.includes(sourceGroup.name!) : false
    }

    // Function-based put permission
    if (typeof put === 'function') {
      try {
        return put(targetElement, sourceElement, dragElement, originalEvent || new Event('drag')) !== false
      }
      catch {
        return false
      }
    }

    return false
  }

  /**
   * Clear all registered groups (useful for testing)
   */
  clear(): void {
    // Remove data attributes from all registered elements
    for (const element of this.registry.keys()) {
      element.removeAttribute('data-sortable-group')
    }

    this.registry.clear()
    this.groupIndex.clear()
  }

  /**
   * Get debug information about registered groups
   * @returns Debug information object
   */
  getDebugInfo(): Record<string, any> {
    const groups: Record<string, HTMLElement[]> = {}
    for (const [groupName, elements] of this.groupIndex) {
      groups[groupName] = Array.from(elements)
    }

    return {
      totalRegistered: this.registry.size,
      groups,
      registryEntries: Array.from(this.registry.entries()).map(([element, entry]) => ({
        element: element.tagName,
        group: entry.group,
        registeredAt: new Date(entry.registeredAt).toISOString(),
      })),
    }
  }

  /**
   * Get the sortable instance associated with an element
   * @param element - The sortable container element
   * @returns Associated sortable instance or undefined
   */
  getState(element: HTMLElement): SortableStateInternal | undefined {
    return this.registry.get(element)?.state
  }

  /**
   * Get the animation controller for a specific sortable list
   * @param element - The sortable container element
   * @returns The animation controller or undefined if not found
   */
  getAnimation(element: HTMLElement): UseSortableAnimationReturn | undefined {
    return this.registry.get(element)?.animation
  }

  /**
   * Get the full context (state, animation, etc.) for a specific sortable list
   * @param element - The sortable container element
   * @returns The group registry entry or undefined if not found
   */
  getSortableContext(element: HTMLElement): GroupRegistryEntry | undefined {
    return this.registry.get(element)
  }
}

// Export singleton instance
export const globalGroupManager = new GroupManager()

// Export class for testing
export { GroupManager }
