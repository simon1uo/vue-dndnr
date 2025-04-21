<script setup lang="ts">
import { ref } from 'vue'
import { DraggableExample, ResizableExample, DnRExample, UseDraggableHookExample } from './components/examples'
import ThemeToggle from './components/ThemeToggle.vue'
import { provideDndContext } from './hooks'

provideDndContext()

const activeTab = ref('draggable-hook')
</script>

<template>
  <div class="container bg-background text-text transition-colors duration-300">
    <ThemeToggle />

    <header>
      <h1 class="text-heading">
        Vue DNDNR
      </h1>
    </header>

    <main>
      <div class="tabs">
        <button class="tab-button" :class="[{ active: activeTab === 'draggable-hook' }]" @click="activeTab = 'draggable-hook'">
          useDraggable Hook
        </button>
        <button class="tab-button" :class="[{ active: activeTab === 'draggable' }]" @click="activeTab = 'draggable'">
          Draggable
        </button>
        <button class="tab-button" :class="[{ active: activeTab === 'resizable' }]" @click="activeTab = 'resizable'">
          Resizable
        </button>
        <button class="tab-button" :class="[{ active: activeTab === 'dnr' }]" @click="activeTab = 'dnr'">
          DnR
        </button>
      </div>

      <div class="tab-content">
        <UseDraggableHookExample v-if="activeTab === 'draggable-hook'" />
        <DraggableExample v-if="activeTab === 'draggable'" />
        <ResizableExample v-if="activeTab === 'resizable'" />
        <DnRExample v-if="activeTab === 'dnr'" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
}

main {
  width: 100%;
}

.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.tab-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-light, #718096);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: var(--text-color, #2d3748);
}

.tab-button.active {
  color: var(--primary-color, #4299e1);
  border-bottom-color: var(--primary-color, #4299e1);
}

.tab-content {
  padding: 1rem 0;
}

.dark .tabs {
  --border-color: #2d3748;
}

.dark .tab-button {
  --text-light: #a0aec0;
  --text-color: #e2e8f0;
  --primary-color: #63b3ed;
}
</style>
