<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { formatFileSize } from '@/utils/format'
import { Settings2Icon, XIcon, FileIcon } from 'lucide-vue-next'

const store = useAppStore()
</script>

<template>
  <aside class="properties-root">
    <!-- 헤더 -->
    <div class="properties-header">
      <div class="properties-header-left">
        <Settings2Icon :size="14" :stroke-width="1.5" />
        <span>속성</span>
      </div>
      <button
        class="close-button"
        title="패널 닫기"
        @click="store.togglePropertiesPanel()"
      >
        <XIcon :size="14" :stroke-width="1.5" />
      </button>
    </div>

    <!-- 파일 정보 (로드됨) -->
    <div v-if="store.fileInfo" class="properties-content">
      <div class="property-section">
        <div class="property-section-title">파일 정보</div>
        <div class="property-row">
          <FileIcon :size="12" :stroke-width="1.5" class="property-icon" />
          <span class="property-label">이름</span>
          <span class="property-value" :title="store.fileInfo.name">
            {{ store.fileInfo.name }}
          </span>
        </div>
        <div class="property-row">
          <span class="property-label-indent">크기</span>
          <span class="property-value">
            {{ formatFileSize(store.fileInfo.size) }}
          </span>
        </div>
        <div class="property-row">
          <span class="property-label-indent">형식</span>
          <span class="property-value">
            {{ store.fileInfo.type }}
          </span>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="properties-empty">
      <p>파일을 열면<br />정보가 표시됩니다</p>
    </div>
  </aside>
</template>

<style scoped>
.properties-root {
  width: var(--cad-properties-width);
  display: flex;
  flex-direction: column;
  background: var(--cad-bg-panel);
  border-left: 1px solid var(--cad-border-default);
  overflow-y: auto;
}

.properties-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--cad-space-2) var(--cad-space-3);
  border-bottom: 1px solid var(--cad-border-default);
}

.properties-header-left {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  font-size: var(--cad-text-sm);
  font-weight: var(--cad-font-medium);
  color: var(--cad-text-primary);
}

.close-button {
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
  transition: all var(--cad-transition-fast);
}

.close-button:hover {
  color: var(--cad-text-primary);
  background: var(--cad-hover-bg);
}

.properties-content {
  padding: var(--cad-space-2) 0;
}

.property-section {
  padding: 0 var(--cad-space-3);
}

.property-section-title {
  font-size: var(--cad-text-2xs);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: var(--cad-space-2);
  border-bottom: 1px solid var(--cad-border-default);
  margin-bottom: var(--cad-space-2);
}

.property-row {
  display: flex;
  align-items: center;
  gap: var(--cad-space-1);
  padding: var(--cad-space-1) 0;
  font-size: var(--cad-text-xs);
}

.property-icon {
  color: var(--cad-text-muted);
  flex-shrink: 0;
}

.property-label {
  color: var(--cad-text-secondary);
  min-width: 36px;
}

.property-label-indent {
  color: var(--cad-text-secondary);
  min-width: 36px;
  padding-left: 16px;
}

.property-value {
  color: var(--cad-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-2xs);
}

.properties-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--cad-space-4);
}

.properties-empty p {
  text-align: center;
  font-size: var(--cad-text-xs);
  color: var(--cad-text-muted);
  line-height: var(--cad-leading-relaxed);
}
</style>
