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

- [ ] 2.2 实现基础动画
  - [ ] 2.2.1 准备 `useDnD` 以配合 `<TransitionGroup>`
    - 目标：确保 `useDnD` 的输出 (`processedItems`, `getItemProps`) 与 Vue 的 `<TransitionGroup>` 组件兼容，以实现列表项的平滑移动动画。
    - 任务：
      - 确认 `getItemProps` 提供的 `key` 对于 `<TransitionGroup>` 是唯一且稳定的。 (当前已提供 `key`)
      - 确保当 `options.items` 排序发生变化并触发 `onChange/onSort` 后，`processedItems` 的更新能够被 `<TransitionGroup>` 正确捕获以产生动画。 (当前 `processedItems` 是 `computed`, `options.items` 是 `MaybeRefOrGetter`, 应该能正常工作)
    - 成功标准：在示例代码中，当列表项排序变化时，`<TransitionGroup>` 能够平滑地动画处理列表项的移动。

  - [ ] 2.2.2 实现拖拽项的"幽灵"样式 (Ghost Class for Dragged Item)
    - 目标：当一个列表项被拖动时，该项本身（或其视觉替代物）应有独特的样式，以区别于列表中的其他静态项。
    - 任务：
      - 利用 `useDnD` 中已有的 `dragClassToApply` (来自 `options.dragClass` 或 `options.dragOptions.dragClass`)。
      - 在示例/Demo中提供默认的CSS样式给这个 `dragClassToApply`，例如半透明效果、阴影等。
      - 确保此样式在拖拽开始时应用，在拖拽结束时移除。 (当前 `useDrag` 的 `onDragStart/onDragEnd` 已处理类名切换)
    - 成功标准：被拖拽的列表项在视觉上呈现"幽灵"状态（例如，半透明）。

  - [ ] 2.2.3 实现列表项排序时的过渡动画 (Transition for Sorting)
    - 目标：当一个项目被拖放到新的位置，导致列表重新排序时，其他列表项应平滑地移动到它们的新位置。
    - 任务：
      - 在使用 `useDnD` 的示例/Demo中，将列表项的渲染包裹在 `<TransitionGroup>` 组件内。
      - 为 `<TransitionGroup>` 定义必要的 CSS 过渡类，特别是 `*-move` 类 (例如 `list-move`，如果 `<TransitionGroup name="list">`)。
      - 提供示例CSS，实现平滑的 `transform` 过渡效果。
    - 成功标准：列表项在排序操作后，能够平滑地动画到其新位置。

  - [ ] 2.2.4 实现拖放占位符效果 (Placeholder/Drop Target Indication)
    - 目标：在拖拽过程中，当鼠标悬停在有效的放置位置（项目之间或容器的有效区域）时，应有视觉指示，表明如果释放鼠标，项目将被放置在哪里。
    - 任务：
      - 方案1 (优先): 增强现有 `ghostClassValue` (来自 `options.ghostClass`) 的应用。当前它应用于 `isDropTarget` 的项。调整逻辑或CSS，使其能清晰指示插入位置（例如，在目标项上方或下方添加边框或背景）。
      - 方案2 (备选): 利用 `getPlaceholderProps`。当前 `getPlaceholderProps` 主要用于容器末尾的占位符。考虑是否扩展其功能或引入新的机制，以便在项目之间显示占位符。这可能涉及到在拖拽悬停时计算精确的插入索引，并在该位置动态渲染一个占位符元素。
      - 在示例/Demo中提供默认的CSS样式给占位符类。
    - 成功标准：当拖拽项悬停在两个列表项之间或列表的有效插入点时，出现清晰的视觉占位符（例如，一条线、一个高亮区域或被推开的项目的视觉效果）。

  - [ ] 2.2.5 更新文档和示例
    - 目标：在文档中说明如何配置和使用动画及占位符效果，并提供完整的示例代码。
    - 任务：
      - 更新 `docs/api/use-dnd.md`，添加关于如何集成 `<TransitionGroup>` 的说明。
      - 提供使用动画和占位符效果的完整代码示例。
      - 包含必要的CSS样式片段或说明如何自定义这些样式。
    - 成功标准：文档清晰地解释了如何实现和自定义拖拽动画和占位符，并提供了可工作的示例。

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

- 当前阶段：阶段 2.5.2 创建基础示例 - **基础列表排序 Demo 已创建用于测试**
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

## 执行者反馈或请求帮助

已按照指示，跳过阶段 2.2，并为阶段 2.5 创建了 `docs/api/use-dnd.md` 文件。该文件中已包含一个基础的 Demo，用于测试目前已实现的列表拖拽排序功能，包括项目间的放置逻辑和 `onSort` 回调。

Demo关键点：

- 使用 `shallowRef` 管理 `initialItems`。
- `onSort` 回调中，使用 `initialItems.value = [...newSortedItems]` 来确保响应式更新。
- 提供了基本的Vue模板来渲染可排序列表，并绑定了 `getItemProps`。
- 添加了简单的CSS样式，包括对 `item-is-drop-target` 的高亮显示。

**建议：**
请您现在使用这个 Demo (`docs/api/use-dnd.md`) 来测试以下功能点：

1. **基本拖拽**: 能否拖动列表项。
2. **项目间排序**: 能否将一个列表项拖动到另一个列表项的上方或下方，并使其正确排序。
3. **`newIndex` 计算**: 特别关注 `newIndex` 的计算是否在各种情况下都准确（例如，向上拖动、向下拖动、拖动到列表首尾）。这对应您之前在 `src/hooks/useDnD.ts` 中关于 `canDrop` 和 `newIndex` 计算的注释。
4. **`onSort` 和 `onChange` 回调**: 检查控制台输出，确认回调被正确触发，并且参数 (`oldIndex`, `newIndex`, `item`, `items`) 的值符合预期。
5. **数据响应性**: 确认列表在排序后能够正确地在界面上响应更新。
6. **拖拽到容器边缘**: 测试将项目拖到容器的空白区域（特别是末尾）是否按预期工作（目前应添加到列表末尾）。

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
