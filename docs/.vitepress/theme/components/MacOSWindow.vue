<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Window',
})

const windowTitleBarRef = ref<HTMLElement | null>(null)
</script>

<template>
  <div class="macos-window">
    <div ref="windowTitleBarRef" class="window-titlebar">
      <div class="window-controls">
        <div class="control close" title="Close" />
        <div class="control minimize" title="Minimize" />
        <div class="control maximize" title="Maximize" />
      </div>
      <div class="window-title">
        {{ title }}
      </div>
      <div class="window-actions" />
    </div>
    <div class="window-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.macos-window {
  width: 100%;
  height: 100%;
  background-color: var(--color-background-soft);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
}

.window-titlebar {
  height: 38px;
  background-color: var(--color-background-soft) / 0.5;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  user-select: none;
}

.window-controls {
  display: flex;
  gap: 8px;
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
}

.close {
  background-color: #ff5f56;
}

.minimize {
  background-color: #ffbd2e;
}

.maximize {
  background-color: #27c93f;
}

.window-title {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.window-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: var(--color-background);
  background-opacity: 0.8;
}

html.dark .macos-window {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
</style>
