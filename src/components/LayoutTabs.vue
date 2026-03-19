<script setup lang="ts">
import { useLayoutStore } from '@/stores/layout'

const layoutStore = useLayoutStore()

const emit = defineEmits<{
  switchLayout: [name: string]
}>()

function handleClick(name: string) {
  if (name !== layoutStore.currentLayoutName) {
    emit('switchLayout', name)
  }
}
</script>

<template>
  <div v-if="layoutStore.hasMultipleLayouts" class="layout-tabs">
    <button
      v-for="layout in layoutStore.layouts"
      :key="layout.name"
      class="layout-tab"
      :class="{
        'layout-tab--active': layout.name === layoutStore.currentLayoutName,
        'layout-tab--model': layout.type === 'Model',
      }"
      :title="layout.type === 'Model' ? '모델 공간' : `배치: ${layout.name}`"
      @click="handleClick(layout.name)"
    >
      <span class="layout-tab-label">{{ layout.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.layout-tabs {
  display: flex;
  align-items: stretch;
  gap: 1px;
  height: 24px;
  padding: 0 var(--cad-space-2);
  background: var(--cad-bg-app);
  border-top: 1px solid var(--cad-border-default);
  overflow-x: auto;
  flex-shrink: 0;
}

.layout-tabs::-webkit-scrollbar {
  height: 2px;
}

.layout-tabs::-webkit-scrollbar-thumb {
  background: var(--cad-border-default);
  border-radius: 1px;
}

.layout-tab {
  display: flex;
  align-items: center;
  padding: 0 var(--cad-space-3);
  font-size: var(--cad-text-xs);
  color: var(--cad-text-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--cad-transition-fast);
  min-width: 0;
}

.layout-tab:hover:not(.layout-tab--active) {
  color: var(--cad-text-secondary);
  background: var(--cad-hover-bg);
}

.layout-tab--active {
  color: var(--cad-text-primary);
  border-bottom-color: var(--cad-accent-primary);
  font-weight: var(--cad-font-semibold);
}

.layout-tab--active.layout-tab--model {
  border-bottom-color: var(--cad-accent-primary);
}

.layout-tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}
</style>
