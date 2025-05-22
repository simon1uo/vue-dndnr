# useDrag 和 useDrop 类型重构计划

## 背景和动机

 useDrag 和 useDrop 当前实现包含了丰富但复杂的API接口。我们需要简化这些接口，减少复杂性，将拖拽系统从复杂的数据传输转变为基于ID和类型的简单识别系统。这将使组件更易于使用和维护，同时保持核心功能。

## 关键挑战和分析

### 当前实现分析

1. **DragData接口**：
   - 目前使用`DragData`接口包含type、payload和source信息
   - `payload`可以是任意类型(`unknown`)，增加了类型安全的挑战
   - source信息包括id、index和containerId，这与我们想要的新接口有一定重叠

2. **数据传输机制**：
   - 使用全局`dragStore`存储和共享拖拽数据
   - 使用复杂的数据提取和验证逻辑，处理多种数据格式
   - 使用`DataTransfer`API和fallback机制传输数据

3. **类型验证逻辑**：
   - `useDrop`中的`accept`属性用于验证可接受的拖拽类型
   - 验证逻辑与DragData的type字段绑定

### 重构挑战

1. 移除`DragData`同时保持拖拽功能
2. 简化数据传输逻辑，同时支持HTML5和fallback模式
3. 修改类型验证系统，适应新的类型定义
4. 保持API一致性和可用性，同时减少复杂性

## 高层任务拆分

### 1. 修改类型定义 (src/types/dnd.ts)

- 删除`DragData`接口定义
- 修改`DragOptions`接口：
  - 移除`data`属性
  - 添加必填的`dragId: string`属性
  - 添加必填的`index: number`属性
  - 添加`type: string = 'default'`属性，提供默认值
- 修改`DropOptions`接口：
  - 添加必填的`dropId: string`属性
  - 更新`accept`属性类型为`string | string[] | ((type: string) => boolean)`
  - 更新回调函数签名，移除`DragData`相关参数

### 2. 更新全局存储机制 (src/utils/dragStore.ts)

- 修改`ActiveDragContext`接口：
  - 删除`data: DragData<T>`
  - 添加新属性：
    - `dragId: string`
    - `index: number`
    - `type: string`
    - `sourceDropId?: string`
- 更新`dragStore`的方法签名和实现：
  - 提取类型到 `src/types/dnd.ts` 中导出
  - 修改`setActiveDrag`方法
  - 修改`getActiveDrag`方法
  - 更新`getDataById`和`hasDataById`方法
  - 添加获取拖拽项信息的辅助方法

### 3. 重构useDrag (src/hooks/useDrag.ts)

- 更新参数和返回值：
  - 添加对必填参数的验证 (`dragId`, `index`)
  - 移除`data`相关处理逻辑
- 更新拖拽事件处理：
  - 修改`handleDragStart`，使用新属性
  - 简化数据传输逻辑，只传递必要的ID和类型信息
- 更新返回值和清理逻辑

### 4. 重构useDrop (src/hooks/useDrop.ts)

- 更新参数和返回值：
  - 添加对必填参数的验证 (`dropId`)
  - 更新`accept`属性处理逻辑
- 更新放置事件处理：
  - 修改数据提取逻辑，基于新的ID和类型系统
  - 更新类型验证逻辑，验证拖拽项的`type`
  - 修改事件回调，提供新的参数格式
- 更新返回值和清理逻辑

### 5. 更新文档和示例

- 更新`useDrag.md` 和 `useDrop.md` 文档中的API描述和示例
- 确保Playground示例与新的API一致

## 项目状态看板

- [x] 分析当前代码实现
- [x] 修改类型定义 (src/types/dnd.ts)
- [x] 更新全局存储机制 (src/utils/dragStore.ts)
- [x] 重构useDrag (src/hooks/useDrag.ts)
- [x] 重构useDrop (src/hooks/useDrop.ts)
- [x] 更新 Drop.vue 组件 (src/components/Drop.vue)
- [ ] 更新 Drag.vue 组件 (src/components/Drag.vue)
- [ ] 更新文档和示例

## 执行者反馈或请求帮助

- 已完成类型定义重构，DragData 已移除，DragOptions/DropOptions 已按新方案调整。
- 已完成全局存储机制 (src/utils/dragStore.ts) 的更新。ActiveDragContext 接口已移至 dnd.ts 并更新了其结构。dragStore 中的 setActiveDrag, getActiveDrag 等方法已相应修改。getDataById 已被移除 。
- 已完成 useDrag (src/hooks/useDrag.ts) 的重构，已完全移除 DragData 和 payload 相关逻辑，参数和全局存储均已切换为 dragId/index/type 方案。
- 已完成 useDrop (src/hooks/useDrop.ts) 的重构，已完全移除 DragData 和 payload 相关逻辑，参数和全局存储均已切换为 dragId/index/type 方案。
- 已完成 Drop.vue 组件 (src/components/Drop.vue) 的 API 适配和类型更新，所有 emits、props、事件处理均已切换为 { dragId, index, type } 结构，等待用户验收。

请规划者确认项目是否完成。

## 经验教训

- 在进行API重设计时，需要均衡简洁性和功能性
- 修改前后进行完整测试，确保功能不受影响
- 保留核心功能，同时减少不必要的复杂性
- 使用强类型和必填参数验证可以显著提高API的可靠性和易用性
- 命名规范化（如 `dragId`/`dropId`）可以提高代码的一致性和可读性
- 基于ID的系统比复杂的数据传输系统更易于维护和扩展
- 注意重设计API时避免修改原有的逻辑，重写之前请询问用户
