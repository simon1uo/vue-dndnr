# Installation

## Prerequisites

Vue DNDNR requires Vue 3 as a peer dependency.

## Installation

You can install Vue DNDNR using npm, yarn, or pnpm:

::: code-group
```bash [npm]
npm install vue-dndnr
```

```bash [yarn]
yarn add vue-dndnr
```

```bash [pnpm]
pnpm add vue-dndnr
```
:::

## Usage

### Global Registration

You can register all components globally in your main entry file:

```js
import { createApp } from 'vue'
import { DnR, Draggable, Resizable } from 'vue-dndnr'
import App from './App.vue'

const app = createApp(App)

app.component('DnR', DnR)
app.component('Draggable', Draggable)
app.component('Resizable', Resizable)

app.mount('#app')
```

### On-demand Import

You can also import components on-demand in your Vue components:

```vue
<script setup>
import { DnR, Draggable, Resizable } from 'vue-dndnr'
</script>

<template>
  <Draggable>
    <div>Drag me!</div>
  </Draggable>
</template>
```

### TypeScript Support

Vue DNDNR is written in TypeScript and provides type definitions out of the box. No additional setup is required to use it with TypeScript.
