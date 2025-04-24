<script setup lang="ts">
import { useData } from 'vitepress'
import { DnR, Draggable } from 'vue-dndnr'
import EditorDemo from './EditorDemo.vue'
import MacOSWindow from './MacOSWindow.vue'
import { ref } from 'vue'

const { frontmatter } = useData()

const windowSize = ref({ width: 800, height: 100 })
</script>

<template>
  <div class="HomeHero">
    <div class="flex flex-col mx-auto">
      <div class="flex justify-start relative">
        <h1
          class="font-heading flex flex-col w-fit text-32px sm:text-48px md:text-56px font-extrabold mx-auto max-w-576px lh-0.9em">
          <span>
            {{ frontmatter.hero.name }}
          </span>
          <p class="font-light">
            <span class="font-heading-serif">Draggable/Resizable/Droppable</span>
            <span class="font-normal"> library</span>
          </p>
        </h1>

        <Draggable>
          <div class="shadow-lg hover:shadow-2xl absolute  bg-slate w-100px h-100px border-rd-50%" />
        </Draggable>
      </div>
    </div>

    <div
      class="w-full min-h-100 h-fit relative max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto relative">
      <DnR v-model:size="windowSize">
        <MacOSWindow title="DEMO">
          <EditorDemo />
        </MacOSWindow>
      </DnR>
    </div>
  </div>
</template>

<style scoped>
.HomeHero {
  margin-top: calc((var(--vp-nav-height) + var(--vp-layout-top-height, 0px)) * -1);
  padding: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 48px) 24px 48px;
}

@media (min-width: 640px) {
  .HomeHero {
    padding: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 80px) 48px 64px;
  }
}

@media (min-width: 960px) {
  .HomeHero {
    padding: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 80px) 64px 64px;
  }
}

.aspect-ratio-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%;
  /* 4:3 aspect ratio */
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
    padding-bottom: 85%;
    /* Slightly taller on mobile */
  }
}
</style>
