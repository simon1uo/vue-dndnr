<script setup lang="ts">
import { onMounted, ref } from 'vue'

const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value

  // Add transitioning class for smooth theme change
  document.documentElement.classList.add('transitioning')

  // Toggle dark class
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('vue-dndnr-theme', 'dark')
  }
  else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('vue-dndnr-theme', 'light')
  }

  // Remove transitioning class after transition completes
  setTimeout(() => {
    document.documentElement.classList.remove('transitioning')
  }, 300)
}

onMounted(() => {
  // Check for saved theme preference or system preference
  const savedTheme = localStorage.getItem('vue-dndnr-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  isDark.value = savedTheme === 'dark' || (!savedTheme && prefersDark)

  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <button
    class="theme-toggle"
    aria-label="Toggle dark mode"
    title="Toggle dark mode"
    @click="toggleTheme"
  >
    <div class="i-lucide-moon dark:i-lucide-sun text-2xl" />
  </button>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 9999px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-toggle:hover {
  background-color: var(--color-background-mute);
  transform: scale(1.05);
}

.dark .theme-toggle {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
