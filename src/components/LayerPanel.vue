<script setup lang="ts">
import { useLayerStore } from '@/stores/layer'
import { EyeIcon, EyeOffIcon } from 'lucide-vue-next'

const emit = defineEmits<{
  toggleVisibility: [layerName: string, visible: boolean]
  toggleAll: [visible: boolean]
}>()

const layerStore = useLayerStore()

function handleToggle(name: string) {
  const layer = layerStore.layers.find((l) => l.name === name)
  if (layer) {
    const newVisible = !layer.visible
    layerStore.toggleLayerVisibility(name)
    emit('toggleVisibility', name, newVisible)
  }
}

function handleAllOn() {
  layerStore.setAllVisible(true)
  emit('toggleAll', true)
}

function handleAllOff() {
  layerStore.setAllVisible(false)
  emit('toggleAll', false)
}
</script>

<template>
  <aside class="layer-panel-root">
    <div class="layer-panel-header">
      <span class="layer-panel-title">Layers</span>
      <span class="layer-panel-count">{{ layerStore.visibleCount }}/{{ layerStore.totalCount }}</span>
    </div>

    <div class="layer-panel-actions">
      <button class="layer-action-button" title="모두 켜기" @click="handleAllOn">All On</button>
      <button class="layer-action-button" title="모두 끄기" @click="handleAllOff">All Off</button>
    </div>

    <div v-if="layerStore.layers.length === 0" class="layer-panel-empty">
      <p>파일을 열면 레이어가 표시됩니다</p>
    </div>

    <div v-else class="layer-list">
      <button
        v-for="layer in layerStore.layers"
        :key="layer.name"
        class="layer-item"
        :class="{
          'layer-item--selected': layerStore.selectedLayerName === layer.name,
          'layer-item--hidden': !layer.visible,
        }"
        @click="layerStore.selectLayer(layer.name)"
      >
        <span
          class="layer-color-swatch"
          :style="{ backgroundColor: layer.color }"
        />
        <span class="layer-name">{{ layer.name }}</span>
        <button
          class="layer-visibility-toggle"
          :title="layer.visible ? '숨기기' : '표시'"
          @click.stop="handleToggle(layer.name)"
        >
          <EyeIcon v-if="layer.visible" :size="14" :stroke-width="1.5" />
          <EyeOffIcon v-else :size="14" :stroke-width="1.5" />
        </button>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.layer-panel-root {
  width: var(--cad-properties-width);
  display: flex;
  flex-direction: column;
  background: var(--cad-bg-panel);
  border-left: 1px solid var(--cad-border-default);
  user-select: none;
  overflow: hidden;
}

.layer-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--cad-space-2) var(--cad-space-3);
  border-bottom: 1px solid var(--cad-border-default);
}

.layer-panel-title {
  font-size: var(--cad-text-sm);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-primary);
}

.layer-panel-count {
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
  font-family: var(--cad-font-mono);
}

.layer-panel-actions {
  display: flex;
  gap: var(--cad-space-1);
  padding: var(--cad-space-1) var(--cad-space-2);
  border-bottom: 1px solid var(--cad-border-default);
}

.layer-action-button {
  flex: 1;
  padding: 2px var(--cad-space-2);
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-secondary);
  background: transparent;
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.layer-action-button:hover {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.layer-panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--cad-space-4);
}

.layer-panel-empty p {
  font-size: var(--cad-text-xs);
  color: var(--cad-text-muted);
  text-align: center;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--cad-space-1) 0;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  width: 100%;
  padding: var(--cad-space-1) var(--cad-space-3);
  font-size: var(--cad-text-sm);
  color: var(--cad-text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--cad-transition-fast);
  text-align: left;
}

.layer-item:hover {
  background: var(--cad-hover-bg);
}

.layer-item--selected {
  background: var(--cad-accent-active-bg);
}

.layer-item--hidden {
  opacity: 0.5;
}

.layer-item--hidden .layer-name {
  text-decoration: line-through;
}

.layer-color-swatch {
  width: 12px;
  height: 12px;
  border-radius: var(--cad-radius-full);
  border: 1px solid var(--cad-border-default);
  flex-shrink: 0;
}

.layer-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-visibility-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--cad-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  flex-shrink: 0;
}

.layer-visibility-toggle:hover {
  color: var(--cad-text-primary);
  background: var(--cad-hover-bg-strong);
}
</style>
