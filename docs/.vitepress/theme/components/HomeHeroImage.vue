<script setup>
import { ref } from 'vue'
import EditorDemo from './EditorDemo.vue'
import MacOSWindow from './MacOSWindow.vue'
</script>

<template>
  <div class="w-80 h-80">
    <MacOSWindow title="DEMO">
      <EditorDemo />
    </MacOSWindow>
  </div>
</template>
