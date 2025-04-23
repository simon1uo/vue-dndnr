<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <HomeHeroImage />
    </template>
  </Layout>
</template>

<style scoped></style>
