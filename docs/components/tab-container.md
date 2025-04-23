# TabContainer Component

The `TabContainer` component provides a container for creating tabbed interfaces with draggable tabs.

## Basic Usage

```vue
<script setup>
import { TabContainer } from 'vue-dndnr'
import { ref } from 'vue'

const tabs = ref([
  { id: 'tab1', title: 'Tab 1', content: 'Content for Tab 1' },
  { id: 'tab2', title: 'Tab 2', content: 'Content for Tab 2' },
  { id: 'tab3', title: 'Tab 3', content: 'Content for Tab 3' },
])
const activeTab = ref('tab1')
</script>

<template>
  <TabContainer v-model:tabs="tabs" v-model:active-tab="activeTab">
    <template #tab="{ tab }">
      {{ tab.title }}
    </template>
    <template #content="{ tab }">
      {{ tab.content }}
    </template>
  </TabContainer>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Array` | `[]` | Array of tab objects. Each tab should have a unique `id`. |
| `activeTab` | `String\|Number` | First tab's id | ID of the currently active tab. |
| `draggable` | `Boolean` | `true` | Whether tabs can be reordered by dragging. |
| `closable` | `Boolean` | `false` | Whether tabs can be closed. |
| `addable` | `Boolean` | `false` | Whether new tabs can be added. |
| `tabPosition` | `String` | `'top'` | Position of the tabs. Options: 'top', 'bottom', 'left', 'right'. |

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:tabs` | `Array` | Emitted when the tabs array changes (reordering, adding, removing). |
| `update:activeTab` | `String\|Number` | Emitted when the active tab changes. |
| `tab-click` | `{ tab, index }` | Emitted when a tab is clicked. |
| `tab-close` | `{ tab, index }` | Emitted when a tab is closed. |
| `tab-add` | None | Emitted when the add tab button is clicked. |
| `tab-reorder` | `{ oldIndex, newIndex }` | Emitted when tabs are reordered. |

## Slots

| Slot | Props | Description |
|------|-------|-------------|
| `tab` | `{ tab, index, active }` | Content for each tab. |
| `content` | `{ tab, index, active }` | Content for the active tab panel. |
| `add-button` | None | Custom add button content. |
| `close-button` | `{ tab, index }` | Custom close button content. |

## Examples

### Closable Tabs

```vue
<template>
  <TabContainer 
    v-model:tabs="tabs" 
    v-model:active-tab="activeTab"
    :closable="true"
  >
    <template #tab="{ tab }">
      {{ tab.title }}
    </template>
    <template #content="{ tab }">
      {{ tab.content }}
    </template>
  </TabContainer>
</template>
```

### With Add Button

```vue
<script setup>
import { TabContainer } from 'vue-dndnr'
import { ref } from 'vue'

const tabs = ref([
  { id: 'tab1', title: 'Tab 1', content: 'Content for Tab 1' },
  { id: 'tab2', title: 'Tab 2', content: 'Content for Tab 2' },
])
const activeTab = ref('tab1')
let nextId = 3

function handleAddTab() {
  const newId = `tab${nextId++}`
  tabs.value.push({
    id: newId,
    title: `Tab ${nextId - 1}`,
    content: `Content for Tab ${nextId - 1}`
  })
  activeTab.value = newId
}
</script>

<template>
  <TabContainer 
    v-model:tabs="tabs" 
    v-model:active-tab="activeTab"
    :closable="true"
    :addable="true"
    @tab-add="handleAddTab"
  >
    <template #tab="{ tab }">
      {{ tab.title }}
    </template>
    <template #content="{ tab }">
      {{ tab.content }}
    </template>
  </TabContainer>
</template>
```

### Custom Tab Styling

```vue
<template>
  <TabContainer v-model:tabs="tabs" v-model:active-tab="activeTab">
    <template #tab="{ tab, active }">
      <div :class="['custom-tab', { active }]">
        <span class="tab-icon">📄</span>
        {{ tab.title }}
      </div>
    </template>
    <template #content="{ tab }">
      <div class="custom-content">
        {{ tab.content }}
      </div>
    </template>
  </TabContainer>
</template>

<style scoped>
.custom-tab {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid transparent;
}
.custom-tab.active {
  border-bottom: 2px solid #3498db;
  font-weight: bold;
}
.tab-icon {
  font-size: 16px;
}
.custom-content {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}
</style>
```
