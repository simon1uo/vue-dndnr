<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <div class="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 w-full">
        <HomeHeroImage />
      </div>
    </template>
  </Layout>
</template>

<style scoped>
 
:deep(.VPHomeHero .container) {
  display: flex; 
  align-items: center;
}

:deep(.VPHomeHero .image) {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
   
}
:deep(.VPHomeHero .image .image-container) {
  height: fit-content;
}

@media (max-width: 640px) {
  :deep(.VPHero) {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}
</style>
