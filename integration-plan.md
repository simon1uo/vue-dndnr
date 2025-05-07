# useDraggable 和 useResizable 整合计划（基于现有 useDnR 钩子）

## 当前状态分析

1. 现有实现
   - 已有 useDnR 钩子整合了 useDraggable 和 useResizable 功能
   - useDnR 通过组合调用 useDraggable 和 useResizable 实现功能
   - 使用 interactionMode 状态管理拖拽和缩放的互斥关系
   - 实现了基本的状态同步和事件处理

2. 现有问题
   - 代码重复：两个基础钩子中有大量重复逻辑
   - 状态管理复杂：需要在 useDnR 中手动同步多个状态
   - 事件处理冗余：每个钩子都有自己的事件处理系统
   - 性能开销：同时运行两个独立钩子可能导致性能问题
   - 功能限制：某些高级功能难以在组合模式下实现

## 优化方案

### 1. 增强 useDnR 作为核心钩子

1. 重构 useDnR 实现
   - 不再依赖 useDraggable 和 useResizable 的组合
   - 直接实现所有功能，避免重复逻辑
   - 保持与现有 API 完全兼容

2. 核心状态管理
   ```typescript
   // 统一状态管理
   const position = ref<Position>({ ...initialPosition })
   const size = ref<Size>({ ...initialSize })
   const interactionMode = ref<'idle' | 'dragging' | 'resizing'>('idle')
   const isActive = ref(initialActive ?? false)
   const startEvent = ref<PointerEvent | null>(null)
   const startPosition = ref<Position>({ ...initialPosition })
   const startSize = ref<Size>({ ...initialSize })
   const activeHandle = ref<ResizeHandle | null>(null)
   const hoverHandle = ref<ResizeHandle | null>(null)
   ```

3. 统一事件处理系统
   - 创建单一的事件处理系统，处理所有指针事件
   - 根据 interactionMode 决定事件行为
   - 实现事件委托，减少事件监听器数量

4. 整合 useResizeHandles
   - 直接在 useDnR 中使用 useResizeHandles
   - 优化自定义手柄的注册和事件绑定
   - 保持 handleType 的三种模式：'borders'、'handles' 和 'custom'

5. 统一约束处理
   - 整合边界检查逻辑
   - 整合网格对齐功能
   - 整合尺寸和位置约束

### 2. 重构 useDraggable 和 useResizable

1. 基于 useDnR 实现
   - 将 useDraggable 重构为使用 useDnR 并禁用 resize 功能
   - 将 useResizable 重构为使用 useDnR 并禁用 drag 功能
   - 保持现有 API 不变

2. 优化性能
   - 减少重复计算和状态更新
   - 使用 computed 属性优化派生状态
   - 使用 throttle 优化事件处理

### 3. 迁移策略

1. 分阶段实现
   - **阶段一**：增强 useDnR 核心实现
   - **阶段二**：重构 useDraggable 和 useResizable 使用 useDnR
   - **阶段三**：更新组件实现和文档

2. 保持向后兼容
   - 保持现有 API 不变
   - 在内部使用新的实现
   - 提供平滑迁移路径

3. 文档和示例更新
   - 更新 API 文档
   - 创建新的示例展示统一功能
   - 提供迁移指南

## 具体实现步骤

### 阶段一：增强 useDnR 核心实现

1. 重构 useDnR.ts
   - 移除对 useDraggable 和 useResizable 的依赖
   - 直接实现拖拽和缩放功能
   - 保持现有 API 不变

2. 整合事件处理
   - 实现统一的事件处理系统
   - 处理拖拽和缩放的互斥关系
   - 优化事件监听器管理

3. 整合状态管理
   - 统一管理位置和大小状态
   - 实现交互模式切换
   - 优化活动状态管理

4. 优化 useResizeHandles 集成
   - 改进自定义手柄支持
   - 优化手柄创建和管理
   - 提高性能和可维护性

### 阶段二：重构 useDraggable 和 useResizable

1. 重构 useDraggable.ts
   - 使用 useDnR 作为内部实现
   - 禁用缩放功能
   - 保持现有 API 不变

2. 重构 useResizable.ts
   - 使用 useDnR 作为内部实现
   - 禁用拖拽功能
   - 保持现有 API 不变

3. 优化性能
   - 减少不必要的计算
   - 优化状态更新
   - 使用 shallowRef 减少深层响应开销

### 阶段三：更新组件实现和文档

1. 更新组件实现
   - 更新 Draggable.vue
   - 更新 Resizable.vue
   - 更新 DnR.vue

2. 更新文档和示例
   - 更新 API 文档
   - 创建新的示例
   - 提供迁移指南

## 测试计划

1. 单元测试
   - 测试 useDnR 的所有功能
   - 测试与现有钩子的兼容性
   - 测试边界情况和错误处理

2. 集成测试
   - 测试组件与钩子的交互
   - 测试不同配置组合
   - 测试性能表现

3. 兼容性测试
   - 测试不同浏览器
   - 测试触摸和鼠标事件
   - 测试 SSR 兼容性

## 时间线

1. 第一阶段（2周）
   - 增强 useDnR 核心实现
   - 整合事件处理和状态管理
   - 初步测试和验证

2. 第二阶段（1周）
   - 重构 useDraggable 和 useResizable
   - 优化性能
   - 编写测试用例

3. 第三阶段（1周）
   - 更新组件实现
   - 完善文档和示例
   - 最终测试和性能优化

## 注意事项

1. 性能优化
   - 减少不必要的状态更新和计算
   - 优化事件处理和节流
   - 使用 shallowRef 减少深层响应开销

2. 兼容性保障
   - 保持现有 API 不变
   - 确保 SSR 兼容性
   - 支持所有现有功能

3. 代码质量
   - 完善类型定义
   - 添加详细注释
   - 遵循项目编码规范
