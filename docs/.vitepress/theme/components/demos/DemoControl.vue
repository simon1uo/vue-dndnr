<script setup lang="ts">
interface Props {
  label?: string
}

withDefaults(defineProps<Props>(), {
  label: '',
})
</script>

<template>
  <div class="flex items-center gap-2">
    <span v-if="label">{{ label }}:</span>
    <slot />
  </div>
</template>
