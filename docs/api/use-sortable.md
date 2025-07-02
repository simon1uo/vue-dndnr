# useSortable

## Demo

<script setup>
import { ref, onMounted } from 'vue'
import { useSortable } from 'vue-dndnr'

const containerRef = ref(null)

const demoItems = ref([
  { id: 'item-1', text: '📝 Task 1' },
  { id: 'item-2', text: '🎯 Task 2' },
  { id: 'item-3', text: '🚀 Task 3' },
  { id: 'item-4', text: '✨ Task 4' }
])

const { isDragging, currentIndex } = useSortable(containerRef, demoItems, {
  animation: 50,
  onStart: (evt) => console.log('Drag started:', evt),
  onEnd: (evt) => console.log('Drag ended:', evt)
})

</script>

<DemoContainer>
   <div ref="containerRef" class="sortable-container">
    <div
      v-for="item in demoItems"
      :key="item.id"
      class="sortable-item p-3 mb-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md cursor-move select-none hover:bg-gray-50 dark:hover:bg-gray-600"
    >
      {{ item.text }}
    </div>
  </div>

  <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
    <div>Dragging: {{ isDragging ? 'Yes' : 'No' }}</div>
    <div>Current Index: {{ currentIndex ?? 'None' }}</div>
    <div>Items Count: {{ demoItems.length }}</div>
  </div>
</DemoContainer>
