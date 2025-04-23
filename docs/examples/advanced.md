# Advanced Examples

This section provides more advanced examples of how to use Vue DNDNR components and hooks.

## Dashboard Layout

A dashboard with multiple draggable and resizable widgets.

```vue
<script setup>
import { DnR } from 'vue-dndnr'
import { ref } from 'vue'

const widgets = ref([
  { id: 1, position: { x: 20, y: 20 }, size: { width: 300, height: 200 }, title: 'Widget 1', color: '#3498db' },
  { id: 2, position: { x: 340, y: 20 }, size: { width: 300, height: 200 }, title: 'Widget 2', color: '#2ecc71' },
  { id: 3, position: { x: 20, y: 240 }, size: { width: 300, height: 200 }, title: 'Widget 3', color: '#9b59b6' },
  { id: 4, position: { x: 340, y: 240 }, size: { width: 300, height: 200 }, title: 'Widget 4', color: '#e74c3c' },
])

function updateWidgetPosition(id, position) {
  const widget = widgets.value.find(w => w.id === id)
  if (widget) {
    widget.position = position
  }
}

function updateWidgetSize(id, size) {
  const widget = widgets.value.find(w => w.id === id)
  if (widget) {
    widget.size = size
  }
}
</script>

<template>
  <div class="dashboard">
    <DnR 
      v-for="widget in widgets" 
      :key="widget.id"
      v-model:position="widget.position"
      v-model:size="widget.size"
      bounds="parent"
      :min-width="200"
      :min-height="150"
      @update:position="updateWidgetPosition(widget.id, $event)"
      @update:size="updateWidgetSize(widget.id, $event)"
    >
      <div class="widget" :style="{ backgroundColor: widget.color }">
        <div class="widget-header">
          {{ widget.title }}
        </div>
        <div class="widget-content">
          <div>Position: {{ widget.position.x }}, {{ widget.position.y }}</div>
          <div>Size: {{ widget.size.width }} x {{ widget.size.height }}</div>
        </div>
      </div>
    </DnR>
  </div>
</template>

<style scoped>
.dashboard {
  position: relative;
  width: 100%;
  height: 600px;
  background-color: #f8f9fa;
  border: 2px dashed #ccc;
  margin-bottom: 20px;
}

.widget {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.widget-header {
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.1);
  color: white;
  font-weight: bold;
  cursor: move;
}

.widget-content {
  flex: 1;
  padding: 15px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
```

## Custom Handles for Resizable

A resizable element with custom resize handles.

```vue
<script setup>
import { Resizable } from 'vue-dndnr'
import { ref } from 'vue'

const size = ref({ width: 300, height: 200 })
</script>

<template>
  <div class="example-container">
    <Resizable 
      v-model:size="size" 
      :min-width="200" 
      :min-height="150"
      class="custom-resizable"
    >
      <template #handle-se>
        <div class="custom-handle custom-handle-se">
          <div class="handle-icon">↘</div>
        </div>
      </template>
      <template #handle-sw>
        <div class="custom-handle custom-handle-sw">
          <div class="handle-icon">↙</div>
        </div>
      </template>
      <template #handle-ne>
        <div class="custom-handle custom-handle-ne">
          <div class="handle-icon">↗</div>
        </div>
      </template>
      <template #handle-nw>
        <div class="custom-handle custom-handle-nw">
          <div class="handle-icon">↖</div>
        </div>
      </template>
      
      <div class="content">
        <h3>Custom Resize Handles</h3>
        <div>Size: {{ size.width }} x {{ size.height }}</div>
      </div>
    </Resizable>
  </div>
</template>

<style scoped>
.example-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px dashed #ccc;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-resizable {
  background-color: #3498db;
  border-radius: 8px;
  overflow: visible;
}

.content {
  width: 100%;
  height: 100%;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.custom-handle {
  position: absolute;
  width: 24px;
  height: 24px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.handle-icon {
  font-size: 14px;
  color: #3498db;
}

.custom-handle-se {
  bottom: -12px;
  right: -12px;
}

.custom-handle-sw {
  bottom: -12px;
  left: -12px;
}

.custom-handle-ne {
  top: -12px;
  right: -12px;
}

.custom-handle-nw {
  top: -12px;
  left: -12px;
}
</style>
```

## Nested Draggable Elements

An example of nested draggable elements with proper event handling.

```vue
<script setup>
import { Draggable } from 'vue-dndnr'
import { ref } from 'vue'

const outerPosition = ref({ x: 100, y: 100 })
const innerPosition1 = ref({ x: 20, y: 20 })
const innerPosition2 = ref({ x: 20, y: 150 })
</script>

<template>
  <div class="example-container">
    <Draggable 
      v-model:position="outerPosition" 
      bounds="parent"
      class="outer-draggable"
    >
      <div class="outer-content">
        <h3>Parent Container</h3>
        <p>Position: {{ outerPosition.x }}, {{ outerPosition.y }}</p>
        
        <Draggable 
          v-model:position="innerPosition1" 
          bounds="parent"
          class="inner-draggable"
          :cancel="'.content'"
        >
          <div class="inner-content" style="background-color: #2ecc71;">
            <div class="handle">Drag Here</div>
            <div class="content">
              <p>Child 1</p>
              <p>Position: {{ innerPosition1.x }}, {{ innerPosition1.y }}</p>
            </div>
          </div>
        </Draggable>
        
        <Draggable 
          v-model:position="innerPosition2" 
          bounds="parent"
          class="inner-draggable"
          :cancel="'.content'"
        >
          <div class="inner-content" style="background-color: #e74c3c;">
            <div class="handle">Drag Here</div>
            <div class="content">
              <p>Child 2</p>
              <p>Position: {{ innerPosition2.x }}, {{ innerPosition2.y }}</p>
            </div>
          </div>
        </Draggable>
      </div>
    </Draggable>
  </div>
</template>

<style scoped>
.example-container {
  position: relative;
  width: 100%;
  height: 600px;
  border: 2px dashed #ccc;
  margin-bottom: 20px;
}

.outer-draggable {
  position: absolute;
}

.outer-content {
  width: 500px;
  height: 400px;
  background-color: #3498db;
  border-radius: 8px;
  padding: 20px;
  color: white;
  position: relative;
}

.inner-draggable {
  position: absolute;
}

.inner-content {
  width: 200px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.handle {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 8px;
  text-align: center;
  cursor: move;
  font-weight: bold;
}

.content {
  padding: 10px;
  text-align: center;
}
</style>
```

## Interactive Form Builder

A simple form builder with draggable and resizable form elements.

```vue
<script setup>
import { Draggable, DnR } from 'vue-dndnr'
import { ref } from 'vue'

const formElements = ref([
  { id: 1, type: 'text', label: 'Name', position: { x: 50, y: 50 }, size: { width: 300, height: 80 } },
  { id: 2, type: 'email', label: 'Email', position: { x: 50, y: 150 }, size: { width: 300, height: 80 } },
  { id: 3, type: 'textarea', label: 'Message', position: { x: 50, y: 250 }, size: { width: 300, height: 120 } },
])

const toolboxItems = ref([
  { type: 'text', label: 'Text Input' },
  { type: 'email', label: 'Email Input' },
  { type: 'textarea', label: 'Text Area' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'select', label: 'Select Dropdown' },
])

let nextId = 4

function addFormElement(type, label) {
  formElements.value.push({
    id: nextId++,
    type,
    label,
    position: { x: 50, y: 50 + (formElements.value.length * 100) },
    size: { width: 300, height: type === 'textarea' ? 120 : 80 }
  })
}

function getFormElementComponent(type) {
  switch (type) {
    case 'text':
    case 'email':
      return 'input'
    case 'textarea':
      return 'textarea'
    case 'checkbox':
      return 'input'
    case 'select':
      return 'select'
    default:
      return 'input'
  }
}

function getFormElementType(type) {
  switch (type) {
    case 'text':
    case 'email':
    case 'checkbox':
      return type
    default:
      return null
  }
}
</script>

<template>
  <div class="form-builder">
    <div class="toolbox">
      <h3>Form Elements</h3>
      <div 
        v-for="item in toolboxItems" 
        :key="item.type"
        class="toolbox-item"
        @click="addFormElement(item.type, item.label)"
      >
        {{ item.label }}
      </div>
    </div>
    
    <div class="canvas">
      <DnR 
        v-for="element in formElements" 
        :key="element.id"
        v-model:position="element.position"
        v-model:size="element.size"
        bounds="parent"
        :min-width="200"
        :min-height="60"
      >
        <div class="form-element">
          <div class="element-header">
            {{ element.label }}
          </div>
          <div class="element-content">
            <label :for="`element-${element.id}`">{{ element.label }}</label>
            <component 
              :is="getFormElementComponent(element.type)" 
              :id="`element-${element.id}`"
              :type="getFormElementType(element.type)"
              :placeholder="`Enter ${element.label.toLowerCase()}`"
              class="form-control"
            />
          </div>
        </div>
      </DnR>
    </div>
  </div>
</template>

<style scoped>
.form-builder {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.toolbox {
  width: 200px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbox h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.toolbox-item {
  padding: 10px;
  background-color: #3498db;
  color: white;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toolbox-item:hover {
  background-color: #2980b9;
}

.canvas {
  flex: 1;
  height: 600px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #ccc;
  position: relative;
}

.form-element {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.element-header {
  padding: 8px 12px;
  background-color: #3498db;
  color: white;
  font-weight: bold;
  cursor: move;
}

.element-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.form-control {
  margin-top: 5px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

textarea.form-control {
  resize: none;
  height: 60px;
}
</style>
```
