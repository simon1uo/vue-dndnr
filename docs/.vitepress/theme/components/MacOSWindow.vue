<script setup>
defineProps({
  title: {
    type: String,
    default: 'Window'
  }
})
</script>

<template>
  <div class="macos-window">
    <div class="window-titlebar">
      <div class="window-controls">
        <div class="control close" title="Close"></div>
        <div class="control minimize" title="Minimize"></div>
        <div class="control maximize" title="Maximize"></div>
      </div>
      <div class="window-title">{{ title }}</div>
      <div class="window-actions"></div>
    </div>
    <div class="window-content">
      <slot></slot>
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
  background-color: var(--color-background-soft);
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
}

html.dark .macos-window {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
</style>
