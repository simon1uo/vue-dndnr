<script setup>
defineProps({
  label: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="flex items-center gap-2">
    <span v-if="label">{{ label }}:</span>
    <slot></slot>
  </div>
</template>
