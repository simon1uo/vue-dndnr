<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  description?: string
  type?: 'checkbox' | 'select' | 'number' | 'text' | 'range'
  modelValue?: any
  options?: { label: string, value: any }[]
  min?: number
  max?: number
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'checkbox',
  description: '',
  options: () => [],
  min: 0,
  max: 100,
  step: 1,
})

const emit = defineEmits(['update:modelValue'])

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement

  if (props.type === 'checkbox') {
    emit('update:modelValue', (target as HTMLInputElement).checked)
  }
  else if (props.type === 'number' || props.type === 'range') {
    emit('update:modelValue', Number(target.value))
  }
  else {
    emit('update:modelValue', target.value)
  }
}

const inputId = computed(() => `config-${props.label.toLowerCase().replace(/\s+/g, '-')}`)
</script>

<template>
  <div class="config-option mb-2">
    <div class="flex justify-between items-center mb-1">
      <label :for="inputId" class="text-sm font-light  text-gray-700 dark:text-gray-300" :title="description">{{ label
      }}</label>

      <!-- Checkbox type -->
      <div v-if="type === 'checkbox'" class="flex items-center">
        <input
          :id="inputId" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          :checked="modelValue" :title="description" @change="updateValue"
        >
      </div>
    </div>
    <div v-if="type === 'select'" class="relative">
      <select
        :id="inputId"
        class="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm shadow-sm focus:border-primary focus:ring-primary p-1 cursor-pointer"
        :value="modelValue" :title="description" @change="updateValue"
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Number type -->
    <input
      v-if="type === 'number'" :id="inputId" type="number"
      class="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm shadow-sm focus:border-primary focus:ring-primary"
      :value="modelValue" :min="min" :max="max" :step="step" :title="description" @input="updateValue"
    >

    <!-- Text type -->
    <input
      v-if="type === 'text'" :id="inputId" type="text"
      class="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm shadow-sm focus:border-primary focus:ring-primary"
      :value="modelValue" :title="description" @input="updateValue"
    >

    <!-- Range type -->
    <div v-if="type === 'range'" class="flex flex-col">
      <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{{ min }}</span>
        <span>{{ modelValue }}</span>
        <span>{{ max }}</span>
      </div>
      <input
        :id="inputId" type="range"
        class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" :value="modelValue"
        :min="min" :max="max" :step="step" :title="description" @input="updateValue"
      >
    </div>
  </div>
</template>

<style scoped>
/* Custom styling for range input */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 4px;
  background: var(--color-background-mute);
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  transition: background 0.2s;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  transition: background 0.2s;
  border: none;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: var(--color-primary-dark);
}

input[type="range"]::-moz-range-thumb:hover {
  background: var(--color-primary-dark);
}

select {
  position: relative;
  z-index: 10;
  transition: all 0.2s ease;
}

select option {
  background-color: var(--color-background-soft);
  color: var(--color-text);
  padding: 8px 12px;
}

select:hover {
  border-color: var(--color-primary-light);
}

select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light, rgba(64, 179, 140, 0.2));
  outline: none;
}

/* Style for select in dark mode */
.dark select {
  border-color: var(--color-border);
  background-color: var(--color-background-soft);
}

.dark select:hover {
  border-color: var(--color-primary);
}

.dark select:focus {
  border-color: var(--color-primary-light);
  box-shadow: 0 0 0 2px var(--color-primary-dark, rgba(51, 160, 125, 0.3));
}
</style>
