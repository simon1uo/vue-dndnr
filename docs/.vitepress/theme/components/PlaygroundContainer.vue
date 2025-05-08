<template>
  <div class="my-8 overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative min-h-100 h-fit w-full">
    <!-- Content -->
    <div class="flex flex-col md:flex-row h-full w-full relative">
      <!-- Demo Area -->
      <div class="demo-area relative h-auto w-full md:w-2/3 p-6 bg-background-soft dark:bg-gray-900">
        <slot name="demo" />
      </div>

      <!-- Config Panel -->
      <div class="w-full md:w-1/4 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 h-180 overflow-y-auto">
          <div class="space-y-3">
            <slot name="config" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
