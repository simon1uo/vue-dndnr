<script setup lang="ts">
import { BasicExample } from './components/examples'
import ThemeToggle from './components/ThemeToggle.vue'
import { provideDndContext } from './hooks'

provideDndContext()
</script>

<template>
  <div class="container bg-background text-text transition-colors duration-300">
    <ThemeToggle />

    <header>
      <h1 class="text-heading">
        Vue DNDNR
      </h1>
      <p class="text-text-light">
        Vue 3 Draggable, Droppable, and Resizable Component Library
      </p>
    </header>

    <main>
      <BasicExample />
    </main>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
}

main {
  width: 100%;
}
</style>
