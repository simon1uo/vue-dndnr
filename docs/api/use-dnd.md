# useDnD

The `useDnD` hook is designed for creating sortable lists and grids with drag and drop functionality, supporting various advanced features.

## Demo

This basic demo illustrates a sortable list.

<script setup>
import { ref, shallowRef } from 'vue'
import { useDnD } from 'vue-dndnr'

const initialItems = shallowRef([
  { id: '1', data: { text: 'Item 1 (Draggable)' }, order: 1 },
  { id: '2', data: { text: 'Item 2 (Draggable)' }, order: 2 },
  { id: '3', data: { text: 'Item 3 (Draggable)' }, order: 3 },
  { id: '4', data: { text: 'Item 4 (Draggable)' }, order: 4 },
  { id: '5', data: { text: 'Item 5 (Draggable)' }, order: 5 },
])

const listContainerRef = ref(null)

const {
  processedItems,
  containerProps,
  getItemProps,
  getPlaceholderProps,
  isDragging,
  draggingItem,
} = useDnD(listContainerRef, {
  initialItems,
  getKey: item => item.id,
  animation: {
    duration: 100, // milliseconds
    easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
  },
  ghostClass: 'ghost-item-class',
  dragOptions: {
    forceFallback: true,
    stateStyles: {
      dragging: {
        opacity: '0.5',
      },
    },
  },
  onSort: (event) => {
    console.log('Sort event:', event)
  },
  onChange: (items, type) => {
    console.log('Change event:', type, items)
    initialItems.value = [...items];
  },
})

const getRawData = (item) => JSON.stringify(item.data)
const getRawDragged = () => draggingItem.value ? JSON.stringify({id: draggingItem.value.id, data: draggingItem.value.data }) : 'null'

</script>

<div class="p-5 bg-gray-100 dark:bg-gray-800 rounded-lg">
  <p class="dark:text-gray-200">Drag items to reorder them.</p>
  <p class="dark:text-gray-200"><strong>Is Dragging:</strong> {{ isDragging }}</p>
  <p class="dark:text-gray-200"><strong>Dragged Item:</strong> <span>{{ getRawDragged() }}</span></p>

  <div
    ref="listContainerRef"
    v-bind="containerProps"
    class="bg-gray-200 dark:bg-gray-700 p-2.5 rounded min-h-25 mt-3"
  >
    <template v-if="!processedItems.length">
      <div v-bind="getPlaceholderProps(0)" />
      <p class="text-gray-500 dark:text-gray-400 text-center py-2">No items to display. Drop here to add.</p>
    </template>
    <template v-else>
      <template v-for="(item, index) in processedItems" :key="item.id">
        <div v-bind="getPlaceholderProps(index)" />
        <div
          v-bind="getItemProps(item, index)"
          class="p-2.5 my-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-grab select-none hover:bg-gray-50 dark:hover:bg-gray-700 active:cursor-grabbing dark:text-gray-200"
          :class="{ 'item-is-drop-target': item['data-is-item-drop-target'] }"
        >
          <strong>ID: {{ item.id }}</strong> - {{ getRawData(item) }}
          <span v-if="item['data-is-item-drop-target']" class="font-bold text-green-600 dark:text-green-400 ml-2.5"> (Item Drop Target)</span>
        </div>
      </template>
      <div v-bind="getPlaceholderProps(processedItems.length)" />
    </template>
  </div>

  <div class="mt-5 bg-white dark:bg-gray-800 p-2.5 rounded">
    <h4 class="dark:text-gray-200">Current List Order (reactive):</h4>
    <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(processedItems, null, 2) }}</pre>
  </div>
</div>

<style>
.dragging-item-class {
  opacity: 0.5;
  background-color: #EFF6FF;
  border: 1px dashed #3B82F6;
}

.dark .dragging-item-class {
  background-color: rgba(30, 58, 138, 0.3);
  border-color: #60A5FA;
}

.ghost-item-class {
  opacity: 0.7;
  background-color: #F3F4F6;
  border: 2px dashed #60A5FA;
  min-height: 2.5rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  border-radius: 0.25rem;
}

.dark .ghost-item-class {
  background-color: #374151;
  border-color: #3B82F6;
}

.item-is-drop-target {
  background-color: #F0FDF4;
  border-color: #BBF7D0;
}

.dark .item-is-drop-target {
  background-color: rgba(6, 78, 59, 0.3);
  border-color: #047857;
}

.sortable-list-container > div:active {
  cursor: grabbing;
}
</style>

<!-- Further API details will go here -->
