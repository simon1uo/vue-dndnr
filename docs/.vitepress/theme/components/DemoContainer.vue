<script setup lang="ts">
interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
})
</script>

<template>
  <div class="rounded-lg my-6 dark:bg-gray-800 bg-gray-100 p-6">
    <div class="relative h-100 ">
      <slot />
    </div>
  </div>
</template>
