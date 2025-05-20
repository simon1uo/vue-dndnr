# useDnD 开发规划

## 背景和动机

- 需要开发一个强大的 Vue Composition API 钩子 `useDnD`，用于创建可排序的列表和网格
- 该钩子将支持多种高级特性，包括虚拟滚动、多项选择、嵌套结构、网格布局等
- 目标是提供一个灵活且易用的 API，同时保持高性能和良好的用户体验

## 关键挑战和分析

1. 复杂性管理
   - 需要处理多个高级特性的组合
   - 需要确保各个特性之间的良好集成
   - 需要保持代码的可维护性和可测试性

2. 性能考虑
   - 大型列表的渲染性能
   - 拖拽操作的流畅度
   - 虚拟滚动的实现效率

3. 用户体验
   - 触摸设备的支持
   - 键盘可访问性
   - 动画和过渡效果

## 高层任务拆分

### 阶段 1: 基础框架搭建

- [x] 1.1 创建基础文件结构
  - [x] 创建 `src/hooks/useDnD.ts`
  - [x] 创建 `src/types/dnd.ts`
  - [x] 设置基本的类型定义和接口
  - [x] 改进类型定义的文档注释，使用 JSDoc 格式
  - [x] 扩展类型定义以支持排序功能
  - [x] 优化 `useDnD.ts` 的类型定义和声明，为集成 `useDrag` 和 `useDrop` 做准备

- [x] 1.2 实现核心状态管理 (集成 `useDrag` 和 `useDrop`)
  - [x] 在 `useDnD` 中为容器集成 `useDrop` 逻辑 (初步完成)
  - [x] 在 `getItemProps` 中为列表项集成 `useDrag` 逻辑 (初步完成)
  - [x] 实现拖拽状态 (`isDragging`, `draggedItem`) 与 `useDrag` 同步 (初步完成)
  - [x] 实现放置目标状态 (`isDropTarget`) 与 `useDrop` 同步 (初步完成)
  - [x] 实现基本的排序逻辑触发 (`onSort`, `onChange`) (初步完成)

### 阶段 2: 基础排序功能

- [x] 2.1 实现基本拖拽功能
  - [x] 实现单项目拖拽 (通过 `useDrag` 初步具备，并通过 `getItemProps` 集成)
  - [x] 实现基本的放置逻辑 (已在 `getItemProps` 中集成 `useDrop`，实现了项目间的初步放置和排序逻辑触发)
  - [x] 实现排序回调 (已在项目间 `onDrop` 中触发 `onSort` 和 `onChange`)

- [x] 2.2 实现基础动画
  - [x] 2.2.1 动画方案调研与API设计
    - 目标：实现使 `useDnD` 输出的 props 直接支持平滑移动动画。
    - 任务：
      [x] 调研 `@vueuse/core` 动画相关钩子（如 `useTransition`），分析其适用性。
      [x] 设计 `useDnD` 的动画API（如 `animation` 选项、动画参数、开关等）。
    - 成功标准：明确动画实现技术路线，API设计合理，具备可扩展性。

  - [x] 2.2.2 实现拖拽项的"幽灵"样式 (Ghost Class for Dragged Item)
    - 目标：当一个列表项被拖动时，该项本身应有独特的视觉效果（"幽灵"态），以区别于列表中的其他静态项。这是通过 `useDrag` 的 `stateStyles` 选项实现的。
    - 任务：
      [x] 移除 `UseDnDOptions` 和 `SortableDragOptions` 中的 `dragClass` 选项，推广使用 `dragOptions.stateStyles.dragging`。
      [x] 移除 `useDnD.ts` 中手动应用拖拽类名的逻辑。
      [x] 确保 `getItemProps` 返回的 `style` 属性能够正确应用来自 `useDrag` 的 `stateStyles.dragging`。
      [x] 在示例/Demo中，指导用户通过向 `useDnD` 的 `dragOptions.stateStyles.dragging` 传递样式对象来实现拖拽项的"幽灵"效果（例如，半透明、阴影等）。
    - 成功标准：被拖拽的列表项在视觉上通过内联样式（来自 `stateStyles.dragging`）呈现"幽灵"状态，不再依赖外部CSS类进行此特定效果。`useDnD` API 得到简化。

  - [x] 2.2.3 实现FLIP动画的平滑排序过渡 (已完成)
    - 目标：当一个项目被拖放到新的位置，导致列表重新排序时，其他列表项应平滑地移动到它们的新位置。
    - 任务：
      [x] 在 `useDnD` 内部追踪每个列表项的前后位置（可用 `getBoundingClientRect`）。
      [x] 在排序变更时，计算每个元素的"位移差"，用 `requestAnimationFrame` 平滑过渡 transform。
      [x] 提供动画 style 给 `getItemProps。
      [x] 支持动画参数配置（如时长、缓动）。
      [x] 更新`docs/api/use-dnd.md` 中的 Demo 以测试动画效果。
    - 成功标准：列表项在排序操作后，能够平滑地动画到其新位置，且动画参数可配置。

  - [x] 2.2.4 实现拖放占位符效果 (Placeholder/Drop Target Indication) (已完成 - Scheme 2)
    - 目标：在拖拽过程中，当鼠标悬停在有效的放置位置（项目之间或容器的有效区域）时，应有视觉指示（一个独立的占位符元素），表明如果释放鼠标，项目将被放置在哪里。
    - 任务：
      [-] ~~方案1 (优先): 增强现有 `ghostClassValue` (来自 `options.ghostClass`) 的应用。通过在 `ManagedDragItemContext` 中添加 `dropIndicatorPosition` 状态，并在 item 的 `onDragOver`/`onDragLeave` 中更新此状态。~~
      [-] ~~`getItemProps` 已更新，会输出 `data-drop-indicator-position` 属性。~~
      [-] ~~在示例/Demo中 (`docs/api/use-dnd.md`) 添加了 CSS 样式，利用 `ghostClass` 和 `data-drop-indicator-position` 来显示顶部或底部边框作为插入指示。~~
      [x] 方案2 (实施): 利用 `getPlaceholderProps`。
        [x] 添加 `placeholderIndex` 状态到 `useDnD`。
        [x] 更新 item 和 container 的 `useDrop` (onDragOver, onDragLeave, onDrop) 逻辑来管理 `placeholderIndex`。
        [x] `getPlaceholderProps(index)` 现在根据 `placeholderIndex` 控制占位符的显示，并应用 `ghostClass`。
        [x] 更新 `docs/api/use-dnd.md` Demo 以使用 `v-for` 和 `getPlaceholderProps` 渲染占位符元素，并调整/确认 `ghostClass` 的 CSS。
    - 成功标准：当拖拽项悬停在两个列表项之间或列表的有效插入点时，出现一个独立的、清晰的占位符元素（使用 `ghostClass` 样式）。占位符在拖拽结束或离开有效区域后正确消失。

  - [ ] 2.2.5 动画开关、兼容性与文档示例
    - 目标：动画能力可选、可配置，兼容虚拟滚动、SSR等场景，并有完善文档和示例。
    - 任务：
      - 提供动画开关（如 `animation: false` 可禁用动画）。
      - 兼容 SSR、虚拟滚动等场景，确保动画逻辑不会引发异常。
      - 在 API 文档中说明动画选项、用法和自定义方式。
    - 成功标准：动画与拖拽、排序等核心功能无冲突，兼容复杂场景，文档和示例清晰。

### 阶段 2.5: 文档和示例

- [ ] 2.5.1 编写基础 API 文档
  - [x] 创建 `docs/api/use-dnd.md` (已创建)
  - [ ] 编写详细的类型定义和接口说明
  - [ ] 编写参数和返回值说明
  - [ ] 编写选项配置说明
  - [ ] 编写回调函数说明

- [-] 2.5.2 创建基础示例
  - [-] 创建基础列表排序示例 (已在 `docs/api/use-dnd.md` 中添加 Demo 用于测试)
  - [ ] 创建网格排序示例
  - [ ] 添加动画效果示例
  - [ ] 编写示例代码注释

### 阶段 3: 高级特性 - 第一部分

- [ ] 3.1 实现网格布局支持
  - 添加网格布局选项
  - 实现二维位置计算
  - 优化网格拖拽体验

- [ ] 3.2 实现多项选择
  - 添加多选状态管理
  - 实现修饰键支持
  - 实现批量拖拽

### 阶段 4: 高级特性 - 第二部分

- [ ] 4.1 实现嵌套列表
  - 添加嵌套数据结构
  - 实现嵌套拖拽逻辑
  - 添加深度限制支持

- [ ] 4.2 实现虚拟滚动
  - 添加虚拟滚动选项
  - 实现窗口化渲染
  - 优化滚动性能

### 阶段 5: 优化和测试

- [ ] 5.1 性能优化
  - 优化大型列表性能
  - 优化拖拽操作性能
  - 实现必要的缓存机制

## 项目状态看板

- 当前阶段：阶段 2.2.5 动画开关、兼容性与文档示例
- 已完成：
  - [x] 创建 `src/types/dnd.ts` 文件，定义基本类型和接口
  - [x] 创建 `src/hooks/useDnD.ts` 文件，实现基本钩子框架
  - [x] 改进 `src/types/dnd.ts` 中类型定义的文档注释，使用 JSDoc 格式
  - [x] 扩展 `src/types/dnd.ts` 中类型定义以支持排序功能，并优化 `UseDnDOptions` 部分类型声明使用 `MaybeRefOrGetter`
  - [x] 优化 `src/hooks/useDnD.ts` 的类型定义和声明（使用 `shallowRef`, `markRaw`，处理未使用参数，添加 `isDropTarget` 和 `getPlaceholderProps` 占位符），为后续集成 `useDrag` 和 `useDrop` 做基础。
  - [x] 初步在 `useDnD.ts` 中集成了 `useDrop` (容器逻辑) 和 `useDrag` (列表项逻辑)，并进行了一轮类型修复尝试。
  - [x] 针对容器的 `onDrop` 事件，初步完善了 `onSort` 和 `onChange` 回调的触发逻辑及其参数的准确性。
  - [x] 在 `getItemProps` 中为每个列表项集成了 `useDrag`，实现了基本的单项目拖拽功能。
  - [x] 在 `getItemProps` 中为每个列表项集成了 `useDrop`，初步实现了项目到项目的放置逻辑，包括基于位置的 `newIndex` 计算，并触发了 `onSort` 和 `onChange` 回调。
  - [x] 创建了 `docs/api/use-dnd.md` 文件。
  - [-] 在 `docs/api/use-dnd.md` 中添加了一个基本的 Demo 部分，用于测试当前的列表排序功能。
  - [x] 扩展 `src/types/dnd.ts` 中类型定义以支持排序功能，并优化
  - [x] 2.2.1 动画方案调研与API设计 - 完成
  - [x] 2.2.2 实现拖拽项的"幽灵"样式 - 完成
  - [x] 2.2.3 实现FLIP动画的平滑排序过渡 - 完成
  - [x] 2.2.4 实现拖放占位符效果 (Placeholder/Drop Target Indication) - 完成 (Scheme 2)

## 执行者反馈或请求帮助

## 经验教训

- 在开始实现之前，先定义清晰的类型和接口有助于后续开发。
- 使用 TypeScript 的类型系统（包括 `shallowRef`, `markRaw`）可以帮助我们更好地理解和管理复杂的状态，特别是涉及泛型和响应式对象时。
- 将功能模块化，便于后续扩展和维护。
- 使用 JSDoc 格式的文档注释可以提高代码的可读性和可维护性。
- 为接口和属性添加详细的文档说明，包括参数、返回值和默认值，有助于其他开发者理解和使用。
- 通过扩展现有接口而不是创建新的接口，可以更好地复用现有代码。
- 在设计 API 时，考虑向后兼容性和扩展性很重要。
- 对于 Vue Composition API，正确使用 `shallowRef` 和 `markRaw` 对于处理包含复杂或泛型数据的响应式状态至关重要，可以避免不必要的性能开销和类型问题。
- 集成多个复杂钩子时，类型匹配和正确传递泛型参数非常关键。**特别要注意区分 `DragData<P>` 和其负载 `P` 本身。**
