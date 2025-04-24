<script setup>
import { ref } from 'vue'
import EditorDemo from './EditorDemo.vue'
import MacOSWindow from './MacOSWindow.vue'
</script>

<template>
  <div class="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto relative">
    <div class="aspect-ratio-container">
      <MacOSWindow title="DEMO">
        <EditorDemo />
      </MacOSWindow>
    </div>
  </div>
</template>

<style scoped>
.aspect-ratio-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 aspect ratio */
}

.aspect-ratio-container :deep(.macos-window) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

@media (max-width: 640px) {
  .aspect-ratio-container {
    padding-bottom: 85%; /* Slightly taller on mobile */
  }
}
</style>
