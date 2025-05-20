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
  isDragging,
  draggedItem,
  // isDropTarget, // For container drop target state
} = useDnD(listContainerRef, {
  items: initialItems,
  getKey: item => item.id,
  // Example onSort handler to update the items array
  onSort: (event) => {
    console.log('Sort event:', event)

  },
  onChange: (items, type) => {
    console.log('Change event:', type, items)
    initialItems.value = [...items];
  },
})

// Helper to see the internal state for the demo
const getRawData = (item) => JSON.stringify(item.data)
const getRawDragged = () => draggedItem.value ? JSON.stringify({id: draggedItem.value.id, data: draggedItem.value.data }) : 'null'

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
    <p v-if="!processedItems.length" class="text-gray-500 dark:text-gray-400">No items to display.</p>
    <div
      v-for="(item, index) in processedItems"
      v-bind="getItemProps(item, index)"
      :key="item.id"
      class="p-2.5 my-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-grab select-none hover:bg-gray-50 dark:hover:bg-gray-700 active:cursor-grabbing dark:text-gray-200"
      :class="{ 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700': item['data-is-item-drop-target'] }"
    >
      <strong>ID: {{ item.id }}</strong> - {{ getRawData(item) }}
      <span v-if="item['data-is-item-drop-target']" class="font-bold text-green-600 dark:text-green-400 ml-2.5"> (Drop Target)</span>
    </div>
  </div>

  <div class="mt-5 bg-white dark:bg-gray-800 p-2.5 rounded">
    <h4 class="dark:text-gray-200">Current List Order (reactive):</h4>
    <pre class="whitespace-pre-wrap break-words dark:text-gray-300">{{ JSON.stringify(processedItems, null, 2) }}</pre>
  </div>
</div>

<style>
.dragging-item-class {
  @apply opacity-50 bg-blue-50 dark:bg-blue-900/30 border border-dashed border-blue-500 dark:border-blue-400;
}

.ghost-item-class {
  @apply opacity-70 bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-500 dark:border-gray-400 min-h-10 flex items-center justify-center text-gray-500 dark:text-gray-400;
}

/* Example styling for when an item is a drop target */
.item-is-drop-target {
  background-color: #d4edda !important; /* Light green */
  border-color: #c3e6cb !important;
}

.sortable-list-container > div:active {
  cursor: grabbing;
}
</style>

<!-- Further API details will go here -->
