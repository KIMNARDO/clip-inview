<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useMeasurementStore } from '@/stores/measurement'
import { useMeasurementSettingsStore } from '@/stores/measurementSettings'
import { formatMeasurement } from '@/utils/measurement'

const store = useAppStore()
const measureStore = useMeasurementStore()
const settingsStore = useMeasurementSettingsStore()
</script>

<template>
  <footer class="statusbar-root">
    <!-- 왼쪽: 활성 도구 + 측정값 -->
    <div class="statusbar-left">
      <span class="statusbar-tool">{{ store.activeToolLabel }}</span>
      <template v-if="measureStore.lastMeasurement">
        <span class="statusbar-divider" />
        <span class="statusbar-measure" title="마지막 측정 결과">
          {{ formatMeasurement(measureStore.lastMeasurement.value, measureStore.lastMeasurement.unit) }}
        </span>
      </template>
    </div>

    <!-- 중앙: 좌표 표시 (강조) -->
    <div class="statusbar-coords-group">
      <div class="coord-item">
        <span class="coord-axis coord-axis--x">X</span>
        <span class="coord-value">{{ store.formattedCoords.x }}</span>
      </div>
      <div class="coord-item">
        <span class="coord-axis coord-axis--y">Y</span>
        <span class="coord-value">{{ store.formattedCoords.y }}</span>
      </div>
      <span class="statusbar-divider" />
      <span class="coord-scale" :title="`축척: ${settingsStore.settings.scale.label}`">
        {{ settingsStore.settings.scale.label }}
      </span>
    </div>

    <!-- 오른쪽: 토글 + 줌 -->
    <div class="statusbar-right">
      <button
        class="toggle-btn"
        :class="{ 'toggle-btn--active': store.isGridEnabled }"
        title="그리드 표시"
        @click="store.toggleGrid()"
      >
        GRID
      </button>
      <button
        class="toggle-btn"
        :class="{ 'toggle-btn--active': store.isSnapEnabled }"
        title="스냅"
        @click="store.toggleSnap()"
      >
        SNAP
      </button>
      <button
        class="toggle-btn"
        :class="{ 'toggle-btn--active': store.isOrthoEnabled }"
        title="직교 모드"
        @click="store.toggleOrtho()"
      >
        ORTHO
      </button>
      <button
        class="toggle-btn"
        :class="{ 'toggle-btn--active': store.isOsnapEnabled }"
        title="객체 스냅"
        @click="store.toggleOsnap()"
      >
        OSNAP
      </button>
      <span class="statusbar-divider" />
      <span class="statusbar-zoom" title="줌 레벨">{{ store.formattedZoom }}</span>
    </div>
  </footer>
</template>

<style scoped>
.statusbar-root {
  height: var(--cad-statusbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--cad-space-3);
  background: var(--cad-bg-panel);
  border-top: 1px solid var(--cad-border-default);
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-secondary);
  user-select: none;
}

.statusbar-left,
.statusbar-right {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
}

.statusbar-tool {
  color: var(--cad-accent-active-text);
  font-weight: var(--cad-font-semibold);
  font-size: var(--cad-text-xs);
}

.statusbar-measure {
  font-family: var(--cad-font-mono);
  color: #FFD700;
  font-weight: var(--cad-font-semibold);
  letter-spacing: 0.3px;
}

.statusbar-divider {
  width: 1px;
  height: 14px;
  background: var(--cad-border-default);
}

/* ─── 좌표 표시 (중앙, 강조) ─── */
.statusbar-coords-group {
  display: flex;
  align-items: center;
  gap: var(--cad-space-3);
  padding: 2px 12px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: var(--cad-radius-md);
  border: 1px solid var(--cad-border-default);
}

.coord-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coord-axis {
  font-size: 9px;
  font-weight: var(--cad-font-semibold);
  padding: 1px 4px;
  border-radius: 2px;
  line-height: 1;
}

.coord-axis--x {
  color: #FF6B6B;
  background: rgba(255, 107, 107, 0.15);
}

.coord-axis--y {
  color: #51CF66;
  background: rgba(81, 207, 102, 0.15);
}

.coord-value {
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-xs);
  color: var(--cad-text-primary);
  letter-spacing: 0.5px;
  min-width: 64px;
  text-align: right;
}

.coord-scale {
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-2xs);
  color: var(--cad-accent-active-text);
  font-weight: var(--cad-font-medium);
}

/* ─── 토글 버튼 ─── */
.toggle-btn {
  padding: 1px 6px;
  font-size: 9px;
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
  letter-spacing: 0.5px;
}

.toggle-btn:hover {
  color: var(--cad-text-secondary);
  background: var(--cad-hover-bg);
}

.toggle-btn--active {
  color: var(--cad-accent-active-text);
  background: var(--cad-accent-active-bg);
  border-color: var(--cad-accent-active-border);
}

.statusbar-zoom {
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-xs);
  color: var(--cad-text-primary);
  min-width: 40px;
  text-align: right;
}
</style>
