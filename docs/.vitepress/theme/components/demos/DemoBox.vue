<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title?: string
  height?: string | number
}

withDefaults(defineProps<Props>(), {
  title: '',
  height: 300,
})

const controlsVisible = ref(true)

function toggleControls(): void {
  controlsVisible.value = !controlsVisible.value
}
</script>

<template>
  <div class="flex flex-col gap-4 mb-8">
    <div v-if="title || $slots.controls" class="flex items-center justify-between">
      <h3 v-if="title" class="text-lg font-medium mb-0">
        {{ title }}
      </h3>
      <div class="flex items-center gap-2">
        <button
          v-if="$slots.controls"
          class="text-sm flex items-center gap-1 text-text-light hover:text-primary transition-colors"
          @click="toggleControls"
        >
          <span>{{ controlsVisible ? 'Hide Controls' : 'Show Controls' }}</span>
          <div class="i-lucide-settings w-4 h-4" />
        </button>
        <slot name="actions" />
      </div>
    </div>

    <!-- Controls -->
    <div v-if="$slots.controls && controlsVisible" class="flex flex-wrap gap-4 p-3 bg-background-soft rounded-lg">
      <slot name="controls" />
    </div>

    <!-- Demo playground -->
    <div
      class="relative border-2 border-dashed border-border rounded-lg "
      :style="{ height: typeof height === 'number' ? `${height}px` : height }"
    >
      <slot />
    </div>
  </div>
</template>
