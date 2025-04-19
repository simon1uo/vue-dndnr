<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  tabs: {
    id: string
    label: string
  }[]
  activeTab?: string
}>()

const emit = defineEmits(['update:activeTab'])
const activeTabInternal = ref(props.activeTab || (props.tabs.length > 0 ? props.tabs[0].id : ''))
watch(() => props.activeTab, (newValue) => {
  if (newValue && newValue !== activeTabInternal.value) {
    activeTabInternal.value = newValue
  }
}, { immediate: true })

function setActiveTab(tabId: string) {
  activeTabInternal.value = tabId
  emit('update:activeTab', tabId)
}
</script>

<template>
  <div class="tab-container">
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTabInternal === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-content">
      <slot :active-tab="activeTabInternal" />
    </div>
  </div>
</template>

<style scoped>
.tab-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.tab-header {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
  overflow-x: auto;
}

.tab-button {
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-light);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-button:hover {
  color: var(--color-primary);
  background-color: var(--color-background-mute);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  background-color: var(--color-background);
}

.tab-content {
  padding: 20px;
  background-color: var(--color-background);
}
</style>
