<template>
  <div
    class="my-8 overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative w-full"
  >
    <!-- Content -->
    <div class="flex flex-col md:flex-row h-full w-full relative">
      <!-- Demo Area -->
      <div class="demo-area relative h-[400px] md:h-[500px] w-full md:w-3/5 p-6 bg-background-soft dark:bg-gray-900 overflow-auto">
        <slot name="demo" />
      </div>

      <!-- Config Panel -->
      <div class="w-full md:w-2/5 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 h-[400px] md:h-[500px] overflow-y-auto">
          <div class="space-y-3">
            <slot name="config" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
