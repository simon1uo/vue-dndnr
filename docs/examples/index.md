# Examples Overview

Vue DNDNR provides a comprehensive set of examples to help you understand how to use the library's components and hooks in various scenarios. Each example demonstrates both the component-based approach and the hooks-based approach.

## Draggable Examples

The [Draggable examples](/examples/Draggable/) showcase how to use the `Draggable` component and `useDraggable` hook in different scenarios:

- [Basic Usage](/examples/Draggable/basic) - Simple draggable element
- [Constrained Dragging](/examples/Draggable/constrained) - Limit dragging within bounds
- [Grid Alignment](/examples/Draggable/grid) - Snap to grid while dragging
- [Custom Handle](/examples/Draggable/handle) - Drag only by a specific handle
- [Axis Constraint](/examples/Draggable/axis) - Limit dragging to x or y axis
- [Event Handling](/examples/Draggable/events) - Respond to drag events
- [Active State Modes](/examples/Draggable/active-modes) - Control when elements can be dragged

## Resizable Examples

The [Resizable examples](/examples/Resizable/) demonstrate the `Resizable` component and `useResizable` hook capabilities:

- [Basic Usage](/examples/Resizable/basic) - Simple resizable element
- [Constrained Resizing](/examples/Resizable/constrained) - Set min/max size constraints
- [Custom Handles](/examples/Resizable/handles) - Customize which resize handles are available
- [Handle Types](/examples/Resizable/handle-types) - Different handle types (borders, handles, custom)
- [Aspect Ratio Lock](/examples/Resizable/aspect-ratio) - Maintain aspect ratio while resizing
- [Grid Resizing](/examples/Resizable/grid) - Snap to grid while resizing
- [Event Handling](/examples/Resizable/events) - Respond to resize events
- [Active State Modes](/examples/Resizable/active-modes) - Control when elements can be resized

## DnR Examples

The [DnR examples](/examples/DnR/) show how to use the combined `DnR` component and `useDnR` hook:

- [Basic Usage](/examples/DnR/basic) - Simple draggable and resizable element
- [Constrained DnR](/examples/DnR/constrained) - Set bounds and size constraints
- [Custom Handle](/examples/DnR/handle) - Customize drag handle
- [Handle Types](/examples/DnR/handle-types) - Different handle types
- [Window Style](/examples/DnR/window) - Create window-like UI elements
- [Event Handling](/examples/DnR/events) - Respond to drag and resize events
- [Active State Modes](/examples/DnR/active-modes) - Control when elements can be dragged or resized

## Component vs Hook Approach

Each example demonstrates both approaches:

- **Component Approach**: Using the pre-built components (`Draggable`, `Resizable`, `DnR`)
- **Hook Approach**: Using the composable hooks (`useDraggable`, `useResizable`, `useDnR`)

The component approach is simpler and requires less code, while the hook approach provides more flexibility and control for custom implementations.
